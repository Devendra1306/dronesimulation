from fastapi import APIRouter, Query
from typing import Optional
from app.db.repositories.sensors import sensors_repo

router = APIRouter()

@router.get("/history")
async def get_sensor_history(
    experiment_id: Optional[str] = Query(None),
    run_id: Optional[str] = Query(None),
    sensor_type: Optional[str] = Query(None),
    start_time: Optional[float] = Query(None),
    end_time: Optional[float] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0)
):
    return await sensors_repo.get_history(
        experiment_id=experiment_id,
        run_id=run_id,
        sensor_type=sensor_type,
        start_time=start_time,
        end_time=end_time,
        limit=limit,
        skip=skip
    )
