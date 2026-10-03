from pydantic import BaseModel

class SimulationStatus(BaseModel):
    status: str # "running", "paused", "stopped"
    time: float
    source: str
