import pytest
from datetime import datetime, timezone, timedelta
from allocation_engine.eligibility import check_eligibility, EligibilityResult
from allocation_engine.scoring import score_allocation, haversine_distance_km, ScoringWeights
from allocation_engine.matcher import find_best_allocation, MatchResult


class DummySupply:
    def __init__(
        self,
        id=1,
        resource_type="Generator",
        quantity=10,
        reserve_quantity=3,
        provider="ABC Hospital",
        location="Metro Center",
        latitude=40.7128,
        longitude=-74.0060,
        available_from=None,
        available_until=None,
        status="available",
        provider_reliability=1.0,
    ):
        self.id = id
        self.resource_type = resource_type
        self.quantity = quantity
        self.reserve_quantity = reserve_quantity
        self.provider = provider
        self.location = location
        self.latitude = latitude
        self.longitude = longitude
        self.available_from = available_from
        self.available_until = available_until
        self.status = status
        self.provider_reliability = provider_reliability

    def model_dump(self):
        return {
            "id": self.id,
            "resource_type": self.resource_type,
            "quantity": self.quantity,
            "reserve_quantity": self.reserve_quantity,
            "provider": self.provider,
            "location": self.location,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "available_from": self.available_from,
            "available_until": self.available_until,
            "status": self.status,
            "provider_reliability": self.provider_reliability,
        }


class DummyDemand:
    def __init__(
        self,
        id=1,
        resource_type="Generator",
        quantity=2,
        requester="District Emergency Center",
        location="Downtown Hub",
        latitude=40.7306,
        longitude=-73.9352,
        urgency="CRITICAL",
        needed_by=None,
        status="pending",
    ):
        self.id = id
        self.resource_type = resource_type
        self.quantity = quantity
        self.requester = requester
        self.location = location
        self.latitude = latitude
        self.longitude = longitude
        self.urgency = urgency
        self.needed_by = needed_by
        self.status = status

    def model_dump(self):
        return {
            "id": self.id,
            "resource_type": self.resource_type,
            "quantity": self.quantity,
            "requester": self.requester,
            "location": self.location,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "urgency": self.urgency,
            "needed_by": self.needed_by,
            "status": self.status,
        }


# 1. Exact resource match
def test_exact_resource_match():
    supply = DummySupply(resource_type="Generator")
    demand = DummyDemand(resource_type="Generator")
    result = check_eligibility(supply, demand)
    assert result.eligible is True

    score_res = score_allocation(supply, demand)
    assert score_res.breakdown["resource_compatibility"] == 30.0
    assert "Exact resource match" in score_res.reasons


# 2. Wrong resource
def test_wrong_resource():
    supply = DummySupply(resource_type="Generator")
    demand = DummyDemand(resource_type="Ambulance")
    result = check_eligibility(supply, demand)
    assert result.eligible is False
    assert any("Resource type mismatch" in r for r in result.reasons)


# 3. Sufficient quantity
def test_sufficient_quantity():
    # quantity 10, reserve 3 => usable 7. Demand is 5.
    supply = DummySupply(quantity=10, reserve_quantity=3)
    demand = DummyDemand(quantity=5)
    result = check_eligibility(supply, demand)
    assert result.eligible is True
    assert result.usable_quantity == 7

    score_res = score_allocation(supply, demand)
    assert score_res.breakdown["quantity"] == 20.0
    assert "Sufficient usable quantity" in score_res.reasons


# 4. Insufficient quantity
def test_insufficient_quantity():
    # quantity 10, reserve 3 => usable 7. Demand is 8.
    supply = DummySupply(quantity=10, reserve_quantity=3)
    demand = DummyDemand(quantity=8)
    result = check_eligibility(supply, demand, allow_partial=False)
    assert result.eligible is False
    assert any("Insufficient usable quantity" in r for r in result.reasons)


# 5. Reserve quantity protection
def test_reserve_quantity_protection():
    # quantity = 10, reserve = 3 => usable = 7.
    # Demand for 8 should fail to claim
    supply = DummySupply(quantity=10, reserve_quantity=3)
    demand = DummyDemand(quantity=8)
    res = check_eligibility(supply, demand)
    assert res.eligible is False

    # Demand for 7 should succeed
    demand_fit = DummyDemand(quantity=7)
    res_fit = check_eligibility(supply, demand_fit)
    assert res_fit.eligible is True
    assert res_fit.usable_quantity == 7


# 6. Critical urgency
def test_critical_urgency():
    supply = DummySupply()
    demand = DummyDemand(urgency="CRITICAL")
    score_res = score_allocation(supply, demand)
    assert score_res.breakdown["urgency"] == 25.0
    assert "Critical demand" in score_res.reasons


# 7. High urgency
def test_high_urgency():
    supply = DummySupply()
    demand = DummyDemand(urgency="HIGH")
    score_res = score_allocation(supply, demand)
    assert score_res.breakdown["urgency"] == 20.0
    assert "High urgency demand" in score_res.reasons


# 8. Distance calculation (Haversine)
def test_distance_calculation():
    # Distance between NYC coordinates: ~6.2 km
    dist = haversine_distance_km(40.7128, -74.0060, 40.7306, -73.9352)
    assert 5.0 < dist < 8.0

    supply = DummySupply(latitude=40.7128, longitude=-74.0060)
    demand = DummyDemand(latitude=40.7306, longitude=-73.9352)
    score_res = score_allocation(supply, demand)
    assert score_res.breakdown["distance"] > 10.0
    assert any("km away" in r for r in score_res.reasons)

    # Test missing coordinates: does not add arbitrary points
    supply_no_loc = DummySupply(latitude=None, longitude=None)
    score_res_no_loc = score_allocation(supply_no_loc, demand)
    assert score_res_no_loc.breakdown["distance"] == 0.0


# 9. Time compatibility
def test_time_compatibility():
    now = datetime(2026, 9, 19, 10, 0, 0, tzinfo=timezone.utc)
    needed = now + timedelta(hours=4)
    available_until = now + timedelta(hours=24)

    supply = DummySupply(available_until=available_until.isoformat())
    demand = DummyDemand(needed_by=needed.isoformat())

    result = check_eligibility(supply, demand, reference_time=now)
    assert result.eligible is True

    score_res = score_allocation(supply, demand, reference_time=now)
    assert score_res.breakdown["time_compatibility"] > 0
    assert "Availability covers the required time" in score_res.reasons


# 10. Expired supply
def test_expired_supply():
    now = datetime(2026, 9, 19, 10, 0, 0, tzinfo=timezone.utc)
    past_expiry = now - timedelta(hours=2)

    supply = DummySupply(available_until=past_expiry.isoformat())
    demand = DummyDemand()

    result = check_eligibility(supply, demand, reference_time=now)
    assert result.eligible is False
    assert any("expired" in r for r in result.reasons)


# 11. No eligible candidates
def test_no_eligible_candidates():
    supplies = [
        DummySupply(id=1, resource_type="Ambulance"),
        DummySupply(id=2, resource_type="Water Tanker"),
    ]
    demand = DummyDemand(resource_type="Generator")
    match_res = find_best_allocation(supplies, demand)
    assert match_res.status == "NO_MATCH"
    assert match_res.recommendation is None
    assert len(match_res.reasons) > 0


# 12. Best candidate selection
def test_best_candidate_selection():
    # Supply 1 is close (high score), Supply 2 is far (lower score)
    close_supply = DummySupply(id=1, provider="Near Hospital", latitude=40.7128, longitude=-74.0060)
    far_supply = DummySupply(id=2, provider="Far Hospital", latitude=41.5000, longitude=-75.0000)
    demand = DummyDemand(latitude=40.7130, longitude=-74.0050)

    match_res = find_best_allocation([far_supply, close_supply], demand)
    assert match_res.status == "MATCH_FOUND"
    assert match_res.recommendation is not None
    assert match_res.recommendation["supply_id"] == 1
    assert match_res.recommendation["provider"] == "Near Hospital"


# 13. Alternative candidates
def test_alternative_candidates():
    s1 = DummySupply(id=1, provider="Provider 1", latitude=40.7128, longitude=-74.0060)
    s2 = DummySupply(id=2, provider="Provider 2", latitude=40.7200, longitude=-74.0100)
    s3 = DummySupply(id=3, provider="Provider 3", latitude=40.7300, longitude=-74.0200)
    demand = DummyDemand(latitude=40.7128, longitude=-74.0060)

    match_res = find_best_allocation([s1, s2, s3], demand)
    assert match_res.status == "MATCH_FOUND"
    assert len(match_res.alternatives) == 2
    assert match_res.recommendation["supply_id"] == 1
