# RoboEdge AI Lab

> **Drone Simulation, ROS2, Computer Vision & Edge AI Experimentation Platform**

A professional-grade UAS / Drone R&D control and experimentation platform, designed to demonstrate real-world aerospace robotics engineering skills. Built for a UAS / Drone Simulation internship portfolio.

The system currently operates in **Demo Simulation Mode** — a fully functional UI and backend with realistic simulated drone telemetry — and is architecturally designed to connect to real **ROS2** and **Gazebo** environments.

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│               React Frontend (Vite)              │
│  Mission Control | ROS2 Lab | CV | Edge AI | ... │
└────────────────────┬─────────────────────────────┘
                     │  HTTP REST + WebSocket
┌────────────────────▼─────────────────────────────┐
│            FastAPI Backend (Python)               │
│   /api/drone  /api/ros2  /api/cv  /ws/telemetry  │
└────────────────────┬─────────────────────────────┘
                     │  Service Layer
┌────────────────────▼─────────────────────────────┐
│              Simulation Adapter                   │
│  ┌──────────────────┐  ┌────────────────────────┐│
│  │ DemoSimulation   │  │  GazeboAdapter (future)││
│  │ Adapter (active) │  │  ROS2Adapter (future)  ││
│  └──────────────────┘  └────────────────────────┘│
└────────────────────┬─────────────────────────────┘
                     │  (future)
┌────────────────────▼─────────────────────────────┐
│              ROS2 Ecosystem                       │
│   Gazebo | rosbridge | drone_controller nodes    │
└──────────────────────────────────────────────────┘
```

---

## Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Mission Control Dashboard** | ✅ | Real-time drone telemetry, controls, sensor graphs |
| **Drone Simulator** | ✅ | ARM/DISARM/TAKEOFF/LAND/HOVER/STOP + directional control |
| **ROS2 Lab** | ✅ | Node graph visualization, topic monitor, service explorer |
| **Computer Vision** | ✅ | OpenCV image processing: edge detection, blur, contours |
| **Sensor Data** | ✅ | Live IMU, GPS, altitude, velocity, battery charts |
| **Data Analysis** | ✅ | CSV upload + pandas/numpy statistics + charts |
| **Edge AI** | ✅ | Jetson/RPi device comparison, inference benchmarks |
| **Experiments** | ✅ | Experiment management and tracking |
| **System Logs** | ✅ | Real-time log viewer with filtering |
| **Settings** | ✅ | Simulation mode, API, ROS2, Gazebo configuration |
| **WebSocket Streaming** | ✅ | Real-time telemetry at 10Hz via `/ws/telemetry` |
| **Demo Mode** | ✅ | Fully functional without ROS2/Gazebo |
| **ROS2 Integration** | 🔜 | Adapter stub provided — requires ROS2 environment |
| **Gazebo Integration** | 🔜 | Adapter stub provided — requires Gazebo |

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

## Running — With ROS2

See the full guide: [docs/GazeboIntegration.md](docs/GazeboIntegration.md)

Quick summary:
```bash
# 1. Change .env
SIMULATION_MODE=ros2
ROS2_BRIDGE_URL=ws://localhost:9090

# 2. Start rosbridge
ros2 launch rosbridge_server rosbridge_websocket_launch.xml

# 3. Start your ROS2 nodes
ros2 run roboedge_drone drone_controller

# 4. Restart backend
uvicorn app.main:app --reload
```

---

## Running — With Gazebo

See the full guide: [docs/GazeboIntegration.md](docs/GazeboIntegration.md)

Quick summary:
```bash
# 1. Change .env
SIMULATION_MODE=gazebo
GAZEBO_URL=http://localhost:8081

# 2. Start Gazebo
gazebo --verbose

# 3. Spawn drone model
ros2 run gazebo_ros spawn_entity.py -entity quadrotor -file models/quadrotor/model.sdf

# 4. Start backend
uvicorn app.main:app --reload
```

The UI header will change from `DEMO SIMULATION` to `GAZEBO CONNECTED`.

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

## Security

- **No hardcoded credentials** — all secrets in `.env`
- `.env` is in `.gitignore`
- `.env.example` provided with safe placeholder values
- CORS configured for development (restrict in production)
- API keys never exposed in the frontend

---

## Future Improvements

- [ ] Implement real `GazeboSimulationAdapter`
- [ ] Implement real `ROS2Adapter` using rosbridge protocol
- [ ] Add YOLO object detection in the CV pipeline
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
