from abc import ABC, abstractmethod
from typing import Optional
from app.schemas.drone import TelemetryData
from app.schemas.simulation import SimulationStatus

class SimulationAdapter(ABC):
    """Abstract base class for simulation adapters.
    
    Implementations:
    - DemoSimulationAdapter: uses generated demo data (no external dependencies)
    - GazeboSimulationAdapter: connects to real Gazebo simulation
    - ROS2Adapter: interfaces with actual ROS2 ecosystem
    """
    
    @abstractmethod
    async def connect(self) -> bool: ...
    
    @abstractmethod
    async def disconnect(self) -> None: ...
    
    @abstractmethod
    async def start_simulation(self) -> bool: ...
    
    @abstractmethod
    async def pause_simulation(self) -> bool: ...
    
    @abstractmethod
    async def reset_simulation(self) -> bool: ...
    
    @abstractmethod
    async def step_simulation(self, steps: int = 1) -> bool: ...
    
    @abstractmethod
    async def get_telemetry(self) -> TelemetryData: ...
    
    @abstractmethod
    async def send_drone_command(self, command: str, params: dict) -> bool: ...
    
    @abstractmethod
    async def get_simulation_status(self) -> SimulationStatus: ...
    
    @abstractmethod
    async def get_camera_frame(self) -> Optional[bytes]: ...
    
    @property
    @abstractmethod
    def adapter_name(self) -> str: ...
    
    @property
    @abstractmethod
    def is_demo(self) -> bool: ...
