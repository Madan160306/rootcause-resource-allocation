import React from "react";

export default function MarqueeTicker({ demands = [] }) {
  const criticalItems = demands.filter(
    (d) => d.status === "pending"
  );

  const tickerData =
    criticalItems.length > 0
      ? criticalItems
      : [
          {
            id: "default-1",
            requester: "METRO GENERAL TRAUMA CENTER",
            resource_type: "OXYGEN CYLINDER",
            quantity: 50,
            urgency: "CRITICAL",
            location: "SECTOR 4",
          },
          {
            id: "default-2",
            requester: "EAST VALLEY EMERGENCY CLINIC",
            resource_type: "AMBULANCE",
            quantity: 3,
            urgency: "HIGH",
            location: "DISTRICT 2",
          },
          {
            id: "default-3",
            requester: "HIGHLAND MEDICAL RELIEF",
            resource_type: "BACKUP GENERATOR",
            quantity: 2,
            urgency: "CRITICAL",
            location: "GRID ZONE 9",
          },
        ];

  // Duplicate for seamless infinite loop
  const displayItems = [...tickerData, ...tickerData, ...tickerData];

  return (
    <div className="marquee-container" aria-label="Live Critical Demands Telemetry">
      <div className="marquee-badge font-mono">
        <span className="marquee-dot" />
        <span>LIVE TELEMETRY</span>
      </div>
      <div className="marquee-track-wrapper">
        <div className="marquee-track font-mono">
          {displayItems.map((item, idx) => {
            const isCrit = item.urgency?.toUpperCase() === "CRITICAL";
            return (
              <span key={`${item.id}-${idx}`} className="marquee-item">
                <span
                  className="marquee-dot-inline"
                  style={{ backgroundColor: isCrit ? "var(--accent)" : "var(--status-high)" }}
                />
                <span className="marquee-requester" style={{ fontWeight: 600, color: "var(--ink)" }}>{item.requester}</span>
                <span className="marquee-divider">/</span>
                <span className="marquee-resource" style={{ color: isCrit ? "var(--accent)" : "var(--ink)", fontWeight: 600 }}>
                  {item.resource_type} [{item.quantity} UNITS]
                </span>
                <span className="marquee-divider">/</span>
                <span className="marquee-loc" style={{ color: "var(--text-secondary)" }}>{item.location}</span>
                <span className="marquee-divider">/</span>
                <span style={{ color: isCrit ? "var(--accent)" : "var(--status-high)", fontWeight: 700 }}>
                  {item.urgency}
                </span>
                <span className="marquee-spacer">✦</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
