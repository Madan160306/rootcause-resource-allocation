import React, { useState } from "react";
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  Building2,
  ShieldCheck,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { RESOURCE_TYPES, getResourceConfig } from "../utils/resourceHelper";

const PRESET_SUPPLY_LOCATIONS = [
  { name: "Downtown Central Medical Center", lat: 40.7128, lon: -74.0060 },
  { name: "Eastside Regional Medical Hub", lat: 40.7306, lon: -73.9352 },
  { name: "Queens Emergency Logistics Base", lat: 40.7282, lon: -73.7949 },
  { name: "Midtown Dispatch Depo", lat: 40.7589, lon: -73.9851 },
  { name: "North Bronx Auxiliary Depot", lat: 40.8448, lon: -73.8648 },
];

export default function PostSupplyTab({ onPostSupply, onSuccessRedirect, loading }) {
  const [resourceType, setResourceType] = useState("Oxygen Cylinder");
  const [quantity, setQuantity] = useState(40);
  const [reserveQuantity, setReserveQuantity] = useState(8);
  const [provider, setProvider] = useState("Central Regional Hospital");
  const [location, setLocation] = useState("Downtown Central Medical Center");
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.0060);
  const [availableUntil, setAvailableUntil] = useState("2026-09-25T23:59:59Z");
  const [reliability, setReliability] = useState(0.95);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const totalQty = parseInt(quantity || 0, 10);
  const reserveQty = parseInt(reserveQuantity || 0, 10);
  const usable = Math.max(0, totalQty - reserveQty);
  const usablePercent = totalQty > 0 ? (usable / totalQty) * 100 : 0;
  const reservePercent = 100 - usablePercent;

  const selectedConfig = getResourceConfig(resourceType);
  const ResourceIcon = selectedConfig.Icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (totalQty <= 0) {
      setErrorMsg("Total inventory quantity must be greater than zero.");
      return;
    }
    if (reserveQty < 0) {
      setErrorMsg("Safety reserve quantity cannot be negative.");
      return;
    }
    if (reserveQty > totalQty) {
      setErrorMsg("Safety reserve quantity cannot exceed total physical stock.");
      return;
    }
    if (!provider.trim() || !location.trim()) {
      setErrorMsg("Provider facility and Location are mandatory fields.");
      return;
    }

    try {
      await onPostSupply({
        resource_type: resourceType,
        quantity: totalQty,
        reserve_quantity: reserveQty,
        provider: provider.trim(),
        location: location.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        available_from: new Date().toISOString(),
        available_until: availableUntil || undefined,
        status: "available",
        provider_reliability: parseFloat(reliability),
      });

      setSuccessMsg("Supply inventory and guarded reserve registered!");
      setTimeout(() => {
        onSuccessRedirect();
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || "Failed to register supply inventory");
    }
  };

  return (
    <div className="form-card">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
        <div className="brand-icon-box" style={{ width: "36px", height: "36px", color: selectedConfig.color, background: selectedConfig.bgColor, borderColor: selectedConfig.borderColor }}>
          <ResourceIcon size={18} strokeWidth={2.2} />
        </div>
        <h2 className="form-title" style={{ margin: 0 }}>
          Register Supply Inventory &amp; Reserve Guard
        </h2>
      </div>
      <p className="form-desc">
        Publish emergency assets into the dispatch pool. Safety reserves are strictly guarded by RootCause to prevent local facility collapse.
      </p>

      {/* Dynamic Capacity Split Bar Callout */}
      <div
        style={{
          background: "var(--surface-hover)",
          border: "1px solid var(--border)",
          borderRadius: "0px",
          padding: "1.15rem",
          marginBottom: "1.75rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShieldCheck size={16} style={{ color: "var(--status-ok)" }} />
            <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--ink)" }}>
              Automated Safety Reserve Calculator
            </span>
          </div>
          <span className="font-mono" style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>
            GUARD CONSTRAINT: Usable = Total - Reserve &gt; 0
          </span>
        </div>

        <div className="split-bar-track" style={{ height: "10px", margin: "0.65rem 0" }}>
          <div
            className="usable-bar-segment"
            style={{ width: `${usablePercent}%` }}
            title={`Net Usable for Dispatch: ${usable} units (${usablePercent.toFixed(0)}%)`}
          />
          <div
            className="reserve-bar-segment"
            style={{ width: `${reservePercent}%` }}
            title={`Guarded Facility Reserve: ${reserveQty} units (${reservePercent.toFixed(0)}%)`}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginTop: "0.5rem" }}>
          <div>
            <span style={{ color: "var(--text-secondary)" }}>Net Usable: </span>
            <strong className="font-mono" style={{ color: "var(--status-ok)", fontSize: "0.95rem" }}>
              {usable} units
            </strong>
          </div>
          <div>
            <span style={{ color: "var(--text-secondary)" }}>Protected Reserve: </span>
            <strong className="font-mono" style={{ color: "var(--status-high)", fontSize: "0.95rem" }}>
              {reserveQty} units
            </strong>
          </div>
          <div>
            <span style={{ color: "var(--text-secondary)" }}>Total Capacity: </span>
            <strong className="font-mono" style={{ color: "var(--ink)", fontSize: "0.95rem" }}>
              {totalQty} units
            </strong>
          </div>
        </div>

        {reserveQty >= totalQty && (
          <div style={{ color: "var(--status-critical)", fontSize: "0.78rem", marginTop: "0.6rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <ShieldAlert size={14} />
            <span>Warning: Safety reserve exhausts 100% of inventory. 0 units will be eligible for dispatch!</span>
          </div>
        )}
      </div>

      {errorMsg && (
        <div style={{ color: "var(--status-critical)", background: "var(--status-critical-bg)", border: "1px solid var(--status-critical-border)", padding: "0.8rem 1rem", borderRadius: "var(--radius-btn)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.88rem" }}>
          <AlertTriangle size={16} strokeWidth={2} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ color: "var(--status-ok)", background: "var(--status-ok-bg)", border: "1px solid var(--status-ok-border)", padding: "0.8rem 1rem", borderRadius: "var(--radius-btn)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.88rem" }}>
          <CheckCircle2 size={16} strokeWidth={2} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>
              Resource Category
              <span className="field-badge required">REQUIRED</span>
            </label>
            <select
              className="form-control"
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
            >
              {RESOURCE_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              Provider Facility Name
              <span className="field-badge required">REQUIRED</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="e.g. Bellevue Hospital Center"
              required
            />
            {!provider.trim() && (
              <div className="field-inline-error">Provider facility name cannot be empty.</div>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              Total Physical Stock Units
              <span className="field-badge required">REQUIRED</span>
            </label>
            <input
              type="number"
              className="form-control font-mono"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            {totalQty <= 0 && (
              <div className="field-inline-error">Physical stock must be greater than zero.</div>
            )}
          </div>

          <div className="form-group">
            <label>
              Mandatory Protected Reserve
              <span className="field-badge required">REQUIRED</span>
            </label>
            <input
              type="number"
              className="form-control font-mono"
              min="0"
              value={reserveQuantity}
              onChange={(e) => setReserveQuantity(e.target.value)}
              required
            />
            {reserveQty > totalQty && (
              <div className="field-inline-error">Reserve cannot exceed total stock.</div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>
            Facility Location
            <span className="field-badge required">REQUIRED</span>
          </label>
          <input
            type="text"
            className="form-control"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
          {!location.trim() && (
            <div className="field-inline-error">Facility location cannot be empty.</div>
          )}
        </div>

        <div className="form-group">
          <label style={{ fontSize: "0.74rem" }}>Location Presets (Fast Dispatch Fill):</label>
          <div className="presets-row">
            {PRESET_SUPPLY_LOCATIONS.map((preset) => (
              <button
                type="button"
                key={preset.name}
                className="preset-btn"
                onClick={() => {
                  setLocation(preset.name);
                  setLatitude(preset.lat);
                  setLongitude(preset.lon);
                }}
              >
                <Building2 size={13} strokeWidth={2} style={{ color: "var(--accent-gold)" }} />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              Latitude (Geodesic)
              <span className="field-badge required">REQUIRED</span>
            </label>
            <input
              type="number"
              step="any"
              className="form-control font-mono"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>
              Longitude (Geodesic)
              <span className="field-badge required">REQUIRED</span>
            </label>
            <input
              type="number"
              step="any"
              className="form-control font-mono"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              Available Until (ISO 8601 UTC)
              <span className="field-badge optional">OPTIONAL</span>
            </label>
            <input
              type="text"
              className="form-control font-mono"
              value={availableUntil}
              onChange={(e) => setAvailableUntil(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>
              Provider Reliability Index (0.50 - 1.00)
              <span className="field-badge optional">OPTIONAL</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.5"
              max="1.0"
              className="form-control font-mono"
              value={reliability}
              onChange={(e) => setReliability(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ width: "100%", marginTop: "1rem" }}
          disabled={loading}
        >
          <Package size={18} strokeWidth={2.2} />
          <span>{loading ? "Registering Stock..." : "Register Supply & Protected Reserve"}</span>
          <ArrowRight size={16} strokeWidth={2.2} />
        </button>
      </form>
    </div>
  );
}
