from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from app.db.mongodb import mongodb_manager
from app.schemas.database import SimulationRunCreate

class SimulationRunsRepository:
    @property
    def collection(self):
        db = mongodb_manager.get_database()
        return db.simulation_runs if db is not None else None

    async def list_runs(
        self,
        experiment_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        if self.collection is None:
            return []

        query: Dict[str, Any] = {}
        if experiment_id:
            query["experiment_id"] = experiment_id
        if status:
            query["status"] = status.upper()

        cursor = self.collection.find(query, {"_id": 0}).sort("start_time", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def get_by_id(self, run_id: str) -> Optional[Dict[str, Any]]:
        if self.collection is None:
            return None
        return await self.collection.find_one({"run_id": run_id}, {"_id": 0})

    async def create(self, data: SimulationRunCreate) -> Dict[str, Any]:
        run_id = data.run_id or f"RUN-{uuid.uuid4().hex[:6].upper()}"
        doc = {
            "run_id": run_id,
            "experiment_id": data.experiment_id,
            "simulation_mode": data.simulation_mode,
            "environment": data.environment,
            "drone_model": data.drone_model,
            "start_time": datetime.utcnow(),
            "end_time": None,
            "duration": None,
            "status": data.status.upper(),
            "configuration": data.configuration,
            "summary": data.summary,
            "created_at": datetime.utcnow(),
        }
        if self.collection is not None:
            await self.collection.insert_one(doc.copy())
        return {k: v for k, v in doc.items() if k != "_id"}

    async def complete_run(
        self,
        run_id: str,
        status: str = "COMPLETED",
        summary: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        if self.collection is None:
            return None

        current = await self.get_by_id(run_id)
        if not current:
            return None

        end_time = datetime.utcnow()
        start_time = current.get("start_time")
        duration = (end_time - start_time).total_seconds() if start_time else 0.0

        update_dict: Dict[str, Any] = {
            "end_time": end_time,
            "duration": round(duration, 2),
            "status": status.upper(),
        }
        if summary:
            update_dict["summary"] = summary

        await self.collection.update_one({"run_id": run_id}, {"$set": update_dict})
        return await self.get_by_id(run_id)

simulation_runs_repo = SimulationRunsRepository()
