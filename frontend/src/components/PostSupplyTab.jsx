import React, { useState } from "react";
import { Package, AlertTriangle, CheckCircle2, Building2 } from "lucide-react";

const PRESET_SUPPLY_LOCATIONS = [
  { name: "Downtown Center", lat: 40.7128, lon: -74.0060 },
  { name: "Eastside Medical Hub", lat: 40.7306, lon: -73.9352 },
  { name: "Queens Logistics Park", lat: 40.7282, lon: -73.7949 },
  { name: "Midtown Dispatch Center", lat: 40.7589, lon: -73.9851 },
  { name: "North Bronx Depot", lat: 40.8448, lon: -73.8648 },
];

export default function PostSupplyTab({ onPostSupply, onSuccessRedirect, loading }) {
  const [resourceType, setResourceType] = useState("Oxygen Cylinder");
  const [quantity, setQuantity] = useState(40);
  const [reserveQuantity, setReserveQuantity] = useState(8);
  const [provider, setProvider] = useState("Central Regional Hospital");
  const [location, setLocation] = useState("Downtown Center");
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.0060);
  const [availableUntil, setAvailableUntil] = useState("2026-09-25T23:59:59Z");
  const [reliability, setReliability] = useState(0.95);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const totalQty = parseInt(quantity, 10);
    const reserveQty = parseInt(reserveQuantity, 10);

    if (totalQty <= 0) {
      setErrorMsg("Total quantity must be greater than zero.");
      return;
    }
    if (reserveQty < 0) {
      setErrorMsg("Reserve quantity cannot be negative.");
      return;
    }
    if (reserveQty > totalQty) {
      setErrorMsg("Safety reserve quantity cannot exceed total quantity.");
      return;
    }
    if (!provider.trim() || !location.trim()) {
      setErrorMsg("Provider and Location are required.");
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

      setSuccessMsg("Supply inventory registered successfully!");
      setTimeout(() => {
        onSuccessRedirect();
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || "Failed to register supply");
    }
  };

  const usable = Math.max(0, quantity - reserveQuantity);

  return (
    <div className="form-card">
      <h2 className="form-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Package size={16} strokeWidth={1.5} />
        <span>Register Supply Inventory &amp; Reserve</span>
      </h2>
      <p className="form-desc">
        Publish available emergency assets. Safety reserves are strictly guarded by RootCause to prevent facility exhaustion.
      </p>

      {errorMsg && (
        <div style={{ color: "var(--status-critical)", background: "var(--status-critical-bg)", padding: "0.75rem", borderRadius: "var(--radius-btn)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AlertTriangle size={16} strokeWidth={1.5} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ color: "var(--status-ok)", background: "var(--status-ok-bg)", padding: "0.75rem", borderRadius: "var(--radius-btn)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CheckCircle2 size={16} strokeWidth={1.5} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Resource Type</label>
            <select
              className="form-control"
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
            >
              <option value="Oxygen Cylinder">Oxygen Cylinder</option>
              <option value="Ambulance">Ambulance</option>
              <option value="Generator">Generator</option>
              <option value="Blood Unit">Blood Unit</option>
              <option value="Medical Kit">Medical Kit</option>
              <option value="Water Tanker">Water Tanker</option>
              <option value="Food Packet">Food Packet</option>
              <option value="Shelter Kit">Shelter Kit</option>
            </select>
          </div>

          <div className="form-group">
            <label>Provider Name</label>
            <input
              type="text"
              className="form-control"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="e.g. Metro Logistics Dep"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Total Inventory Units</label>
            <input
              type="number"
              className="form-control font-mono"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Mandatory Safety Reserve (Protected)</label>
            <input
              type="number"
              className="form-control font-mono"
              min="0"
              value={reserveQuantity}
              onChange={(e) => setReserveQuantity(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Dynamic Capacity Callout */}
        <div
          style={{
            background: "var(--raised)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-btn)",
            padding: "0.75rem",
            marginBottom: "1.25rem",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.85rem",
          }}
        >
          <span>
            Total: <strong className="font-mono">{quantity}</strong>
          </span>
          <span>
            Safety Reserve: <strong className="font-mono">{reserveQuantity}</strong>
          </span>
          <span>
            Net Usable for Allocation:{" "}
            <strong className="font-mono">{usable} units</strong>
          </span>
        </div>

        <div className="form-group">
          <label>Facility Location</label>
          <input
            type="text"
            className="form-control"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Latitude</label>
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
            <label>Longitude</label>
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

        <div className="form-group">
          <label>Location Presets (Quick Fill):</label>
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
                <Building2 size={16} strokeWidth={1.5} style={{ verticalAlign: "middle", marginRight: "3px" }} />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Available Until</label>
            <input
              type="text"
              className="form-control font-mono"
              value={availableUntil}
              onChange={(e) => setAvailableUntil(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Historical Reliability (0.0 - 1.0)</label>
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
          className="btn btn-secondary"
          style={{ width: "100%", padding: "0.75rem", marginTop: "1rem" }}
          disabled={loading}
        >
          {loading ? "Registering..." : "Register Supply Asset"}
        </button>
      </form>
    </div>
  );
}
