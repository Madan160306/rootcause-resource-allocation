import React, { useState, useMemo } from "react";
import {
  AlertCircle,
  Package,
  Zap,
  Trash2,
  Search,
  Activity,
  ArrowRight,
} from "lucide-react";
import { getResourceConfig } from "../utils/resourceHelper";

export default function DashboardTab({
  stats,
  demands = [],
  supplies = [],
  onSelectDemandForAllocation,
  onDeleteSupply,
  onDeleteDemand,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("ALL");

  // Filtered Demands
  const filteredDemands = useMemo(() => {
    return demands.filter((d) => {
      const matchSearch =
        !searchQuery ||
        d.resource_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.requester?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.location?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchUrgency =
        urgencyFilter === "ALL" ||
        d.urgency?.toUpperCase() === urgencyFilter.toUpperCase();

      const matchType =
        selectedTypeFilter === "ALL" ||
        d.resource_type?.toLowerCase().includes(selectedTypeFilter.toLowerCase());

      return matchSearch && matchUrgency && matchType;
    });
  }, [demands, searchQuery, urgencyFilter, selectedTypeFilter]);

  // Filtered Supplies
  const filteredSupplies = useMemo(() => {
    return supplies.filter((s) => {
      const matchSearch =
        !searchQuery ||
        s.resource_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.provider?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.location?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType =
        selectedTypeFilter === "ALL" ||
        s.resource_type?.toLowerCase().includes(selectedTypeFilter.toLowerCase());

      return matchSearch && matchType;
    });
  }, [supplies, searchQuery, selectedTypeFilter]);

  // Urgency Status: small uppercase mono text with a colored dot
  const getUrgencyBadge = (urgency) => {
    const u = (urgency || "LOW").toUpperCase();
    let dotColor = "var(--muted)";
    if (u === "CRITICAL") dotColor = "var(--accent)";
    else if (u === "HIGH") dotColor = "#D97706";
    else if (u === "MEDIUM") dotColor = "#B45309";
    else if (u === "LOW") dotColor = "var(--muted)";

    return (
      <span className="status-mono font-mono">
        <span className="status-dot" style={{ backgroundColor: dotColor }} />
        {u}
      </span>
    );
  };

  const totalUsableUnits = supplies.reduce((acc, s) => {
    return acc + Math.max(0, (s.quantity || 0) - (s.reserve_quantity || 0));
  }, 0);

  const totalDemandedUnits = demands.reduce((acc, d) => {
    return acc + (d.quantity || 0);
  }, 0);

  const criticalDemandsCount = demands.filter(
    (d) => d.urgency?.toUpperCase() === "CRITICAL" && d.status === "pending"
  ).length;

  return (
    <div>
      {/* Real-time Operations Matrix Banner */}
      <div className="command-banner">
        <div className="banner-left">
          <div className="banner-pulse-icon">
            <Activity size={20} strokeWidth={2.2} />
          </div>
          <div>
            <div className="banner-title">
              Operational Incident Telemetry &amp; Dispatch Matrix
            </div>
            <div className="banner-desc">
              Deterministic 100-Point Match Algorithm guarding protected reserve stock &amp; life-critical SLAs
            </div>
          </div>
        </div>

        <div className="banner-telemetry">
          <div className="telemetry-item">
            <span style={{ color: "var(--status-ok)" }}>●</span>
            <span>Constraint Filter: <strong>Active (0% Error)</strong></span>
          </div>
          <div className="telemetry-item">
            <span style={{ color: "var(--accent-gold)" }}>●</span>
            <span>Bedrock GenAI: <strong>Operational</strong></span>
          </div>
          <div className="telemetry-item">
            <span style={{ color: "var(--status-info)" }}>●</span>
            <span>Geodesic Engine: <strong>Haversine km</strong></span>
          </div>
        </div>
      </div>

      {/* Editorial Stats: Huge Mono Numerals (96px) + Tiny Uppercase Labels separated by hairline rules */}
      <div className="editorial-stats">
        {/* Stat 1: Usable Resources */}
        <div className="stat-column">
          <div className="stat-numeral font-mono">
            {stats?.available_resources ??
              supplies.filter((s) => s.quantity - s.reserve_quantity > 0).length}
          </div>
          <div className="stat-meta">
            <span className="stat-label">Usable Resource Lots</span>
            <span className="stat-sub font-mono">{totalUsableUnits} units ready</span>
          </div>
        </div>

        {/* Stat 2: Active Demands */}
        <div className="stat-column">
          <div className="stat-numeral font-mono">
            {stats?.active_demands ??
              demands.filter((d) => d.status === "pending").length}
          </div>
          <div className="stat-meta">
            <span className="stat-label">Active Demands</span>
            <span className="stat-sub font-mono" style={{ color: criticalDemandsCount > 0 ? "var(--accent)" : "var(--muted)" }}>
              <span className="status-dot" style={{ backgroundColor: criticalDemandsCount > 0 ? "var(--accent)" : "var(--muted)" }} />
              {criticalDemandsCount > 0 ? `${criticalDemandsCount} CRITICAL` : "STABLE"} · {totalDemandedUnits} req
            </span>
          </div>
        </div>

        {/* Stat 3: Pending Matches */}
        <div className="stat-column">
          <div className="stat-numeral font-mono">
            {stats?.pending_matches ?? 0}
          </div>
          <div className="stat-meta">
            <span className="stat-label">Draft Recommendations</span>
            <span className="stat-sub font-mono">Awaiting dispatch</span>
          </div>
        </div>

        {/* Stat 4: Fulfilled / Completed Transfers */}
        <div className="stat-column">
          <div className="stat-numeral font-mono">
            {(stats?.accepted_allocations ?? 0) +
              (stats?.completed_transfers ?? 0)}
          </div>
          <div className="stat-meta">
            <span className="stat-label">Fulfilled &amp; In-Transit</span>
            <span className="stat-sub font-mono">{stats?.completed_transfers ?? 0} verified</span>
          </div>
        </div>
      </div>

      {/* Filter & Live Search Toolbar */}
      <div className="filter-toolbar">
        <div className="search-input-box">
          <Search size={16} strokeWidth={2} />
          <input
            type="text"
            className="search-input"
            placeholder="Filter by resource type, requester, facility, sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="category-filter-chips">
          <button
            className={`filter-chip ${urgencyFilter === "ALL" ? "active" : ""}`}
            onClick={() => setUrgencyFilter("ALL")}
          >
            All Urgencies
          </button>
          <button
            className={`filter-chip ${urgencyFilter === "CRITICAL" ? "active" : ""}`}
            onClick={() => setUrgencyFilter("CRITICAL")}
            style={{
              borderColor: urgencyFilter === "CRITICAL" ? "var(--status-critical)" : undefined,
              color: urgencyFilter === "CRITICAL" ? "var(--status-critical)" : undefined,
            }}
          >
            Critical Only
          </button>
          <button
            className={`filter-chip ${urgencyFilter === "HIGH" ? "active" : ""}`}
            onClick={() => setUrgencyFilter("HIGH")}
          >
            High Priority
          </button>
          <div style={{ width: "1px", height: "18px", background: "var(--border)", margin: "0 0.25rem" }} />
          {["ALL", "Oxygen", "Ambulance", "Generator", "Blood", "Medical"].map((type) => (
            <button
              key={type}
              className={`filter-chip ${selectedTypeFilter === type ? "active" : ""}`}
              onClick={() => setSelectedTypeFilter(type)}
            >
              {type === "ALL" ? "All Resources" : type}
            </button>
          ))}
        </div>
      </div>

      {/* Main Dual Panels */}
      <div className="dashboard-grid">
        {/* Panel 1: Active Demands */}
        <div className="section-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <AlertCircle size={17} strokeWidth={2} style={{ color: "var(--status-critical)" }} />
              <span>Emergency Demands Queue</span>
            </h2>
            <span className="panel-badge font-mono">
              {filteredDemands.length} / {demands.length}
            </span>
          </div>

          <div className="panel-body">
            {filteredDemands.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 1.5rem", color: "var(--muted)" }}>
                <AlertCircle
                  size={36}
                  strokeWidth={1.5}
                  style={{ opacity: 0.4, margin: "0 auto 0.75rem auto", display: "block" }}
                />
                <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  No matching emergency demands
                </p>
                <p style={{ fontSize: "0.82rem", marginTop: "0.25rem" }}>
                  {demands.length === 0
                    ? "Click 'Seed Demo Scenario' in the header to load real-time triage data."
                    : "Try adjusting your search criteria."}
                </p>
              </div>
            ) : (
              filteredDemands.map((d) => {
                const config = getResourceConfig(d.resource_type);
                const isCritical = d.urgency?.toUpperCase() === "CRITICAL";

                return (
                  <div
                    key={d.id}
                    className={`ruled-row ${isCritical ? "is-critical" : ""}`}
                  >
                    <div className="row-main">
                      <div className="row-header">
                        <div className="row-title-group">
                          <h3 className="row-title">
                            {d.resource_type}{" "}
                            <span className="row-quantity font-mono">
                              [{d.quantity} {config.unit}]
                            </span>
                          </h3>
                        </div>
                        <div className="row-header-right">
                          {getUrgencyBadge(d.urgency)}
                        </div>
                      </div>

                      <div className="row-meta font-mono">
                        <span className="meta-item">{d.requester}</span>
                        <span className="meta-sep">/</span>
                        <span className="meta-item">{d.location}</span>
                        {d.latitude && (
                          <>
                            <span className="meta-sep">/</span>
                            <span className="meta-item">
                              {d.latitude.toFixed(2)}, {d.longitude?.toFixed(2)}
                            </span>
                          </>
                        )}
                        {d.needed_by && (
                          <>
                            <span className="meta-sep">/</span>
                            <span className="meta-item">
                              NEEDED:{" "}
                              {new Date(d.needed_by).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </>
                        )}
                        <span className="meta-sep">/</span>
                        <span
                          className="meta-item"
                          style={{
                            color:
                              d.status === "pending"
                                ? "var(--status-high)"
                                : "var(--status-ok)",
                          }}
                        >
                          STATUS: {d.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="row-actions">
                      {d.status === "pending" && (
                        <button
                          className="btn-match-accent"
                          onClick={() => onSelectDemandForAllocation(d)}
                        >
                          <Zap size={13} strokeWidth={2.5} />
                          <span>Match Resource</span>
                          <ArrowRight size={13} strokeWidth={2.5} />
                        </button>
                      )}
                      <button
                        className="btn-row-ghost"
                        onClick={() => onDeleteDemand(d.id)}
                        title="Delete demand record"
                      >
                        <Trash2 size={15} strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel 2: Available Supplies Inventory */}
        <div className="section-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <Package size={17} strokeWidth={2} style={{ color: "var(--status-ok)" }} />
              <span>Facility Supplies &amp; Protected Reserves</span>
            </h2>
            <span className="panel-badge font-mono">
              {filteredSupplies.length} / {supplies.length}
            </span>
          </div>

          <div className="panel-body">
            {filteredSupplies.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 1.5rem", color: "var(--muted)" }}>
                <Package
                  size={36}
                  strokeWidth={1.5}
                  style={{ opacity: 0.4, margin: "0 auto 0.75rem auto", display: "block" }}
                />
                <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  No available supplies cataloged
                </p>
                <p style={{ fontSize: "0.82rem", marginTop: "0.25rem" }}>
                  {supplies.length === 0
                    ? "Click 'Seed Demo Scenario' or 'Post Supply' to register inventory."
                    : "Try adjusting your search filter."}
                </p>
              </div>
            ) : (
              filteredSupplies.map((s) => {
                const config = getResourceConfig(s.resource_type);
                const usable = Math.max(0, s.quantity - s.reserve_quantity);
                const usablePercent = s.quantity > 0 ? (usable / s.quantity) * 100 : 0;
                const reservePercent = 100 - usablePercent;

                return (
                  <div key={s.id} className="ruled-row">
                    <div className="row-main">
                      <div className="row-header">
                        <div className="row-title-group">
                          <h3 className="row-title">
                            {s.resource_type}{" "}
                            <span className="row-quantity font-mono">
                              [{s.quantity} {config.unit}]
                            </span>
                          </h3>
                        </div>
                        <div className="row-header-right">
                          <span className="status-mono font-mono">
                            <span
                              className="status-dot"
                              style={{
                                backgroundColor:
                                  s.status === "available"
                                    ? "var(--status-ok)"
                                    : "var(--muted)",
                              }}
                            />
                            {(s.status || "UNKNOWN").toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="row-meta font-mono">
                        <span className="meta-item">{s.provider}</span>
                        <span className="meta-sep">/</span>
                        <span className="meta-item">{s.location}</span>
                        <span className="meta-sep">/</span>
                        <span className="meta-item">
                          USABLE: <strong style={{ color: "var(--ink)" }}>{usable}</strong>
                        </span>
                        <span className="meta-sep">/</span>
                        <span className="meta-item">
                          RESERVE: <strong style={{ color: "var(--status-high)", fontWeight: 700 }}>{s.reserve_quantity}</strong>
                        </span>
                        {s.provider_reliability && (
                          <>
                            <span className="meta-sep">/</span>
                            <span className="meta-item">
                              RELIABILITY: {(s.provider_reliability * 100).toFixed(0)}%
                            </span>
                          </>
                        )}
                        {s.available_until && (
                          <>
                            <span className="meta-sep">/</span>
                            <span className="meta-item">
                              UNTIL:{" "}
                              {new Date(s.available_until).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Hairline split capacity line */}
                      <div className="supply-split-line">
                        <div
                          className="usable-bar-segment"
                          style={{ width: `${usablePercent}%` }}
                          title={`Usable: ${usable} units`}
                        />
                        <div
                          className="reserve-bar-segment"
                          style={{ width: `${reservePercent}%` }}
                          title={`Safety Reserve: ${s.reserve_quantity} units`}
                        />
                      </div>
                    </div>

                    <div className="row-actions">
                      <button
                        className="btn-row-ghost"
                        onClick={() => onDeleteSupply(s.id)}
                        title="Delete supply record"
                      >
                        <Trash2 size={15} strokeWidth={1.75} />
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
