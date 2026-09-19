from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone


VALID_RESOURCE_TYPES = [
    "Generator",
    "Ambulance",
    "Oxygen Cylinder",
    "Blood Unit",
    "Medical Kit",
    "Water Tanker",
    "Food Packet",
    "Shelter Kit",
]

VALID_URGENCIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]


class Supply(BaseModel):
    id: Optional[int] = None
    resource_type: str
    quantity: int
    reserve_quantity: int = 0
    provider: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    available_from: Optional[str] = None
    available_until: Optional[str] = None
    status: str = "available"  # available, reserved, depleted, inactive
    provider_reliability: Optional[float] = 1.0

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Quantity must be greater than zero")
        return v

    @field_validator("reserve_quantity")
    @classmethod
    def validate_reserve(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Reserve quantity cannot be negative")
        return v

    @field_validator("resource_type")
    @classmethod
    def validate_resource_type(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Resource type cannot be empty")
        return s

    @model_validator(mode="after")
    def validate_reserve_le_quantity(self) -> "Supply":
        if self.reserve_quantity > self.quantity:
            raise ValueError("Reserve quantity cannot exceed total quantity")
        return self


class Demand(BaseModel):
    id: Optional[int] = None
    resource_type: str
    quantity: int
    requester: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    urgency: str = "MEDIUM"
    needed_by: Optional[str] = None
    status: str = "pending"  # pending, matched, fulfilled, cancelled
    created_at: Optional[str] = None

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Quantity must be greater than zero")
        return v

    @field_validator("resource_type")
    @classmethod
    def validate_resource_type(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Resource type cannot be empty")
        return s

    @field_validator("urgency")
    @classmethod
    def validate_urgency(cls, v: str) -> str:
        v_upper = v.strip().upper()
        if v_upper not in VALID_URGENCIES:
            raise ValueError(f"Urgency must be one of {VALID_URGENCIES}")
        return v_upper


class Allocation(BaseModel):
    id: Optional[int] = None
    demand_id: int
    supply_id: int
    provider: str
    requester: str
    allocated_quantity: int
    score: float
    breakdown: Optional[Dict[str, float]] = None
    reasons: List[str] = Field(default_factory=list)
    created_at: Optional[str] = None
    status: str = "pending"  # pending, accepted, completed, cancelled
    explanation: Optional[str] = None


class AllocateRequest(BaseModel):
    demand_id: Optional[int] = None
    demand: Optional[Demand] = None
    allow_partial: bool = False


class StatsResponse(BaseModel):
    available_resources: int
    active_demands: int
    pending_matches: int
    accepted_allocations: int
    completed_transfers: int
    total_supplies: int
    total_demands: int