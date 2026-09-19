"""
Deterministic, Explainable Scoring Engine for RootCause Resource Allocation.
Provides modular weights, Haversine distance calculations, and granular reasoning breakdowns.
"""

import math
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from .eligibility import parse_flexible_datetime


class ScoringWeights:
    """Configurable scoring weights summing to 100 points."""
    def __init__(
        self,
        resource_compatibility: float = 30.0,
        urgency: float = 25.0,
        quantity: float = 20.0,
        distance: float = 15.0,
        time_compatibility: float = 10.0,
        max_distance_km: float = 45.0,
    ):
        self.resource_compatibility = resource_compatibility
        self.urgency = urgency
        self.quantity = quantity
        self.distance = distance
        self.time_compatibility = time_compatibility
        self.max_distance_km = max_distance_km


URGENCY_SCORES = {
    "CRITICAL": 25.0,
    "HIGH": 20.0,
    "MEDIUM": 12.0,
    "LOW": 5.0,
}


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on the Earth in kilometers.
    Uses standard Haversine formula.
    """
    R = 6371.0  # Earth radius in kilometers

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


class ScoreBreakdown:
    def __init__(
        self,
        score: float,
        breakdown: Dict[str, float],
        reasons: List[str],
        distance_km: Optional[float] = None,
    ):
        self.score = score
        self.breakdown = breakdown
        self.reasons = reasons
        self.distance_km = distance_km

    def to_dict(self) -> Dict[str, Any]:
        return {
            "score": round(self.score, 1),
            "breakdown": {k: round(v, 1) for k, v in self.breakdown.items()},
            "reasons": self.reasons,
            "distance_km": round(self.distance_km, 2) if self.distance_km is not None else None,
        }


def score_allocation(
    supply: Any,
    demand: Any,
    weights: Optional[ScoringWeights] = None,
    allow_partial: bool = False,
    reference_time: Optional[datetime] = None,
) -> ScoreBreakdown:
    """
    Compute deterministic score and reasons for a compatible supply and demand pair.
    """
    cfg = weights or ScoringWeights()
    breakdown: Dict[str, float] = {}
    reasons: List[str] = []

    # 1. Resource Compatibility (Default max 30)
    supply_type = (getattr(supply, "resource_type", "") or "").strip().lower()
    demand_type = (getattr(demand, "resource_type", "") or "").strip().lower()
    if supply_type == demand_type and supply_type != "":
        breakdown["resource_compatibility"] = cfg.resource_compatibility
        reasons.append("Exact resource match")
    else:
        breakdown["resource_compatibility"] = 0.0
        reasons.append("Resource mismatch")

    # 2. Urgency (Default max 25)
    urgency_str = (getattr(demand, "urgency", "MEDIUM") or "MEDIUM").strip().upper()
    urgency_base = URGENCY_SCORES.get(urgency_str, 12.0)
    # Scale in case weight is customized
    urgency_points = round((urgency_base / 25.0) * cfg.urgency, 1)
    breakdown["urgency"] = urgency_points
    if urgency_str == "CRITICAL":
        reasons.append("Critical demand")
    elif urgency_str == "HIGH":
        reasons.append("High urgency demand")
    elif urgency_str == "MEDIUM":
        reasons.append("Medium urgency demand")
    else:
        reasons.append(f"{urgency_str.capitalize()} urgency demand")

    # 3. Quantity Availability (Default max 20)
    total_qty = getattr(supply, "quantity", 0) or 0
    reserve_qty = getattr(supply, "reserve_quantity", 0) or 0
    requested_qty = getattr(demand, "quantity", 0) or 0
    usable_qty = max(0, total_qty - reserve_qty)

    if usable_qty >= requested_qty:
        breakdown["quantity"] = cfg.quantity
        reasons.append("Sufficient usable quantity")
    elif allow_partial and requested_qty > 0 and usable_qty > 0:
        partial_ratio = min(1.0, usable_qty / requested_qty)
        partial_pts = round(partial_ratio * cfg.quantity, 1)
        breakdown["quantity"] = partial_pts
        reasons.append(f"Partial fulfillment capability ({usable_qty}/{requested_qty} units)")
    else:
        breakdown["quantity"] = 0.0
        reasons.append("Insufficient quantity available")

    # 4. Distance Calculation via Haversine (Default max 15)
    sup_lat = getattr(supply, "latitude", None)
    sup_lon = getattr(supply, "longitude", None)
    dem_lat = getattr(demand, "latitude", None)
    dem_lon = getattr(demand, "longitude", None)

    dist_km: Optional[float] = None
    if None not in (sup_lat, sup_lon, dem_lat, dem_lon):
        try:
            dist_km = haversine_distance_km(float(sup_lat), float(sup_lon), float(dem_lat), float(dem_lon))
            # Linear decay from cfg.distance points down to 0 at max_distance_km
            if dist_km <= 0.1:
                dist_score = cfg.distance
            elif dist_km >= cfg.max_distance_km:
                dist_score = max(0.0, cfg.distance * 0.1) # small distance presence if reachable
            else:
                ratio = 1.0 - (dist_km / cfg.max_distance_km)
                dist_score = round(cfg.distance * max(0.0, ratio), 1)
            
            breakdown["distance"] = dist_score
            reasons.append(f"Provider is {dist_km:.1f} km away")
        except Exception:
            breakdown["distance"] = 0.0
            reasons.append("Distance calculation unavailable due to invalid coordinates")
    else:
        # Distance coordinates not supplied - do not add points blindly
        breakdown["distance"] = 0.0
        reasons.append("Geographic coordinates not provided for distance calculation")

    # 5. Time Compatibility (Default max 10)
    avail_from_dt = parse_flexible_datetime(getattr(supply, "available_from", None))
    avail_until_dt = parse_flexible_datetime(getattr(supply, "available_until", None))
    needed_by_dt = parse_flexible_datetime(getattr(demand, "needed_by", None))
    now = reference_time or datetime.now(timezone.utc)

    if needed_by_dt and avail_until_dt:
        if avail_until_dt >= needed_by_dt:
            # Buffer calculation
            buffer_hours = (avail_until_dt - needed_by_dt).total_seconds() / 3600.0
            if buffer_hours >= 12.0:
                time_pts = cfg.time_compatibility
            elif buffer_hours >= 2.0:
                time_pts = round(cfg.time_compatibility * 0.7, 1)
            else:
                time_pts = round(cfg.time_compatibility * 0.5, 1)
            breakdown["time_compatibility"] = time_pts
            reasons.append("Availability covers the required time")
        else:
            breakdown["time_compatibility"] = 0.0
            reasons.append("Availability window ends before needed time")
    else:
        # Fallback: availability active
        breakdown["time_compatibility"] = round(cfg.time_compatibility * 0.7, 1)
        reasons.append("Availability covers the required time")

    if reserve_qty > 0:
        reasons.append(f"Provider reserve maintained ({reserve_qty} units protected)")

    total_score = sum(breakdown.values())
    total_score = max(0.0, min(100.0, total_score))

    return ScoreBreakdown(
        score=total_score,
        breakdown=breakdown,
        reasons=reasons,
        distance_km=dist_km,
    )
