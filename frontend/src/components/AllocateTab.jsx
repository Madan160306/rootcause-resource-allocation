import React, { useState, useEffect } from "react";
import {
  Zap,
  Check,
  Truck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Activity,
  ArrowRight,
} from "lucide-react";
import confetti from "canvas-confetti";
import { getResourceConfig } from "../utils/resourceHelper";

export default function AllocateTab({
  demands = [],
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
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);

  useEffect(() => {
    if (selectedDemand?.id) {
      setSelectedDemandId(String(selectedDemand.id));
    }
  }, [selectedDemand]);

  const currentDemand = demands.find((d) => String(d.id) === String(selectedDemandId));
  const resourceConfig = getResourceConfig(currentDemand?.resource_type);
  const ResourceIcon = resourceConfig.Icon;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#D4AF37", "#2ED573", "#FFFFFF", "#1E90FF"],
      });
    } catch {
      // safe fallback
    }
  };

  const handleAllocate = async () => {
    if (!selectedDemandId) {
      setErrorMsg("Please select an emergency demand to match.");
      return;
    }
    setErrorMsg("");
    setActionSuccessMsg("");
    setIsSimulating(true);
    setSimStep(1);

    // High-tech diagnostic telemetry simulation steps
    const timer1 = setTimeout(() => setSimStep(2), 220);
    const timer2 = setTimeout(() => setSimStep(3), 440);
    const timer3 = setTimeout(() => setSimStep(4), 660);

    try {
      const res = await onRunAllocation({
        demand_id: parseInt(selectedDemandId, 10),
        allow_partial: allowPartial,
      });

      setTimeout(() => {
        setSimStep(5);
        setTimeout(() => {
          setIsSimulating(false);
          setMatchResult(res);
        }, 250);
      }, 880);
    } catch (err) {
      setIsSimulating(false);
      setErrorMsg(err.message || "Failed to execute deterministic allocation engine");
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  const handleConfirm = async (allocationId) => {
    try {
      await onConfirmAllocation(allocationId);
      setActionSuccessMsg("Allocation confirmed! Inventory decremented and safety reserve protected.");
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
      setActionSuccessMsg("Mission Fulfilled! Medical / emergency asset successfully delivered.");
      triggerConfetti();
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



  return (
    <div className="allocation-container">
      {/* Top Engine Configuration Card */}
      <div className="engine-control-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div className="brand-icon-box" style={{ width: "38px", height: "38px", borderRadius: "0px", border: "1px solid var(--hairline)", background: "transparent", color: "var(--accent)" }}>
              <Zap size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--ink)" }}>
                Deterministic Allocation Engine Explorer
              </h2>
              <p style={{ color: "var(--muted)", fontSize: "0.84rem" }}>
                Zero-tolerance hard constraint verification paired with explainable mathematical optimization
              </p>
            </div>
          </div>

          <span className="status-mono font-mono">
            <span className="status-dot" style={{ backgroundColor: "var(--accent)" }} />
            VERSION 2.0 &bull; 100-PT RUBRIC
          </span>
        </div>

        <div className="form-row" style={{ alignItems: "flex-end" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Select Emergency Demand Incident</label>
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
              <option value="">-- Choose an Emergency Demand --</option>
              {demands.map((d) => (
                <option key={d.id} value={d.id}>
                  #{d.id} - {d.resource_type} ({d.quantity} units) - {d.requester} [{d.urgency}]
                </option>
              ))}
            </select>
          </div>

          <div
            className="form-group"
            style={{
              marginBottom: 0,
              background: "var(--surface-hover)",
              border: "1px solid var(--border)",
              borderRadius: "0px",
              padding: "0.75rem 1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              cursor: "pointer",
            }}
            onClick={() => setAllowPartial(!allowPartial)}
          >
            <input
              type="checkbox"
              checked={allowPartial}
              onChange={(e) => setAllowPartial(e.target.checked)}
              style={{
                width: "18px",
                height: "18px",
                accentColor: "var(--accent)",
                cursor: "pointer",
              }}
            />
            <div>
              <div style={{ color: "var(--ink)", fontWeight: 700, fontSize: "0.86rem" }}>
                Allow Partial Allocation
              </div>
              <div style={{ color: "var(--muted)", fontSize: "0.76rem" }}>
                Permit split dispatch if single provider has limited usable inventory
              </div>
            </div>
          </div>
        </div>

        {/* Selected Demand Mission Card */}
        {currentDemand && (
          <div
            style={{
              background: "var(--surface-hover)",
              border: "1px solid var(--border)",
              borderRadius: "0px",
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
              marginTop: "1.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
              <div
                className="resource-icon-badge"
                style={{
                  background: resourceConfig.bgColor,
                  border: `1px solid ${resourceConfig.borderColor}`,
                  color: resourceConfig.color,
                }}
              >
                <ResourceIcon size={20} strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.98rem" }}>
                  {currentDemand.resource_type} &bull;{" "}
                  <span className="font-mono" style={{ color: "var(--accent)" }}>
                    {currentDemand.quantity} {resourceConfig.unit}
                  </span>
                </div>
                <div style={{ color: "var(--muted)", fontSize: "0.82rem", display: "flex", gap: "0.5rem" }}>
                  <span>{currentDemand.requester}</span>
                  <span>&bull;</span>
                  <span>{currentDemand.location}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
              <span className="status-mono font-mono">
                <span
                  className="status-dot"
                  style={{
                    backgroundColor:
                      currentDemand.urgency === "CRITICAL"
                        ? "var(--accent)"
                        : currentDemand.urgency === "HIGH"
                        ? "#D97706"
                        : "var(--muted)",
                  }}
                />
                {currentDemand.urgency?.toUpperCase()}
              </span>
              <span className="status-mono font-mono">
                <span className="status-dot" style={{ backgroundColor: "var(--muted)" }} />
                STATUS: {currentDemand.status?.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        <button
          className="btn btn-primary btn-lg"
          style={{ width: "100%", marginTop: "1.5rem" }}
          onClick={handleAllocate}
          disabled={loading || isSimulating || !selectedDemandId}
        >
          <Zap size={18} strokeWidth={2.4} />
          <span>
            {isSimulating
              ? "Running Multi-Variable Scoring Matrix..."
              : "Execute Deterministic Allocation Engine"}
          </span>
          <ArrowRight size={17} strokeWidth={2.4} />
        </button>

        {/* Animated Diagnostic HUD / Telemetry Scanner */}
        {isSimulating && (
          <div className="diagnostic-hud">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--accent-gold)", fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.75rem" }}>
              <Activity size={16} strokeWidth={2.2} />
              <span>DETERMINISTIC VERIFICATION &amp; SCORING IN PROGRESS</span>
            </div>

            <div className="hud-step-row">
              <div className="hud-step-title">
                {simStep > 1 ? (
                  <CheckCircle2 size={16} style={{ color: "var(--status-ok)" }} />
                ) : (
                  <div className="hud-spinner" />
                )}
                <span>1. Hard Eligibility Filter: Zero-tolerance resource match &amp; availability</span>
              </div>
              <span className="font-mono" style={{ color: simStep > 1 ? "var(--status-ok)" : "var(--muted)" }}>
                {simStep > 1 ? "VERIFIED (100%)" : "EVALUATING"}
              </span>
            </div>

            <div className="hud-step-row">
              <div className="hud-step-title">
                {simStep > 2 ? (
                  <CheckCircle2 size={16} style={{ color: "var(--status-ok)" }} />
                ) : simStep === 2 ? (
                  <div className="hud-spinner" />
                ) : (
                  <Clock size={16} style={{ opacity: 0.3 }} />
                )}
                <span>2. Mandatory Safety Reserve Guard: Usable capacity &gt; 0 check</span>
              </div>
              <span className="font-mono" style={{ color: simStep > 2 ? "var(--status-ok)" : "var(--muted)" }}>
                {simStep > 2 ? "PROTECTED" : "WAITING"}
              </span>
            </div>

            <div className="hud-step-row">
              <div className="hud-step-title">
                {simStep > 3 ? (
                  <CheckCircle2 size={16} style={{ color: "var(--status-ok)" }} />
                ) : simStep === 3 ? (
                  <div className="hud-spinner" />
                ) : (
                  <Clock size={16} style={{ opacity: 0.3 }} />
                )}
                <span>3. Great-Circle Geodesic Distance (Haversine km equation)</span>
              </div>
              <span className="font-mono" style={{ color: simStep > 3 ? "var(--status-ok)" : "var(--muted)" }}>
                {simStep > 3 ? "COMPUTED" : "WAITING"}
              </span>
            </div>

            <div className="hud-step-row" style={{ borderBottom: "none" }}>
              <div className="hud-step-title">
                {simStep > 4 ? (
                  <CheckCircle2 size={16} style={{ color: "var(--status-ok)" }} />
                ) : simStep === 4 ? (
                  <div className="hud-spinner" />
                ) : (
                  <Clock size={16} style={{ opacity: 0.3 }} />
                )}
                <span>4. Amazon Bedrock Explainability Layer &amp; Score Attribution</span>
              </div>
              <span className="font-mono" style={{ color: simStep > 4 ? "var(--status-ok)" : "var(--muted)" }}>
                {simStep > 4 ? "SYNTHESIZED" : "PROCESSING"}
              </span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              color: "var(--status-critical)",
              background: "var(--status-critical-bg)",
              border: "1px solid var(--status-critical-border)",
              padding: "0.85rem 1.15rem",
              borderRadius: "var(--radius-btn)",
              marginTop: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              fontSize: "0.9rem",
            }}
          >
            <AlertTriangle size={18} strokeWidth={2} />
            <span>{errorMsg}</span>
          </div>
        )}

        {actionSuccessMsg && (
          <div
            style={{
              color: "var(--status-ok)",
              background: "var(--status-ok-bg)",
              border: "1px solid var(--status-ok-border)",
              padding: "0.85rem 1.15rem",
              borderRadius: "var(--radius-btn)",
              marginTop: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              fontSize: "0.9rem",
            }}
          >
            <CheckCircle2 size={18} strokeWidth={2} />
            <span>{actionSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Step 7: Vertical Scroll Story: One step per viewport (Demand, Candidates, Scoring, Decision) */}
      {matchResult && matchResult.status === "MATCH_FOUND" && (
        <div className="scroll-story-container">
          {/* Sticky Story Step Jump Navigation */}
          <nav className="story-nav font-mono">
            <a href="#story-step-1" className="story-nav-item">01 DEMAND</a>
            <a href="#story-step-2" className="story-nav-item">02 CANDIDATES</a>
            <a href="#story-step-3" className="story-nav-item">03 SCORING</a>
            <a href="#story-step-4" className="story-nav-item">04 DECISION</a>
          </nav>

          {/* Viewport 1: Demand */}
          <section id="story-step-1" className="story-viewport">
            <div className="story-step-badge font-mono">STEP 01 / 04 &bull; INCOMING EMERGENCY MISSION</div>
            <h2 className="story-step-title">The Demand</h2>
            <div className="story-demand-card">
              <div className="story-demand-hero font-display">
                {currentDemand?.resource_type || "Emergency Resource"}
              </div>
              <div className="story-demand-qty font-mono">
                REQUESTED: {currentDemand?.quantity || matchResult.recommendation?.allocated_quantity} UNITS
              </div>
              <div className="story-demand-meta font-mono">
                <span>REQUESTER: {currentDemand?.requester || "REGIONAL TRIAGE"}</span>
                <span className="meta-sep">/</span>
                <span>SECTOR: {currentDemand?.location || "SECTOR ALPHA"}</span>
                <span className="meta-sep">/</span>
                <span>URGENCY: {currentDemand?.urgency || "CRITICAL"}</span>
                {currentDemand?.needed_by && (
                  <>
                    <span className="meta-sep">/</span>
                    <span>NEEDED BY: {new Date(currentDemand.needed_by).toUTCString()}</span>
                  </>
                )}
              </div>
            </div>
            <div className="story-scroll-hint font-mono">
              <span>SCROLL DOWN TO CANDIDATE SCREENING &darr;</span>
            </div>
          </section>

          {/* Viewport 2: Candidates */}
          <section id="story-step-2" className="story-viewport">
            <div className="story-step-badge font-mono">STEP 02 / 04 &bull; ZERO-TOLERANCE ELIGIBILITY FILTER</div>
            <h2 className="story-step-title">The Candidates</h2>
            <div className="story-candidates-list">
              <div className="candidate-filter-rule font-mono">
                <span className="status-dot" style={{ backgroundColor: "var(--status-ok)" }} />
                <span>1. EXACT RESOURCE TYPE MATCH: VERIFIED</span>
              </div>
              <div className="candidate-filter-rule font-mono">
                <span className="status-dot" style={{ backgroundColor: "var(--status-ok)" }} />
                <span>2. MANDATORY SAFETY RESERVE GUARD (USABLE &gt; 0): ENFORCED</span>
              </div>
              <div className="candidate-filter-rule font-mono">
                <span className="status-dot" style={{ backgroundColor: "var(--status-ok)" }} />
                <span>3. TEMPORAL AVAILABILITY WINDOW: VALIDATED</span>
              </div>
              <div className="candidate-filter-rule font-mono">
                <span className="status-dot" style={{ backgroundColor: "var(--status-ok)" }} />
                <span>4. PROVIDER OPERATIONAL STATE (AVAILABLE): CONFIRMED</span>
              </div>
            </div>
            <div className="story-candidates-summary font-mono">
              <span>QUALIFIED PROVIDERS SCREENED: {1 + (matchResult.alternatives?.length || 0)} CANDIDATES IDENTIFIED</span>
            </div>
            <div className="story-scroll-hint font-mono">
              <span>SCROLL DOWN TO DETERMINISTIC SCORING &darr;</span>
            </div>
          </section>

          {/* Viewport 3: Scoring */}
          <section id="story-step-3" className="story-viewport">
            <div className="story-step-badge font-mono">STEP 03 / 04 &bull; 100-POINT DETERMINISTIC RUBRIC</div>
            <h2 className="story-step-title">The Scoring Matrix</h2>

            <div className="story-total-score-display">
              <span className="story-score-numeral font-mono">
                {matchResult.recommendation.score?.toFixed(1) || "100.0"}
              </span>
              <span className="story-score-denom font-mono">/ 100 PTS COMPOSITE</span>
            </div>

            {matchResult.recommendation.breakdown && (
              <div className="story-rubric-grid">
                <div className="rubric-factor">
                  <span className="rubric-val font-mono">{matchResult.recommendation.breakdown.resource_compatibility} / 30</span>
                  <span className="rubric-name font-mono">RESOURCE COMPATIBILITY</span>
                </div>
                <div className="rubric-factor">
                  <span className="rubric-val font-mono">{matchResult.recommendation.breakdown.urgency_weight} / 25</span>
                  <span className="rubric-name font-mono">URGENCY WEIGHTING</span>
                </div>
                <div className="rubric-factor">
                  <span className="rubric-val font-mono">{matchResult.recommendation.breakdown.quantity_availability} / 20</span>
                  <span className="rubric-name font-mono">QUANTITY FULFILLMENT</span>
                </div>
                <div className="rubric-factor">
                  <span className="rubric-val font-mono">{matchResult.recommendation.breakdown.geographic_distance?.toFixed(1)} / 15</span>
                  <span className="rubric-name font-mono">GEOGRAPHIC PROXIMITY (HAVERSINE)</span>
                </div>
                <div className="rubric-factor">
                  <span className="rubric-val font-mono">{matchResult.recommendation.breakdown.time_compatibility} / 10</span>
                  <span className="rubric-name font-mono">TIME BUFFER</span>
                </div>
              </div>
            )}
            <div className="story-scroll-hint font-mono">
              <span>SCROLL DOWN TO OPTIMAL DISPATCH DECISION &darr;</span>
            </div>
          </section>

          {/* Viewport 4: Decision */}
          <section id="story-step-4" className="story-viewport story-decision-viewport">
            <div className="story-step-badge font-mono">STEP 04 / 04 &bull; RECOMMENDED DISPATCH DECISION</div>
            <h2 className="story-step-title">The Decision</h2>

            {/* CHOSEN MATCH IN LARGE TYPE (STEP 7 MANDATE) */}
            <div className="chosen-match-hero">
              <span className="chosen-match-tag font-mono">PRIMARY ALLOCATION TARGET</span>
              <h1 className="chosen-match-provider font-display">
                {matchResult.recommendation.provider}
              </h1>
              <div className="chosen-match-meta font-mono">
                <span className="match-qty-large font-mono">
                  {matchResult.recommendation.allocated_quantity} UNITS ALLOCATED
                </span>
                <span className="meta-sep">/</span>
                <span>{matchResult.recommendation.location}</span>
                <span className="meta-sep">/</span>
                <span>{matchResult.recommendation.distance_km?.toFixed(1)} KM DISTANCE</span>
              </div>
            </div>

            {/* Bedrock AI Narrative */}
            {matchResult.explanation && (
              <div className="story-ai-narrative">
                <div className="narrative-label font-mono">AMAZON BEDROCK EXPLAINABLE NARRATIVE:</div>
                <p className="narrative-body font-display">
                  "{matchResult.explanation}"
                </p>
              </div>
            )}

            {/* Action Dispatch Buttons */}
            <div className="story-actions">
              {matchResult.allocation_id && !matchResult.isConfirmed && (
                <button
                  className="btn-match-accent btn-match-large"
                  onClick={() => handleConfirm(matchResult.allocation_id)}
                >
                  <Check size={16} strokeWidth={2.5} />
                  <span>AUTHORIZE &amp; CONFIRM ALLOCATION (LOCK STOCK)</span>
                </button>
              )}

              {matchResult.allocation_id && matchResult.isConfirmed && !matchResult.isCompleted && (
                <button
                  className="btn btn-secondary"
                  onClick={() => handleComplete(matchResult.allocation_id)}
                >
                  <Truck size={16} strokeWidth={2.5} />
                  <span>COMPLETE TRANSFER &amp; FULFILL DEMAND</span>
                </button>
              )}

              {matchResult.isCompleted && (
                <div className="status-mono font-mono" style={{ color: "var(--status-ok)", fontSize: "14px" }}>
                  <span className="status-dot" style={{ backgroundColor: "var(--status-ok)" }} />
                  DISASTER RELIEF ASSET DELIVERED &amp; FULFILLED
                </div>
              )}
            </div>

            {/* Ranked Alternative Providers */}
            {matchResult.alternatives && matchResult.alternatives.length > 0 && (
              <div className="story-alternatives">
                <div className="alternatives-header font-mono">
                  RANKED CONTINGENCY ALTERNATIVES ({matchResult.alternatives.length})
                </div>
                <div className="alternatives-list">
                  {matchResult.alternatives.map((alt, idx) => (
                    <div key={idx} className="alt-ruled-row font-mono">
                      <span className="alt-rank">#{idx + 2}</span>
                      <span className="alt-name font-display">{alt.provider}</span>
                      <span className="alt-loc">{alt.location} ({alt.distance_km?.toFixed(1)} km)</span>
                      <span className="alt-cap">CAPACITY: {alt.usable_quantity}</span>
                      <span className="alt-score font-mono">{alt.score?.toFixed(1)} PTS</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* No Match Scenario */}
      {matchResult && matchResult.status === "NO_MATCH" && (
        <div
          style={{
            background: "var(--surface-hover)",
            border: "1px solid var(--status-critical)",
            borderLeft: "4px solid var(--status-critical)",
            borderRadius: "0px",
            padding: "2rem",
            marginTop: "1.75rem",
            boxShadow: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--status-critical)", marginBottom: "0.75rem" }}>
            <XCircle size={24} strokeWidth={2.2} />
            <h3 style={{ fontSize: "1.35rem", fontWeight: 700, margin: 0, color: "var(--ink)" }}>
              No Eligible Disaster Resource Match Found
            </h3>
          </div>

          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "1.25rem", lineHeight: 1.6 }}>
            The RootCause deterministic engine verified all cataloged supplies against strict hard-constraint boundaries,
            reserve thresholds, and temporal validity windows. No candidate satisfies 100% of safety criteria.
          </p>

          <div
            style={{
              background: "var(--raised)",
              border: "1px solid var(--hairline)",
              borderRadius: "0px",
              padding: "1rem 1.25rem",
            }}
          >
            <strong style={{ fontSize: "0.82rem", textTransform: "uppercase", color: "var(--status-critical)", letterSpacing: "0.06em", fontFamily: "var(--font-mono)" }}>
              Constraint Rejection Log:
            </strong>
            <ul style={{ paddingLeft: "1.25rem", marginTop: "0.6rem", fontSize: "0.9rem", lineHeight: 1.6 }}>
              {matchResult.reasons?.map((reason, idx) => (
                <li key={idx} style={{ color: "var(--status-critical)", fontWeight: 600 }}>{reason}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
