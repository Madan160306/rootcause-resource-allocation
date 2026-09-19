from abc import ABC
from typing import List, Optional
import threading
from models import Supply
from .base import BaseRepository


class SupplyRepository(BaseRepository[Supply], ABC):
    """Abstract supply repository interface."""
    pass


class LocalSupplyRepository(SupplyRepository):
    """
    Local in-memory / JSON-capable supply repository.
    Ensures safe operations without requiring AWS DynamoDB.
    """
    def __init__(self):
        self._lock = threading.Lock()
        self._storage: dict[int, Supply] = {}
        self._counter: int = 1

    def list_all(self) -> List[Supply]:
        with self._lock:
            return list(self._storage.values())

    def get_by_id(self, item_id: int) -> Optional[Supply]:
        with self._lock:
            return self._storage.get(item_id)

    def add(self, item: Supply) -> Supply:
        with self._lock:
            if item.id is None:
                item.id = self._counter
                self._counter += 1
            elif item.id >= self._counter:
                self._counter = item.id + 1
            self._storage[item.id] = item
            return item

    def update(self, item_id: int, item: Supply) -> Optional[Supply]:
        with self._lock:
            if item_id in self._storage:
                item.id = item_id
                self._storage[item_id] = item
                return item
            return None

    def delete(self, item_id: int) -> bool:
        with self._lock:
            return self._storage.pop(item_id, None) is not None

    def count(self) -> int:
        with self._lock:
            return len(self._storage)

    def clear(self) -> None:
        with self._lock:
            self._storage.clear()
            self._counter = 1
