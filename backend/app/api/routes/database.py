from fastapi import APIRouter
from app.db.mongodb import mongodb_manager

router = APIRouter()

@router.get("/status")
async def get_database_status():
    """Returns MongoDB connectivity health status."""
    return await mongodb_manager.check_health()
