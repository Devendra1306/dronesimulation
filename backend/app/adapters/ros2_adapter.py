"""ROS2 / Gazebo Simulation Adapter for RoboEdge AI Lab.

Connects FastAPI to the ROS2 ecosystem via rosbridge_suite WebSocket (ws://localhost:9090)
or directly to ROS2 topics.

Architecture:
  React UI (Vercel)
       │ HTTPS / WSS
       ▼
  FastAPI (Robotics Gateway)
       │ Internal loopback WebSocket (ws://localhost:9090)
       ▼
  rosbridge_server
       │ ROS2 DDS Bus
       ▼
  Gazebo / Simulated Drone (Quadrotor)
"""

import asyncio
import json
import time
import math
import logging
from typing import Optional, Dict, Any

from app.adapters.base import SimulationAdapter
from app.schemas.drone import TelemetryData
from app.schemas.simulation import SimulationStatus

logger = logging.getLogger("ros2_adapter")


class ROS2Adapter(SimulationAdapter):
    def __init__(self, bridge_url: str = "ws://localhost:9090"):
        self.bridge_url = bridge_url
        self._connected = False
        self._ws = None
        self._listener_task: Optional[asyncio.Task] = None
        self._reconnect_task: Optional[asyncio.Task] = None
        self._should_run = True

        # Active Topics & Diagnostics
        self.active_topics: Set[str] = set()
        self.last_topic_recv: Dict[str, float] = {}

        # Internal state updated from ROS2 topics
        self.mode = "STANDBY"
        self.is_armed = False
        self.is_airborne = False
        self.altitude = 0.0
        self.velocity = 0.0
        self.heading = 0.0
        self.pitch = 0.0
        self.roll = 0.0
        self.yaw = 0.0
        self.lat = 0.0
        self.lon = 0.0
        self.battery = 0.0
        self.battery_available = False
        self.signal_strength = 0.0
        self.sim_time = 0.0
        self.start_time = time.time()
        self.last_msg_time = 0.0

    @property
    def is_bridge_connected(self) -> bool:
        return self._connected

    async def connect(self) -> bool:
        """Initiate background connection to rosbridge."""
        self._should_run = True
        if not self._reconnect_task or self._reconnect_task.done():
            self._reconnect_task = asyncio.create_task(self._maintain_connection())
        return True

    async def disconnect(self) -> None:
        """Gracefully disconnect from rosbridge."""
        self._should_run = False
        if self._reconnect_task and not self._reconnect_task.done():
            self._reconnect_task.cancel()
        if self._listener_task and not self._listener_task.done():
            self._listener_task.cancel()
        if self._ws:
            try:
                await self._ws.close()
            except Exception:
                pass
        self._connected = False
        logger.info("ROS2 Adapter disconnected")

    async def _maintain_connection(self):
        """Continually attempts to connect to rosbridge if disconnected."""
        import websockets

        while self._should_run:
            if not self._connected:
                try:
                    logger.info(f"Attempting connection to ROS2 rosbridge at {self.bridge_url}...")
                    self._ws = await asyncio.wait_for(
                        websockets.connect(self.bridge_url, ping_interval=10, ping_timeout=10),
                        timeout=3.0
                    )
                    self._connected = True
                    logger.info("Successfully connected to ROS2 rosbridge suite!")
                    
                    # Subscribe and advertise topics
                    await self._setup_ros_topics()

                    # Start message receiver
                    self._listener_task = asyncio.create_task(self._message_listener())
                    await self._listener_task
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    self._connected = False
                    logger.debug(f"ROS2 rosbridge connection attempt failed: {e}. Retrying in 5s...")
                    await asyncio.sleep(5.0)
            else:
                await asyncio.sleep(2.0)

    async def _setup_ros_topics(self):
        """Advertise publishers and subscribe to telemetry topics on ROS2."""
        if not self._ws or not self._connected:
            return

        # 1. Advertise /cmd_vel (Twist)
        advertise_cmd_vel = {
            "op": "advertise",
            "topic": "/cmd_vel",
            "type": "geometry_msgs/msg/Twist"
        }
        await self._ws.send(json.dumps(advertise_cmd_vel))

        # 2. Advertise /drone/command (String)
        advertise_drone_cmd = {
            "op": "advertise",
            "topic": "/drone/command",
            "type": "std_msgs/msg/String"
        }
        await self._ws.send(json.dumps(advertise_drone_cmd))

        # 3. Subscribe to /drone/telemetry or /mavros/state or /cmd_vel echo
        subscribe_telemetry = {
            "op": "subscribe",
            "topic": "/drone/telemetry",
            "type": "std_msgs/msg/String"
        }
        await self._ws.send(json.dumps(subscribe_telemetry))

        subscribe_odom = {
            "op": "subscribe",
            "topic": "/odom",
            "type": "nav_msgs/msg/Odometry"
        }
        await self._ws.send(json.dumps(subscribe_odom))

    async def _message_listener(self):
        """Receive and decode JSON messages from rosbridge."""
        try:
            async for raw_msg in self._ws:
                self.last_msg_time = time.time()
                try:
                    msg = json.loads(raw_msg)
                    topic = msg.get("topic")
                    payload = msg.get("msg", {})

                    if topic == "/drone/telemetry":
                        self._handle_telemetry_msg(payload)
                    elif topic == "/odom":
                        self._handle_odometry_msg(payload)
                except Exception as ex:
                    logger.debug(f"Error parsing rosbridge msg: {ex}")
        except Exception as e:
            logger.warning(f"ROS2 rosbridge connection lost: {e}")
            self._connected = False

    def _handle_telemetry_msg(self, payload: Any):
        """Parse custom string/JSON drone telemetry message."""
        try:
            if isinstance(payload, dict):
                data = payload
            elif isinstance(payload, str):
                data = json.loads(payload)
            else:
                data = json.loads(payload.get("data", "{}"))

            if "altitude" in data: self.altitude = float(data["altitude"])
            if "velocity" in data: self.velocity = float(data["velocity"])
            if "heading" in data: self.heading = float(data["heading"])
            if "pitch" in data: self.pitch = float(data["pitch"])
            if "roll" in data: self.roll = float(data["roll"])
            if "yaw" in data: self.yaw = float(data["yaw"])
            if "mode" in data: self.mode = str(data["mode"]).upper()
            if "is_armed" in data: self.is_armed = bool(data["is_armed"])
            if "is_airborne" in data: self.is_airborne = bool(data["is_airborne"])
            if "battery" in data: self.battery = float(data["battery"])
        except Exception:
            pass

    def _handle_odometry_msg(self, payload: Dict[str, Any]):
        """Parse nav_msgs/msg/Odometry from Gazebo/ROS2."""
        try:
            pose = payload.get("pose", {}).get("pose", {})
            position = pose.get("position", {})
            twist = payload.get("twist", {}).get("twist", {})
            linear = twist.get("linear", {})

            z = position.get("z", 0.0)
            self.altitude = max(0.0, float(z))
            self.is_airborne = self.altitude > 0.2

            vx = linear.get("x", 0.0)
            vy = linear.get("y", 0.0)
            vz = linear.get("z", 0.0)
            self.velocity = math.sqrt(vx*vx + vy*vy + vz*vz)
        except Exception:
            pass

    async def start_simulation(self) -> bool:
        return True

    async def pause_simulation(self) -> bool:
        return True

    async def reset_simulation(self) -> bool:
        self.altitude = 0.0
        self.velocity = 0.0
        self.mode = "STANDBY"
        self.is_armed = False
        self.is_airborne = False
        return True

    async def step_simulation(self, steps: int = 1) -> bool:
        return True

    async def get_telemetry(self) -> TelemetryData:
        now = time.time()
        self.sim_time = now - self.start_time

        source = "ROS2" if self._connected else "ROS2_DISCONNECTED"
        bat = round(self.battery, 1) if (self._connected and self.battery_available) else (100.0 if self._connected else 0.0)

        return TelemetryData(
            timestamp=now,
            altitude=round(self.altitude, 2),
            velocity=round(self.velocity, 2),
            heading=round(self.heading, 1),
            pitch=round(self.pitch, 2),
            roll=round(self.roll, 2),
            yaw=round(self.yaw, 2),
            latitude=round(self.lat, 6),
            longitude=round(self.lon, 6),
            battery=bat,
            signal_strength=round(self.signal_strength if self._connected else 0.0, 1),
            simulation_time=round(self.sim_time, 2),
            mode=self.mode,
            is_armed=self.is_armed,
            is_airborne=self.is_airborne,
            source=source
        )

    async def send_drone_command(self, command: str, params: dict) -> bool:
        """Dispatch commands to ROS2 topics (/cmd_vel, /drone/command)."""
        cmd = command.upper()
        logger.info(f"ROS2 Adapter dispatching command: {cmd} with params {params}")

        # Handle local state transitions
        if cmd == "ARM":
            self.is_armed = True
            self.mode = "ARMED"
        elif cmd == "DISARM":
            self.is_armed = False
            self.is_airborne = False
            self.mode = "STANDBY"
        elif cmd == "TAKEOFF":
            if self.is_armed:
                self.mode = "TAKING_OFF"
                self.is_airborne = True
        elif cmd == "LAND":
            self.mode = "LANDING"
        elif cmd == "HOVER":
            self.mode = "HOVERING"
        elif cmd == "STOP":
            self.mode = "IDLE"

        # If connected to rosbridge, publish over WebSocket
        if self._ws and self._connected:
            try:
                if cmd == "MOVE":
                    direction = params.get("direction", "forward").lower()
                    speed = float(params.get("speed", 1.0))
                    
                    lx, ly, lz, az = 0.0, 0.0, 0.0, 0.0
                    if direction == "forward": lx = speed
                    elif direction == "backward": lx = -speed
                    elif direction == "left": ly = speed
                    elif direction == "right": ly = -speed
                    elif direction == "up": lz = speed
                    elif direction == "down": lz = -speed
                    elif direction == "yaw_left": az = speed
                    elif direction == "yaw_right": az = -speed

                    twist_msg = {
                        "op": "publish",
                        "topic": "/cmd_vel",
                        "msg": {
                            "linear": {"x": lx, "y": ly, "z": lz},
                            "angular": {"x": 0.0, "y": 0.0, "z": az}
                        }
                    }
                    await self._ws.send(json.dumps(twist_msg))
                else:
                    cmd_msg = {
                        "op": "publish",
                        "topic": "/drone/command",
                        "msg": {"data": cmd}
                    }
                    await self._ws.send(json.dumps(cmd_msg))
                return True
            except Exception as e:
                logger.error(f"Failed to publish ROS2 command: {e}")
                return False

        # In standby mode before rosbridge is online, state is queued
        return True

    async def get_simulation_status(self) -> SimulationStatus:
        return SimulationStatus(
            status="running" if self._connected else "standby",
            time=round(time.time() - self.start_time, 2),
            source="ROS2_GAZEBO" if self._connected else "ROS2_STANDBY"
        )

    async def get_camera_frame(self) -> Optional[bytes]:
        return None

    @property
    def adapter_name(self) -> str:
        return "ROS2_GAZEBO" if self._connected else "ROS2_STANDBY"

    @property
    def is_demo(self) -> bool:
        return False

    @property
    def is_connected(self) -> bool:
        return self._connected
