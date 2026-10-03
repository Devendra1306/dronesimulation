from typing import List, Optional, Dict, Any
from app.db.mongodb import mongodb_manager
from app.schemas.database import SensorDataRecord

class SensorsRepository:
    @property
    def collection(self):
        db = mongodb_manager.get_database()
        return db.sensor_data if db is not None else None

    async def insert(self, record: SensorDataRecord) -> bool:
        if self.collection is None:
            return False
        try:
            await self.collection.insert_one(record.model_dump())
            return True
        except Exception:
            return False

    async def get_history(
        self,
        experiment_id: Optional[str] = None,
        run_id: Optional[str] = None,
        sensor_type: Optional[str] = None,
        start_time: Optional[float] = None,
        end_time: Optional[float] = None,
        limit: int = 100,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        if self.collection is None:
            return []

        query: Dict[str, Any] = {}
        if experiment_id:
            query["experiment_id"] = experiment_id
        if run_id:
            query["run_id"] = run_id
        if sensor_type:
            query["sensor_type"] = sensor_type.upper()
        if start_time is not None or end_time is not None:
            query["timestamp"] = {}
            if start_time is not None:
                query["timestamp"]["$gte"] = start_time
            if end_time is not None:
                query["timestamp"]["$lte"] = end_time

        cursor = self.collection.find(query, {"_id": 0}).sort("timestamp", 1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

sensors_repo = SensorsRepository()
