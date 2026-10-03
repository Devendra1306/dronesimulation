from fastapi import APIRouter, Query
from typing import Optional
from app.db.repositories.telemetry import telemetry_repo

router = APIRouter()

@router.get("/history")
async def get_telemetry_history(
    experiment_id: Optional[str] = Query(None),
    run_id: Optional[str] = Query(None),
    start_time: Optional[float] = Query(None),
    end_time: Optional[float] = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    skip: int = Query(0, ge=0)
):
    return await telemetry_repo.get_history(
        experiment_id=experiment_id,
        run_id=run_id,
        start_time=start_time,
        end_time=end_time,
        limit=limit,
        skip=skip
    )

@router.get("/summary")
async def get_telemetry_summary(
    experiment_id: Optional[str] = Query(None),
    run_id: Optional[str] = Query(None)
):
    return await telemetry_repo.get_summary(
        experiment_id=experiment_id,
        run_id=run_id
    )
