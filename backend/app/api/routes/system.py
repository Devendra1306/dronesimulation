from fastapi import APIRouter
from app.config import settings

import app.main as m

router = APIRouter()

@router.get("/status")
async def get_system_status():
    is_ros2 = getattr(m.adapter, "adapter_name", "").startswith("ROS2")
    is_gazebo = getattr(m.adapter, "adapter_name", "").startswith("GAZEBO")
    is_conn = getattr(m.adapter, "is_connected", False)

    ros2_connected = is_conn if (is_ros2 or is_gazebo) else False
    gazebo_connected = is_conn if is_gazebo else False
    sim_status = await m.adapter.get_simulation_status()

    return {
        "status": "operational",
        "mode": settings.simulation_mode,
        "adapter": m.adapter.adapter_name,
        "is_demo": m.adapter.is_demo,
        "ros2_connected": ros2_connected,
        "gazebo_connected": gazebo_connected,
        "simulation_running": sim_status.status in ["running", "operational"],
        "uptime": sim_status.time,
        "version": "0.1.0"
    }
