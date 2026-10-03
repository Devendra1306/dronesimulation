from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.schemas.database import ExperimentCreate, ExperimentUpdate
from app.db.repositories.experiments import experiments_repo
from app.db.repositories.experiment_results import experiment_results_repo
from app.services.persistence_service import persistence_service

router = APIRouter()

@router.get("")
async def list_experiments(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0)
):
    return await experiments_repo.list_experiments(status=status, search=search, limit=limit, skip=skip)

@router.post("")
async def create_experiment(exp: ExperimentCreate):
    created = await experiments_repo.create(exp)
    await persistence_service.log_event(
        event_type="EXPERIMENT_CREATED",
        message=f"Experiment {created['experiment_id']} ({created['name']}) created",
        severity="INFO",
        source="EXPERIMENT_REGISTRY",
        metadata={"experiment_id": created["experiment_id"]}
    )
    return created

@router.get("/{experiment_id}")
async def get_experiment(experiment_id: str):
    exp = await experiments_repo.get_by_id(experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    
    # Also fetch results if available
    result = await experiment_results_repo.get_by_experiment_id(experiment_id)
    return {
        **exp,
        "results": result
    }

@router.put("/{experiment_id}")
async def update_experiment(experiment_id: str, update: ExperimentUpdate):
    exp = await experiments_repo.update(experiment_id, update)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return exp

@router.delete("/{experiment_id}")
async def delete_experiment(experiment_id: str):
    deleted = await experiments_repo.delete(experiment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Experiment not found or already deleted")
    return {"status": "success", "message": f"Experiment {experiment_id} deleted"}
