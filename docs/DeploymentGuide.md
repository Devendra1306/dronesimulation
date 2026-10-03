# RoboEdge AI Lab — Production & Demo Deployment Guide

This guide details how to deploy and run **RoboEdge AI Lab** for production portfolios and live UAS / Drone Simulation internship presentations.

---

## 1. Architecture Overview

Because robotics simulations (**ROS2 / Gazebo / Webots / OpenCV**) require access to local host hardware, display servers, or GPU acceleration, the system uses a **split deployment architecture**:

```text
                     INTERNET / EVALUATOR's BROWSER
                                  │
                                  ▼
                   ┌─────────────────────────────┐
                   │        Vercel Cloud         │
                   │   React 18 + Vite (SPA)     │
                   │   Tailwind CSS + Recharts   │
                   └──────────────┬──────────────┘
                                  │
                                  │ HTTPS (REST API) & WSS (WebSockets)
                                  ▼
     ┌─────────────────────────────────────────────────────────────┐
     │          Secure Tunnel (Cloudflare Tunnel / ngrok)          │
     └────────────────────────────┬────────────────────────────────┘
                                  │
                                  ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │                Local Machine / Robotics Linux VM                    │
 │                                                                     │
 │   FastAPI Backend (Port 8000)                                       │
 │     ├── SimulationAdapter (DemoSimulationAdapter / ROS2Adapter)     │
 │     ├── Computer Vision Pipeline (OpenCV)                           │
 │     ├── Statistical Analysis Service (Pandas / NumPy)               │
 │     └── Non-Blocking Persistence Worker (Motor Async Pool)          │
 │                                                                     │
 │   Robotics Layer                                                    │
 │     ├── ROS2 Humble / Iron Nodes (rclpy)                            │
 │     └── Gazebo / Webots Drone Physics Engine                        │
 └──────────────────────────────────┬──────────────────────────────────┘
                                    │
                                    │ TLS Connection
                                    ▼
                     ┌─────────────────────────────┐
                     │   MongoDB Atlas (Cloud)     │
                     │  Persistent Trials & Logs   │
                     └─────────────────────────────┘
```

---

## 2. Deploying the React Frontend to Vercel

### Step 2.1 — Import Repository to Vercel
1. Push your project code to GitHub / GitLab.
2. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Select your repository.

### Step 2.2 — Configure Project Settings
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend` *(Click Edit and select the `frontend` folder)*
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 2.3 — Configure Environment Variables
In the Vercel project configuration page (under **Environment Variables**), add:

| Key | Value (Example) | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `https://api.yourdomain.com` or `https://xxxx.ngrok-free.app` | Public HTTPS URL of your FastAPI backend |
| `VITE_WS_BASE_URL` | `wss://api.yourdomain.com` or `wss://xxxx.ngrok-free.app` | Public WSS URL for telemetry & logs |

*(If leaving these blank or testing in demo-only mode, the app defaults to `http://localhost:8000` / `ws://localhost:8000`).*

### Step 2.4 — SPA Routing
The repository already contains `frontend/vercel.json`:
```json
{
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
This ensures that refreshing sub-routes like `/ros2`, `/cv`, or `/experiments` resolves smoothly without 404 errors.

---

## 3. Exposing the Backend via Secure Tunnel

To allow your Vercel frontend to communicate with your local or VM robotics environment, expose FastAPI (port 8000) via a secure tunnel.

### Option A: Cloudflare Tunnel (Recommended — Free & No Bandwidth Limits)
1. Install `cloudflared`:
   ```powershell
   winget install --id Cloudflare.cloudflared
   ```
2. Start an ad-hoc tunnel to port 8000:
   ```bash
   cloudflared tunnel --url http://localhost:8000
   ```
3. Cloudflare will output a public URL (e.g. `https://random-subdomain.trycloudflare.com`).
4. Set in Vercel:
   - `VITE_API_BASE_URL`: `https://random-subdomain.trycloudflare.com`
   - `VITE_WS_BASE_URL`: `wss://random-subdomain.trycloudflare.com`

### Option B: ngrok
1. Install and authenticate ngrok:
   ```powershell
   ngrok http 8000
   ```
2. Copy the forwarding URL (e.g. `https://xxxx.ngrok-free.app`).
3. Set in Vercel:
   - `VITE_API_BASE_URL`: `https://xxxx.ngrok-free.app`
   - `VITE_WS_BASE_URL`: `wss://xxxx.ngrok-free.app`

---

## 4. Backend & MongoDB Configuration

Create or update `backend/.env`:
```ini
# Application Mode
SIMULATION_MODE=demo      # "demo" for software demo, "ros2" for live ROS2 bridge
DEBUG=true

# MongoDB Atlas Persistence Layer
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.ecei9hd.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=roboedge_ai_lab

# Robotics & CV Settings
TELEMETRY_DB_RATE_HZ=1.0  # Decoupled persistence rate (Hz)
ROS2_BRIDGE_URL=ws://localhost:9090
GAZEBO_URL=http://localhost:8081
CV_MODEL_PATH=models/yolo.pt
```

Launch the FastAPI backend:
```powershell
cd k:\Drone\backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 5. Dual-Mode Demonstration Strategy for Interviews

During an internship interview or technical evaluation, present both modes:

### Mode 1: Public Standalone Cloud Demonstration
- **URL**: `https://roboedge-ai-lab.vercel.app`
- **Use Case**: Sent in application forms, resume links, and pre-interview screenings.
- **How It Works**: Evaluators can open the link anytime without needing you to run your PC. They can inspect the Mission Control dashboard, ROS2 node topology, Computer Vision pipeline, edge hardware benchmarks, and historical experiment databases.

### Mode 2: Live Technical Demonstration (Connected to Gazebo / ROS2)
- **Use Case**: Live interview screen-share or interactive testing.
- **Workflow**:
  1. Boot your Linux environment / WSL2 / Docker container with ROS2 and Gazebo.
  2. Launch Gazebo quadrotor simulation world.
  3. Start the ROS2 adapter bridge (`SIMULATION_MODE=ros2`).
  4. Start Cloudflare Tunnel or point the UI directly to local host.
  5. Demonstrate real-time control: **ARM → TAKEOFF → WAYPOINT NAVIGATION → HOVER → LAND**.
  6. Point out that telemetry updates reflect the real physics model in Gazebo, and the ROS2 tab reflects live publishers and subscribers on ROS topics (`/cmd_vel`, `/camera/image_raw`, `/imu/data`).
