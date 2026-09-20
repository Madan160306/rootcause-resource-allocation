import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Zap,
  AlertCircle,
  Package,
  ClipboardList,
  Clock,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export default function Header({
  activeTab,
  setActiveTab,
  health,
  onSeed,
  onReset,
  loading,
  demandsCount = 0,
  suppliesCount = 0,
  allocationsCount = 0,
}) {
  const [currentTime, setCurrentTime] = useState("");
  const navRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toUTCString().replace("GMT", "UTC")
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
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
    const timeout = setTimeout(updateIndicator, 60);
    window.addEventListener("resize", updateIndicator);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeTab, demandsCount, suppliesCount, allocationsCount]);

  const tabs = [
    {
      id: "dashboard",
      label: "Operations",
      Icon: LayoutDashboard,
      count: demandsCount + suppliesCount,
    },
    {
      id: "allocate",
      label: "Allocation",
      Icon: Zap,
      highlight: true,
    },
    {
      id: "post-demand",
      label: "Demands",
      Icon: AlertCircle,
      count: demandsCount,
    },
    {
      id: "post-supply",
      label: "Supplies",
      Icon: Package,
      count: suppliesCount,
    },
    {
      id: "activity",
      label: "Transfers",
      Icon: ClipboardList,
      count: allocationsCount,
    },
  ];

  const isOnline = health && health.status === "healthy";
  const isBedrockActive = health && health.bedrock_status === "CONNECTED";

  return (
    <header className="app-header">
      <div className="header-utility">
        <div className="utility-left">
          <span className="brand-badge font-mono">DETERMINISTIC &bull; AUDITABLE &bull; EXPLAINABLE</span>
        </div>

        <div className="header-actions">
          <div className="live-clock font-mono">
            <Clock size={12} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
            <span>{currentTime || "SYNCHRONIZING..."}</span>
          </div>

          <div className="connection-pill font-mono">
            <span
              className="status-dot"
              style={{ backgroundColor: isOnline ? "var(--status-ok)" : "var(--status-critical)" }}
            />
            <span>{isOnline ? "ENGINE: ONLINE" : "ENGINE: OFFLINE"}</span>
          </div>

          <div className="connection-pill font-mono">
            <span
              className="status-dot"
              style={{
                backgroundColor: isBedrockActive ? "var(--status-ok)" : "var(--muted)",
              }}
            />
            <span>{isBedrockActive ? "BEDROCK: CONNECTED" : "BEDROCK: LOCAL HEURISTIC"}</span>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={onSeed}
            disabled={loading}
            title="Load realistic New York disaster emergency scenario supplies and demands"
          >
            <Sparkles size={12} strokeWidth={2} style={{ color: "var(--accent)" }} />
            <span>{loading ? "SEEDING..." : "SEED SCENARIO"}</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={onReset}
            disabled={loading}
            title="Clear all records"
          >
            <RotateCcw size={12} strokeWidth={1.5} />
            <span>RESET</span>
          </button>
        </div>
      </div>

      <div className="header-hero-grid">
        <h1 className="brand-title">RootCause</h1>
        <div className="header-tagline-col">
          <p className="brand-subtitle">
            Emergency Resource Allocation &amp; Decision Support Engine
          </p>
        </div>
      </div>

      <div className="nav-tabs-wrapper">
        <nav className="nav-tabs" ref={navRef}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`nav-tab ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" && tab.count > 0 && (
                  <span className="tab-count-pill font-mono">[{tab.count}]</span>
                )}
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
      </div>
    </header>
  );
}
