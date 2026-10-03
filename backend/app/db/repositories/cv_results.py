from typing import List, Optional, Dict, Any
from app.db.mongodb import mongodb_manager
from app.schemas.database import CVResultRecord

class CVResultsRepository:
    @property
    def collection(self):
        db = mongodb_manager.get_database()
        return db.cv_results if db is not None else None

    async def insert(self, record: CVResultRecord) -> bool:
        if self.collection is None:
            return False
        try:
            await self.collection.insert_one(record.model_dump())
            return True
        except Exception:
            return False

    async def list_results(
        self,
        experiment_id: Optional[str] = None,
        run_id: Optional[str] = None,
        algorithm: Optional[str] = None,
        limit: int = 50,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        if self.collection is None:
            return []

        query: Dict[str, Any] = {}
        if experiment_id:
            query["experiment_id"] = experiment_id
        if run_id:
            query["run_id"] = run_id
        if algorithm:
            query["algorithm"] = algorithm

        cursor = self.collection.find(query, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

cv_results_repo = CVResultsRepository()
