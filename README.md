# RoboEdge AI Lab

> **Drone Simulation, ROS2, Computer Vision & Edge AI Experimentation Platform**

A professional-grade UAS / Drone R&D control and experimentation platform, designed to demonstrate real-world aerospace robotics engineering skills. Built for a UAS / Drone Simulation internship portfolio.

The system currently operates in **Demo Simulation Mode** — a fully functional UI and backend with realistic simulated drone telemetry — and is architecturally designed to connect to real **ROS2** and **Gazebo** environments.

---

## Architecture

```text
                    React Frontend
                         │
              ┌──────────┴──────────┐
              │                     │
          REST API              WebSocket
              │                     │
              ▼                     ▼
            FastAPI             ROS2 / Live Data
              │
       ┌──────┴───────────┐
       │                  │
       ▼                  ▼
    MongoDB            ROS2 Adapter
       │                  │
       │                  ▼
       │                Gazebo
       │                  │
       └──── Historical ──┘
          persistence
```

### Real-Time vs Persistence Decoupling

- **Real-Time Control Loop (Sub-millisecond / 10 Hz)**:
  `React UI → FastAPI → SimulationAdapter / ROS2 → Gazebo → Simulated Drone`
  MongoDB is strictly **decoupled** from the flight command and real-time control path.
- **Historical Persistence Layer (Throttled 1 Hz)**:
  `FastAPI → Motor AsyncIO → MongoDB Atlas / Local MongoDB`
  Stores experiment records, throttled telemetry snapshots, sensor histories, OpenCV frame detections, simulation runs, and system events.

---

## Features & 9 UAS Sections

| Section | Status | Description |
|---------|--------|-------------|
| **Mission Control Dashboard** | ✅ | GCS telemetry HUD, flight commands (ARM, TAKEOFF, LAND, STOP), and live Recharts stream |
| **Drone Simulator (SITL)** | ✅ | Native SITL flight physics, Primary Flight Display (PFD) artificial horizon, camera HUD overlay |
| **ROS2 & Gazebo Lab** | ✅ | Dynamic node graph, topic monitor (/odom, /cmd_vel, /imu/data, /gps/fix), rate analytics |
| **Drone Vision** | ✅ | Aerial target extraction, Canny edge detection, contour analysis, OpenCV pipeline |
| **Flight Sensors** | ✅ | 6 avionics sensors: 6-DOF IMU, GNSS GPS, barometric altimeter, pitot speed, LiPo BMS, RF link |
| **UAV Edge AI** | ✅ | Embedded companion computer profiles (Jetson Orin/Nano, RPi 4/5), sub-40ms latency analysis |
| **Simulation Experiments** | ✅ | MongoDB Atlas persistent trials for flight tests, navigation, CV detection, and RTL failsafes |
| **System Logs** | ✅ | High-frequency engineering log stream with severity filtering and millisecond timestamps |
| **Settings** | ✅ | Runtime adapter selection (Demo, ROS2, Gazebo), rosbridge endpoint, and persistence rates |
| **ROS2 Adapter** | ✅ | Full rosbridge JSON client subscribing to /odom, /imu/data, /gps/fix and publishing /cmd_vel |
| **Gazebo Adapter** | ✅ | Dual-mode Gazebo Classic / Gazebo Sim adapter with unpause/pause services and model odometry |

---

## Technology Stack

### Frontend
- **React 18** + **TypeScript** — component architecture
- **Vite** — fast development server and build
- **Tailwind CSS v3** — utility-first styling with custom design tokens
- **Recharts** — telemetry and sensor data charts
- **Lucide React** — professional icon set
- **React Router v6** — client-side routing
- **Axios** — typed HTTP API client
- **WebSocket API** — real-time telemetry streaming

### Backend
- **FastAPI** — high-performance async Python web framework
- **Uvicorn** — ASGI server
- **Pydantic v2** — data validation and serialization
- **OpenCV** (headless) — computer vision processing
- **Pandas + NumPy** — data analysis and processing
- **SQLAlchemy + SQLite** — local database (PostgreSQL-compatible)
- **WebSockets** — real-time data streaming

### Future Robotics Integration
- **ROS2 Humble** — Robot Operating System 2
- **Gazebo** — 3D robotics simulation
- **rosbridge_suite** — WebSocket bridge for ROS2
- **YOLO** (optional) — object detection via clean adapter interface

---

## Project Structure

```
RoboEdge AI Lab/
├── frontend/                    # React/Vite TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          # Sidebar, Header, AppLayout
│   │   │   ├── common/          # StatusDot, TelemetryCard, DemoLabel, Panel
│   │   │   ├── drone/           # DroneVisualizer, DroneControls, TelemetryPanel
│   │   │   ├── charts/          # TelemetryChart, AltitudeChart, BatteryChart
│   │   │   └── ros2/            # NodeGraph, NodeCard, TopicMonitor
│   │   ├── pages/               # 10 full pages
│   │   ├── hooks/               # useTelemetry, useWebSocket, useSimulation
│   │   ├── services/            # api.ts, websocket.ts
│   │   ├── store/               # appStore.ts (React Context)
│   │   └── types/               # Shared TypeScript interfaces
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                     # FastAPI Python backend
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/          # system, drone, simulation, ros2, cv, data, edge, logs
│   │   │   └── websockets/      # telemetry_ws, ros2_ws, logs_ws
│   │   ├── services/            # Business logic layer
│   │   ├── adapters/            # Simulation adapter pattern
│   │   │   ├── base.py          # Abstract SimulationAdapter interface
│   │   │   ├── demo_adapter.py  # DemoSimulationAdapter (active)
│   │   │   └── ros2_adapter.py  # ROS2Adapter stub (future)
│   │   ├── models/              # SQLAlchemy database models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   └── core/                # Exceptions, config
│   ├── requirements.txt
│   └── .env.example
│
└── docs/
    ├── GazeboIntegration.md     # Step-by-step Gazebo/ROS2 setup guide
    └── Architecture.md          # System design documentation
```

---

## ROS2 Architecture

When connected to a real ROS2 environment, the system uses this node topology:

```
[camera_node]          [imu_node]          [gps_node]
      │                    │                    │
      ▼                    ▼                    ▼
/camera/image_raw     /imu/data           /gps/fix
      │                    │                    │
      └──────────┬──────────┘                   │
                 ▼                              │
           [cv_node]                            │
                 │                              │
                 ▼                              │
           /detections                          │
                 │                              │
                 └─────────┬──────────────────┘
                           ▼
                  [drone_controller]
                           │
                           ▼
                       /cmd_vel
                           │
                           ▼
                    [Gazebo Simulation]
```

**Topics:**
| Topic | Type | Rate | Description |
|-------|------|------|-------------|
| `/camera/image_raw` | `sensor_msgs/Image` | 30 Hz | Camera feed |
| `/imu/data` | `sensor_msgs/Imu` | 100 Hz | Inertial measurement unit |
| `/gps/fix` | `sensor_msgs/NavSatFix` | 10 Hz | GPS coordinates |
| `/cmd_vel` | `geometry_msgs/Twist` | 20 Hz | Velocity commands |
| `/detections` | `custom_msgs/Detection` | 30 Hz | Object detections |
| `/drone/state` | `std_msgs/String` | 10 Hz | Drone state machine |

---

## Installation

### Prerequisites
- Node.js 18+ 
- Python 3.10+
- Git

### Clone & Setup

```bash
git clone https://github.com/yourusername/roboedge-ai-lab.git
cd roboedge-ai-lab
```

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
```

### Frontend Setup

```bash
cd frontend
npm install
```

---

## Running — Demo Mode

Demo Mode requires **no ROS2, no Gazebo, no external dependencies.**

### Terminal 1 — Backend

```bash
cd backend
venv\Scripts\activate   # or: source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Expected output:
```
INFO: RoboEdge AI Lab backend starting...
INFO: Simulation mode: DEMO
INFO: DemoSimulationAdapter initialized
INFO: Uvicorn running on http://0.0.0.0:8000
```

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

Open: **http://localhost:5173**

You will see:
- `DEMO SIMULATION` badge in the header
- `● Simulation Connected` (green)
- `○ ROS2` (disconnected — expected in demo mode)
- `○ Gazebo` (disconnected — expected in demo mode)

All telemetry is clearly labelled as **DEMO / SIMULATION** data.

---

## Running — With ROS2 & Gazebo

See the comprehensive engineering guide: [docs/ROS2_Gazebo_Integration.md](docs/ROS2_Gazebo_Integration.md)

### Mode 1: ROS 2 Headless / Standalone Topic Verification
```bash
# Terminal 1 — Start ROS 2 test node
source /opt/ros/humble/setup.bash
python3 simulation/scripts/mock_gazebo_ros2_node.py

# Terminal 2 — Start rosbridge (loopback only)
source /opt/ros/humble/setup.bash
ros2 launch rosbridge_server rosbridge_websocket_launch.xml address:=127.0.0.1 port:=9090

# Terminal 3 — Start FastAPI Gateway
cd backend
export SIMULATION_MODE=gazebo
export ROS2_BRIDGE_URL=ws://127.0.0.1:9090
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 4 — Start React GCS Dashboard
cd frontend
npm run dev
```

### Mode 2: Full 3D Gazebo Simulation
```bash
# Terminal 1 — Launch Gazebo with Quadrotor Model
source /opt/ros/humble/setup.bash
ros2 launch simulation/launch/quadrotor_sim.launch.py

# Terminal 2 — Start FastAPI Gateway (Port 8000)
cd backend
export SIMULATION_MODE=gazebo
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 3 — Open React Dashboard
cd frontend
npm run dev
```
The GCS header will turn **GAZEBO ACTIVE** and **ROS2 ACTIVE** green only when live physics and rosbridge streams are detected. If Gazebo is offline, the header truthfully reflects **GAZEBO: DISCONNECTED**.

---

## API Reference

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/system/status` | System status, mode, connection state |
| GET | `/api/system/health` | Health check |

### Drone Control
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drone/telemetry` | Current telemetry snapshot |
| POST | `/api/drone/arm` | Arm the drone |
| POST | `/api/drone/disarm` | Disarm the drone |
| POST | `/api/drone/takeoff` | Execute takeoff |
| POST | `/api/drone/land` | Execute landing |
| POST | `/api/drone/hover` | Hold position |
| POST | `/api/drone/stop` | Emergency stop |
| POST | `/api/drone/move` | Move in direction |

### ROS2
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ros2/nodes` | List all ROS2 nodes |
| GET | `/api/ros2/topics` | List all topics |
| GET | `/api/ros2/services` | List all services |

### Simulation
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/simulation/status` | Simulation status |
| POST | `/api/simulation/start` | Start simulation |
| POST | `/api/simulation/pause` | Pause simulation |
| POST | `/api/simulation/reset` | Reset simulation |
| POST | `/api/simulation/step` | Step simulation |

### Computer Vision
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cv/process` | Process uploaded image |

### Data Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/data/analyze` | Analyze uploaded CSV |

### Edge AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/edge/devices` | Device comparison data |

### WebSocket Streams
| Endpoint | Rate | Description |
|----------|------|-------------|
| `/ws/telemetry` | 10 Hz | Real-time drone telemetry |
| `/ws/ros2` | 1 Hz | ROS2 node/topic status |
| `/ws/logs` | event | System log entries |

---

## Computer Vision

The Computer Vision module uses **OpenCV** through the FastAPI backend.

Supported operations:
- **Grayscale** — color space conversion
- **Gaussian Blur** — noise reduction with configurable kernel
- **Canny Edge Detection** — edge extraction with threshold control
- **Thresholding** — binary image segmentation
- **Contour Detection** — shape finding and analysis

Upload an image via the CV page → select operations → click Process.  
The processed image is returned as base64 and displayed alongside the original.

**Object Detection:** YOLO integration is provided via a clean adapter interface in `cv_service.py`. Requires a trained YOLO model file at the path specified in `.env`.

---

## Edge AI

The Edge AI page compares inference performance across different hardware:

| Device | Inference (ms) | FPS | Memory | Power |
|--------|----------------|-----|--------|-------|
| NVIDIA Jetson Nano | 45 ms | 22 | 512 MB | 5W |
| NVIDIA Jetson Xavier NX | 12 ms | 83 | 8 GB | 10W |
| Raspberry Pi 4 | 380 ms | 2.6 | 256 MB | 3.5W |
| Laptop GPU (RTX 3060) | 8 ms | 125 | 2 GB | 80W |

> **Note:** All values are labelled **DEMO / SAMPLE** — not measured from real hardware.  
> To add real measurements, implement `edge_service.py` to read from actual devices.

---

## Data Analysis

Upload any CSV file to the Data Analysis page.

The backend uses **Pandas + NumPy** to compute:
- Row and column counts
- Missing value counts per column
- Numerical statistics: mean, median, std, min, max, quartiles
- Data type detection
- Correlation matrix

Download the processed dataset as a cleaned CSV.

---

## Database Architecture & MongoDB Integration

RoboEdge AI Lab uses **MongoDB** as its persistent storage layer for non-real-time data (experiment registries, telemetry histories, sensor logs, computer vision detections, simulation runs, and system events).

```text
Real-time Control:
React → FastAPI → ROS2 → Gazebo

Historical Persistence:
ROS2/Gazebo/SITL → FastAPI → Motor (AsyncIO) → MongoDB
```

### Why MongoDB?
1. **Dynamic Sensor & Telemetry Documents**: UAV telemetry and multi-sensor structures (IMU accelerometer vectors, GPS NavSat fixes, barometer altimetry) vary in schema. MongoDB's BSON structure naturally accommodates heterogeneous sensor payloads without rigid table migrations.
2. **Decoupled High-Frequency Data**: Live flight control streams at 10 Hz over WebSockets, while the persistence layer samples at a configurable rate (`TELEMETRY_DB_RATE_HZ=1`) to prevent uncontrolled disk inflation.
3. **Graceful Fallback**: If MongoDB is unreachable, the system automatically runs in live Demo Simulation Mode with a non-blocking UI notice.

### MongoDB Collections

| Collection | Purpose | Key Indexes |
|---|---|---|
| `experiments` | Research trials, objectives, airframe model, algorithm configs | `experiment_id (unique)`, `status`, `created_at` |
| `simulation_runs` | Individual execution runs, durations, SITL mode, completion status | `run_id (unique)`, `experiment_id + start_time` |
| `telemetry` | Time-series flight coordinates, altitude, velocity, battery, attitude | `experiment_id + timestamp`, `timestamp` |
| `sensor_data` | Multi-channel sensor records (IMU 3-axis, GPS, distance/proximity) | `experiment_id + timestamp`, `sensor_type` |
| `cv_results` | Computer vision frames, detection lists, processing latency (ms) | `experiment_id + timestamp` |
| `experiment_results` | Aggregated post-flight benchmarks (max alt, avg vel, CV accuracy) | `experiment_id (unique)`, `created_at` |
| `system_events` | Critical flight commands (`ARM`, `TAKEOFF`, `STOP`), simulation errors | `severity + timestamp`, `event_type` |

### Configuration

#### Local MongoDB Setup
```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=roboedge_ai_lab
TELEMETRY_DB_RATE_HZ=1
ENABLE_TELEMETRY_PERSISTENCE=true
```

#### MongoDB Atlas Setup (Cloud Replica Set)
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.ecei9hd.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=roboedge_ai_lab
TELEMETRY_DB_RATE_HZ=1
ENABLE_TELEMETRY_PERSISTENCE=true
```

#### Running with vs without MongoDB
- **With MongoDB**: Full persistence enabled. Experiments, flight history, and CV results persist across backend restarts and can be inspected in the **Experiments** registry or **Data Analysis** workbench.
- **Without MongoDB**: If MongoDB is offline, `/api/database/status` reports `connected: false`, the header displays `MongoDB ○ Offline`, and live flight simulation, 60 FPS PFD HUD, and OpenCV filters continue operating normally in memory.

---

## Security

- **No hardcoded credentials** — all secrets in `.env`
- `.env` is in `.gitignore`
- `.env.example` provided with safe placeholder values
- CORS configured for development (restrict in production)
- API keys never exposed in the frontend

---

## Future Improvements & Implementation Status

- [x] Implement real `GazeboSimulationAdapter` (Dual Gazebo Classic & Sim support)
- [x] Implement real `ROS2Adapter` using rosbridge protocol
- [x] Simulation assets (Quadrotor SDF model, test world, launch files, mock ROS2 node)
- [ ] Add YOLO model weights for live inference in CV pipeline
- [ ] Add 3D drone visualization using Three.js
- [ ] Add waypoint mission planning on a 2D map
- [ ] Add experiment data export (CSV, JSON)
- [ ] Add user authentication with JWT
- [ ] Add PostgreSQL support for production
- [ ] Add Docker Compose for full-stack deployment
- [ ] Add CI/CD with GitHub Actions
- [ ] Add telemetry data recording and replay

---

## Author

Built as a portfolio/R&D project demonstrating:
- ROS2 architecture understanding
- Drone simulation workflows
- Computer vision pipeline design
- Data processing with pandas/numpy
- Edge AI deployment concepts
- Full-stack engineering (React + FastAPI)
- Clean adapter-pattern architecture
- Professional engineering UI/UX

---

## License

MIT License — see [LICENSE](LICENSE) for details.
