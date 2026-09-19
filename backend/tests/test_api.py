import pytest
import sys
import os
from fastapi.testclient import TestClient

# Add project root and backend to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
root_dir = os.path.dirname(backend_dir)
for p in [root_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from main import app, supply_repo, demand_repo, allocation_repo

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_repos():
    supply_repo.clear()
    demand_repo.clear()
    allocation_repo.clear()
    yield
    supply_repo.clear()
    demand_repo.clear()
    allocation_repo.clear()


def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["project"] == "RootCause"
    assert data["status"] == "running"

    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_supply_crud():
    # Create supply
    payload = {
        "resource_type": "Oxygen Cylinder",
        "quantity": 50,
        "reserve_quantity": 10,
        "provider": "Apex Hospital",
        "location": "Sector 4",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "available_from": "2026-09-19T00:00:00Z",
        "available_until": "2026-09-22T00:00:00Z",
        "status": "available",
    }
    create_res = client.post("/supplies", json=payload)
    assert create_res.status_code == 201
    created_supply = create_res.json()
    assert created_supply["id"] == 1
    assert created_supply["quantity"] == 50

    # List supplies
    list_res = client.get("/supplies")
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    # Get single supply
    get_res = client.get("/supplies/1")
    assert get_res.status_code == 200
    assert get_res.json()["provider"] == "Apex Hospital"

    # Delete supply
    del_res = client.delete("/supplies/1")
    assert del_res.status_code == 200
    assert client.get("/supplies/1").status_code == 404


def test_demand_crud():
    payload = {
        "resource_type": "Ambulance",
        "quantity": 2,
        "requester": "Emergency Response Team 1",
        "location": "North Highway",
        "latitude": 12.9800,
        "longitude": 77.6000,
        "urgency": "CRITICAL",
        "needed_by": "2026-09-20T00:00:00Z",
    }
    create_res = client.post("/demands", json=payload)
    assert create_res.status_code == 201
    created_demand = create_res.json()
    assert created_demand["id"] == 1
    assert created_demand["urgency"] == "CRITICAL"

    # List demands
    list_res = client.get("/demands")
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    # Get single demand
    get_res = client.get("/demands/1")
    assert get_res.status_code == 200
    assert get_res.json()["requester"] == "Emergency Response Team 1"

    # Delete demand
    del_res = client.delete("/demands/1")
    assert del_res.status_code == 200
    assert client.get("/demands/1").status_code == 404


def test_seed_and_stats():
    seed_res = client.post("/seed")
    assert seed_res.status_code == 200
    assert seed_res.json()["supplies_loaded"] > 0
    assert seed_res.json()["demands_loaded"] > 0

    stats_res = client.get("/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_supplies"] == seed_res.json()["supplies_loaded"]
    assert stats["active_demands"] == seed_res.json()["demands_loaded"]
    assert stats["available_resources"] > 0


def test_allocate_and_lifecycle():
    client.post("/seed")

    # Allocate demand 1 (Oxygen Cylinder)
    alloc_req = {"demand_id": 1, "allow_partial": False}
    alloc_res = client.post("/allocate", json=alloc_req)
    assert alloc_res.status_code == 200
    data = alloc_res.json()
    assert data["status"] == "MATCH_FOUND"
    assert data["recommendation"] is not None
    assert "score" in data["recommendation"]
    assert "explanation" in data
    assert "allocation_id" in data

    alloc_id = data["allocation_id"]

    # Verify allocation record created
    get_alloc = client.get(f"/allocations/{alloc_id}")
    assert get_alloc.status_code == 200
    assert get_alloc.json()["status"] == "pending"

    # Confirm allocation
    confirm_res = client.post(f"/allocations/{alloc_id}/confirm")
    assert confirm_res.status_code == 200
    assert confirm_res.json()["status"] == "accepted"

    # Verify demand is marked matched
    updated_demand = client.get("/demands/1").json()
    assert updated_demand["status"] == "matched"

    # Verify supply inventory was deducted
    matched_supply_id = data["recommendation"]["supply_id"]
    updated_supply = client.get(f"/supplies/{matched_supply_id}").json()
    # Initial 50 - 20 requested = 30 remaining
    assert updated_supply["quantity"] == 30

    # Complete transfer
    complete_res = client.post(f"/allocations/{alloc_id}/complete")
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "completed"

    updated_demand_after = client.get("/demands/1").json()
    assert updated_demand_after["status"] == "fulfilled"


def test_allocate_no_match():
    # Demand for an unavailable resource
    no_match_req = {
        "demand": {
            "resource_type": "Shelter Kit",
            "quantity": 100,
            "requester": "Flood Relief Camp",
            "location": "Island Outpost",
            "latitude": 10.0,
            "longitude": 75.0,
            "urgency": "HIGH",
        }
    }
    alloc_res = client.post("/allocate", json=no_match_req)
    assert alloc_res.status_code == 200
    data = alloc_res.json()
    assert data["status"] == "NO_MATCH"
    assert "reasons" in data
    assert len(data["reasons"]) > 0
