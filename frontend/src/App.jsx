import React, { useState, useEffect, useCallback } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import Header from "./components/Header";
import DashboardTab from "./components/DashboardTab";
import AllocateTab from "./components/AllocateTab";
import PostDemandTab from "./components/PostDemandTab";
import PostSupplyTab from "./components/PostSupplyTab";
import ActivityTab from "./components/ActivityTab";
import MarqueeTicker from "./components/MarqueeTicker";
import { api } from "./api";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [supplies, setSupplies] = useState([]);
  const [demands, setDemands] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = "success") => {
    setNotification({ msg, type, id: Date.now() });
    setTimeout(() => {
      setNotification((curr) => (curr?.msg === msg ? null : curr));
    }, 4000);
  };

  const refreshAll = useCallback(async () => {
    try {
      const [hRes, sRes, supRes, demRes, allocRes] = await Promise.allSettled([
        api.getHealth(),
        api.getStats(),
        api.getSupplies(),
        api.getDemands(),
        api.getAllocations(),
      ]);

      if (hRes.status === "fulfilled") setHealth(hRes.value);
      if (sRes.status === "fulfilled") setStats(sRes.value);
      if (supRes.status === "fulfilled") setSupplies(supRes.value);
      if (demRes.status === "fulfilled") setDemands(demRes.value);
      if (allocRes.status === "fulfilled") setAllocations(allocRes.value);
    } catch (err) {
      console.warn("Data refresh issue:", err);
    }
  }, []);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 6000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  // Seed realistic disaster scenario
  const handleSeed = async () => {
    setLoading(true);
    try {
      const res = await api.seedDemoData();
      showNotification(res.message || "Emergency disaster scenario loaded successfully!");
      await refreshAll();
    } catch (err) {
      showNotification(err.message || "Failed to seed demo data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Reset all records
  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to clear all supplies, demands, and allocations?")) {
      return;
    }
    setLoading(true);
    try {
      await api.resetData();
      showNotification("All database records cleared.");
      await refreshAll();
    } catch (err) {
      showNotification(err.message || "Failed to reset data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemandForAllocation = (demand) => {
    setSelectedDemand(demand);
    setActiveTab("allocate");
  };

  const handlePostSupply = async (supplyData) => {
    setLoading(true);
    try {
      await api.createSupply(supplyData);
      showNotification("Supply asset and protected safety reserve registered!");
      await refreshAll();
    } finally {
      setLoading(false);
    }
  };

  const handlePostDemand = async (demandData) => {
    setLoading(true);
    try {
      await api.createDemand(demandData);
      showNotification("Emergency demand published to triage board!");
      await refreshAll();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSupply = async (id) => {
    try {
      await api.deleteSupply(id);
      showNotification("Supply record removed.");
      await refreshAll();
    } catch (err) {
      showNotification(err.message || "Failed to delete supply", "error");
    }
  };

  const handleDeleteDemand = async (id) => {
    try {
      await api.deleteDemand(id);
      showNotification("Demand record removed.");
      await refreshAll();
    } catch (err) {
      showNotification(err.message || "Failed to delete demand", "error");
    }
  };

  const handleRunAllocation = async (req) => {
    setLoading(true);
    try {
      const res = await api.allocate(req);
      await refreshAll();
      return res;
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAllocation = async (id) => {
    setLoading(true);
    try {
      const res = await api.confirmAllocation(id);
      showNotification("Allocation confirmed! Inventory safely updated & reserved.");
      await refreshAll();
      return res;
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAllocation = async (id) => {
    setLoading(true);
    try {
      const res = await api.completeAllocation(id);
      showNotification("Transfer completed! Emergency demand fulfilled.");
      await refreshAll();
      return res;
    } finally {
      setLoading(false);
    }
  };

  // Custom Editorial Cursor & Motion
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [cursorHovered, setCursorHovered] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
      if (!cursorVisible) setCursorVisible(true);
      const target = e.target;
      const isOverInteractive = Boolean(
        target &&
          target.closest(
            ".ruled-row, .item-card, .stat-column, button, a, .filter-chip, .nav-tab, .breakdown-card, .btn-match-accent"
          )
      );
      setCursorHovered(isOverInteractive);
    };

    const handleMouseLeave = () => setCursorVisible(false);

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [cursorVisible]);

  return (
    <div className="app-container">
      {/* Custom Editorial Cursor (grows over ruled rows & actions) */}
      <div
        className={`editorial-cursor ${cursorHovered ? "is-hovered" : ""} ${
          cursorVisible ? "is-visible" : ""
        }`}
        style={{
          transform: `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)`,
        }}
      />

      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        onSeed={handleSeed}
        onReset={handleReset}
        loading={loading}
        demandsCount={demands.length}
        suppliesCount={supplies.length}
        allocationsCount={allocations.length}
      />

      {/* Marquee Ticker of Live Critical Demands */}
      <MarqueeTicker demands={demands} />

      {notification && (
        <div
          className={`floating-toast ${
            notification.type === "error" ? "toast-error" : "toast-success"
          }`}
        >
          {notification.type === "error" ? (
            <AlertCircle size={18} strokeWidth={2.2} />
          ) : (
            <CheckCircle2 size={18} strokeWidth={2.2} />
          )}
          <span style={{ flex: 1 }}>{notification.msg}</span>
          <button
            onClick={() => setNotification(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              padding: "0.2rem",
              display: "flex",
              opacity: 0.7,
            }}
          >
            <X size={14} />
          </button>
          <div className="toast-progress-bar" />
        </div>
      )}

      <main className="main-content">
        {activeTab === "dashboard" && (
          <DashboardTab
            stats={stats}
            demands={demands}
            supplies={supplies}
            health={health}
            onNavigateTab={setActiveTab}
            onSelectDemandForAllocation={handleSelectDemandForAllocation}
            onDeleteSupply={handleDeleteSupply}
            onDeleteDemand={handleDeleteDemand}
          />
        )}

        {activeTab === "allocate" && (
          <AllocateTab
            demands={demands}
            supplies={supplies}
            health={health}
            selectedDemand={selectedDemand}
            onNavigateTab={setActiveTab}
            onRunAllocation={handleRunAllocation}
            onConfirmAllocation={handleConfirmAllocation}
            onCompleteAllocation={handleCompleteAllocation}
            loading={loading}
          />
        )}

        {activeTab === "post-demand" && (
          <PostDemandTab
            onPostDemand={handlePostDemand}
            onSuccessRedirect={() => setActiveTab("dashboard")}
            loading={loading}
          />
        )}

        {activeTab === "post-supply" && (
          <PostSupplyTab
            onPostSupply={handlePostSupply}
            onSuccessRedirect={() => setActiveTab("dashboard")}
            loading={loading}
          />
        )}

        {activeTab === "activity" && (
          <ActivityTab
            allocations={allocations}
            onConfirmAllocation={handleConfirmAllocation}
            onCompleteAllocation={handleCompleteAllocation}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
}
