from pydantic import BaseModel
from typing import Optional

class TelemetryData(BaseModel):
    timestamp: float
    altitude: float  # meters
    velocity: float  # m/s
    heading: float   # degrees 0-360
    pitch: float     # degrees
    roll: float      # degrees  
    yaw: float       # degrees
    latitude: float
    longitude: float
    battery: float   # percentage 0-100
    signal_strength: float  # percentage
    simulation_time: float  # seconds
    mode: str  # IDLE/ARMED/TAKING_OFF/HOVERING/MOVING/LANDING
    is_armed: bool
    is_airborne: bool
    source: str  # always "DEMO_SIMULATION" or "ROS2" or "GAZEBO"

class CommandResponse(BaseModel):
    success: bool
    message: str
    state: str
    source: str
