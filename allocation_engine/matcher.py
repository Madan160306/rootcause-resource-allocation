"""
Best-Candidate Matcher for RootCause Resource Allocation.
Filters ineligible supplies, computes deterministic scores, and selects best match and top alternatives.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from .eligibility import check_eligibility
from .scoring import score_allocation, ScoringWeights


class MatchResult:
    def __init__(
        self,
        status: str,
        recommendation: Optional[Dict[str, Any]] = None,
        alternatives: Optional[List[Dict[str, Any]]] = None,
        rejected_candidates: Optional[List[Dict[str, Any]]] = None,
        message: Optional[str] = None,
        reasons: Optional[List[str]] = None,
    ):
        self.status = status  # "MATCH_FOUND" or "NO_MATCH"
        self.recommendation = recommendation
        self.alternatives = alternatives or []
        self.rejected_candidates = rejected_candidates or []
        self.message = message
        self.reasons = reasons or []

    def to_dict(self) -> Dict[str, Any]:
        result: Dict[str, Any] = {"status": self.status}
        if self.status == "MATCH_FOUND":
            result["recommendation"] = self.recommendation
            result["alternatives"] = self.alternatives
            if self.rejected_candidates:
                result["rejected_candidates"] = self.rejected_candidates
        else:
            result["message"] = self.message or "No suitable resource found"
            result["reasons"] = self.reasons
            if self.rejected_candidates:
                result["rejected_candidates"] = self.rejected_candidates
        return result


def find_best_allocation(
    supplies: List[Any],
    demand: Any,
    weights: Optional[ScoringWeights] = None,
    allow_partial: bool = False,
    reference_time: Optional[datetime] = None,
) -> MatchResult:
    """
    Evaluate available supplies against a specific demand.
    
    1. Filter ineligible supplies using hard constraints.
    2. Score all eligible supplies deterministically.
    3. Sort eligible candidates by score in descending order.
    4. Return best candidate as recommendation, plus remaining top candidates as alternatives.
    5. If no supplies are eligible, return NO_MATCH with aggregate reasons.
    """
    eligible_candidates: List[Dict[str, Any]] = []
    rejected_candidates: List[Dict[str, Any]] = []
    all_rejection_reasons: List[str] = []

    for supply in supplies:
        eligibility = check_eligibility(
            supply,
            demand,
            allow_partial=allow_partial,
            reference_time=reference_time
        )
        
        supply_dict = supply.model_dump() if hasattr(supply, "model_dump") else (
            supply.dict() if hasattr(supply, "dict") else dict(supply.__dict__)
        )
        
        if eligibility.eligible:
            score_res = score_allocation(
                supply,
                demand,
                weights=weights,
                allow_partial=allow_partial,
                reference_time=reference_time
            )
            requested_qty = getattr(demand, "quantity", 0)
            allocated_qty = min(requested_qty, eligibility.usable_quantity)

            eligible_candidates.append({
                "supply": supply_dict,
                "supply_id": supply_dict.get("id"),
                "provider": supply_dict.get("provider"),
                "location": supply_dict.get("location"),
                "available_quantity": supply_dict.get("quantity"),
                "usable_quantity": eligibility.usable_quantity,
                "reserve_quantity": supply_dict.get("reserve_quantity", 0),
                "allocated_quantity": allocated_qty,
                "score": round(score_res.score, 1),
                "breakdown": score_res.breakdown,
                "reasons": score_res.reasons,
                "distance_km": score_res.distance_km,
            })
        else:
            rejected_candidates.append({
                "supply_id": supply_dict.get("id"),
                "provider": supply_dict.get("provider"),
                "resource_type": supply_dict.get("resource_type"),
                "reasons": eligibility.reasons,
            })
            for r in eligibility.reasons:
                if r not in all_rejection_reasons:
                    all_rejection_reasons.append(r)

    if not eligible_candidates:
        if not all_rejection_reasons:
            all_rejection_reasons = ["No supply records found in the repository"]
        return MatchResult(
            status="NO_MATCH",
            message="No suitable resource found",
            reasons=all_rejection_reasons,
            rejected_candidates=rejected_candidates,
        )

    # Sort candidates descending by score, tie-breaking by usable_quantity descending
    eligible_candidates.sort(
        key=lambda c: (c["score"], c["usable_quantity"]),
        reverse=True
    )

    recommendation = eligible_candidates[0]
    alternatives = eligible_candidates[1:]

    return MatchResult(
        status="MATCH_FOUND",
        recommendation=recommendation,
        alternatives=alternatives,
        rejected_candidates=rejected_candidates,
    )
