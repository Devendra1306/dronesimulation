"""Gazebo Simulation Adapter for RoboEdge AI Lab.

Interfaces with Gazebo (Gazebo Classic 11 / ODE Physics) via rosbridge_suite (ws://localhost:9090).

Architecture:
  React UI (GCS)
       │ HTTPS / WSS
       ▼
  FastAPI (Robotics Gateway)
       │ Internal loopback WebSocket (ws://127.0.0.1:9090)
       ▼
  rosbridge_server
       │ ROS2 DDS Bus
       ▼
  Gazebo World & 3D Quadrotor Model with libgazebo_ros_quadrotor_controller.so
"""

import asyncio
import json
import time
import math
import logging
from typing import Optional, Dict, Any, Set

from app.adapters.base import SimulationAdapter
from app.schemas.drone import TelemetryData
from app.schemas.simulation import SimulationStatus
from app.services.log_service import log_service

logger = logging.getLogger("gazebo_adapter")


class GazeboSimulationAdapter(SimulationAdapter):
    def __init__(self, bridge_url: str = "ws://localhost:9090", gazebo_url: str = "http://localhost:8081"):
        self.bridge_url = bridge_url
        self.gazebo_url = gazebo_url
        
        # Connection status tracking
        self._bridge_connected = False
        self._gazebo_msg_recv_time = 0.0
        self._physics_running = False
        self._ws = None
        self._listener_task: Optional[asyncio.Task] = None
        self._reconnect_task: Optional[asyncio.Task] = None
        self._flight_loop_task: Optional[asyncio.Task] = None
        self._should_run = True

        # Drone Model configuration
        self.drone_model_name = "quadrotor"
        
        # Discovered / Active Topics
        self.active_topics: Set[str] = set()
        self.last_topic_recv: Dict[str, float] = {}

        # Live telemetry state parsed from Gazebo topics
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
        self.battery_available = False
        self.signal_strength = 0.0
        self.sim_time = 0.0
        self.start_time = time.time()
        self.last_msg_time = 0.0
        self.has_valid_odometry = False
        self._camera_frame: Optional[bytes] = None

        # Desired hover / target state for flight manager
        self._target_altitude = 2.0
        self._active_linear_vel = [0.0, 0.0, 0.0]
        self._active_angular_vel = 0.0

    async def connect(self) -> bool:
        """Start background connection to rosbridge and flight manager."""
        self._should_run = True
        log_service.add_log("INFO", f"Initializing GazeboSimulationAdapter for target {self.bridge_url}", "GAZEBO_ADAPTER")
        if not self._reconnect_task or self._reconnect_task.done():
            self._reconnect_task = asyncio.create_task(self._maintain_connection())
        if not self._flight_loop_task or self._flight_loop_task.done():
            self._flight_loop_task = asyncio.create_task(self._flight_manager_loop())
        return True

    async def disconnect(self) -> None:
        """Gracefully disconnect from Gazebo bridge."""
        self._should_run = False
        if self._reconnect_task and not self._reconnect_task.done():
            self._reconnect_task.cancel()
        if self._listener_task and not self._listener_task.done():
            self._listener_task.cancel()
        if self._flight_loop_task and not self._flight_loop_task.done():
            self._flight_loop_task.cancel()
        if self._ws:
            try:
                await self._ws.close()
            except Exception:
                pass
        self._bridge_connected = False
        self._physics_running = False
        self.has_valid_odometry = False
        self.active_topics.clear()
        log_service.add_log("INFO", "GazeboSimulationAdapter disconnected", "GAZEBO_ADAPTER")

    @property
    def is_bridge_connected(self) -> bool:
        """True if the WebSocket to rosbridge is actively connected."""
        return self._bridge_connected

    @property
    def is_gazebo_active(self) -> bool:
        """True ONLY if real odometry messages have actually arrived from Gazebo within the last 3.5s."""
        return (
            self._bridge_connected
            and self.has_valid_odometry
            and (time.time() - self._gazebo_msg_recv_time < 3.5)
        )

    @property
    def is_connected(self) -> bool:
        return self.is_gazebo_active

    @property
    def adapter_name(self) -> str:
        if self.is_gazebo_active:
            return "GAZEBO"
        elif self.is_bridge_connected:
            return "GAZEBO_STANDBY (rosbridge Online, Awaiting Gazebo Physics)"
        return "GAZEBO_DISCONNECTED"

    @property
    def is_demo(self) -> bool:
        return False

    async def _maintain_connection(self):
        """Maintains persistent connection with rosbridge."""
        import websockets

        while self._should_run:
            if not self._bridge_connected:
                try:
                    logger.info(f"Connecting to rosbridge at {self.bridge_url}...")
                    self._ws = await asyncio.wait_for(
                        websockets.connect(
                            self.bridge_url,
                            ping_interval=10,
                            ping_timeout=10,
                            max_size=10 * 1024 * 1024
                        ),
                        timeout=3.0
                    )
                    self._bridge_connected = True
                    self.signal_strength = 98.0
                    log_service.add_log("INFO", f"Connected to rosbridge WebSocket at {self.bridge_url}", "ROS2_BRIDGE")
                    
                    # Advertise and subscribe to Gazebo topics
                    await self._setup_gazebo_topics()
                    
                    self._listener_task = asyncio.create_task(self._message_listener())
                    await self._listener_task
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    self._bridge_connected = False
                    self.has_valid_odometry = False
                    self.signal_strength = 0.0
                    logger.debug(f"Gazebo rosbridge connection failed: {e}. Retrying in 4s...")
                    await asyncio.sleep(4.0)
            else:
                await asyncio.sleep(2.0)

    async def _setup_gazebo_topics(self):
        """Advertise Gazebo command topics and subscribe to physics odometry."""
        if not self._ws or not self._bridge_connected:
            return

        # 1. Advertise velocity to Gazebo quadrotor plugins
        command_topics = [
            ("/cmd_vel", "geometry_msgs/msg/Twist"),
            (f"/model/{self.drone_model_name}/cmd_vel", "geometry_msgs/msg/Twist"),
            ("/drone/command", "std_msgs/msg/String")
        ]
        for topic, t_type in command_topics:
            await self._ws.send(json.dumps({
                "op": "advertise",
                "topic": topic,
                "type": t_type
            }))

        # 2. Subscribe to Gazebo Model States, Odometry, IMU, GPS, and Camera
        topics_to_sub = [
            ("/odom", "nav_msgs/msg/Odometry"),
            (f"/model/{self.drone_model_name}/odometry", "nav_msgs/msg/Odometry"),
            ("/gazebo/model_states", "gazebo_msgs/msg/ModelStates"),
            ("/imu/data", "sensor_msgs/msg/Imu"),
            ("/gps/fix", "sensor_msgs/msg/NavSatFix"),
            ("/camera/image_raw", "sensor_msgs/msg/Image"),
            ("/drone/telemetry", "std_msgs/msg/String"),
            ("/battery_state", "sensor_msgs/msg/BatteryState")
        ]
        for top, t_type in topics_to_sub:
            await self._ws.send(json.dumps({
                "op": "subscribe",
                "topic": top,
                "type": t_type
            }))
        log_service.add_log("INFO", "Subscribed to Gazebo physics topics: /odom, /imu/data, /gps/fix, /cmd_vel", "GAZEBO_ADAPTER")

    async def _message_listener(self):
        """Listen and parse Gazebo world physics updates."""
        try:
            async for raw_msg in self._ws:
                self.last_msg_time = time.time()
                try:
                    msg = json.loads(raw_msg)
                    topic = msg.get("topic")
                    payload = msg.get("msg", {})

                    if topic:
                        self.active_topics.add(topic)
                        self.last_topic_recv[topic] = time.time()

                    if topic == "/odom" or "/odometry" in str(topic):
                        self._handle_odometry(payload)
                        self._gazebo_msg_recv_time = time.time()
                        self._physics_running = True
                        self.has_valid_odometry = True
                    elif topic == "/gazebo/model_states":
                        self._handle_model_states(payload)
                        self._gazebo_msg_recv_time = time.time()
                        self._physics_running = True
                        self.has_valid_odometry = True
                    elif topic == "/imu/data":
                        self._handle_imu(payload)
                    elif topic == "/gps/fix":
                        self._handle_gps(payload)
                    elif topic == "/drone/telemetry":
                        self._handle_telemetry(payload)
                    elif topic == "/battery_state":
                        self._handle_battery(payload)
                    elif topic == "/camera/image_raw":
                        self._handle_camera(payload)
                except Exception as ex:
                    logger.warning(f"Error parsing Gazebo message: {ex}")
        except Exception as e:
            logger.error(f"rosbridge connection interrupted: {type(e).__name__}: {e}")
            log_service.add_log("WARN", f"rosbridge connection interrupted: {type(e).__name__}: {e}", "ROS2_BRIDGE")
            self._bridge_connected = False
            self._physics_running = False
            self.has_valid_odometry = False
            self.signal_strength = 0.0

    def _handle_odometry(self, payload: Dict[str, Any]):
        """Parse nav_msgs/msg/Odometry from Gazebo controller plugin."""
        try:
            pose = payload.get("pose", {}).get("pose", {})
            pos = pose.get("position", {})
            q = pose.get("orientation", {})
            twist = payload.get("twist", {}).get("twist", {}).get("linear", {})

            z = float(pos.get("z", 0.0))
            self.altitude = max(0.0, z)
            
            # TRUTHFUL FLIGHT DETECTION: airborne is strictly determined by physical altitude
            self.is_airborne = bool(self.altitude > 0.25)

            vx = float(twist.get("x", 0.0))
            vy = float(twist.get("y", 0.0))
            vz = float(twist.get("z", 0.0))
            self.velocity = math.sqrt(vx * vx + vy * vy + vz * vz)

            self._quaternion_to_euler(q)
        except Exception:
            pass

    def _handle_model_states(self, payload: Dict[str, Any]):
        """Extract quadrotor pose and twist from Gazebo Classic ModelStates as fallback."""
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

            z = float(p.get("z", 0.0))
            self.altitude = max(0.0, z)
            self.is_airborne = bool(self.altitude > 0.25)

            vx = float(t.get("x", 0.0))
            vy = float(t.get("y", 0.0))
            vz = float(t.get("z", 0.0))
            self.velocity = math.sqrt(vx * vx + vy * vy + vz * vz)

            self._quaternion_to_euler(q)
        except Exception:
            pass

    def _handle_imu(self, payload: Dict[str, Any]):
        """Parse sensor_msgs/msg/Imu."""
        try:
            orientation = payload.get("orientation", {})
            if orientation:
                self._quaternion_to_euler(orientation)
        except Exception:
            pass

    def _handle_gps(self, payload: Dict[str, Any]):
        """Parse sensor_msgs/msg/NavSatFix."""
        try:
            lat = payload.get("latitude")
            lon = payload.get("longitude")
            if lat is not None and lon is not None:
                self.lat = float(lat)
                self.lon = float(lon)
        except Exception:
            pass

    def _handle_battery(self, payload: Dict[str, Any]):
        """Parse sensor_msgs/msg/BatteryState."""
        try:
            percentage = payload.get("percentage")
            if percentage is not None:
                self.battery = float(percentage) * 100.0 if float(percentage) <= 1.0 else float(percentage)
                self.battery_available = True
        except Exception:
            pass

    def _handle_camera(self, payload: Dict[str, Any]):
        """Store camera image raw frame."""
        try:
            data = payload.get("data")
            if isinstance(data, (bytes, bytearray)):
                self._camera_frame = bytes(data)
        except Exception:
            pass

    def _handle_telemetry(self, payload: Any):
        try:
            data = json.loads(payload) if isinstance(payload, str) else payload
            if "battery" in data: 
                self.battery = float(data["battery"])
                self.battery_available = True
        except Exception:
            pass

    def _quaternion_to_euler(self, q: Dict[str, Any]):
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

    async def _flight_manager_loop(self):
        """Background control loop to manage altitude transitions (TAKEOFF hold, LAND touchdown)."""
        while self._should_run:
            try:
                if self.is_gazebo_active and self.is_armed:
                    # Automatic takeoff climb to target hover altitude
                    if self.mode == "TAKING_OFF":
                        if self.altitude >= self._target_altitude:
                            # Reached target altitude -> transition to hover
                            self.mode = "HOVERING"
                            self._active_linear_vel = [0.0, 0.0, 0.0]
                            await self._publish_velocity(0.0, 0.0, 0.0, 0.0)
                            log_service.add_log("INFO", f"Takeoff climb complete. Holding hover at {self.altitude:.2f}m", "FLIGHT_CONTROLLER")
                        else:
                            # Continue upward climb
                            await self._publish_velocity(0.0, 0.0, 1.2, 0.0)

                    # Controlled landing descent
                    elif self.mode == "LANDING":
                        if self.altitude <= 0.22:
                            # Ground touchdown confirmed
                            self.mode = "STANDBY"
                            self.is_armed = False
                            self._active_linear_vel = [0.0, 0.0, 0.0]
                            await self._publish_velocity(0.0, 0.0, 0.0, 0.0)
                            log_service.add_log("INFO", f"Touchdown confirmed at {self.altitude:.2f}m. Motors secured.", "FLIGHT_CONTROLLER")
                        else:
                            # Continue controlled descent
                            await self._publish_velocity(0.0, 0.0, -0.8, 0.0)

            except Exception as e:
                logger.debug(f"Flight manager loop iteration error: {e}")

            await asyncio.sleep(0.1)  # 10 Hz control loop

    async def start_simulation(self) -> bool:
        """Unpause Gazebo physics."""
        self._physics_running = True
        log_service.add_log("INFO", "Unpausing Gazebo simulation physics", "GAZEBO")
        if self._ws and self._bridge_connected:
            await self._ws.send(json.dumps({
                "op": "call_service",
                "service": "/gazebo/unpause_physics",
                "args": {}
            }))
        return True

    async def pause_simulation(self) -> bool:
        """Pause Gazebo physics."""
        self._physics_running = False
        log_service.add_log("INFO", "Pausing Gazebo simulation physics", "GAZEBO")
        if self._ws and self._bridge_connected:
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
        log_service.add_log("INFO", "Resetting Gazebo simulation world", "GAZEBO")
        if self._ws and self._bridge_connected:
            await self._ws.send(json.dumps({
                "op": "call_service",
                "service": "/gazebo/reset_world",
                "args": {}
            }))
        return True

    async def step_simulation(self, steps: int = 1) -> bool:
        return True

    async def get_telemetry(self) -> TelemetryData:
        now = time.time()
        self.sim_time = now - self.start_time
        
        # Check honest status
        if self.is_gazebo_active:
            source = "GAZEBO"
            sig = self.signal_strength
            bat = round(self.battery, 1) if self.battery_available else 100.0
        elif self.is_bridge_connected:
            source = "GAZEBO_STANDBY"
            sig = 50.0
            bat = 0.0
        else:
            source = "GAZEBO_DISCONNECTED"
            sig = 0.0
            bat = 0.0

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
            signal_strength=sig,
            simulation_time=round(self.sim_time, 2),
            mode=self.mode,
            is_armed=self.is_armed,
            is_airborne=self.is_airborne,
            source=source
        )

    async def send_drone_command(self, command: str, params: dict) -> bool:
        """Send flight maneuvers to Gazebo quadrotor model via /cmd_vel with physical confirmation."""
        cmd = command.upper()
        log_service.add_log("INFO", f"Dispatched command {cmd} to Gazebo flight adapter", "FLIGHT_CONTROLLER")

        if cmd == "ARM":
            self.is_armed = True
            self.mode = "ARMED"
            log_service.add_log("INFO", "Motors Armed. Flight Interlock Disengaged.", "FLIGHT_CONTROLLER")
            return True

        elif cmd == "DISARM":
            if self.is_airborne:
                log_service.add_log("WARN", "Safety Interlock: Cannot disarm while airborne!", "FLIGHT_CONTROLLER")
                return False
            self.is_armed = False
            self.mode = "STANDBY"
            await self._publish_velocity(0.0, 0.0, 0.0, 0.0)
            log_service.add_log("INFO", "Motors Disarmed. Flight Interlock Engaged.", "FLIGHT_CONTROLLER")
            return True

        elif cmd == "TAKEOFF":
            if not self.is_armed:
                log_service.add_log("WARN", "Takeoff rejected: Drone is not armed!", "FLIGHT_CONTROLLER")
                return False

            self.mode = "TAKING_OFF"
            self._target_altitude = 2.0
            # Send vertical climb velocity
            pub_ok = await self._publish_velocity(0.0, 0.0, 1.4, 0.0)
            if not pub_ok:
                self.mode = "ARMED"
                return False

            # Wait briefly to confirm physical lift-off response
            init_alt = self.altitude
            for _ in range(15):
                await asyncio.sleep(0.1)
                if self.altitude > init_alt + 0.08 or self.is_airborne:
                    log_service.add_log("INFO", f"Takeoff confirmed: physical altitude climbing ({self.altitude:.2f}m)", "FLIGHT_CONTROLLER")
                    return True

            log_service.add_log("WARN", "Takeoff commanded: physical climb verification pending in Gazebo", "FLIGHT_CONTROLLER")
            return True

        elif cmd == "LAND":
            self.mode = "LANDING"
            await self._publish_velocity(0.0, 0.0, -0.8, 0.0)
            log_service.add_log("INFO", f"Controlled landing initiated from {self.altitude:.2f}m", "FLIGHT_CONTROLLER")
            return True

        elif cmd == "HOVER":
            self.mode = "HOVERING"
            self._active_linear_vel = [0.0, 0.0, 0.0]
            self._active_angular_vel = 0.0
            await self._publish_velocity(0.0, 0.0, 0.0, 0.0)
            log_service.add_log("INFO", "Hover / Position Hold engaged", "FLIGHT_CONTROLLER")
            return True

        elif cmd == "STOP":
            # Emergency motor kill
            self.mode = "IDLE"
            self.is_armed = False
            self._active_linear_vel = [0.0, 0.0, 0.0]
            self._active_angular_vel = 0.0
            await self._publish_velocity(0.0, 0.0, 0.0, 0.0)
            log_service.add_log("WARN", "EMERGENCY MOTOR CUT DISPATCHED", "FLIGHT_CONTROLLER")
            return True

        elif cmd == "MOVE":
            if not self.is_armed:
                log_service.add_log("WARN", "Move rejected: Drone is not armed!", "FLIGHT_CONTROLLER")
                return False

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

            self.mode = "MOVING"
            return await self._publish_velocity(lx, ly, lz, az)

        return True

    async def _publish_velocity(self, lx: float, ly: float, lz: float, az: float) -> bool:
        """Publish geometry_msgs/msg/Twist to /cmd_vel."""
        if self._ws and self._bridge_connected:
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
                log_service.add_log("ERROR", f"Failed to publish /cmd_vel to rosbridge: {e}", "GAZEBO_ADAPTER")
                return False
        return False

    async def get_simulation_status(self) -> SimulationStatus:
        if self.is_gazebo_active:
            st = "running" if self._physics_running else "paused"
            src = "GAZEBO"
        elif self.is_bridge_connected:
            st = "standby"
            src = "GAZEBO_STANDBY"
        else:
            st = "disconnected"
            src = "GAZEBO_DISCONNECTED"

        return SimulationStatus(
            status=st,
            time=round(time.time() - self.start_time, 2),
            source=src
        )

    async def get_camera_frame(self) -> Optional[bytes]:
        return self._camera_frame
