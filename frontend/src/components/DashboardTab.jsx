import React from "react";

export default function DashboardTab({
  stats,
  demands,
  supplies,
  onSelectDemandForAllocation,
  onDeleteSupply,
  onDeleteDemand,
}) {
  const getUrgencyBadge = (urgency) => {
    switch (urgency?.toUpperCase()) {
      case "CRITICAL":
        return <span className="badge badge-critical">CRITICAL</span>;
      case "HIGH":
        return <span className="badge badge-high">HIGH</span>;
      case "MEDIUM":
        return <span className="badge badge-medium">MEDIUM</span>;
      default:
        return <span className="badge badge-low">LOW</span>;
    }
  };

  const getStatusBadge = (status) => {
    return (
      <span className={`badge badge-status-${status || "pending"}`}>
        {status || "pending"}
      </span>
    );
  };

  return (
    <div>
      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">Usable Resources</div>
          <div className="kpi-value" style={{ color: "#38bdf8" }}>
            {stats?.available_resources ?? supplies?.filter(s => (s.quantity - s.reserve_quantity) > 0).length ?? 0}
          </div>
          <div className="kpi-sub">Across {supplies?.length ?? 0} total providers</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Active Emergency Demands</div>
          <div className="kpi-value" style={{ color: "#fb7185" }}>
            {stats?.active_demands ?? demands?.filter(d => d.status === "pending").length ?? 0}
          </div>
          <div className="kpi-sub">Requiring immediate allocation</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Pending Matches</div>
          <div className="kpi-value" style={{ color: "#fcd34d" }}>
            {stats?.pending_matches ?? 0}
          </div>
          <div className="kpi-sub">Awaiting confirmation</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Confirmed & Fulfilled</div>
          <div className="kpi-value" style={{ color: "#4ade80" }}>
            {(stats?.accepted_allocations ?? 0) + (stats?.completed_transfers ?? 0)}
          </div>
          <div className="kpi-sub">
            {stats?.completed_transfers ?? 0} completed transfers
          </div>
        </div>
      </div>

      {/* Main Dual Panels */}
      <div className="dashboard-grid">
        {/* Active Demands Panel */}
        <div className="section-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <span>🚨</span> Active Emergency Demands ({demands.length})
            </h2>
          </div>
          <div className="panel-body">
            {demands.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                No active demands registered. Use "Seed Demo Scenario" or "Post Demand".
              </div>
            ) : (
              demands.map((d) => (
                <div key={d.id} className="item-card">
                  <div className="item-header">
                    <div>
                      <div className="item-title">{d.resource_type} ({d.quantity} units)</div>
                      <div className="item-subtitle">{d.requester} &bull; {d.location}</div>
                    </div>
                    <div>{getUrgencyBadge(d.urgency)}</div>
                  </div>

                  <div className="item-meta">
                    <span>Status: {getStatusBadge(d.status)}</span>
                    {d.needed_by && <span>Needed: {new Date(d.needed_by).toLocaleString()}</span>}
                    {d.latitude && <span>Coords: {d.latitude.toFixed(2)}, {d.longitude?.toFixed(2)}</span>}
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", justifyContent: "flex-end" }}>
                    {d.status === "pending" && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => onSelectDemandForAllocation(d)}
                      >
                        ⚡ Match Resource
                      </button>
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onDeleteDemand(d.id)}
                      title="Remove demand"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Available Supplies Inventory */}
        <div className="section-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <span>📦</span> Available Supply Inventory ({supplies.length})
            </h2>
          </div>
          <div className="panel-body">
            {supplies.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                No supplies cataloged. Use "Seed Demo Scenario" or "Post Supply".
              </div>
            ) : (
              supplies.map((s) => {
                const usable = Math.max(0, s.quantity - s.reserve_quantity);
                return (
                  <div key={s.id} className="item-card">
                    <div className="item-header">
                      <div>
                        <div className="item-title">{s.resource_type}</div>
                        <div className="item-subtitle">{s.provider} &bull; {s.location}</div>
                      </div>
                      <span className={`badge ${s.status === "available" ? "badge-status-fulfilled" : "badge-low"}`}>
                        {s.status}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "1rem", margin: "0.5rem 0", fontSize: "0.9rem" }}>
                      <div>
                        <strong style={{ color: "#38bdf8" }}>{usable}</strong>
                        <span style={{ color: "var(--text-muted)", marginLeft: "4px" }}>usable</span>
                      </div>
                      <div>
                        <strong>{s.quantity}</strong>
                        <span style={{ color: "var(--text-muted)", marginLeft: "4px" }}>total</span>
                      </div>
                      <div>
                        <strong style={{ color: "#f59e0b" }}>{s.reserve_quantity}</strong>
                        <span style={{ color: "var(--text-muted)", marginLeft: "4px" }}>safety reserve</span>
                      </div>
                    </div>

                    <div className="item-meta">
                      {s.latitude && <span>Coords: {s.latitude.toFixed(2)}, {s.longitude?.toFixed(2)}</span>}
                      {s.available_until && <span>Available until: {new Date(s.available_until).toLocaleDateString()}</span>}
                      {s.provider_reliability && <span>Reliability: {(s.provider_reliability * 100).toFixed(0)}%</span>}
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", justifyContent: "flex-end" }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onDeleteSupply(s.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
