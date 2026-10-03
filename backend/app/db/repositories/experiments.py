from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from app.db.mongodb import mongodb_manager
from app.schemas.database import ExperimentCreate, ExperimentUpdate

class ExperimentsRepository:
    @property
    def collection(self):
        db = mongodb_manager.get_database()
        return db.experiments if db is not None else None

    async def list_experiments(
        self,
        status: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        if self.collection is None:
            return []
        
        query: Dict[str, Any] = {}
        if status:
            query["status"] = status.upper()
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"experiment_id": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
            ]
            
        cursor = self.collection.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def get_by_id(self, experiment_id: str) -> Optional[Dict[str, Any]]:
        if self.collection is None:
            return None
        return await self.collection.find_one({"experiment_id": experiment_id}, {"_id": 0})

    async def create(self, data: ExperimentCreate) -> Dict[str, Any]:
        exp_id = data.experiment_id or f"EXP-{uuid.uuid4().hex[:6].upper()}"
        doc = {
            "experiment_id": exp_id,
            "name": data.name,
            "description": data.description,
            "simulation_environment": data.simulation_environment,
            "drone_model": data.drone_model,
            "cv_algorithm": data.cv_algorithm,
            "status": data.status.upper(),
            "configuration": data.configuration,
            "created_at": datetime.utcnow(),
            "started_at": datetime.utcnow() if data.status.upper() == "RUNNING" else None,
            "ended_at": None,
        }
        if self.collection is not None:
            await self.collection.insert_one(doc.copy())
        return {k: v for k, v in doc.items() if k != "_id"}

    async def update(self, experiment_id: str, data: ExperimentUpdate) -> Optional[Dict[str, Any]]:
        if self.collection is None:
            return None
        update_fields = {k: v for k, v in data.model_dump().items() if v is not None}
        if not update_fields:
            return await self.get_by_id(experiment_id)
            
        if "status" in update_fields:
            update_fields["status"] = update_fields["status"].upper()
            if update_fields["status"] in ["COMPLETED", "FAILED", "CANCELLED"] and "ended_at" not in update_fields:
                update_fields["ended_at"] = datetime.utcnow()

        await self.collection.update_one(
            {"experiment_id": experiment_id},
            {"$set": update_fields}
        )
        return await self.get_by_id(experiment_id)

    async def delete(self, experiment_id: str) -> bool:
        if self.collection is None:
            return False
        res = await self.collection.delete_one({"experiment_id": experiment_id})
        return res.deleted_count > 0

experiments_repo = ExperimentsRepository()
