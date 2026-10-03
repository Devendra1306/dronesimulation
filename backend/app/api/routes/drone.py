from fastapi import APIRouter
from app.schemas.drone import CommandResponse
from pydantic import BaseModel
import app.main as m
from app.services.log_service import log_service

router = APIRouter()

@router.get("/telemetry")
async def get_telemetry():
    return await m.adapter.get_telemetry()

class MoveCommand(BaseModel):
    direction: str
    speed: float = 1.0

from app.services.persistence_service import persistence_service

@router.post("/move")
async def move_drone(cmd: MoveCommand):
    success = await m.adapter.send_drone_command("MOVE", {"direction": cmd.direction, "speed": cmd.speed})
    log_service.add_log("INFO", f"Flight Maneuver: Vector {cmd.direction.upper()} at {cmd.speed} m/s", "FLIGHT_CONTROLLER")
    await persistence_service.log_event(
        event_type="DRONE_MOVE",
        message=f"Direction: {cmd.direction.upper()}, Speed: {cmd.speed} m/s",
        severity="INFO",
        source="FLIGHT_CONTROLLER",
        metadata={"direction": cmd.direction, "speed": cmd.speed}
    )
    return CommandResponse(
        success=success,
        message=f"Moving {cmd.direction} at {cmd.speed}",
        state="MOVING",
        source=m.adapter.adapter_name
    )

@router.post("/{command}")
async def command_drone(command: str):
    cmd = command.upper()
    valid_cmds = ["ARM", "DISARM", "TAKEOFF", "LAND", "HOVER", "STOP"]
    if cmd in valid_cmds:
        success = await m.adapter.send_drone_command(cmd, {})
        level = "WARN" if cmd == "STOP" else "INFO"
        log_service.add_log(level, f"Flight Command Dispatched: {cmd}", "FLIGHT_CONTROLLER")
        await persistence_service.log_event(
            event_type=f"DRONE_{cmd}",
            message=f"Command {cmd} executed via Mission Control",
            severity="WARNING" if cmd == "STOP" else "INFO",
            source="MISSION_CONTROL",
            metadata={"command": cmd, "state": cmd}
        )
        return CommandResponse(
            success=success,
            message=f"Command {cmd} executed",
            state=cmd,
            source=m.adapter.adapter_name
        )
    return {"error": f"Invalid command: {command}"}
