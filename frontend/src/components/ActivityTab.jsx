import React from "react";

export default function ActivityTab({
  allocations,
  onConfirmAllocation,
  onCompleteAllocation,
  loading,
}) {
  const getStatusBadge = (status) => {
    switch (status) {
      case "accepted":
        return <span className="badge badge-status-accepted">ACCEPTED / IN-TRANSIT</span>;
      case "completed":
        return <span className="badge badge-status-fulfilled">COMPLETED / DELIVERED</span>;
      default:
        return <span className="badge badge-status-pending">PENDING CONFIRMATION</span>;
    }
  };

  return (
    <div className="section-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <span>📋</span> Resource Allocation &amp; Transfer Activity Log ({allocations.length})
        </h2>
      </div>
      <div className="panel-body">
        {allocations.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "3rem" }}>
            No allocation decisions recorded yet. Run a match in "Allocation Engine" or from the Dashboard.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Requester</th>
                  <th>Matched Provider</th>
                  <th>Allocated Qty</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Explanation / Rationale</th>
                  <th>Lifecycle Action</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>#{a.id}</strong>
                    </td>
                    <td>{a.requester}</td>
                    <td>
                      <strong>{a.provider}</strong>
                    </td>
                    <td>
                      <span style={{ color: "#38bdf8", fontWeight: 700 }}>
                        {a.allocated_quantity} units
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-low" style={{ fontWeight: 800 }}>
                        {a.score?.toFixed(1)} / 100
                      </span>
                    </td>
                    <td>{getStatusBadge(a.status)}</td>
                    <td style={{ maxWidth: "320px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {a.explanation || a.reasons?.join(", ") || "Deterministic score match."}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {a.status === "pending" && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => onConfirmAllocation(a.id)}
                            disabled={loading}
                          >
                            Confirm
                          </button>
                        )}
                        {a.status === "accepted" && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => onCompleteAllocation(a.id)}
                            disabled={loading}
                          >
                            Complete
                          </button>
                        )}
                        {a.status === "completed" && (
                          <span style={{ color: "#4ade80", fontSize: "0.85rem", fontWeight: 700 }}>
                            ✓ Fulfilled
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
