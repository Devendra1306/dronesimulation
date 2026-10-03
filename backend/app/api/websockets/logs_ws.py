from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
from app.services.log_service import log_service

router = APIRouter()

@router.websocket("/logs")
async def websocket_logs(websocket: WebSocket):
    await websocket.accept()
    last_idx = len(log_service.logs)
    try:
        while True:
            curr_idx = len(log_service.logs)
            if curr_idx > last_idx:
                for i in range(last_idx, curr_idx):
                    await websocket.send_json(log_service.logs[i])
                last_idx = curr_idx
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        pass
