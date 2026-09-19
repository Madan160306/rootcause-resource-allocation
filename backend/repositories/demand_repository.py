from abc import ABC
from typing import List, Optional
import threading
from models import Demand
from .base import BaseRepository


class DemandRepository(BaseRepository[Demand], ABC):
    """Abstract demand repository interface."""
    pass


class LocalDemandRepository(DemandRepository):
    """
    Local in-memory / JSON-capable demand repository.
    Works seamlessly without AWS dependencies.
    """
    def __init__(self):
        self._lock = threading.Lock()
        self._storage: dict[int, Demand] = {}
        self._counter: int = 1

    def list_all(self) -> List[Demand]:
        with self._lock:
            return list(self._storage.values())

    def get_by_id(self, item_id: int) -> Optional[Demand]:
        with self._lock:
            return self._storage.get(item_id)

    def add(self, item: Demand) -> Demand:
        with self._lock:
            if item.id is None:
                item.id = self._counter
                self._counter += 1
            elif item.id >= self._counter:
                self._counter = item.id + 1
            self._storage[item.id] = item
            return item

    def update(self, item_id: int, item: Demand) -> Optional[Demand]:
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
