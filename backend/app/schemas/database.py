from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

# ----------------- Experiments -----------------
class ExperimentCreate(BaseModel):
    experiment_id: Optional[str] = None
    name: str
    description: str = ""
    simulation_environment: str = "urban_demo"
    drone_model: str = "quadrotor_x500"
    cv_algorithm: str = "opencv_canny"
    status: str = "DRAFT"  # DRAFT | RUNNING | COMPLETED | FAILED | CANCELLED
    configuration: Dict[str, Any] = Field(default_factory=dict)

class ExperimentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    simulation_environment: Optional[str] = None
    drone_model: Optional[str] = None
    cv_algorithm: Optional[str] = None
    status: Optional[str] = None
    ended_at: Optional[datetime] = None

class ExperimentDB(BaseModel):
    experiment_id: str
    name: str
    description: str
    simulation_environment: str
    drone_model: str
    cv_algorithm: str
    status: str
    configuration: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

# ----------------- Simulation Runs -----------------
class SimulationRunCreate(BaseModel):
    run_id: Optional[str] = None
    experiment_id: Optional[str] = None
    simulation_mode: str = "DEMO_SIMULATION"  # DEMO_SIMULATION | ROS2 | GAZEBO
    environment: str = "urban_demo"
    drone_model: str = "quadrotor_x500"
    status: str = "RUNNING"
    configuration: Dict[str, Any] = Field(default_factory=dict)
    summary: Dict[str, Any] = Field(default_factory=dict)

class SimulationRunDB(BaseModel):
    run_id: str
    experiment_id: Optional[str] = None
    simulation_mode: str
    environment: str
    drone_model: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration: Optional[float] = None
    status: str
    configuration: Dict[str, Any] = Field(default_factory=dict)
    summary: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

# ----------------- Telemetry History -----------------
class TelemetryRecord(BaseModel):
    experiment_id: Optional[str] = None
    run_id: Optional[str] = None
    timestamp: float
    altitude: float
    velocity: float
    latitude: float
    longitude: float
    heading: float
    pitch: float
    roll: float
    yaw: float
    battery: float
    signal: float
    flight_state: str
    source: str = "DEMO_SIMULATION"

# ----------------- Sensor Data -----------------
class SensorDataRecord(BaseModel):
    experiment_id: Optional[str] = None
    run_id: Optional[str] = None
    sensor_type: str  # IMU | GPS | ALTITUDE | VELOCITY | BATTERY | DISTANCE
    timestamp: float
    data: Dict[str, Any]
    source: str = "DEMO_SIMULATION"

# ----------------- CV Results -----------------
class DetectionItem(BaseModel):
    label: str
    confidence: float
    bounding_box: Dict[str, Any] = Field(default_factory=dict)

class CVResultRecord(BaseModel):
    experiment_id: Optional[str] = None
    run_id: Optional[str] = None
    timestamp: float
    algorithm: str
    input_type: str = "camera_frame"
    detection_count: int = 0
    detections: List[Dict[str, Any]] = Field(default_factory=list)
    processing_time_ms: float = 0.0
    confidence: Optional[float] = None
    source: str = "OPENCV"

# ----------------- Experiment Results -----------------
class ExperimentResultRecord(BaseModel):
    experiment_id: str
    run_id: Optional[str] = None
    duration: float = 0.0
    average_altitude: float = 0.0
    maximum_altitude: float = 0.0
    average_velocity: float = 0.0
    maximum_velocity: float = 0.0
    battery_consumed: float = 0.0
    detection_count: int = 0
    average_cv_latency: float = 0.0
    success_rate: float = 100.0
    metrics: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ----------------- System Events -----------------
class SystemEventRecord(BaseModel):
    timestamp: float
    severity: str  # INFO | WARNING | ERROR | CRITICAL
    source: str
    event_type: str
    message: str
    experiment_id: Optional[str] = None
    run_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
