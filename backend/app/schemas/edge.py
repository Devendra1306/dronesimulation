from pydantic import BaseModel
from typing import List

class EdgeDevice(BaseModel):
    name: str
    inference_time_ms: int
    fps: int
    memory_mb: int
    model: str
    power_watts: float
    source: str
