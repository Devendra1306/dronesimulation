# Gazebo Integration Guide — RoboEdge AI Lab

> **Current State:** The application runs in **Demo Simulation Mode** by default.  
> This document explains how to connect the real ROS2 + Gazebo stack.

---

## Architecture Overview

```
React Frontend (Vite)
       ↓  HTTP / WebSocket
FastAPI Backend (Python)
       ↓  Service Layer
Simulation Adapter (pluggable)
       ↓
  ┌────────────────────┐
  │  DemoSimulation    │  ← Default (no external deps)
  └────────────────────┘
  ┌────────────────────┐
  │  GazeboAdapter     │  ← Connects to real Gazebo
  └────────────────────┘
  ┌────────────────────┐
  │  ROS2Adapter       │  ← Connects to real ROS2 ecosystem
  └────────────────────┘
```

**Key Principle:** The frontend never talks to ROS2/Gazebo directly.  
All robotics communication is abstracted through the adapter layer.

---

## Prerequisites

### System Requirements
- Ubuntu 22.04 LTS (recommended) or Ubuntu 20.04
- ROS2 Humble Hawksbill or ROS2 Iron Irwini
- Gazebo Classic (Gazebo 11) or Ignition Gazebo (Gazebo Fortress/Garden)
- Python 3.10+
- Node.js 18+

### Alternative: Windows WSL2
If you are on Windows, use WSL2 with Ubuntu 22.04 for the robotics components.  
The React frontend and FastAPI backend can run natively on Windows, with the ROS2/Gazebo stack inside WSL2.

---

## Step 1: Install ROS2

### Ubuntu 22.04 — ROS2 Humble

```bash
# Set up locale
sudo apt update && sudo apt install locales
sudo locale-gen en_US en_US.UTF-8
sudo update-locale LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8

# Add ROS2 apt repository
sudo apt install software-properties-common
sudo add-apt-repository universe
sudo apt update && sudo apt install curl -y
sudo curl -sSL https://raw.githubusercontent.com/ros/rosdistro/master/ros.key -o /usr/share/keyrings/ros-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/ros-archive-keyring.gpg] http://packages.ros.org/ros2/ubuntu $(. /etc/os-release && echo $UBUNTU_CODENAME) main" | sudo tee /etc/apt/sources.list.d/ros2.list > /dev/null

# Install ROS2 Humble Desktop
sudo apt update
sudo apt install ros-humble-desktop

# Install development tools
sudo apt install ros-dev-tools

# Source ROS2 in bash
echo "source /opt/ros/humble/setup.bash" >> ~/.bashrc
source ~/.bashrc
```

### Verify ROS2 Installation

```bash
ros2 --version
ros2 topic list   # should show basic topics
```

---

## Step 2: Install Gazebo

### Gazebo Classic (Gazebo 11) — simplest integration

```bash
sudo apt update
sudo apt install gazebo

# ROS2-Gazebo bridge
sudo apt install ros-humble-gazebo-ros-pkgs
sudo apt install ros-humble-gazebo-ros2-control
```

### Verify Gazebo

```bash
gazebo --version
# Start Gazebo with empty world
gazebo
```

### Ignition Gazebo (Gazebo Fortress) — recommended for new projects

```bash
sudo apt install gz-fortress

# ROS2-Ignition bridge
sudo apt install ros-humble-ros-gz
```

---

## Step 3: Create ROS2 Workspace

```bash
# Create workspace
mkdir -p ~/ros2_ws/src
cd ~/ros2_ws

# Source ROS2
source /opt/ros/humble/setup.bash

# Build empty workspace
colcon build
source install/setup.bash
```

---

## Step 4: Create Drone ROS2 Package

```bash
cd ~/ros2_ws/src

# Create Python package
ros2 pkg create --build-type ament_python roboedge_drone \
  --dependencies rclpy sensor_msgs geometry_msgs nav_msgs std_msgs

# Package structure will be:
# roboedge_drone/
#   package.xml
#   setup.py
#   roboedge_drone/
#     __init__.py
#     drone_controller.py   ← Main drone control node
#     telemetry_publisher.py ← Publishes telemetry
#     camera_bridge.py      ← Camera topic bridge
```

### Example Drone Controller Node

```python
# ~/ros2_ws/src/roboedge_drone/roboedge_drone/drone_controller.py

import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from std_msgs.msg import String
import json

class DroneController(Node):
    def __init__(self):
        super().__init__('drone_controller')
        
        # Publisher: velocity commands to Gazebo
        self.cmd_vel_pub = self.create_publisher(Twist, '/cmd_vel', 10)
        
        # Publisher: drone state
        self.state_pub = self.create_publisher(String, '/drone/state', 10)
        
        # Subscriber: incoming commands from backend bridge
        self.cmd_sub = self.create_subscription(
            String, '/roboedge/command', self.command_callback, 10
        )
        
        self.get_logger().info('DroneController initialized')
        self.state = 'IDLE'
    
    def command_callback(self, msg):
        command = json.loads(msg.data)
        action = command.get('action')
        
        if action == 'ARM':
            self.state = 'ARMED'
            self.publish_state()
        elif action == 'TAKEOFF':
            self.execute_takeoff(command.get('altitude', 10.0))
        elif action == 'LAND':
            self.execute_land()
        elif action == 'HOVER':
            self.publish_zero_velocity()
        elif action == 'EMERGENCY_STOP':
            self.emergency_stop()
    
    def execute_takeoff(self, altitude: float):
        self.state = 'TAKING_OFF'
        self.publish_state()
        # Send vertical velocity command
        msg = Twist()
        msg.linear.z = 2.0  # upward
        self.cmd_vel_pub.publish(msg)
    
    def publish_state(self):
        msg = String()
        msg.data = json.dumps({'state': self.state})
        self.state_pub.publish(msg)
    
    def publish_zero_velocity(self):
        self.cmd_vel_pub.publish(Twist())

def main():
    rclpy.init()
    node = DroneController()
    rclpy.spin(node)
    rclpy.shutdown()
```

### Example Telemetry Publisher

```python
# ~/ros2_ws/src/roboedge_drone/roboedge_drone/telemetry_publisher.py

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import NavSatFix, Imu
from nav_msgs.msg import Odometry
from std_msgs.msg import Float32

class TelemetryPublisher(Node):
    def __init__(self):
        super().__init__('telemetry_publisher')
        
        # Subscribe to Gazebo sensor topics
        self.gps_sub = self.create_subscription(NavSatFix, '/gps/fix', self.gps_callback, 10)
        self.imu_sub = self.create_subscription(Imu, '/imu/data', self.imu_callback, 10)
        self.odom_sub = self.create_subscription(Odometry, '/odom', self.odom_callback, 10)
        
        self.get_logger().info('TelemetryPublisher ready')
    
    def gps_callback(self, msg: NavSatFix):
        lat, lon = msg.latitude, msg.longitude
        # Bridge this data to the FastAPI backend via HTTP or WebSocket
        self.send_to_backend({'type': 'gps', 'lat': lat, 'lon': lon})
    
    def send_to_backend(self, data: dict):
        # Use httpx or websocket-client to push data to FastAPI
        import httpx
        httpx.post('http://localhost:8000/api/internal/telemetry', json=data)
```

---

## Step 5: Drone Model for Gazebo

Create a simple drone model (URDF/SDF):

```bash
mkdir -p ~/ros2_ws/src/roboedge_drone/models/quadrotor
```

```xml
<!-- ~/ros2_ws/src/roboedge_drone/models/quadrotor/model.sdf -->
<?xml version="1.0" ?>
<sdf version="1.7">
  <model name="quadrotor">
    <link name="base_link">
      <pose>0 0 0.1 0 0 0</pose>
      <inertial>
        <mass>1.5</mass>
        <inertia>
          <ixx>0.0347563</ixx>
          <ixy>0</ixy><ixz>0</ixz>
          <iyy>0.0458929</iyy>
          <iyz>0</iyz>
          <izz>0.0977</izz>
        </inertia>
      </inertial>
      <visual name="body">
        <geometry>
          <box><size>0.5 0.5 0.1</size></box>
        </geometry>
        <material>
          <ambient>0.1 0.4 0.8 1</ambient>
          <diffuse>0.1 0.4 0.8 1</diffuse>
        </material>
      </visual>
      <collision name="collision">
        <geometry><box><size>0.5 0.5 0.1</size></box></geometry>
      </collision>
    </link>
    
    <!-- IMU sensor -->
    <plugin filename="libgazebo_ros_imu_sensor.so" name="imu_plugin">
      <topicName>/imu/data</topicName>
      <updateRateHZ>100</updateRateHZ>
    </plugin>
    
    <!-- GPS sensor -->
    <plugin filename="libgazebo_ros_gps_sensor.so" name="gps_plugin">
      <topicName>/gps/fix</topicName>
      <updateRate>10</updateRate>
    </plugin>
    
    <!-- Camera -->
    <plugin filename="libgazebo_ros_camera.so" name="camera_plugin">
      <cameraName>drone_camera</cameraName>
      <imageTopicName>/camera/image_raw</imageTopicName>
      <frameName>camera_frame</frameName>
    </plugin>
  </model>
</sdf>
```

---

## Step 6: Start Gazebo with Drone

```bash
# Source everything
source /opt/ros/humble/setup.bash
source ~/ros2_ws/install/setup.bash

# Launch Gazebo with ROS2 integration
ros2 launch gazebo_ros gazebo.launch.py world:=empty.world

# Spawn drone model (in another terminal)
ros2 run gazebo_ros spawn_entity.py \
  -entity quadrotor \
  -file ~/ros2_ws/src/roboedge_drone/models/quadrotor/model.sdf \
  -x 0 -y 0 -z 0.5
```

### Verify Gazebo-ROS2 Bridge

```bash
# List available topics (should show /camera/image_raw, /imu/data, /gps/fix, /cmd_vel)
ros2 topic list

# Check camera feed
ros2 topic echo /camera/image_raw --once

# Check IMU
ros2 topic echo /imu/data --once
```

---

## Step 7: Start ROS2 Nodes

```bash
# Terminal 1: Drone Controller
ros2 run roboedge_drone drone_controller

# Terminal 2: Telemetry Publisher
ros2 run roboedge_drone telemetry_publisher

# Verify nodes
ros2 node list
# Should show: /drone_controller, /telemetry_publisher, etc.
```

---

## Step 8: Connect Backend Adapter

In the `.env` file, change the simulation mode:

```env
SIMULATION_MODE=gazebo
GAZEBO_URL=http://localhost:8081
ROS2_BRIDGE_URL=ws://localhost:9090
```

> **Note:** The `GazeboSimulationAdapter` in `backend/app/adapters/` must be implemented.  
> The `ros2_adapter.py` stub provides the interface — implement the HTTP/WebSocket calls to the ROS2 bridge.

### Install ROS2 Bridge (rosbridge_suite)

```bash
sudo apt install ros-humble-rosbridge-suite

# Start rosbridge WebSocket server
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
# Starts WebSocket at ws://localhost:9090
```

### Update the Adapter

```python
# backend/app/adapters/gazebo_adapter.py
# Implement GazeboSimulationAdapter using:
# - httpx for REST calls to Gazebo REST API
# - websockets for rosbridge connection at ws://localhost:9090
# - rclpy if running in the same ROS2 environment

# Key: swap in backend/app/main.py:
# adapter = GazeboSimulationAdapter()   # instead of DemoSimulationAdapter()
```

---

## Step 9: Start Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will connect to:
- Gazebo REST API at `http://localhost:8081`
- ROS2 rosbridge at `ws://localhost:9090`

---

## Step 10: Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

The header will now show:
- `● GAZEBO CONNECTED` (green)
- `● ROS2 READY` (green)

instead of the default `DEMO SIMULATION` labels.

---

## Step 11: Verify Telemetry

```bash
# In the frontend: Go to Mission Control
# Telemetry values should update from real Gazebo sensors
# Altitude, GPS, IMU should show Gazebo physics values

# In backend logs:
# [INFO] GazeboAdapter: connected to http://localhost:8081
# [INFO] ROS2Bridge: connected to ws://localhost:9090
# [INFO] Telemetry stream active at 10Hz

# In ROS2 terminal:
ros2 topic echo /drone/state
# Should show state changes as you click buttons in the UI
```

---

## Step 12: Test Drone Workflow

```bash
# UI: Click ARM → should publish to /roboedge/command
ros2 topic echo /roboedge/command
# {"action": "ARM"}

# UI: Click TAKE OFF
ros2 topic echo /cmd_vel
# linear.z > 0 (upward velocity)

# Gazebo: Drone should visually rise in the simulation
# UI: Altitude readout should increase

# UI: Click HOVER
ros2 topic echo /cmd_vel
# All zeros (hovering)

# UI: Click LAND
# Drone should descend in Gazebo
```

---

## Troubleshooting

### Gazebo not connecting
```bash
# Check if Gazebo REST API is running
curl http://localhost:8081/api/version

# Check if gazebo_ros plugin is loaded
rostopic list 2>/dev/null || ros2 topic list
```

### ROS2 Bridge not connecting
```bash
# Verify rosbridge is running
ss -tlnp | grep 9090
# Should show port 9090 open

# Check rosbridge logs
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

### Telemetry not updating
```bash
# Check if drone controller is publishing
ros2 topic hz /drone/state
# Should show ~10 Hz

# Check if backend WebSocket is streaming
# Open browser DevTools → Network → WS → /ws/telemetry
```

---

## Environment Variables Reference

```env
# .env
SIMULATION_MODE=demo      # demo | ros2 | gazebo

# ROS2 rosbridge WebSocket
ROS2_BRIDGE_URL=ws://localhost:9090

# Gazebo REST API (if using Gazebo 11)
GAZEBO_URL=http://localhost:8081

# For production, use your Ubuntu machine's IP
# ROS2_BRIDGE_URL=ws://192.168.1.100:9090
# GAZEBO_URL=http://192.168.1.100:8081
```

---

## Summary: Full System Startup Order

```
1. Start Gazebo:        gazebo --verbose
2. Spawn drone:         ros2 run gazebo_ros spawn_entity.py ...
3. Start ROS2 nodes:    ros2 run roboedge_drone drone_controller
4. Start rosbridge:     ros2 launch rosbridge_server rosbridge_websocket_launch.xml
5. Set env:             SIMULATION_MODE=gazebo in .env
6. Start backend:       uvicorn app.main:app --reload
7. Start frontend:      npm run dev
8. Open browser:        http://localhost:5173
```

---

*This guide is part of the RoboEdge AI Lab project.*  
*Author: RoboEdge AI Lab Team*  
*Last Updated: October 2026*
