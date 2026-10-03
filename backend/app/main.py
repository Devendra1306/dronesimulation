from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import time
from app.services.log_service import log_service

from app.adapters.demo_adapter import DemoSimulationAdapter
from app.api.routes import system, drone, simulation, ros2, cv, data, edge, logs
from app.api.websockets import telemetry, ros2_ws, logs_ws

adapter = DemoSimulationAdapter()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await adapter.connect()
    log_service.add_log("INFO", "Application started, Demo adapter connected", "SYSTEM")
    yield
    await adapter.disconnect()
    log_service.add_log("INFO", "Application shutting down", "SYSTEM")

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

app.include_router(system.router, prefix="/api/system", tags=["system"])
app.include_router(drone.router, prefix="/api/drone", tags=["drone"])
app.include_router(simulation.router, prefix="/api/simulation", tags=["simulation"])
app.include_router(ros2.router, prefix="/api/ros2", tags=["ros2"])
app.include_router(cv.router, prefix="/api/cv", tags=["cv"])
app.include_router(data.router, prefix="/api/data", tags=["data"])
app.include_router(edge.router, prefix="/api/edge", tags=["edge"])
app.include_router(logs.router, prefix="/api/logs", tags=["logs"])

app.include_router(telemetry.router, prefix="/ws")
app.include_router(ros2_ws.router, prefix="/ws")
app.include_router(logs_ws.router, prefix="/ws")
