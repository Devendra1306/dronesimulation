from typing import List, Optional, Dict, Any
from app.db.mongodb import mongodb_manager
from app.schemas.database import SystemEventRecord

class SystemEventsRepository:
    @property
    def collection(self):
        db = mongodb_manager.get_database()
        return db.system_events if db is not None else None

    async def log_event(self, record: SystemEventRecord) -> bool:
        if self.collection is None:
            return False
        try:
            await self.collection.insert_one(record.model_dump())
            return True
        except Exception:
            return False

    async def list_events(
        self,
        severity: Optional[str] = None,
        event_type: Optional[str] = None,
        source: Optional[str] = None,
        experiment_id: Optional[str] = None,
        run_id: Optional[str] = None,
        limit: int = 100,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        if self.collection is None:
            return []

        query: Dict[str, Any] = {}
        if severity:
            query["severity"] = severity.upper()
        if event_type:
            query["event_type"] = event_type.upper()
        if source:
            query["source"] = source
        if experiment_id:
            query["experiment_id"] = experiment_id
        if run_id:
            query["run_id"] = run_id

        cursor = self.collection.find(query, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

system_events_repo = SystemEventsRepository()
