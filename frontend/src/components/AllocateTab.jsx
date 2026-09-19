import React, { useState, useEffect } from "react";

export default function AllocateTab({
  demands,
  selectedDemand,
  onRunAllocation,
  onConfirmAllocation,
  onCompleteAllocation,
  loading,
}) {
  const [selectedDemandId, setSelectedDemandId] = useState(() => {
    if (selectedDemand?.id) return String(selectedDemand.id);
    if (demands.length > 0) return String(demands[0].id);
    return "";
  });
  const [allowPartial, setAllowPartial] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  useEffect(() => {
    if (selectedDemand?.id) {
      setSelectedDemandId(String(selectedDemand.id));
    }
  }, [selectedDemand]);

  const handleAllocate = async () => {
    if (!selectedDemandId) {
      setErrorMsg("Please select a demand to allocate.");
      return;
    }
    setErrorMsg("");
    setActionSuccessMsg("");
    try {
      const res = await onRunAllocation({
        demand_id: parseInt(selectedDemandId, 10),
        allow_partial: allowPartial,
      });
      setMatchResult(res);
    } catch (err) {
      setErrorMsg(err.message || "Failed to execute allocation");
    }
  };

  const handleConfirm = async (allocationId) => {
    try {
      await onConfirmAllocation(allocationId);
      setActionSuccessMsg("Allocation successfully CONFIRMED! Provider inventory deducted safely.");
      if (matchResult && matchResult.recommendation) {
        setMatchResult({
          ...matchResult,
          isConfirmed: true,
        });
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to confirm allocation");
    }
  };

  const handleComplete = async (allocationId) => {
    try {
      await onCompleteAllocation(allocationId);
      setActionSuccessMsg("Transfer marked as COMPLETED! Demand fulfilled.");
      if (matchResult) {
        setMatchResult({
          ...matchResult,
          isCompleted: true,
        });
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to complete transfer");
    }
  };

  const currentDemand = demands.find((d) => String(d.id) === String(selectedDemandId));

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <div className="section-panel" style={{ marginBottom: "1.5rem" }}>
        <div className="panel-header">
          <h2 className="panel-title">
            <span>⚡</span> Deterministic Allocation Engine Explorer
          </h2>
        </div>
        <div className="panel-body">
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", fontSize: "0.95rem" }}>
            The RootCause Allocation Engine applies strict hard-constraint filtering, reserve protection,
            and a 100-point multi-variable scoring model to match life-saving resources in real time.
          </p>

          <div className="form-row">
            <div className="form-group">
              <label>Select Emergency Demand</label>
              <select
                className="form-control"
                value={selectedDemandId}
                onChange={(e) => {
                  setSelectedDemandId(e.target.value);
                  setMatchResult(null);
                  setErrorMsg("");
                  setActionSuccessMsg("");
                }}
              >
                <option value="">-- Choose a Demand --</option>
                {demands.map((d) => (
                  <option key={d.id} value={d.id}>
                    #{d.id} - {d.resource_type} ({d.quantity} units) - {d.requester} [{d.urgency}]
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", marginTop: "1.2rem" }}>
                <input
                  type="checkbox"
                  checked={allowPartial}
                  onChange={(e) => setAllowPartial(e.target.checked)}
                  style={{ width: "18px", height: "18px" }}
                />
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                  Allow Partial Fulfillment (split capacity)
                </span>
              </label>
            </div>
          </div>

          {currentDemand && (
            <div
              style={{
                background: "#0f172a",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                display: "flex",
                gap: "1.5rem",
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                marginBottom: "1rem",
                flexWrap: "wrap",
              }}
            >
              <span><strong>Requester:</strong> {currentDemand.requester}</span>
              <span><strong>Location:</strong> {currentDemand.location}</span>
              <span><strong>Urgency:</strong> <span style={{ color: "#fda4af" }}>{currentDemand.urgency}</span></span>
              <span><strong>Requested:</strong> {currentDemand.quantity} units</span>
              <span><strong>Status:</strong> {currentDemand.status}</span>
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem" }}
            onClick={handleAllocate}
            disabled={loading || !selectedDemandId}
          >
            {loading ? "Computing Multi-Variable Scoring..." : "⚡ Run Deterministic Allocation Engine"}
          </button>

          {errorMsg && (
            <div style={{ color: "#fb7185", background: "rgba(244,63,94,0.1)", padding: "0.75rem", borderRadius: "6px", marginTop: "1rem" }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {actionSuccessMsg && (
            <div style={{ color: "#4ade80", background: "rgba(16,185,129,0.1)", padding: "0.75rem", borderRadius: "6px", marginTop: "1rem" }}>
              ✅ {actionSuccessMsg}
            </div>
          )}
        </div>
      </div>

      {/* Match Results Display */}
      {matchResult && matchResult.status === "MATCH_FOUND" && (
        <div className="recommendation-box">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
            <div>
              <span className="badge badge-status-fulfilled" style={{ marginBottom: "0.4rem" }}>
                OPTIMAL MATCH IDENTIFIED
              </span>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                {matchResult.recommendation.provider}
              </h2>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                {matchResult.recommendation.allocated_quantity} units allocated &bull; Located {matchResult.recommendation.distance_km?.toFixed(1)} km away
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div className="score-badge">
                <span>⭐</span>
                <span>{matchResult.recommendation.score?.toFixed(1)}</span>
                <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>/ 100</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Deterministic Allocation Score
              </div>
            </div>
          </div>

          {/* Scoring Rubric Breakdown */}
          {matchResult.recommendation.breakdown && (
            <div style={{ background: "#0b0f19", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "1.25rem", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Mathematical Score Factor Attribution
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                    <span>Resource Type Match</span>
                    <strong>{matchResult.recommendation.breakdown.resource_compatibility} / 30</strong>
                  </div>
                  <div className="breakdown-bar">
                    <div className="breakdown-fill" style={{ width: `${(matchResult.recommendation.breakdown.resource_compatibility / 30) * 100}%`, background: "#38bdf8" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                    <span>Urgency Multiplier</span>
                    <strong>{matchResult.recommendation.breakdown.urgency_weight} / 25</strong>
                  </div>
                  <div className="breakdown-bar">
                    <div className="breakdown-fill" style={{ width: `${(matchResult.recommendation.breakdown.urgency_weight / 25) * 100}%`, background: "#f43f5e" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                    <span>Quantity Capacity</span>
                    <strong>{matchResult.recommendation.breakdown.quantity_availability} / 20</strong>
                  </div>
                  <div className="breakdown-bar">
                    <div className="breakdown-fill" style={{ width: `${(matchResult.recommendation.breakdown.quantity_availability / 20) * 100}%`, background: "#10b981" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                    <span>Proximity (Haversine)</span>
                    <strong>{matchResult.recommendation.breakdown.geographic_distance?.toFixed(1)} / 15</strong>
                  </div>
                  <div className="breakdown-bar">
                    <div className="breakdown-fill" style={{ width: `${(matchResult.recommendation.breakdown.geographic_distance / 15) * 100}%`, background: "#a855f7" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                    <span>Time Buffer</span>
                    <strong>{matchResult.recommendation.breakdown.time_compatibility} / 10</strong>
                  </div>
                  <div className="breakdown-bar">
                    <div className="breakdown-fill" style={{ width: `${(matchResult.recommendation.breakdown.time_compatibility / 10) * 100}%`, background: "#f59e0b" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Key Justification Reasons */}
          {matchResult.recommendation.reasons && (
            <div style={{ marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                Transparent Decision Factors:
              </h3>
              <ul style={{ paddingLeft: "1.2rem", color: "var(--text-primary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                {matchResult.recommendation.reasons.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Narrative Explanation */}
          {matchResult.explanation && (
            <div className="ai-box">
              <div className="ai-header">
                <span>🤖</span> Amazon Bedrock / Operational Narrative Explanation
              </div>
              <p style={{ color: "#e2e8f0", fontSize: "0.95rem", lineHeight: 1.6, fontStyle: "italic" }}>
                "{matchResult.explanation}"
              </p>
            </div>
          )}

          {/* Action Trigger Buttons */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
            {matchResult.allocation_id && !matchResult.isConfirmed && (
              <button
                className="btn btn-success"
                onClick={() => handleConfirm(matchResult.allocation_id)}
              >
                ✅ Confirm Allocation & Reserve Inventory
              </button>
            )}

            {matchResult.allocation_id && matchResult.isConfirmed && !matchResult.isCompleted && (
              <button
                className="btn btn-primary"
                onClick={() => handleComplete(matchResult.allocation_id)}
              >
                🚚 Complete Transfer & Fulfill Demand
              </button>
            )}

            {matchResult.isCompleted && (
              <span className="badge badge-status-fulfilled" style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}>
                ✓ TRANSFER COMPLETED & DELIVERED
              </span>
            )}
          </div>

          {/* Alternative Candidates */}
          {matchResult.alternatives && matchResult.alternatives.length > 0 && (
            <div style={{ marginTop: "2rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                Ranked Alternative Providers ({matchResult.alternatives.length})
              </h3>
              <div className="alt-grid">
                {matchResult.alternatives.map((alt, idx) => (
                  <div key={idx} className="alt-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ color: "var(--text-primary)" }}>{alt.provider}</strong>
                      <span className="badge badge-low">{alt.score?.toFixed(1)} pts</span>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0.4rem 0" }}>
                      {alt.location} &bull; {alt.distance_km?.toFixed(1)} km away
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Usable capacity: {alt.usable_quantity} units
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Match Scenario */}
      {matchResult && matchResult.status === "NO_MATCH" && (
        <div style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: "12px", padding: "1.5rem", marginTop: "1.5rem" }}>
          <h3 style={{ color: "#fda4af", fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            ❌ No Eligible Resource Found
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "1rem" }}>
            The deterministic engine checked all active supplies against this demand's hard constraints,
            but none satisfied all safety criteria.
          </p>
          <div style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>
            <strong>Rejection Reasons:</strong>
            <ul style={{ paddingLeft: "1.2rem", marginTop: "0.5rem", lineHeight: 1.6 }}>
              {matchResult.reasons?.map((reason, idx) => (
                <li key={idx} style={{ color: "#fca5a5" }}>{reason}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
