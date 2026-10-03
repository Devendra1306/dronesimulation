from fastapi import APIRouter
import app.main as m

router = APIRouter()

@router.get("/status")
async def get_status():
    return await m.adapter.get_simulation_status()

@router.post("/{action}")
async def sim_action(action: str):
    if action == "start":
        await m.adapter.start_simulation()
    elif action == "pause":
        await m.adapter.pause_simulation()
    elif action == "reset":
        await m.adapter.reset_simulation()
    elif action == "step":
        await m.adapter.step_simulation()
    return {"status": "success", "action": action}
