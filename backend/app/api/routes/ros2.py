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

@router.get("/topics")
async def get_topics():
    return [
        {
            "name": "/camera/image_raw",
            "type": "sensor_msgs/Image",
            "publisher": "camera_node",
            "subscribers": ["cv_node"],
            "rate": 30.0,
            "status": "ACTIVE",
            "last_received": time.time(),
            "source": "DEMO_SIMULATION"
        },
        {
            "name": "/imu/data",
            "type": "sensor_msgs/Imu",
            "publisher": "imu_node",
            "subscribers": [],
            "rate": 50.0,
            "status": "ACTIVE",
            "last_received": time.time(),
            "source": "DEMO_SIMULATION"
        },
        {
            "name": "/gps/fix",
            "type": "sensor_msgs/NavSatFix",
            "publisher": "gps_node",
            "subscribers": [],
            "rate": 10.0,
            "status": "ACTIVE",
            "last_received": time.time(),
            "source": "DEMO_SIMULATION"
        },
        {
            "name": "/cmd_vel",
            "type": "geometry_msgs/Twist",
            "publisher": "",
            "subscribers": ["drone_controller"],
            "rate": 0.0,
            "status": "IDLE",
            "last_received": time.time(),
            "source": "DEMO_SIMULATION"
        },
        {
            "name": "/detections",
            "type": "vision_msgs/Detection2DArray",
            "publisher": "cv_node",
            "subscribers": [],
            "rate": 15.0,
            "status": "ACTIVE",
            "last_received": time.time(),
            "source": "DEMO_SIMULATION"
        },
        {
            "name": "/drone/state",
            "type": "std_msgs/String",
            "publisher": "drone_controller",
            "subscribers": ["mission_planner"],
            "rate": 10.0,
            "status": "ACTIVE",
            "last_received": time.time(),
            "source": "DEMO_SIMULATION"
        },
        {
            "name": "/mission/status",
            "type": "std_msgs/String",
            "publisher": "mission_planner",
            "subscribers": [],
            "rate": 1.0,
            "status": "ACTIVE",
            "last_received": time.time(),
            "source": "DEMO_SIMULATION"
        }
    ]
