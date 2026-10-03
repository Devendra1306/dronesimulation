from fastapi import APIRouter
import time

router = APIRouter()

@router.get("/nodes")
async def get_nodes():
    return [
        {
            "name": "camera_node",
            "namespace": "/",
            "status": "ACTIVE",
            "published_topics": ["/camera/image_raw"],
            "subscribed_topics": [],
            "source": "DEMO_SIMULATION"
        },
        {
            "name": "imu_node",
            "namespace": "/",
            "status": "ACTIVE",
            "published_topics": ["/imu/data"],
            "subscribed_topics": [],
            "source": "DEMO_SIMULATION"
        },
        {
            "name": "gps_node",
            "namespace": "/",
            "status": "ACTIVE",
            "published_topics": ["/gps/fix"],
            "subscribed_topics": [],
            "source": "DEMO_SIMULATION"
        },
        {
            "name": "drone_controller",
            "namespace": "/",
            "status": "ACTIVE",
            "published_topics": ["/drone/state"],
            "subscribed_topics": ["/cmd_vel"],
            "source": "DEMO_SIMULATION"
        },
        {
            "name": "cv_node",
            "namespace": "/",
            "status": "ACTIVE",
            "published_topics": ["/detections"],
            "subscribed_topics": ["/camera/image_raw"],
            "source": "DEMO_SIMULATION"
        },
        {
            "name": "mission_planner",
            "namespace": "/",
            "status": "ACTIVE",
            "published_topics": ["/mission/status"],
            "subscribed_topics": ["/drone/state"],
            "source": "DEMO_SIMULATION"
        }
    ]

import app.main as m

@router.get("/topics")
async def get_topics():
    mode = getattr(m.adapter, "mode", "IDLE")
    is_active_flight = mode in ["TAKING_OFF", "MOVING", "LANDING", "HOVERING"]
    cmd_vel_rate = 20.0 if mode in ["TAKING_OFF", "MOVING", "LANDING"] else 0.0
    cmd_vel_status = "ACTIVE" if cmd_vel_rate > 0 else "IDLE"

    return [
        {
            "name": "/camera/image_raw",
            "type": "sensor_msgs/Image",
            "publisher": "camera_node",
            "subscribers": ["cv_node"],
            "rate": 30.0 if is_active_flight else 15.0,
            "status": "ACTIVE",
            "last_received": time.time(),
            "source": m.adapter.adapter_name
        },
        {
            "name": "/imu/data",
            "type": "sensor_msgs/Imu",
            "publisher": "imu_node",
            "subscribers": ["drone_controller"],
            "rate": 100.0 if is_active_flight else 50.0,
            "status": "ACTIVE",
            "last_received": time.time(),
            "source": m.adapter.adapter_name
        },
        {
            "name": "/gps/fix",
            "type": "sensor_msgs/NavSatFix",
            "publisher": "gps_node",
            "subscribers": ["drone_controller"],
            "rate": 10.0,
            "status": "ACTIVE",
            "last_received": time.time(),
            "source": m.adapter.adapter_name
        },
        {
            "name": "/cmd_vel",
            "type": "geometry_msgs/Twist",
            "publisher": "drone_controller",
            "subscribers": ["simulation_gazebo"],
            "rate": cmd_vel_rate,
            "status": cmd_vel_status,
            "last_received": time.time(),
            "source": m.adapter.adapter_name
        },
        {
            "name": "/detections",
            "type": "vision_msgs/Detection2DArray",
            "publisher": "cv_node",
            "subscribers": ["mission_planner"],
            "rate": 15.0 if is_active_flight else 0.0,
            "status": "ACTIVE" if is_active_flight else "IDLE",
            "last_received": time.time(),
            "source": m.adapter.adapter_name
        },
        {
            "name": "/drone/state",
            "type": "std_msgs/String",
            "publisher": "drone_controller",
            "subscribers": ["mission_planner"],
            "rate": 10.0,
            "status": "ACTIVE" if is_active_flight else "STANDBY",
            "last_received": time.time(),
            "source": m.adapter.adapter_name
        },
        {
            "name": "/mission/status",
            "type": "std_msgs/String",
            "publisher": "mission_planner",
            "subscribers": ["gcs_bridge"],
            "rate": 2.0,
            "status": "ACTIVE",
            "last_received": time.time(),
            "source": m.adapter.adapter_name
        }
    ]
