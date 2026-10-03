from typing import List, Optional, Dict, Any
from app.db.mongodb import mongodb_manager
from app.schemas.database import TelemetryRecord

class TelemetryRepository:
    @property
    def collection(self):
        db = mongodb_manager.get_database()
        return db.telemetry if db is not None else None

    async def insert(self, record: TelemetryRecord) -> bool:
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
        start_time: Optional[float] = None,
        end_time: Optional[float] = None,
        limit: int = 200,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        if self.collection is None:
            return []

        query: Dict[str, Any] = {}
        if experiment_id:
            query["experiment_id"] = experiment_id
        if run_id:
            query["run_id"] = run_id
        if start_time is not None or end_time is not None:
            query["timestamp"] = {}
            if start_time is not None:
                query["timestamp"]["$gte"] = start_time
            if end_time is not None:
                query["timestamp"]["$lte"] = end_time

        cursor = self.collection.find(query, {"_id": 0}).sort("timestamp", 1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def get_summary(
        self,
        experiment_id: Optional[str] = None,
        run_id: Optional[str] = None
    ) -> Dict[str, Any]:
        if self.collection is None:
            return {"count": 0}

        match: Dict[str, Any] = {}
        if experiment_id:
            match["experiment_id"] = experiment_id
        if run_id:
            match["run_id"] = run_id

        pipeline = [
            {"$match": match} if match else {"$match": {}},
            {
                "$group": {
                    "_id": None,
                    "total_samples": {"$sum": 1},
                    "avg_altitude": {"$avg": "$altitude"},
                    "max_altitude": {"$max": "$altitude"},
                    "min_altitude": {"$min": "$altitude"},
                    "avg_velocity": {"$avg": "$velocity"},
                    "max_velocity": {"$max": "$velocity"},
                    "avg_battery": {"$avg": "$battery"},
                    "min_battery": {"$min": "$battery"},
                    "max_battery": {"$max": "$battery"},
                    "first_timestamp": {"$min": "$timestamp"},
                    "last_timestamp": {"$max": "$timestamp"},
                }
            }
        ]

        cursor = self.collection.aggregate(pipeline)
        results = await cursor.to_list(length=1)
        if not results:
            return {"count": 0}

        res = results[0]
        res.pop("_id", None)
        return {
            "count": res.get("total_samples", 0),
            "avg_altitude": round(res.get("avg_altitude", 0.0) or 0.0, 2),
            "max_altitude": round(res.get("max_altitude", 0.0) or 0.0, 2),
            "min_altitude": round(res.get("min_altitude", 0.0) or 0.0, 2),
            "avg_velocity": round(res.get("avg_velocity", 0.0) or 0.0, 2),
            "max_velocity": round(res.get("max_velocity", 0.0) or 0.0, 2),
            "battery_consumed": round(
                (res.get("max_battery", 100.0) or 100.0) - (res.get("min_battery", 100.0) or 100.0), 2
            ),
            "duration": round(
                (res.get("last_timestamp", 0) or 0) - (res.get("first_timestamp", 0) or 0), 2
            ),
        }

telemetry_repo = TelemetryRepository()
