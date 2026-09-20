"""
Eligibility Engine for RootCause Resource Allocation.
Enforces hard constraints, time windows, and reserve quantity protection.
"""

from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, timezone
import re


def parse_flexible_datetime(dt_input: Any) -> Optional[datetime]:
    """Parse ISO strings, timestamps, or common datetime formats gracefully."""
    if dt_input is None:
        return None
    if isinstance(dt_input, datetime):
        return dt_input if dt_input.tzinfo else dt_input.replace(tzinfo=timezone.utc)
    
    if not isinstance(dt_input, str):
        return None
    
    s = dt_input.strip()
    if not s:
        return None

    # Handle standard ISO formats
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:
        pass

    # Try common formats
    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
        "%m/%d/%Y %H:%M:%S",
        "%m/%d/%Y %H:%M",
        "%m/%d/%Y",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(s, fmt)
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            continue

    # Fallback: if string has relative text like 'Today, 10:00 AM', leave as None
    return None


class EligibilityResult:
    def __init__(self, eligible: bool, reasons: Optional[List[str]] = None, usable_quantity: int = 0):
        self.eligible = eligible
        self.reasons = reasons or []
        self.usable_quantity = usable_quantity

    def to_dict(self) -> Dict[str, Any]:
        return {
            "eligible": self.eligible,
            "reasons": self.reasons,
            "usable_quantity": self.usable_quantity,
        }

    def __repr__(self) -> str:
        return f"<EligibilityResult eligible={self.eligible} reasons={self.reasons} usable={self.usable_quantity}>"


def check_eligibility(
    supply: Any,
    demand: Any,
    allow_partial: bool = False,
    reference_time: Optional[datetime] = None
) -> EligibilityResult:
    """
    Determine whether a supply candidate is eligible to fulfill a demand.
    
    Checks:
    1. Resource type exact match (case-insensitive & stripped)
    2. Status availability (status == 'available')
    3. Usable quantity > 0 (quantity - reserve_quantity)
    4. Required quantity fulfillment (usable_quantity >= demand.quantity, unless allow_partial)
    5. Time window compatibility & expiration checks
    """
    reasons: List[str] = []

    # 1. Resource Type Check
    supply_type = getattr(supply, "resource_type", "") or ""
    demand_type = getattr(demand, "resource_type", "") or ""
    
    normalized_supply_type = supply_type.strip().lower()
    normalized_demand_type = demand_type.strip().lower()

    if normalized_supply_type != normalized_demand_type:
        reasons.append(
            f"Resource type mismatch (Supply: '{supply_type}', Requested: '{demand_type}')"
        )

    # 2. Availability Status Check
    supply_status = (getattr(supply, "status", "available") or "available").lower()
    if supply_status != "available":
        reasons.append(f"Supply is unavailable (current status: {supply_status})")

    # 3. Reserve Protection & Usable Quantity Check
    total_qty = getattr(supply, "quantity", 0) or 0
    reserve_qty = getattr(supply, "reserve_quantity", 0) or 0
    requested_qty = getattr(demand, "quantity", 0) or 0
    
    usable_qty = max(0, total_qty - reserve_qty)

    if usable_qty <= 0:
        reasons.append("Insufficient usable quantity (0 units available after reserve)")
    elif requested_qty > usable_qty:
        if not allow_partial:
            reasons.append(
                f"Insufficient usable quantity (requested {requested_qty}, usable {usable_qty} after protecting reserve of {reserve_qty})"
            )

    # 4. Time Window and Expiry Check
    now = reference_time or datetime.now(timezone.utc)
    
    avail_from_dt = parse_flexible_datetime(getattr(supply, "available_from", None))
    avail_until_dt = parse_flexible_datetime(getattr(supply, "available_until", None))
    needed_by_dt = parse_flexible_datetime(getattr(demand, "needed_by", None))

    if avail_until_dt:
        # Check if supply is already expired
        if avail_until_dt < now:
            reasons.append(f"Supply has expired (availability ended {avail_until_dt.isoformat()})")
        
        # If needed_by is provided, check if availability covers needed_by
        if needed_by_dt and needed_by_dt > avail_until_dt:
            reasons.append(
                f"Required time is outside availability window (Needed by: {needed_by_dt.isoformat()}, Available until: {avail_until_dt.isoformat()})"
            )

    if avail_from_dt and needed_by_dt:
        if avail_from_dt > needed_by_dt:
            reasons.append(
                f"Supply not available in time (Available from: {avail_from_dt.isoformat()}, Needed by: {needed_by_dt.isoformat()})"
            )

    is_eligible = len(reasons) == 0
    return EligibilityResult(eligible=is_eligible, reasons=reasons, usable_quantity=usable_qty)
