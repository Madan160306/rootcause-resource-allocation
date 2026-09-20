"""
RootCause API - Real-Time Explainable Resource Allocation Backend.
FastAPI application exposing RESTful endpoints for emergency supply/demand management,
deterministic matching, explainability narratives, and lifecycle transitions.
"""

import os
import sys
from typing import List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

# Ensure correct sys.path whether run from project root or backend folder
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from models import Supply, Demand, Allocation, AllocateRequest, StatsResponse
from repositories import (
    LocalSupplyRepository,
    LocalDemandRepository,
    LocalAllocationRepository,
    get_repositories,
)
from services import AllocationService, get_explanation_service

app = FastAPI(
    title="RootCause: Explainable Resource Allocation API",
    description="Deterministic and explainable resource allocation engine for emergency operations.",
    version="1.0.0",
)

# CORS configuration for local React frontend and testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Repository & service singletons
supply_repo, demand_repo, allocation_repo = get_repositories()
explanation_service = get_explanation_service()
allocation_service = AllocationService(
    supply_repo=supply_repo,
    demand_repo=demand_repo,
    allocation_repo=allocation_repo,
    explanation_service=explanation_service,
)


@app.get("/")
def root():
    return {
        "project": "RootCause",
        "tagline": "Explainable Real-Time Resource Allocation Engine",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "engine": "active",
        "explanation_mode": "bedrock" if os.environ.get("USE_BEDROCK") else "local",
        "storage_mode": "dynamodb" if os.environ.get("USE_DYNAMODB", "").lower() in ("true", "1", "yes") else "local",
    }



# ==========================================
# Supply Endpoints
# ==========================================

@app.get("/supplies", response_model=List[Supply])
def get_supplies():
    return supply_repo.list_all()


@app.post("/supplies", response_model=Supply, status_code=status.HTTP_201_CREATED)
def create_supply(supply: Supply):
    created = supply_repo.add(supply)
    return created


@app.get("/supplies/{supply_id}", response_model=Supply)
def get_supply(supply_id: int):
    supply = supply_repo.get_by_id(supply_id)
    if not supply:
        raise HTTPException(status_code=404, detail=f"Supply with ID {supply_id} not found")
    return supply


@app.delete("/supplies/{supply_id}")
def delete_supply(supply_id: int):
    deleted = supply_repo.delete(supply_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Supply with ID {supply_id} not found")
    return {"message": f"Supply {supply_id} deleted successfully"}


# ==========================================
# Demand Endpoints
# ==========================================

@app.get("/demands", response_model=List[Demand])
def get_demands():
    return demand_repo.list_all()


@app.post("/demands", response_model=Demand, status_code=status.HTTP_201_CREATED)
def create_demand(demand: Demand):
    created = demand_repo.add(demand)
    return created


@app.get("/demands/{demand_id}", response_model=Demand)
def get_demand(demand_id: int):
    demand = demand_repo.get_by_id(demand_id)
    if not demand:
        raise HTTPException(status_code=404, detail=f"Demand with ID {demand_id} not found")
    return demand


@app.delete("/demands/{demand_id}")
def delete_demand(demand_id: int):
    deleted = demand_repo.delete(demand_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Demand with ID {demand_id} not found")
    return {"message": f"Demand {demand_id} deleted successfully"}


# ==========================================
# Allocation & Matching Endpoints
# ==========================================

@app.post("/allocate")
def run_allocation(req: AllocateRequest):
    """
    Run deterministic resource allocation matching for a demand.
    Accepts either an existing `demand_id` or an inline `demand` object.
    """
    target_demand: Optional[Demand] = None

    if req.demand_id is not None:
        target_demand = demand_repo.get_by_id(req.demand_id)
        if not target_demand:
            raise HTTPException(status_code=404, detail=f"Demand with ID {req.demand_id} not found")
    elif req.demand is not None:
        target_demand = req.demand
    else:
        raise HTTPException(
            status_code=400,
            detail="Either 'demand_id' or 'demand' payload must be provided"
        )

    result = allocation_service.run_allocation(
        demand=target_demand,
        allow_partial=req.allow_partial,
    )
    return result


@app.get("/allocations", response_model=List[Allocation])
def get_allocations():
    return allocation_repo.list_all()


@app.get("/allocations/{allocation_id}", response_model=Allocation)
def get_allocation(allocation_id: int):
    alloc = allocation_repo.get_by_id(allocation_id)
    if not alloc:
        raise HTTPException(status_code=404, detail=f"Allocation with ID {allocation_id} not found")
    return alloc


@app.post("/allocations/{allocation_id}/confirm", response_model=Allocation)
def confirm_allocation(allocation_id: int):
    """
    Confirm an allocation recommendation. Deducts supply inventory safely
    and advances demand/allocation status.
    """
    updated = allocation_service.confirm_allocation(allocation_id)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Allocation with ID {allocation_id} not found")
    return updated


@app.post("/allocations/{allocation_id}/complete", response_model=Allocation)
def complete_allocation(allocation_id: int):
    """
    Mark an allocation transfer as completed and demand as fulfilled.
    """
    updated = allocation_service.complete_allocation(allocation_id)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Allocation with ID {allocation_id} not found")
    return updated


@app.get("/stats", response_model=StatsResponse)
def get_stats():
    """Retrieve aggregate platform metrics for real-time status dashboards."""
    return allocation_service.get_stats()


# ==========================================
# Seed & Reset for Testing / Demos
# ==========================================

DEMO_SUPPLIES = [
    {
        "id": 1,
        "resource_type": "Oxygen Cylinder",
        "quantity": 50,
        "reserve_quantity": 10,
        "provider": "Metro General Hospital",
        "location": "Downtown Center",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "available_from": "2026-09-19T00:00:00Z",
        "available_until": "2026-09-22T23:59:59Z",
        "status": "available",
        "provider_reliability": 0.98,
    },
    {
        "id": 2,
        "resource_type": "Oxygen Cylinder",
        "quantity": 30,
        "reserve_quantity": 5,
        "provider": "St. Jude Emergency Logistics",
        "location": "Eastside Medical Hub",
        "latitude": 40.7306,
        "longitude": -73.9352,
        "available_from": "2026-09-19T00:00:00Z",
        "available_until": "2026-09-25T23:59:59Z",
        "status": "available",
        "provider_reliability": 0.94,
    },
    {
        "id": 3,
        "resource_type": "Generator",
        "quantity": 8,
        "reserve_quantity": 2,
        "provider": "Red Cross Emergency Depot",
        "location": "Queens Logistics Park",
        "latitude": 40.7282,
        "longitude": -73.7949,
        "available_from": "2026-09-19T00:00:00Z",
        "available_until": "2026-09-30T23:59:59Z",
        "status": "available",
        "provider_reliability": 0.99,
    },
    {
        "id": 4,
        "resource_type": "Ambulance",
        "quantity": 12,
        "reserve_quantity": 2,
        "provider": "City EMS Fleet Operations",
        "location": "Midtown Dispatch Center",
        "latitude": 40.7589,
        "longitude": -73.9851,
        "available_from": "2026-09-19T00:00:00Z",
        "available_until": "2026-09-21T18:00:00Z",
        "status": "available",
        "provider_reliability": 0.97,
    },
    {
        "id": 5,
        "resource_type": "Blood Unit",
        "quantity": 120,
        "reserve_quantity": 30,
        "provider": "Regional Blood Bank",
        "location": "Brooklyn Medical Complex",
        "latitude": 40.6782,
        "longitude": -73.9442,
        "available_from": "2026-09-19T00:00:00Z",
        "available_until": "2026-09-24T12:00:00Z",
        "status": "available",
        "provider_reliability": 0.96,
    },
    {
        "id": 6,
        "resource_type": "Medical Kit",
        "quantity": 200,
        "reserve_quantity": 40,
        "provider": "Apex Disaster Relief",
        "location": "North Bronx Depot",
        "latitude": 40.8448,
        "longitude": -73.8648,
        "available_from": "2026-09-19T00:00:00Z",
        "available_until": "2026-09-26T23:59:59Z",
        "status": "available",
        "provider_reliability": 0.92,
    },
]

DEMO_DEMANDS = [
    {
        "id": 1,
        "resource_type": "Oxygen Cylinder",
        "quantity": 20,
        "requester": "Riverside Community Clinic",
        "location": "Manhattan West",
        "latitude": 40.7200,
        "longitude": -74.0100,
        "urgency": "CRITICAL",
        "needed_by": "2026-09-20T12:00:00Z",
        "status": "pending",
        "created_at": "2026-09-19T08:30:00Z",
    },
    {
        "id": 2,
        "resource_type": "Generator",
        "quantity": 4,
        "requester": "Field Triage Station Bravo",
        "location": "Flushing Outpost",
        "latitude": 40.7675,
        "longitude": -73.8331,
        "urgency": "HIGH",
        "needed_by": "2026-09-21T06:00:00Z",
        "status": "pending",
        "created_at": "2026-09-19T09:15:00Z",
    },
    {
        "id": 3,
        "resource_type": "Ambulance",
        "quantity": 3,
        "requester": "Highway Trauma Team",
        "location": "Times Square Corridor",
        "latitude": 40.7580,
        "longitude": -73.9855,
        "urgency": "CRITICAL",
        "needed_by": "2026-09-19T14:00:00Z",
        "status": "pending",
        "created_at": "2026-09-19T10:00:00Z",
    },
]


@app.post("/seed")
def seed_demo_data():
    """Seeds repositories with rich, realistic emergency scenario data."""
    supply_repo.clear()
    demand_repo.clear()
    allocation_repo.clear()

    for s_dict in DEMO_SUPPLIES:
        supply_repo.add(Supply(**s_dict))

    for d_dict in DEMO_DEMANDS:
        demand_repo.add(Demand(**d_dict))

    return {
        "message": "Demo data successfully seeded",
        "supplies_loaded": supply_repo.count(),
        "demands_loaded": demand_repo.count(),
    }


@app.post("/reset")
def reset_all():
    """Resets all repositories for test isolation."""
    supply_repo.clear()
    demand_repo.clear()
    allocation_repo.clear()
    return {"message": "All repositories cleared"}