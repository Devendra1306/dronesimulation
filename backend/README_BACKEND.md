# RoboEdge AI Lab Backend

This is the FastAPI backend for the RoboEdge AI Lab R&D platform.

## Architecture
React → FastAPI → Adapter Layer → ROS2/Gazebo (future)

## Setup
1. `pip install -r requirements.txt`
2. Configure `.env`
3. Run `uvicorn app.main:app --reload`
