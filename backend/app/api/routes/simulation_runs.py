from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.db.repositories.simulation_runs import simulation_runs_repo
from app.schemas.database import SimulationRunCreate

router = APIRouter()

@router.get("/runs")
async def list_simulation_runs(
    experiment_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0)
):
    return await simulation_runs_repo.list_runs(
        experiment_id=experiment_id,
        status=status,
        limit=limit,
        skip=skip
    )

@router.post("/runs")
async def create_simulation_run(run: SimulationRunCreate):
    return await simulation_runs_repo.create(run)

@router.get("/runs/{run_id}")
async def get_simulation_run(run_id: str):
    run = await simulation_runs_repo.get_by_id(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Simulation run not found")
    return run
