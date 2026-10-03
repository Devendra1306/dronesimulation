from fastapi import APIRouter
from app.services.log_service import log_service

router = APIRouter()

@router.get("/")
async def get_logs():
    return log_service.get_logs()
