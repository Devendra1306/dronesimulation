"""Gazebo Simulation Adapter for RoboEdge AI Lab.

Interfaces with the Gazebo Physics Engine (Gazebo Classic or Gazebo Garden/Harmonic/Ignition)
via the ROS-Gazebo bridge (ros_gz_bridge) or rosbridge_suite.

Architecture:
  React UI (Vercel)
       │ HTTPS / WSS
       ▼
  FastAPI (Robotics Gateway)
       │ Loopback WebSocket / ROS2 Transport
       ▼
  GazeboSimulationAdapter
       │ Gazebo World & Model Topics
       ▼
  Gazebo Simulation World (Quadrotor Model)
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

logger = logging.getLogger("gazebo_adapter")


class GazeboSimulationAdapter(SimulationAdapter):
    def __init__(self, bridge_url: str = "ws://localhost:9090", gazebo_url: str = "http://localhost:8081"):
        self.bridge_url = bridge_url
        self.gazebo_url = gazebo_url
        self._connected = False
        self._physics_running = False
        self._ws = None
        self._listener_task: Optional[asyncio.Task] = None
        self._reconnect_task: Optional[asyncio.Task] = None
        self._should_run = True

        # Drone State pulled from Gazebo physics
        self.drone_model_name = "quadrotor"
        self.mode = "STANDBY"
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
        self.signal_strength = 99.0
        self.sim_time = 0.0
        self.start_time = time.time()
        self.last_msg_time = 0.0

    async def connect(self) -> bool:
        """Start background connection to Gazebo via ROS2 bridge."""
        self._should_run = True
        if not self._reconnect_task or self._reconnect_task.done():
            self._reconnect_task = asyncio.create_task(self._maintain_connection())
        return True

    async def disconnect(self) -> None:
        """Gracefully disconnect from Gazebo bridge."""
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
        self._physics_running = False
        logger.info("Gazebo Simulation Adapter disconnected")

    async def _maintain_connection(self):
        """Maintains persistent connection with Gazebo topic bridge."""
        import websockets

        while self._should_run:
            if not self._connected:
                try:
                    logger.info(f"Connecting to Gazebo bridge at {self.bridge_url}...")
                    self._ws = await asyncio.wait_for(
                        websockets.connect(self.bridge_url, ping_interval=10, ping_timeout=10),
                        timeout=3.0
                    )
                    self._connected = True
                    self._physics_running = True
                    logger.info("Gazebo bridge connected! Initializing Gazebo topics and services...")
                    
                    await self._setup_gazebo_topics()
                    self._listener_task = asyncio.create_task(self._message_listener())
                    await self._listener_task
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    self._connected = False
                    self._physics_running = False
                    logger.debug(f"Gazebo connection failed: {e}. Retrying in 5s...")
                    await asyncio.sleep(5.0)
            else:
                await asyncio.sleep(2.0)

    async def _setup_gazebo_topics(self):
        """Advertise Gazebo command topics and subscribe to physics odometry."""
        if not self._ws or not self._connected:
            return

        # 1. Advertise velocity to Gazebo quadrotor plugin
        for topic in ["/cmd_vel", f"/model/{self.drone_model_name}/cmd_vel"]:
            await self._ws.send(json.dumps({
                "op": "advertise",
                "topic": topic,
                "type": "geometry_msgs/msg/Twist"
            }))

        # 2. Subscribe to Gazebo Model States & Odometry
        topics_to_sub = [
            ("/gazebo/model_states", "gazebo_msgs/msg/ModelStates"),
            (f"/model/{self.drone_model_name}/odometry", "nav_msgs/msg/Odometry"),
            ("/odom", "nav_msgs/msg/Odometry"),
            ("/drone/telemetry", "std_msgs/msg/String")
        ]
        for top, t_type in topics_to_sub:
            await self._ws.send(json.dumps({
                "op": "subscribe",
                "topic": top,
                "type": t_type
            }))

    async def _message_listener(self):
        """Listen and parse Gazebo world physics updates."""
        try:
            async for raw_msg in self._ws:
                self.last_msg_time = time.time()
                try:
                    msg = json.loads(raw_msg)
                    topic = msg.get("topic")
                    payload = msg.get("msg", {})

                    if topic == "/gazebo/model_states":
                        self._handle_model_states(payload)
                    elif "/odometry" in str(topic) or topic == "/odom":
                        self._handle_odometry(payload)
                    elif topic == "/drone/telemetry":
                        self._handle_telemetry(payload)
                except Exception as ex:
                    logger.debug(f"Error parsing Gazebo message: {ex}")
        except Exception as e:
            logger.warning(f"Gazebo connection lost: {e}")
            self._connected = False
            self._physics_running = False

    def _handle_model_states(self, payload: Dict[str, Any]):
        """Extract quadrotor pose and twist from Gazebo ModelStates."""
        try:
            names = payload.get("name", [])
            poses = payload.get("pose", [])
            twists = payload.get("twist", [])

            if self.drone_model_name in names:
                idx = names.index(self.drone_model_name)
            elif len(names) > 0:
                idx = 0
            else:
                return

            p = poses[idx].get("position", {})
            q = poses[idx].get("orientation", {})
            t = twists[idx].get("linear", {})

            # Altitude
            self.altitude = max(0.0, float(p.get("z", 0.0)))
            self.is_airborne = self.altitude > 0.15

            # Velocity magnitude
            vx = float(t.get("x", 0.0))
            vy = float(t.get("y", 0.0))
            vz = float(t.get("z", 0.0))
            self.velocity = math.sqrt(vx*vx + vy*vy + vz*vz)

            # Quaternions to Euler angles
            qx = float(q.get("x", 0.0))
            qy = float(q.get("y", 0.0))
            qz = float(q.get("z", 0.0))
            qw = float(q.get("w", 1.0))

            sinr_cosp = 2 * (qw * qx + qy * qz)
            cosr_cosp = 1 - 2 * (qx * qx + qy * qy)
            self.roll = math.degrees(math.atan2(sinr_cosp, cosr_cosp))

            sinp = 2 * (qw * qy - qz * qx)
            self.pitch = math.degrees(math.asin(max(-1.0, min(1.0, sinp))))

            siny_cosp = 2 * (qw * qz + qx * qy)
            cosy_cosp = 1 - 2 * (qy * qy + qz * qz)
            self.yaw = math.degrees(math.atan2(siny_cosp, cosy_cosp))
            self.heading = (self.yaw + 360) % 360
        except Exception:
            pass

    def _handle_odometry(self, payload: Dict[str, Any]):
        """Parse nav_msgs/msg/Odometry from Gazebo."""
        try:
            pos = payload.get("pose", {}).get("pose", {}).get("position", {})
            twist = payload.get("twist", {}).get("twist", {}).get("linear", {})
            z = pos.get("z", 0.0)
            self.altitude = max(0.0, float(z))
            self.is_airborne = self.altitude > 0.15

            vx = float(twist.get("x", 0.0))
            vy = float(twist.get("y", 0.0))
            vz = float(twist.get("z", 0.0))
            self.velocity = math.sqrt(vx*vx + vy*vy + vz*vz)
        except Exception:
            pass

    def _handle_telemetry(self, payload: Any):
        try:
            data = json.loads(payload) if isinstance(payload, str) else payload
            if "mode" in data: self.mode = str(data["mode"]).upper()
            if "is_armed" in data: self.is_armed = bool(data["is_armed"])
            if "battery" in data: self.battery = float(data["battery"])
        except Exception:
            pass

    async def start_simulation(self) -> bool:
        """Unpause Gazebo physics."""
        self._physics_running = True
        if self._ws and self._connected:
            await self._ws.send(json.dumps({
                "op": "call_service",
                "service": "/gazebo/unpause_physics",
                "args": {}
            }))
        return True

    async def pause_simulation(self) -> bool:
        """Pause Gazebo physics."""
        self._physics_running = False
        if self._ws and self._connected:
            await self._ws.send(json.dumps({
                "op": "call_service",
                "service": "/gazebo/pause_physics",
                "args": {}
            }))
        return True

    async def reset_simulation(self) -> bool:
        """Reset Gazebo world and drone model position."""
        self.altitude = 0.0
        self.velocity = 0.0
        self.mode = "STANDBY"
        self.is_armed = False
        self.is_airborne = False
        if self._ws and self._connected:
            await self._ws.send(json.dumps({
                "op": "call_service",
                "service": "/gazebo/reset_world",
                "args": {}
            }))
        return True

    async def step_simulation(self, steps: int = 1) -> bool:
        """Step Gazebo physics."""
        return True

    async def get_telemetry(self) -> TelemetryData:
        now = time.time()
        self.sim_time = now - self.start_time
        source = "GAZEBO" if self._connected else "GAZEBO_STANDBY"

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
            battery=round(self.battery, 1),
            signal_strength=round(self.signal_strength if self._connected else 0.0, 1),
            simulation_time=round(self.sim_time, 2),
            mode=self.mode,
            is_armed=self.is_armed,
            is_airborne=self.is_airborne,
            source=source
        )

    async def send_drone_command(self, command: str, params: dict) -> bool:
        """Send flight maneuvers to Gazebo quadrotor model."""
        cmd = command.upper()
        logger.info(f"Gazebo Adapter command: {cmd} {params}")

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
                # Publish upward velocity in Gazebo
                return await self._publish_velocity(0.0, 0.0, 1.5, 0.0)
        elif cmd == "LAND":
            self.mode = "LANDING"
            return await self._publish_velocity(0.0, 0.0, -1.0, 0.0)
        elif cmd == "HOVER":
            self.mode = "HOVERING"
            return await self._publish_velocity(0.0, 0.0, 0.0, 0.0)
        elif cmd == "STOP":
            self.mode = "IDLE"
            return await self._publish_velocity(0.0, 0.0, 0.0, 0.0)
        elif cmd == "MOVE":
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
            return await self._publish_velocity(lx, ly, lz, az)

        return True

    async def _publish_velocity(self, lx: float, ly: float, lz: float, az: float) -> bool:
        if self._ws and self._connected:
            try:
                twist_msg = {
                    "op": "publish",
                    "topic": "/cmd_vel",
                    "msg": {
                        "linear": {"x": lx, "y": ly, "z": lz},
                        "angular": {"x": 0.0, "y": 0.0, "z": az}
                    }
                }
                await self._ws.send(json.dumps(twist_msg))
                return True
            except Exception as e:
                logger.error(f"Gazebo twist command error: {e}")
                return False
        return True

    async def get_simulation_status(self) -> SimulationStatus:
        return SimulationStatus(
            status="running" if (self._connected and self._physics_running) else "standby",
            time=round(time.time() - self.start_time, 2),
            source="GAZEBO" if self._connected else "GAZEBO_STANDBY"
        )

    async def get_camera_frame(self) -> Optional[bytes]:
        return None

    @property
    def adapter_name(self) -> str:
        return "GAZEBO" if self._connected else "GAZEBO_STANDBY"

    @property
    def is_demo(self) -> bool:
        return False

    @property
    def is_connected(self) -> bool:
        return self._connected
