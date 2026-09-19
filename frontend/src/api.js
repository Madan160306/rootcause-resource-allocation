const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.detail || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on [${options.method || "GET"} ${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  getHealth: () => request("/health"),
  getStats: () => request("/stats"),

  // Supplies
  getSupplies: () => request("/supplies"),
  createSupply: (supply) => request("/supplies", { method: "POST", body: JSON.stringify(supply) }),
  deleteSupply: (id) => request(`/supplies/${id}`, { method: "DELETE" }),

  // Demands
  getDemands: () => request("/demands"),
  createDemand: (demand) => request("/demands", { method: "POST", body: JSON.stringify(demand) }),
  deleteDemand: (id) => request(`/demands/${id}`, { method: "DELETE" }),

  // Allocations
  allocate: (req) => request("/allocate", { method: "POST", body: JSON.stringify(req) }),
  getAllocations: () => request("/allocations"),
  confirmAllocation: (id) => request(`/allocations/${id}/confirm`, { method: "POST" }),
  completeAllocation: (id) => request(`/allocations/${id}/complete`, { method: "POST" }),

  // Seed & Reset
  seedDemoData: () => request("/seed", { method: "POST" }),
  resetData: () => request("/reset", { method: "POST" }),
};
