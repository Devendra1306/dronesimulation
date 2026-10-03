from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import time
from app.services.log_service import log_service
from app.db.mongodb import mongodb_manager
from app.db.indexes import create_indexes

from app.config import settings
from app.adapters.demo_adapter import DemoSimulationAdapter
from app.adapters.ros2_adapter import ROS2Adapter
from app.api.routes import (
    system, drone, simulation, ros2, cv, data, edge, logs,
    database, experiments, simulation_runs, telemetry_history,
    sensors_history, events
)
from app.api.websockets import telemetry, ros2_ws, logs_ws

def get_simulation_adapter():
    if settings.simulation_mode.lower() == "ros2":
        return ROS2Adapter(bridge_url=settings.ros2_bridge_url)
    return DemoSimulationAdapter()

adapter = get_simulation_adapter()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Connect Simulation Adapter
    await adapter.connect()
    log_service.add_log("INFO", f"Application started, {adapter.adapter_name} adapter active", "SYSTEM")

    # 2. Connect MongoDB with graceful non-blocking fallback
    mongo_ok = await mongodb_manager.connect()
    if mongo_ok:
        await create_indexes()
        log_service.add_log("INFO", "MongoDB connection established and indexes verified", "DATABASE")
    else:
        log_service.add_log("WARN", "MongoDB unavailable. Running in live demo mode without persistence.", "DATABASE")

    yield

    # Shutdown
    await adapter.disconnect()
    await mongodb_manager.disconnect()
    log_service.add_log("INFO", "Application shutting down cleanly", "SYSTEM")

app = FastAPI(title="RoboEdge AI Lab", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    log_service.add_log(
        "INFO", 
        f"{request.method} {request.url.path} completed in {process_time:.4f}s with status {response.status_code}",
        "API"
    )
    return response

# Existing APIs
app.include_router(system.router, prefix="/api/system", tags=["system"])
app.include_router(drone.router, prefix="/api/drone", tags=["drone"])
app.include_router(simulation.router, prefix="/api/simulation", tags=["simulation"])
app.include_router(ros2.router, prefix="/api/ros2", tags=["ros2"])
app.include_router(cv.router, prefix="/api/cv", tags=["cv"])
app.include_router(data.router, prefix="/api/data", tags=["data"])
app.include_router(edge.router, prefix="/api/edge", tags=["edge"])
app.include_router(logs.router, prefix="/api/logs", tags=["logs"])

# MongoDB Persistence APIs
app.include_router(database.router, prefix="/api/database", tags=["database"])
app.include_router(experiments.router, prefix="/api/experiments", tags=["experiments"])
app.include_router(simulation_runs.router, prefix="/api/simulation", tags=["simulation_runs"])
app.include_router(telemetry_history.router, prefix="/api/telemetry", tags=["telemetry_history"])
app.include_router(sensors_history.router, prefix="/api/sensors", tags=["sensors_history"])
app.include_router(events.router, prefix="/api/events", tags=["events"])

# WebSockets
app.include_router(telemetry.router, prefix="/ws")
app.include_router(ros2_ws.router, prefix="/ws")
app.include_router(logs_ws.router, prefix="/ws")

