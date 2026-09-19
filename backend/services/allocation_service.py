"""
Allocation Service for RootCause.
Coordinates domain operations, repository access, deterministic matching, and state lifecycles.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import sys
import os

# Ensure allocation_engine is importable
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
root_dir = os.path.dirname(parent_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from allocation_engine.matcher import find_best_allocation, MatchResult
from models import Supply, Demand, Allocation, StatsResponse
from repositories import SupplyRepository, DemandRepository, AllocationRepository
from .explanation_service import get_explanation_service, ExplanationService


class AllocationService:
    def __init__(
        self,
        supply_repo: SupplyRepository,
        demand_repo: DemandRepository,
        allocation_repo: AllocationRepository,
        explanation_service: Optional[ExplanationService] = None,
    ):
        self.supply_repo = supply_repo
        self.demand_repo = demand_repo
        self.allocation_repo = allocation_repo
        self.explanation_service = explanation_service or get_explanation_service()

    def run_allocation(
        self,
        demand: Demand,
        allow_partial: bool = False
    ) -> Dict[str, Any]:
        """
        Execute deterministic matching between active supplies and the target demand.
        If a match is found, an optional human explanation is added.
        """
        supplies = self.supply_repo.list_all()
        result: MatchResult = find_best_allocation(
            supplies=supplies,
            demand=demand,
            allow_partial=allow_partial
        )

        res_dict = result.to_dict()

        if result.status == "MATCH_FOUND" and result.recommendation:
            rec = result.recommendation
            explanation = self.explanation_service.explain_allocation(
                recommendation=rec,
                demand=demand.model_dump()
            )
            res_dict["explanation"] = explanation
            rec["explanation"] = explanation

            # Create pending allocation record if demand has an ID
            if demand.id:
                now_str = datetime.now(timezone.utc).isoformat()
                alloc = Allocation(
                    demand_id=demand.id,
                    supply_id=rec["supply_id"],
                    provider=rec["provider"],
                    requester=demand.requester,
                    allocated_quantity=rec["allocated_quantity"],
                    score=rec["score"],
                    breakdown=rec.get("breakdown", {}),
                    reasons=rec.get("reasons", []),
                    created_at=now_str,
                    status="pending",
                    explanation=explanation,
                )
                saved_alloc = self.allocation_repo.add(alloc)
                res_dict["allocation_id"] = saved_alloc.id

        return res_dict

    def confirm_allocation(self, allocation_id: int) -> Optional[Allocation]:
        """
        Confirm a recommended allocation.
        Safely reduces the supply quantity or adjusts reserve, and transitions demand/allocation states.
        """
        alloc = self.allocation_repo.get_by_id(allocation_id)
        if not alloc:
            return None

        if alloc.status == "accepted":
            return alloc

        supply = self.supply_repo.get_by_id(alloc.supply_id)
        demand = self.demand_repo.get_by_id(alloc.demand_id)

        # Update supply inventory
        if supply:
            new_qty = max(0, supply.quantity - alloc.allocated_quantity)
            supply.quantity = new_qty
            if supply.reserve_quantity > supply.quantity:
                supply.reserve_quantity = supply.quantity
            if new_qty == 0:
                supply.status = "depleted"
            self.supply_repo.update(supply.id, supply)

        # Update demand status
        if demand:
            demand.status = "matched"
            self.demand_repo.update(demand.id, demand)

        alloc.status = "accepted"
        return self.allocation_repo.update(allocation_id, alloc)

    def complete_allocation(self, allocation_id: int) -> Optional[Allocation]:
        """
        Mark an allocation transfer as completed / delivered.
        """
        alloc = self.allocation_repo.get_by_id(allocation_id)
        if not alloc:
            return None

        alloc.status = "completed"
        updated_alloc = self.allocation_repo.update(allocation_id, alloc)

        demand = self.demand_repo.get_by_id(alloc.demand_id)
        if demand:
            demand.status = "fulfilled"
            self.demand_repo.update(demand.id, demand)

        return updated_alloc

    def get_stats(self) -> StatsResponse:
        """Compute aggregate system metrics for real-time dashboard display."""
        all_supplies = self.supply_repo.list_all()
        all_demands = self.demand_repo.list_all()
        all_allocations = self.allocation_repo.list_all()

        available_count = sum(
            1 for s in all_supplies
            if s.status == "available" and (s.quantity - s.reserve_quantity) > 0
        )
        active_demand_count = sum(
            1 for d in all_demands
            if d.status == "pending"
        )
        pending_match_count = sum(
            1 for a in all_allocations
            if a.status == "pending"
        )
        accepted_count = sum(
            1 for a in all_allocations
            if a.status == "accepted"
        )
        completed_count = sum(
            1 for a in all_allocations
            if a.status == "completed"
        )

        return StatsResponse(
            available_resources=available_count,
            active_demands=active_demand_count,
            pending_matches=pending_match_count,
            accepted_allocations=accepted_count,
            completed_transfers=completed_count,
            total_supplies=len(all_supplies),
            total_demands=len(all_demands),
        )
