import React, { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  ArrowRight,
  Eye,
} from "lucide-react";
import { RESOURCE_TYPES, getResourceConfig } from "../utils/resourceHelper";

const PRESET_LOCATIONS = [
  { name: "Manhattan West Sector", lat: 40.7200, lon: -74.0100 },
  { name: "Times Square Medical Hub", lat: 40.7580, lon: -73.9855 },
  { name: "Flushing Triage Outpost", lat: 40.7675, lon: -73.8331 },
  { name: "Brooklyn Trauma Center", lat: 40.6782, lon: -73.9442 },
  { name: "Bronx Logistics Depot", lat: 40.8448, lon: -73.8648 },
];

export default function PostDemandTab({ onPostDemand, onSuccessRedirect, loading }) {
  const [resourceType, setResourceType] = useState("Oxygen Cylinder");
  const [quantity, setQuantity] = useState(15);
  const [requester, setRequester] = useState("St. Luke Emergency Triage");
  const [location, setLocation] = useState("Manhattan West Sector");
  const [latitude, setLatitude] = useState(40.7200);
  const [longitude, setLongitude] = useState(-74.0100);
  const [urgency, setUrgency] = useState("CRITICAL");
  const [neededBy, setNeededBy] = useState("2026-09-20T12:00:00Z");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const selectedConfig = getResourceConfig(resourceType);
  const ResourceIcon = selectedConfig.Icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!requester.trim() || !location.trim()) {
      setErrorMsg("Requester facility and Location are mandatory fields.");
      return;
    }
    if (quantity <= 0) {
      setErrorMsg("Quantity must be greater than zero.");
      return;
    }

    try {
      await onPostDemand({
        resource_type: resourceType,
        quantity: parseInt(quantity, 10),
        requester: requester.trim(),
        location: location.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        urgency: urgency,
        needed_by: neededBy || undefined,
        status: "pending",
      });

      setSuccessMsg("Emergency demand posted to dispatch matrix!");
      setTimeout(() => {
        onSuccessRedirect();
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || "Failed to submit emergency demand");
    }
  };

  return (
    <div className="form-card">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
        <div className="brand-icon-box" style={{ width: "36px", height: "36px", color: "var(--status-critical)", borderColor: "rgba(255, 71, 87, 0.4)" }}>
          <AlertCircle size={18} strokeWidth={2.2} />
        </div>
        <h2 className="form-title" style={{ margin: 0 }}>
          Post Emergency Resource Demand
        </h2>
      </div>
      <p className="form-desc">
        Publish urgent hospital or field-unit resource requisitions for explainable AI-assisted matching.
      </p>

      {/* Live Dispatch Preview Card */}
      <div
        style={{
          background: "var(--surface-hover)",
          border: "1px solid var(--border)",
          borderRadius: "0px",
          padding: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)", marginBottom: "0.65rem", fontWeight: 700 }}>
          <Eye size={13} strokeWidth={2} />
          <span>Real-Time Incident Board Preview</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              className="resource-icon-badge"
              style={{
                background: selectedConfig.bgColor,
                border: `1px solid ${selectedConfig.borderColor}`,
                color: selectedConfig.color,
              }}
            >
              <ResourceIcon size={18} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.95rem" }}>
                {resourceType} &bull;{" "}
                <span className="font-mono" style={{ color: "var(--accent)" }}>
                  {quantity || 0} {selectedConfig.unit}
                </span>
              </div>
              <div style={{ color: "var(--muted)", fontSize: "0.8rem", display: "flex", gap: "0.4rem" }}>
                <span>{requester || "Field Facility"}</span>
                <span>&bull;</span>
                <span>{location || "Sector"}</span>
              </div>
            </div>
          </div>

          <span className="status-mono font-mono">
            <span
              className="status-dot"
              style={{
                backgroundColor:
                  urgency === "CRITICAL"
                    ? "var(--accent)"
                    : urgency === "HIGH"
                    ? "#D97706"
                    : "var(--muted)",
              }}
            />
            {urgency.toUpperCase()}
          </span>
        </div>
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
            <label>Resource Category</label>
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
            <label>Quantity Units Needed</label>
            <input
              type="number"
              className="form-control font-mono"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Requester Facility / Unit</label>
            <input
              type="text"
              className="form-control"
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
              placeholder="e.g. Field Triage Bravo"
              required
            />
          </div>

          <div className="form-group">
            <label>Triage Urgency Rating</label>
            <select
              className="form-control"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
            >
              <option value="CRITICAL">CRITICAL (Immediate Life Threat)</option>
              <option value="HIGH">HIGH (Urgent &lt; 12 Hours)</option>
              <option value="MEDIUM">MEDIUM (Operational Need &lt; 48 Hours)</option>
              <option value="LOW">LOW (Replenishment)</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Location / Sector Name</label>
          <input
            type="text"
            className="form-control"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label style={{ fontSize: "0.74rem" }}>Location Presets (Fast Dispatch Fill):</label>
          <div className="presets-row">
            {PRESET_LOCATIONS.map((preset) => (
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
                <MapPin size={13} strokeWidth={2} style={{ color: "var(--accent-gold)" }} />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Latitude (Geodesic)</label>
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
            <label>Longitude (Geodesic)</label>
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
          <label>Delivery Deadline (ISO 8601 UTC)</label>
          <input
            type="text"
            className="form-control font-mono"
            value={neededBy}
            onChange={(e) => setNeededBy(e.target.value)}
            placeholder="e.g. 2026-09-20T12:00:00Z"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ width: "100%", marginTop: "1rem" }}
          disabled={loading}
        >
          <AlertCircle size={18} strokeWidth={2.2} />
          <span>{loading ? "Publishing Demand..." : "Submit Emergency Demand"}</span>
          <ArrowRight size={16} strokeWidth={2.2} />
        </button>
      </form>
    </div>
  );
}
