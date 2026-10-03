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
        if self._running or self.is_armed or self.is_airborne:
            self._sim_time += 0.1
            self.battery = max(0.0, 100.0 - (self._sim_time / 1200.0) * 100)  # 20 min battery life
            
            if self.mode == "TAKING_OFF":
                self.is_airborne = True
                self.velocity = min(4.5, self.velocity + 0.3)
                self.altitude += self.velocity * 0.1
                self.pitch = -2.5
                if self.altitude >= 25.0:
                    self.altitude = 25.0
                    self.mode = "HOVERING"
                    self.velocity = 0.0
                    self.pitch = 0.0
            elif self.mode == "LANDING":
                self.velocity = max(1.5, self.velocity * 0.9)
                self.altitude -= self.velocity * 0.1
                self.pitch = 1.0
                if self.altitude <= 0.0:
                    self.altitude = 0.0
                    self.velocity = 0.0
                    self.pitch = 0.0
                    self.roll = 0.0
                    self.mode = "IDLE"
                    self.is_armed = False
                    self.is_airborne = False
            elif self.mode == "HOVERING":
                self.velocity = round(random.uniform(0.05, 0.25), 2)
                self.altitude = max(0.5, self.altitude + random.uniform(-0.08, 0.08))
                self.pitch = round(random.uniform(-0.5, 0.5), 1)
                self.roll = round(random.uniform(-0.5, 0.5), 1)
                self.lat += random.uniform(-0.000003, 0.000003)
                self.lon += random.uniform(-0.000003, 0.000003)
            elif self.mode == "MOVING":
                self.velocity = min(8.5, max(3.0, self.velocity + 0.2))
                self.altitude = max(1.0, self.altitude + random.uniform(-0.05, 0.05))
                self.pitch = -4.0
                self.roll = round(random.uniform(-1.0, 1.0), 1)
                self.lat += 0.00001
                self.lon += 0.00001
            elif self.mode == "ARMED":
                self.velocity = 0.0
                self.altitude = 0.0
                self.pitch = 0.0
                self.roll = 0.0

        return TelemetryData(
            timestamp=time.time(),
            altitude=round(self.altitude, 2),
            velocity=round(self.velocity, 2),
            heading=round(self.heading, 1),
            pitch=round(self.pitch, 1),
            roll=round(self.roll, 1),
            yaw=round(self.yaw, 1),
            latitude=round(self.lat, 6),
            longitude=round(self.lon, 6),
            battery=round(self.battery, 1),
            signal_strength=96.0,
            simulation_time=round(self._sim_time, 1),
            mode=self.mode,
            is_armed=self.is_armed,
            is_airborne=self.is_airborne,
            source=self.adapter_name
        )
        
    async def send_drone_command(self, command: str, params: dict) -> bool:
        self._running = True
        if command == "ARM":
            self.is_armed = True
            self.mode = "ARMED"
        elif command == "DISARM":
            self.is_armed = False
            self.mode = "IDLE"
            self.velocity = 0.0
        elif command == "TAKEOFF":
            self.is_armed = True
            self.is_airborne = True
            self.mode = "TAKING_OFF"
        elif command == "LAND":
            self.mode = "LANDING"
        elif command == "HOVER":
            self.mode = "HOVERING"
            self.velocity = 0.0
        elif command == "STOP":
            self.mode = "HOVERING"
            self.velocity = 0.0
            self.pitch = 0.0
            self.roll = 0.0
        elif command == "MOVE":
            direction = params.get("direction", "forward")
            self.mode = "MOVING"
            self.velocity = float(params.get("speed", 5.0))
            if direction == "forward":
                self.heading = 0.0
                self.pitch = -5.0
            elif direction == "back":
                self.heading = 180.0
                self.pitch = 5.0
            elif direction == "left":
                self.heading = 270.0
                self.roll = -5.0
            elif direction == "right":
                self.heading = 90.0
                self.roll = 5.0
            elif direction == "up":
                self.altitude += 2.0
            elif direction == "down":
                self.altitude = max(0.5, self.altitude - 2.0)
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
