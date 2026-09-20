from .supply_repository import SupplyRepository, LocalSupplyRepository
from .demand_repository import DemandRepository, LocalDemandRepository
from .allocation_repository import AllocationRepository, LocalAllocationRepository
from .dynamo_repositories import (
    DynamoSupplyRepository,
    DynamoDemandRepository,
    DynamoAllocationRepository,
    HAVE_BOTO3,
)
import os


def get_repositories():
    """
    Factory function providing repositories based on environment configuration.
    Uses DynamoDB repositories if USE_DYNAMODB is true and boto3 is available.
    Otherwise uses thread-safe in-memory repositories.
    """
    use_dynamo = os.environ.get("USE_DYNAMODB", "").lower() in ("true", "1", "yes")
    if use_dynamo and HAVE_BOTO3:
        return (
            DynamoSupplyRepository(),
            DynamoDemandRepository(),
            DynamoAllocationRepository(),
        )
    return (
        LocalSupplyRepository(),
        LocalDemandRepository(),
        LocalAllocationRepository(),
    )


__all__ = [
    "SupplyRepository",
    "LocalSupplyRepository",
    "DemandRepository",
    "LocalDemandRepository",
    "AllocationRepository",
    "LocalAllocationRepository",
    "DynamoSupplyRepository",
    "DynamoDemandRepository",
    "DynamoAllocationRepository",
    "get_repositories",
]

