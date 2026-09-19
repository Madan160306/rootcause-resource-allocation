import React, { useState, useEffect } from "react";

export default function Header({
  activeTab,
  setActiveTab,
  health,
  onSeed,
  onReset,
  loading,
}) {
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toUTCString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const tabs = [
    { id: "dashboard", label: "Operations Dashboard", icon: "📊" },
    { id: "allocate", label: "Allocation Engine", icon: "⚡" },
    { id: "post-demand", label: "Post Demand", icon: "🚨" },
    { id: "post-supply", label: "Post Supply", icon: "📦" },
    { id: "activity", label: "Transfers & Activity", icon: "📋" },
  ];

  const isOnline = health && health.status === "healthy";

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="brand-area">
          <span className="brand-badge">AWS First Commit 2026</span>
          <div>
            <h1 className="brand-title">RootCause</h1>
            <p className="brand-subtitle">
              Explainable Real-Time Resource Allocation Engine
            </p>
          </div>
        </div>

        <div className="header-actions">
          <div className="live-clock">🕒 {currentTime}</div>

          <div className={`connection-pill ${isOnline ? "online" : "offline"}`}>
            <span className="pulse-dot"></span>
            <span>{isOnline ? "Engine Online" : "Connecting..."}</span>
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={onSeed}
            disabled={loading}
            title="Load realistic New York disaster emergency scenario supplies and demands"
          >
            {loading ? "Seeding..." : "⚡ Seed Demo Scenario"}
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={onReset}
            disabled={loading}
            title="Clear all records"
          >
            Reset
          </button>
        </div>
      </div>

      <nav className="nav-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </header>
  );
}
