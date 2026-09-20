import React, { useState } from "react";
import {
  ClipboardList,
  Check,
  Truck,
  CheckCircle2,
  Building2,
  Award,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function ActivityTab({
  allocations = [],
  onConfirmAllocation,
  onCompleteAllocation,
  loading,
}) {
  const [filterStatus, setFilterStatus] = useState("ALL");

  const filteredAllocations = allocations.filter((a) => {
    if (filterStatus === "ALL") return true;
    return a.status?.toLowerCase() === filterStatus.toLowerCase();
  });

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#2ED573", "#D4AF37", "#1E90FF"],
      });
    } catch {}
  };

  const handleComplete = async (id) => {
    await onCompleteAllocation(id);
    triggerConfetti();
  };

  const renderStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    let dotColor = "var(--muted)";
    let label = (status || "PENDING").toUpperCase();

    if (s === "accepted") {
      dotColor = "var(--accent)";
      label = "IN-TRANSIT";
    } else if (s === "completed") {
      dotColor = "var(--status-ok)";
      label = "FULFILLED";
    } else {
      dotColor = "#D97706";
      label = "PENDING CONFIRMATION";
    }

    return (
      <span className="status-mono font-mono">
        <span className="status-dot" style={{ backgroundColor: dotColor }} />
        {label}
      </span>
    );
  };

  const renderLifecycleStepper = (status) => {
    const s = (status || "").toLowerCase();
    const isStep2 = s === "accepted" || s === "completed";
    const isStep3 = s === "completed";

    return (
      <div className="stepper-track" title={`Lifecycle State: ${status}`}>
        <div className={`stepper-node ${isStep2 ? "completed" : "active"}`} title="Draft Match" />
        <div className={`stepper-line ${isStep2 ? "filled" : ""}`} />
        <div className={`stepper-node ${isStep3 ? "completed" : isStep2 ? "active" : ""}`} title="In-Transit" />
        <div className={`stepper-line ${isStep3 ? "filled" : ""}`} />
        <div className={`stepper-node ${isStep3 ? "completed" : ""}`} title="Completed" />
      </div>
    );
  };

  return (
    <div className="section-panel">
      <div className="panel-header" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <h2 className="panel-title">
          <ClipboardList size={18} strokeWidth={2} style={{ color: "var(--accent-gold)" }} />
          <span>Emergency Allocation &amp; Transfer Lifecycle Log</span>
        </h2>

        {/* Filter Pills */}
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <button
            className={`filter-chip ${filterStatus === "ALL" ? "active" : ""}`}
            onClick={() => setFilterStatus("ALL")}
          >
            All ({allocations.length})
          </button>
          <button
            className={`filter-chip ${filterStatus === "pending" ? "active" : ""}`}
            onClick={() => setFilterStatus("pending")}
          >
            Pending
          </button>
          <button
            className={`filter-chip ${filterStatus === "accepted" ? "active" : ""}`}
            onClick={() => setFilterStatus("accepted")}
          >
            In-Transit
          </button>
          <button
            className={`filter-chip ${filterStatus === "completed" ? "active" : ""}`}
            onClick={() => setFilterStatus("completed")}
          >
            Completed
          </button>
        </div>
      </div>

      <div className="panel-body" style={{ maxHeight: "none", padding: 0 }}>
        {filteredAllocations.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--muted)", padding: "4rem 2rem" }}>
            <ClipboardList size={40} style={{ opacity: 0.3, margin: "0 auto 1rem auto" }} />
            <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>
              No transfer activity records found
            </p>
            <p style={{ fontSize: "0.84rem", marginTop: "0.35rem" }}>
              Run the Allocation Engine to match emergency demands with available facility stock.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Audit ID</th>
                  <th>Requester Incident</th>
                  <th>Dispatched Provider</th>
                  <th>Allocated Units</th>
                  <th>Score</th>
                  <th>Status &amp; Lifecycle</th>
                  <th>Explainability Rationale</th>
                  <th style={{ textAlign: "right" }}>Command Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAllocations.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 700, color: "var(--accent)" }}>
                        #{a.id}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "var(--ink)", fontSize: "0.92rem" }}>{a.requester}</strong>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Building2 size={13} style={{ color: "var(--muted)" }} />
                        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{a.provider}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 800, color: "var(--ink)", fontSize: "0.96rem" }}>
                        {a.allocated_quantity} units
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <Award size={13} style={{ color: "var(--accent)" }} />
                        <span className="font-mono" style={{ fontWeight: 700, color: "var(--ink)" }}>
                          {a.score?.toFixed(1)} / 100
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        {renderStatusBadge(a.status)}
                        {renderLifecycleStepper(a.status)}
                      </div>
                    </td>
                    <td style={{ maxWidth: "340px", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                      {a.explanation || a.reasons?.join(", ") || "Deterministic score match calculated."}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
                        {a.status === "pending" && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => onConfirmAllocation(a.id)}
                            disabled={loading}
                          >
                            <Check size={14} strokeWidth={2.4} />
                            <span>Confirm</span>
                          </button>
                        )}
                        {a.status === "accepted" && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleComplete(a.id)}
                            disabled={loading}
                          >
                            <Truck size={14} strokeWidth={2.4} />
                            <span>Complete</span>
                          </button>
                        )}
                        {a.status === "completed" && (
                          <span style={{ color: "var(--status-ok)", fontSize: "0.82rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                            <CheckCircle2 size={16} strokeWidth={2.4} />
                            <span>Fulfilled</span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
