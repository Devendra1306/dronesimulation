from app.adapters.base import SimulationAdapter
from app.schemas.drone import TelemetryData
from app.schemas.simulation import SimulationStatus
import time
import math
import random
from typing import Optional

class DemoSimulationAdapter(SimulationAdapter):
    def __init__(self):
        self._connected = False
        self._running = False
        self._start_time = 0
        self._sim_time = 0
        
        self.mode = "IDLE"
        self.is_armed = False
        self.is_airborne = False
        
        self.altitude = 0.0
        self.velocity = 0.0
        self.heading = 0.0
        self.pitch = 0.0
        self.roll = 0.0
        self.yaw = 0.0
        self.lat = 16.5062
        self.lon = 80.6480
        self.battery = 100.0
        
    async def connect(self) -> bool:
        self._connected = True
        return True
        
    async def disconnect(self) -> None:
        self._connected = False
        
    async def start_simulation(self) -> bool:
        self._running = True
        if self._start_time == 0:
            self._start_time = time.time()
        return True
        
    async def pause_simulation(self) -> bool:
        self._running = False
        return True
        
    async def reset_simulation(self) -> bool:
        self._running = False
        self._sim_time = 0
        self.mode = "IDLE"
        self.is_armed = False
        self.is_airborne = False
        self.altitude = 0.0
        self.battery = 100.0
        return True
        
    async def step_simulation(self, steps: int = 1) -> bool:
        return True
        
    async def get_telemetry(self) -> TelemetryData:
        # Update simulation physics
        if self._running:
            self._sim_time += 0.1
            self.battery = max(0.0, 100.0 - (self._sim_time / 1200.0) * 100) # 20 mins
            
            if self.mode == "TAKING_OFF":
                self.altitude += 1.0
                if self.altitude >= 50.0:
                    self.altitude = 50.0
                    self.mode = "HOVERING"
            elif self.mode == "LANDING":
                self.altitude -= 1.0
                if self.altitude <= 0.0:
                    self.altitude = 0.0
                    self.mode = "IDLE"
                    self.is_airborne = False
            elif self.mode == "HOVERING" or self.mode == "MOVING":
                self.altitude += random.uniform(-0.5, 0.5)
                self.lat += random.uniform(-0.00001, 0.00001)
                self.lon += random.uniform(-0.00001, 0.00001)

        return TelemetryData(
            timestamp=time.time(),
            altitude=self.altitude,
            velocity=self.velocity,
            heading=self.heading,
            pitch=self.pitch,
            roll=self.roll,
            yaw=self.yaw,
            latitude=self.lat,
            longitude=self.lon,
            battery=self.battery,
            signal_strength=95.0,
            simulation_time=self._sim_time,
            mode=self.mode,
            is_armed=self.is_armed,
            is_airborne=self.is_airborne,
            source=self.adapter_name
        )
        
    async def send_drone_command(self, command: str, params: dict) -> bool:
        if command == "ARM":
            self.is_armed = True
            self.mode = "ARMED"
        elif command == "DISARM":
            self.is_armed = False
            self.mode = "IDLE"
        elif command == "TAKEOFF" and self.is_armed:
            self.mode = "TAKING_OFF"
            self.is_airborne = True
        elif command == "LAND":
            self.mode = "LANDING"
        elif command == "HOVER":
            self.mode = "HOVERING"
        elif command == "STOP":
            self.mode = "HOVERING"
            self.velocity = 0.0
        elif command == "MOVE":
            self.mode = "MOVING"
            self.velocity = params.get("speed", 5.0)
        return True
        
    async def get_simulation_status(self) -> SimulationStatus:
        return SimulationStatus(
            status="running" if self._running else "paused" if self._start_time > 0 else "stopped",
            time=self._sim_time,
            source=self.adapter_name
        )
        
    async def get_camera_frame(self) -> Optional[bytes]:
        return None
        
    @property
    def adapter_name(self) -> str:
        return "DEMO_SIMULATION"
        
    @property
    def is_demo(self) -> bool:
        return True
