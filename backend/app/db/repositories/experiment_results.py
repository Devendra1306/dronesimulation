from typing import Optional, Dict, Any
from datetime import datetime
from app.db.mongodb import mongodb_manager
from app.schemas.database import ExperimentResultRecord

class ExperimentResultsRepository:
    @property
    def collection(self):
        db = mongodb_manager.get_database()
        return db.experiment_results if db is not None else None

    async def save_result(self, record: ExperimentResultRecord) -> bool:
        if self.collection is None:
            return False
        try:
            await self.collection.update_one(
                {"experiment_id": record.experiment_id},
                {"$set": record.model_dump()},
                upsert=True
            )
            return True
        except Exception:
            return False

    async def get_by_experiment_id(self, experiment_id: str) -> Optional[Dict[str, Any]]:
        if self.collection is None:
            return None
        return await self.collection.find_one({"experiment_id": experiment_id}, {"_id": 0})

experiment_results_repo = ExperimentResultsRepository()
