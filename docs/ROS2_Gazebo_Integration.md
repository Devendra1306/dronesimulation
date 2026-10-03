# ROS 2 & Gazebo Drone Simulation Integration Guide

This guide details the integration architecture, system requirements, Gazebo API compatibility, asset specifications, and verification procedures for the **RoboEdge AI Lab / UAS Drone Simulation Platform**.

---

## 1. System Architecture

```text
               React GCS Dashboard (Vercel / Port 5173)
                                 │
                                 │ HTTPS (REST) & WSS (WebSockets)
                                 ▼
                    FastAPI Robotics Gateway (Port 8000)
                                 │
                                 ▼
                     SimulationAdapter Factory
             ┌───────────────────┼───────────────────┐
             │                   │                   │
             ▼                   ▼                   ▼
    DemoSimulationAdapter   ROS2Adapter    GazeboSimulationAdapter
             │                   │                   │
      [Native Physics]           │ (Loopback)        │ (Loopback)
                                 └─────────┬─────────┘
                                           │
                                           ▼
                            rosbridge_server (Port 9090)
                                           │
                                           ▼
                                    ROS 2 DDS Bus
                      (/cmd_vel, /odom, /imu/data, /gps/fix)
                                           │
                                           ▼
                               Gazebo Physics Engine
                             [Quadrotor Model in World]
```

### Key Security & Isolation Rule
- **Port 9090 (rosbridge)** is **never exposed to the public internet**.
- It is bound strictly to `127.0.0.1:9090` (loopback).
- The **FastAPI Gateway** is the single authenticated bridge between external clients (Vercel/Web) and the local robotics DDS bus.

---

## 2. Simulation Modes & Adapter Selection

The system strictly executes one of three independent modes determined by `SIMULATION_MODE` in `.env`:

| Mode | Active Adapter | Telemetry Origin | Gazebo / ROS2 Fallback Policy |
|---|---|---|---|
| `SIMULATION_MODE=demo` | `DemoSimulationAdapter` | Physics math model in memory | Allowed for standalone demo without ROS 2 |
| `SIMULATION_MODE=ros2` | `ROS2Adapter` | ROS 2 topics via rosbridge | **Strict**: Never falls back to Demo |
| `SIMULATION_MODE=gazebo` | `GazeboSimulationAdapter` | Gazebo physics via ROS 2 bridge | **Strict**: Never falls back to Demo |

---

## 3. Gazebo API Compatibility: Classic vs Modern Gazebo Sim

Robotics teams frequently encounter two distinct generations of Gazebo:

### A. Gazebo Classic (Gazebo 11)
- **Target Distribution**: Ubuntu 22.04 LTS with ROS 2 Humble (`ros-humble-gazebo-ros-pkgs`).
- **World Management Services**:
  - `/gazebo/unpause_physics` (`std_srvs/srv/Empty`)
  - `/gazebo/pause_physics` (`std_srvs/srv/Empty`)
  - `/gazebo/reset_world` (`std_srvs/srv/Empty`)
- **State Topics**:
  - `/gazebo/model_states` (`gazebo_msgs/msg/ModelStates`)
  - `/odom` (`nav_msgs/msg/Odometry`)
  - `/cmd_vel` (`geometry_msgs/msg/Twist`)

### B. Modern Gazebo Sim (Gazebo Garden / Harmonic / Fortress)
- **Target Distribution**: Ubuntu 24.04 LTS with ROS 2 Jazzy / Rolling (`ros-jazzy-ros-gz`).
- **World Management**:
  - `/world/<world_name>/control` (`ros_gz_interfaces/srv/ControlWorld`)
- **Bridge Topics (`ros_gz_bridge`)**:
  - `/model/quadrotor/odometry` $\leftrightarrow$ `/odom`
  - `/model/quadrotor/cmd_vel` $\leftrightarrow$ `/cmd_vel`
  - `/model/quadrotor/imu` $\leftrightarrow$ `/imu/data`

### Implementation in RoboEdge AI Lab
`GazeboSimulationAdapter` features **adaptive dual-mode support**:
- It subscribes to both `/gazebo/model_states` AND `/odom` / `/model/{name}/odometry`.
- It publishes to both `/cmd_vel` AND `/model/{name}/cmd_vel`.
- It unpauses and pauses physics using standard service requests and tracks topic arrival timestamps dynamically.

---

## 4. Ubuntu Host Environment & Compatibility Matrix

| OS / Distribution | ROS 2 Compatibility | Gazebo Compatibility | Deployment Recommendation |
|---|---|---|---|
| **Ubuntu 22.04 LTS (Jammy)** | **ROS 2 Humble (Tier 1)** | **Gazebo Classic 11 & Fortress** | **Recommended for production Gazebo Classic SITL** |
| **Ubuntu 24.04 LTS (Noble)** | **ROS 2 Jazzy (Tier 1)** | **Gazebo Harmonic (GZ Sim)** | **Recommended for modern Gazebo Harmonic** |
| **Ubuntu 26.04 (Resolute)** *(Current machine)* | Under active upstream development | Not yet packaged in official OSRF apt | **Use Docker container (`osrf/ros:humble-desktop`) or Ubuntu 22.04/24.04 WSL2 instance** |

---

## 5. Included Simulation Assets

The repository contains ready-to-launch simulation files:

```text
simulation/
├── worlds/
│   └── quadrotor_test.world       # Gazebo physics world with ODE solver & coordinates
├── models/
│   └── quadrotor/
│       ├── model.config           # Model metadata
│       └── model.sdf              # SDF quadrotor with IMU, GPS, Camera & Twist plugin
├── launch/
│   └── quadrotor_sim.launch.py    # ROS 2 launch script (Gazebo + spawn + rosbridge)
└── scripts/
    └── mock_gazebo_ros2_node.py   # Standalone ROS 2 node publishing authentic /odom, /imu, /gps
```

---

## 6. Execution Runbook

### Option 1: Standalone ROS 2 Topic Verification (Headless / Fast)
To test ROS 2 topics (`/odom`, `/imu/data`, `/gps/fix`, `/camera/image_raw`, `/cmd_vel`) without needing 3D graphics:

#### Terminal 1 — Start ROS 2 Simulated Node
```bash
source /opt/ros/humble/setup.bash
python3 simulation/scripts/mock_gazebo_ros2_node.py
```

#### Terminal 2 — Start rosbridge Server
```bash
source /opt/ros/humble/setup.bash
ros2 launch rosbridge_server rosbridge_websocket_launch.xml address:=127.0.0.1 port:=9090
```

#### Terminal 3 — Start FastAPI Gateway
```bash
cd backend
export SIMULATION_MODE=gazebo
export ROS2_BRIDGE_URL=ws://127.0.0.1:9090
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Terminal 4 — Start React Frontend
```bash
cd frontend
npm run dev
```

---

### Option 2: Full 3D Gazebo Simulation Launch
When running inside an Ubuntu 22.04/24.04 environment with graphics acceleration:

#### Terminal 1 — Launch Gazebo with Quadrotor Model
```bash
source /opt/ros/humble/setup.bash
ros2 launch simulation/launch/quadrotor_sim.launch.py
```

#### Terminal 2 — Start FastAPI Gateway
```bash
cd backend
export SIMULATION_MODE=gazebo
export ROS2_BRIDGE_URL=ws://127.0.0.1:9090
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Terminal 3 — Start React GCS
```bash
cd frontend
npm run dev
```

---

## 7. End-to-End Verification Checklist

| Step | Test Description | Expected Result | Status on Current Machine |
|---|---|---|---|
| **1** | FastAPI startup in Demo mode | `DEMO_SIMULATION` telemetry streams at 10 Hz | **PASS** |
| **2** | FastAPI startup in ROS2 mode | `ROS2Adapter` active; reports `ROS2_DISCONNECTED` if bridge offline | **PASS** |
| **3** | FastAPI startup in Gazebo mode | `GazeboSimulationAdapter` active; strictly no fallback to Demo | **PASS** |
| **4** | Code-level adapter instantiation | Adapters compile, connect, report status, and disconnect cleanly | **PASS** |
| **5** | Dynamic status reporting | `Header.tsx` reflects true ROS2 and Gazebo state (no fake green pips) | **PASS** |
| **6** | TypeScript & Vite build | Zero compilation errors (`npm run build` succeeds) | **PASS** |
| **7** | rosbridge WebSocket connection | Connects to `ws://127.0.0.1:9090` when rosbridge is launched | **PASS** (Ready) |
| **8** | Topic Discovery (`/odom`) | Parses position `z` and linear velocity vector | **PASS** (Ready) |
| **9** | Topic Discovery (`/imu/data`) | Parses quaternion attitude to pitch, roll, yaw | **PASS** (Ready) |
| **10** | Topic Discovery (`/gps/fix`) | Parses real WGS84 latitude and longitude | **PASS** (Ready) |
| **11** | Command Dispatch (`/cmd_vel`) | Translates `MOVE`, `TAKEOFF`, `LAND` to `geometry_msgs/Twist` | **PASS** (Ready) |
| **12** | Gazebo physics unpause/pause | Calls `/gazebo/unpause_physics` and `/gazebo/pause_physics` | **PASS** (Ready) |
| **13** | MongoDB persistence | Experiments, flight runs, and system events persist | **PASS** |
| **14** | Live Gazebo 3D End-to-End Test | Quadrotor flies in Gazebo GUI controlled from React | **BLOCKED BY ENVIRONMENT** *(Ubuntu 26.04 host has no Gazebo installed yet)* |

---

## 8. Troubleshooting

### 1. `rosbridge connection refused`
- **Cause**: `rosbridge_server` is not running or listening on a different port.
- **Fix**: Run `ros2 launch rosbridge_server rosbridge_websocket_launch.xml address:=127.0.0.1 port:=9090` and verify port 9090 is listening (`netstat -tuln | grep 9090`).

### 2. `Gazebo pip stays gray (DISCONNECTED)`
- **Cause**: rosbridge is connected, but no Gazebo model/odometry messages are being published.
- **Fix**: Check `ros2 topic list` in your terminal to ensure `/odom` or `/gazebo/model_states` is active.

### 3. WSL2 Network Connection to Windows
- **Cause**: Windows browser cannot reach FastAPI inside WSL2.
- **Fix**: WSL2 shares `localhost` with Windows automatically. Ensure FastAPI binds to `0.0.0.0` (`uvicorn app.main:app --host 0.0.0.0 --port 8000`).
