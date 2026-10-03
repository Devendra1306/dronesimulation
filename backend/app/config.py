from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", extra="ignore")
    
    app_name: str = "RoboEdge AI Lab"
    debug: bool = True
    simulation_mode: str = "demo"  # "demo" | "ros2" | "gazebo"
    demo_telemetry_rate: float = 10.0  # Hz
    database_url: str = "sqlite:///./roboedge.db"
    ros2_bridge_url: str = "ws://127.0.0.1:9090"
    gazebo_url: str = "http://127.0.0.1:8081"
    cv_model_path: str = "models/yolo.pt"
    secret_key: str = "change-this-in-production"
    
    # MongoDB configuration
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_database: str = "roboedge_ai_lab"
    telemetry_db_rate_hz: float = 1.0
    enable_telemetry_persistence: bool = True

settings = Settings()
