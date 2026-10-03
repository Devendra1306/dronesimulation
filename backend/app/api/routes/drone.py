from fastapi import APIRouter
from app.schemas.drone import CommandResponse
from pydantic import BaseModel
import app.main as m # hacky access to adapter

router = APIRouter()

@router.get("/telemetry")
async def get_telemetry():
    return await m.adapter.get_telemetry()

class MoveCommand(BaseModel):
    direction: str
    speed: float = 1.0

@router.post("/move")
async def move_drone(cmd: MoveCommand):
    success = await m.adapter.send_drone_command("MOVE", {"direction": cmd.direction, "speed": cmd.speed})
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
        return CommandResponse(
            success=success,
            message=f"Command {cmd} executed",
            state=cmd,
            source=m.adapter.adapter_name
        )
    return {"error": f"Invalid command: {command}"}
