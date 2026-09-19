from abc import ABC, abstractmethod
from typing import Generic, TypeVar, List, Optional, Any

T = TypeVar("T")

class BaseRepository(ABC, Generic[T]):
    @abstractmethod
    def list_all(self) -> List[T]:
        """List all items."""
        pass

    @abstractmethod
    def get_by_id(self, item_id: int) -> Optional[T]:
        """Get an item by unique identifier."""
        pass

    @abstractmethod
    def add(self, item: T) -> T:
        """Add a new item."""
        pass

    @abstractmethod
    def update(self, item_id: int, item: T) -> Optional[T]:
        """Update an existing item."""
        pass

    @abstractmethod
    def delete(self, item_id: int) -> bool:
        """Delete an item."""
        pass
