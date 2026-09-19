import React, { useState, useEffect, useCallback } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Header from "./components/Header";
import DashboardTab from "./components/DashboardTab";
import AllocateTab from "./components/AllocateTab";
import PostDemandTab from "./components/PostDemandTab";
import PostSupplyTab from "./components/PostSupplyTab";
import ActivityTab from "./components/ActivityTab";
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
    setNotification({ msg, type });
    setTimeout(() => {
      setNotification(null);
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
      showNotification(res.message || "Emergency disaster scenario loaded!");
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
      showNotification("Supply asset registered successfully.");
      await refreshAll();
    } finally {
      setLoading(false);
    }
  };

  const handlePostDemand = async (demandData) => {
    setLoading(true);
    try {
      await api.createDemand(demandData);
      showNotification("Emergency demand published successfully.");
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
      showNotification("Allocation confirmed! Inventory safely updated.");
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
      showNotification("Transfer delivered and fulfilled!");
      await refreshAll();
      return res;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        onSeed={handleSeed}
        onReset={handleReset}
        loading={loading}
      />

      {notification && (
        <div
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            zIndex: 1000,
            background: notification.type === "error" ? "var(--status-critical)" : "var(--status-ok)",
            color: "var(--bg)",
            padding: "0.75rem 1.25rem",
            borderRadius: "var(--radius-btn)",
            fontWeight: 600,
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {notification.type === "error" ? (
            <AlertCircle size={16} strokeWidth={1.5} />
          ) : (
            <CheckCircle2 size={16} strokeWidth={1.5} />
          )}
          <span>{notification.msg}</span>
        </div>
      )}

      <main className="main-content">
        {activeTab === "dashboard" && (
          <DashboardTab
            stats={stats}
            demands={demands}
            supplies={supplies}
            onSelectDemandForAllocation={handleSelectDemandForAllocation}
            onDeleteSupply={handleDeleteSupply}
            onDeleteDemand={handleDeleteDemand}
          />
        )}

        {activeTab === "allocate" && (
          <AllocateTab
            demands={demands}
            supplies={supplies}
            selectedDemand={selectedDemand}
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
