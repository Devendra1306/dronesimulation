from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio

router = APIRouter()

@router.websocket("/ros2")
async def websocket_ros2(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.send_json({"type": "ping", "source": "DEMO_SIMULATION"})
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        pass
