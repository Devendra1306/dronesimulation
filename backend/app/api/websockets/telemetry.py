from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import app.main as m
from app.services.persistence_service import persistence_service

router = APIRouter()

@router.websocket("/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await m.adapter.get_telemetry()
            await websocket.send_json(data.model_dump())
            # Non-blocking throttled persistence to MongoDB
            await persistence_service.maybe_persist_telemetry(data)
            await asyncio.sleep(0.1) # 10Hz
    except WebSocketDisconnect:
        pass

