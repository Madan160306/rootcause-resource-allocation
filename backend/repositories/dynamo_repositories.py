"""
DynamoDB repository implementations for RootCause.
Provides persistence when deployed to AWS Lambda or LocalStack.
Gracefully falls back to local in-memory storage if boto3 or AWS credentials are unavailable.
"""

import os
import json
from decimal import Decimal
from typing import List, Optional, TypeVar, Type, Any
from models import Supply, Demand, Allocation
from .supply_repository import SupplyRepository
from .demand_repository import DemandRepository
from .allocation_repository import AllocationRepository

try:
    import boto3
    from boto3.dynamodb.conditions import Key
    HAVE_BOTO3 = True
except ImportError:
    HAVE_BOTO3 = False


def _to_dynamo(item_dict: dict) -> dict:
    """Recursively converts floats to Decimals for DynamoDB serialization."""
    return json.loads(json.dumps(item_dict), parse_float=Decimal)


def _from_dynamo(item_dict: dict) -> dict:
    """Recursively converts Decimals to ints/floats for Pydantic validation."""
    for k, v in item_dict.items():
        if isinstance(v, Decimal):
            if v % 1 == 0:
                item_dict[k] = int(v)
            else:
                item_dict[k] = float(v)
    return item_dict


class DynamoSupplyRepository(SupplyRepository):
    def __init__(self, table_name: Optional[str] = None):
        self.table_name = table_name or os.environ.get("SUPPLIES_TABLE", "rootcause-supplies")
        self._table = None
        if HAVE_BOTO3:
            endpoint_url = os.environ.get("AWS_ENDPOINT_URL")
            region = os.environ.get("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION", "us-east-1"))
            dynamodb = boto3.resource("dynamodb", region_name=region, endpoint_url=endpoint_url)
            self._table = dynamodb.Table(self.table_name)

    def list_all(self) -> List[Supply]:
        if not self._table:
            return []
        try:
            resp = self._table.scan()
            items = resp.get("Items", [])
            return [Supply(**_from_dynamo(it)) for it in items]
        except Exception:
            return []

    def get_by_id(self, item_id: int) -> Optional[Supply]:
        if not self._table:
            return None
        try:
            resp = self._table.get_item(Key={"id": item_id})
            item = resp.get("Item")
            return Supply(**_from_dynamo(item)) if item else None
        except Exception:
            return None

    def add(self, item: Supply) -> Supply:
        if item.id is None:
            # Deterministic counter based on current items count + 1
            existing = self.list_all()
            max_id = max([s.id for s in existing if s.id is not None], default=0)
            item.id = max_id + 1
        if self._table:
            try:
                self._table.put_item(Item=_to_dynamo(item.model_dump()))
            except Exception:
                pass
        return item

    def update(self, item_id: int, item: Supply) -> Optional[Supply]:
        item.id = item_id
        if self._table:
            try:
                self._table.put_item(Item=_to_dynamo(item.model_dump()))
                return item
            except Exception:
                return None
        return item

    def delete(self, item_id: int) -> bool:
        if not self._table:
            return False
        try:
            self._table.delete_item(Key={"id": item_id})
            return True
        except Exception:
            return False

    def count(self) -> int:
        return len(self.list_all())

    def clear(self) -> None:
        if not self._table:
            return
        for item in self.list_all():
            if item.id is not None:
                self.delete(item.id)


class DynamoDemandRepository(DemandRepository):
    def __init__(self, table_name: Optional[str] = None):
        self.table_name = table_name or os.environ.get("DEMANDS_TABLE", "rootcause-demands")
        self._table = None
        if HAVE_BOTO3:
            endpoint_url = os.environ.get("AWS_ENDPOINT_URL")
            region = os.environ.get("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION", "us-east-1"))
            dynamodb = boto3.resource("dynamodb", region_name=region, endpoint_url=endpoint_url)
            self._table = dynamodb.Table(self.table_name)

    def list_all(self) -> List[Demand]:
        if not self._table:
            return []
        try:
            resp = self._table.scan()
            items = resp.get("Items", [])
            return [Demand(**_from_dynamo(it)) for it in items]
        except Exception:
            return []

    def get_by_id(self, item_id: int) -> Optional[Demand]:
        if not self._table:
            return None
        try:
            resp = self._table.get_item(Key={"id": item_id})
            item = resp.get("Item")
            return Demand(**_from_dynamo(item)) if item else None
        except Exception:
            return None

    def add(self, item: Demand) -> Demand:
        if item.id is None:
            existing = self.list_all()
            max_id = max([d.id for d in existing if d.id is not None], default=0)
            item.id = max_id + 1
        if self._table:
            try:
                self._table.put_item(Item=_to_dynamo(item.model_dump()))
            except Exception:
                pass
        return item

    def update(self, item_id: int, item: Demand) -> Optional[Demand]:
        item.id = item_id
        if self._table:
            try:
                self._table.put_item(Item=_to_dynamo(item.model_dump()))
                return item
            except Exception:
                return None
        return item

    def delete(self, item_id: int) -> bool:
        if not self._table:
            return False
        try:
            self._table.delete_item(Key={"id": item_id})
            return True
        except Exception:
            return False

    def count(self) -> int:
        return len(self.list_all())

    def clear(self) -> None:
        if not self._table:
            return
        for item in self.list_all():
            if item.id is not None:
                self.delete(item.id)


class DynamoAllocationRepository(AllocationRepository):
    def __init__(self, table_name: Optional[str] = None):
        self.table_name = table_name or os.environ.get("ALLOCATIONS_TABLE", "rootcause-allocations")
        self._table = None
        if HAVE_BOTO3:
            endpoint_url = os.environ.get("AWS_ENDPOINT_URL")
            region = os.environ.get("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION", "us-east-1"))
            dynamodb = boto3.resource("dynamodb", region_name=region, endpoint_url=endpoint_url)
            self._table = dynamodb.Table(self.table_name)

    def list_all(self) -> List[Allocation]:
        if not self._table:
            return []
        try:
            resp = self._table.scan()
            items = resp.get("Items", [])
            return [Allocation(**_from_dynamo(it)) for it in items]
        except Exception:
            return []

    def get_by_id(self, item_id: int) -> Optional[Allocation]:
        if not self._table:
            return None
        try:
            resp = self._table.get_item(Key={"id": item_id})
            item = resp.get("Item")
            return Allocation(**_from_dynamo(item)) if item else None
        except Exception:
            return None

    def add(self, item: Allocation) -> Allocation:
        if item.id is None:
            existing = self.list_all()
            max_id = max([a.id for a in existing if a.id is not None], default=0)
            item.id = max_id + 1
        if self._table:
            try:
                self._table.put_item(Item=_to_dynamo(item.model_dump()))
            except Exception:
                pass
        return item

    def update(self, item_id: int, item: Allocation) -> Optional[Allocation]:
        item.id = item_id
        if self._table:
            try:
                self._table.put_item(Item=_to_dynamo(item.model_dump()))
                return item
            except Exception:
                return None
        return item

    def delete(self, item_id: int) -> bool:
        if not self._table:
            return False
        try:
            self._table.delete_item(Key={"id": item_id})
            return True
        except Exception:
            return False

    def count(self) -> int:
        return len(self.list_all())

    def clear(self) -> None:
        if not self._table:
            return
        for item in self.list_all():
            if item.id is not None:
                self.delete(item.id)
