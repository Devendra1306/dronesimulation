from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import app.main as m

router = APIRouter()

@router.websocket("/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await m.adapter.get_telemetry()
            await websocket.send_json(data.model_dump())
            await asyncio.sleep(0.1) # 10Hz
    except WebSocketDisconnect:
        pass
