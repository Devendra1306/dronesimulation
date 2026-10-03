from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", extra="ignore")
    
    app_name: str = "RoboEdge AI Lab"
    debug: bool = True
    simulation_mode: str = "demo"  # "demo" | "ros2" | "gazebo"
    demo_telemetry_rate: float = 10.0  # Hz
    database_url: str = "sqlite:///./roboedge.db"
    ros2_bridge_url: str = "ws://localhost:9090"
    gazebo_url: str = "http://localhost:8081"
    cv_model_path: str = "models/yolo.pt"
    secret_key: str = "change-this-in-production"

settings = Settings()
