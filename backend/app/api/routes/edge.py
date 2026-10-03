from fastapi import APIRouter
from app.schemas.edge import EdgeDevice

router = APIRouter()

@router.get("/devices")
async def get_devices():
    return [
        {
            "name": "NVIDIA Jetson Nano",
            "inference_time_ms": 45,
            "fps": 22,
            "memory_mb": 512,
            "model": "YOLOv8n",
            "power_watts": 5.0,
            "source": "DEMO_SAMPLE"
        },
        {
            "name": "NVIDIA Jetson Xavier",
            "inference_time_ms": 15,
            "fps": 60,
            "memory_mb": 2048,
            "model": "YOLOv8n",
            "power_watts": 15.0,
            "source": "DEMO_SAMPLE"
        },
        {
            "name": "Raspberry Pi 4",
            "inference_time_ms": 250,
            "fps": 4,
            "memory_mb": 1024,
            "model": "YOLOv8n",
            "power_watts": 3.5,
            "source": "DEMO_SAMPLE"
        },
        {
            "name": "Laptop GPU",
            "inference_time_ms": 8,
            "fps": 120,
            "memory_mb": 4096,
            "model": "YOLOv8n",
            "power_watts": 45.0,
            "source": "DEMO_SAMPLE"
        }
    ]
