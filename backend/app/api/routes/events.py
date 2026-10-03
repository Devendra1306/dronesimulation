from fastapi import APIRouter, Query
from typing import Optional
from app.db.repositories.system_events import system_events_repo

router = APIRouter()

@router.get("")
async def list_events(
    severity: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    experiment_id: Optional[str] = Query(None),
    run_id: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0)
):
    return await system_events_repo.list_events(
        severity=severity,
        event_type=event_type,
        source=source,
        experiment_id=experiment_id,
        run_id=run_id,
        limit=limit,
        skip=skip
    )
