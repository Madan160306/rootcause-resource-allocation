"""
End-to-end integration tests for RootCause.
Validates complete user journey, deterministic scoring accuracy,
lifecycle transitions, and inventory reserve safety guarantees.
"""

import pytest
import sys
import os
from fastapi.testclient import TestClient

# Setup sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(current_dir))
backend_dir = os.path.join(root_dir, "backend")
for p in [root_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.main import app, supply_repo, demand_repo, allocation_repo

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_database():
    supply_repo.clear()
    demand_repo.clear()
    allocation_repo.clear()
    yield
    supply_repo.clear()
    demand_repo.clear()
    allocation_repo.clear()


def test_full_emergency_allocation_flow():
    # 1. Seed demo scenarios
    seed_res = client.post("/seed")
    assert seed_res.status_code == 200
    supplies_count = seed_res.json()["supplies_loaded"]
    demands_count = seed_res.json()["demands_loaded"]
    assert supplies_count >= 6
    assert demands_count >= 3

    # 2. Check initial system statistics
    stats_res = client.get("/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_supplies"] == supplies_count
    assert stats["active_demands"] == demands_count
    assert stats["accepted_allocations"] == 0

    # 3. Match Demand 1 (Oxygen Cylinder for Riverside Clinic)
    alloc_res = client.post("/allocate", json={"demand_id": 1, "allow_partial": False})
    assert alloc_res.status_code == 200
    alloc_data = alloc_res.json()

    assert alloc_data["status"] == "MATCH_FOUND"
    rec = alloc_data["recommendation"]
    assert rec["provider"] == "Metro General Hospital"
    assert rec["allocated_quantity"] == 20
    assert rec["score"] > 80.0
    assert "reasons" in rec
    assert "explanation" in alloc_data

    # Check top alternative candidate was provided
    assert len(alloc_data["alternatives"]) >= 1
    alt = alloc_data["alternatives"][0]
    assert alt["provider"] == "St. Jude Emergency Logistics"
    assert alt["score"] <= rec["score"]

    alloc_id = alloc_data["allocation_id"]

    # 4. Confirm allocation (Deduct inventory & preserve reserve)
    confirm_res = client.post(f"/allocations/{alloc_id}/confirm")
    assert confirm_res.status_code == 200
    confirmed = confirm_res.json()
    assert confirmed["status"] == "accepted"

    # Verify inventory was updated
    supply = client.get(f"/supplies/{rec['supply_id']}").json()
    assert supply["quantity"] == 30  # 50 - 20 = 30
    assert supply["reserve_quantity"] == 10  # Untouched reserve

    # 5. Complete transfer
    complete_res = client.post(f"/allocations/{alloc_id}/complete")
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "completed"

    # Verify demand is fulfilled
    demand = client.get("/demands/1").json()
    assert demand["status"] == "fulfilled"

    # 6. Verify stats reflect progression
    updated_stats = client.get("/stats").json()
    assert updated_stats["completed_transfers"] == 1
    assert updated_stats["active_demands"] == demands_count - 1


def test_reserve_protection_prevents_depletion():
    # Provider with total 10 units, but 10 in reserve (0 usable)
    client.post("/supplies", json={
        "resource_type": "Generator",
        "quantity": 10,
        "reserve_quantity": 10,
        "provider": "Protected Base Alpha",
        "location": "Sector 1",
        "latitude": 40.71,
        "longitude": -74.00,
        "status": "available",
    })

    # Demand for 2 generators
    alloc_res = client.post("/allocate", json={
        "demand": {
            "resource_type": "Generator",
            "quantity": 2,
            "requester": "Field Post",
            "location": "Sector 1",
            "latitude": 40.71,
            "longitude": -74.00,
            "urgency": "CRITICAL",
        },
        "allow_partial": False,
    })

    assert alloc_res.status_code == 200
    data = alloc_res.json()
    assert data["status"] == "NO_MATCH"
    assert any("reserve" in r.lower() or "usable" in r.lower() or "insufficient" in r.lower() for r in data["reasons"])


def test_partial_allocation_behavior():
    # Supply has only 5 usable units
    client.post("/supplies", json={
        "resource_type": "Medical Kit",
        "quantity": 10,
        "reserve_quantity": 5,  # 5 usable
        "provider": "Clinic Minor",
        "location": "North Hub",
        "latitude": 40.71,
        "longitude": -74.00,
        "status": "available",
    })

    # Demand needs 10 units
    demand_payload = {
        "demand": {
            "resource_type": "Medical Kit",
            "quantity": 10,
            "requester": "Disaster Zone Center",
            "location": "North Hub",
            "latitude": 40.71,
            "longitude": -74.00,
            "urgency": "HIGH",
        }
    }

    # Strict allocation without partial should fail
    strict_res = client.post("/allocate", json={**demand_payload, "allow_partial": False})
    assert strict_res.json()["status"] == "NO_MATCH"

    # Allocation with allow_partial=True should match 5 units
    partial_res = client.post("/allocate", json={**demand_payload, "allow_partial": True})
    assert partial_res.json()["status"] == "MATCH_FOUND"
    assert partial_res.json()["recommendation"]["allocated_quantity"] == 5
