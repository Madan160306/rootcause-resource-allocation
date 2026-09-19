import React, { useState } from "react";

const PRESET_LOCATIONS = [
  { name: "Manhattan West", lat: 40.7200, lon: -74.0100 },
  { name: "Times Square Corridor", lat: 40.7580, lon: -73.9855 },
  { name: "Flushing Outpost (Queens)", lat: 40.7675, lon: -73.8331 },
  { name: "Brooklyn Medical Center", lat: 40.6782, lon: -73.9442 },
];

export default function PostDemandTab({ onPostDemand, onSuccessRedirect, loading }) {
  const [resourceType, setResourceType] = useState("Oxygen Cylinder");
  const [quantity, setQuantity] = useState(15);
  const [requester, setRequester] = useState("St. Luke Community Triage");
  const [location, setLocation] = useState("Manhattan West");
  const [latitude, setLatitude] = useState(40.7200);
  const [longitude, setLongitude] = useState(-74.0100);
  const [urgency, setUrgency] = useState("CRITICAL");
  const [neededBy, setNeededBy] = useState("2026-09-20T12:00:00Z");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!requester.trim() || !location.trim()) {
      setErrorMsg("Requester and Location are mandatory fields.");
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

      setSuccessMsg("Emergency demand posted successfully!");
      setTimeout(() => {
        onSuccessRedirect();
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || "Failed to submit demand request");
    }
  };

  return (
    <div className="form-card">
      <h2 className="form-title">🚨 Post Emergency Resource Demand</h2>
      <p className="form-desc">
        Submit emergency supply requests for rapid, explainable matching by the RootCause Engine.
      </p>

      {errorMsg && (
        <div style={{ color: "#fb7185", background: "rgba(244,63,94,0.1)", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ color: "#4ade80", background: "rgba(16,185,129,0.1)", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>
          ✅ {successMsg}
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
            <label>Units Needed</label>
            <input
              type="number"
              className="form-control"
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
            <label>Urgency Level</label>
            <select
              className="form-control"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
            >
              <option value="CRITICAL">🔴 CRITICAL (Immediate Life Threat)</option>
              <option value="HIGH">🟠 HIGH (Urgent &lt; 12 Hours)</option>
              <option value="MEDIUM">🔵 MEDIUM (Operational Need &lt; 48 Hours)</option>
              <option value="LOW">⚪ LOW (Replenishment)</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Location Name</label>
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
              className="form-control"
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
              className="form-control"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Location Presets (Quick Fill):</label>
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
                📍 {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Needed By (ISO Timestamp)</label>
          <input
            type="text"
            className="form-control"
            value={neededBy}
            onChange={(e) => setNeededBy(e.target.value)}
            placeholder="e.g. 2026-09-20T12:00:00Z"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%", padding: "0.75rem", marginTop: "1rem" }}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit Emergency Demand"}
        </button>
      </form>
    </div>
  );
}
