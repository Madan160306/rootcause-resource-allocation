"""
RootCause Allocation Engine
Deterministic, explainable resource allocation for emergency and operational shortage management.
"""

from .eligibility import check_eligibility, EligibilityResult
from .scoring import score_allocation, ScoreBreakdown
from .matcher import find_best_allocation, MatchResult

__all__ = [
    "check_eligibility",
    "EligibilityResult",
    "score_allocation",
    "ScoreBreakdown",
    "find_best_allocation",
    "MatchResult",
]
