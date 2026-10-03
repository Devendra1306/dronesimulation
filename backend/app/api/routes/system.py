from fastapi import APIRouter
from app.config import settings

router = APIRouter()

@router.get("/status")
async def get_system_status():
    return {
        "status": "operational",
        "mode": settings.simulation_mode,
        "adapter": "DEMO_SIMULATION" if settings.simulation_mode == "demo" else settings.simulation_mode.upper(),
        "is_demo": settings.simulation_mode == "demo",
        "ros2_connected": False,
        "gazebo_connected": False,
        "simulation_running": True, # Or read from adapter
        "uptime": 123.4,
        "version": "0.1.0"
    }
