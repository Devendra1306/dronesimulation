from fastapi import APIRouter
from app.config import settings

import app.main as m

router = APIRouter()

@router.get("/status")
async def get_system_status():
    mode = settings.simulation_mode.lower()
    is_ros2 = mode == "ros2"
    is_gazebo = mode == "gazebo"

    # Truthful connection determination
    ros2_connected = getattr(m.adapter, "is_bridge_connected", False) if (is_ros2 or is_gazebo) else False
    gazebo_connected = getattr(m.adapter, "is_gazebo_active", False) if is_gazebo else False
    
    sim_status = await m.adapter.get_simulation_status()

    # Active topic list if available
    active_topics = list(getattr(m.adapter, "active_topics", []))

    return {
        "status": "operational",
        "mode": settings.simulation_mode,
        "adapter": m.adapter.adapter_name,
        "is_demo": m.adapter.is_demo,
        "ros2_connected": ros2_connected,
        "gazebo_connected": gazebo_connected,
        "active_topics": active_topics,
        "simulation_running": sim_status.status in ["running", "operational"],
        "uptime": sim_status.time,
        "version": "0.1.0"
    }
