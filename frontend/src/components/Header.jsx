import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Zap,
  AlertCircle,
  Package,
  ClipboardList,
  Clock,
  RotateCcw,
} from "lucide-react";

export default function Header({
  activeTab,
  setActiveTab,
  health,
  onSeed,
  onReset,
  loading,
}) {
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString());
  const navRef = React.useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toUTCString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateIndicator = () => {
      if (!navRef.current) return;
      const activeEl = navRef.current.querySelector(".nav-tab.active");
      if (activeEl) {
        setIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
        });
      }
    };
    updateIndicator();
    // Re-check after layout calculation
    const timeout = setTimeout(updateIndicator, 50);
    window.addEventListener("resize", updateIndicator);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeTab]);

  const tabs = [
    { id: "dashboard", label: "Operations Dashboard", Icon: LayoutDashboard },
    { id: "allocate", label: "Allocation Engine", Icon: Zap },
    { id: "post-demand", label: "Post Demand", Icon: AlertCircle },
    { id: "post-supply", label: "Post Supply", Icon: Package },
    { id: "activity", label: "Transfers & Activity", Icon: ClipboardList },
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
          <div className="live-clock" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Clock size={16} strokeWidth={1.5} />
            <span>{currentTime}</span>
          </div>

          <div className={`connection-pill ${isOnline ? "online" : "offline"}`}>
            <span className="pulse-dot"></span>
            <span>{isOnline ? "Engine Online" : "Connecting..."}</span>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={onSeed}
            disabled={loading}
            title="Load realistic New York disaster emergency scenario supplies and demands"
          >
            <Zap size={16} strokeWidth={1.5} />
            <span>{loading ? "Seeding..." : "Seed Demo Scenario"}</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={onReset}
            disabled={loading}
            title="Clear all records"
          >
            <RotateCcw size={16} strokeWidth={1.5} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <nav className="nav-tabs" ref={navRef}>
        {tabs.map((tab) => {
          const TabIcon = tab.Icon;
          return (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <TabIcon size={16} strokeWidth={1.5} />
              <span>{tab.label}</span>
            </button>
          );
        })}
        <span
          className="nav-tab-indicator"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />
      </nav>
    </header>
  );
}
