export interface TelemetryData {
  timestamp: number;
  altitude: number;
  velocity: number;
  heading: number;
  pitch: number;
  roll: number;
  yaw: number;
  latitude: number;
  longitude: number;
  battery: number;
  signal_strength: number;
  simulation_time: number;
  mode: 'IDLE' | 'ARMED' | 'TAKING_OFF' | 'HOVERING' | 'MOVING' | 'LANDING';
  is_armed: boolean;
  is_airborne: boolean;
  source: string;
}

export interface SystemStatus {
  status: string;
  mode: 'demo' | 'ros2' | 'gazebo';
  adapter: string;
  is_demo: boolean;
  ros2_connected: boolean;
  gazebo_connected: boolean;
  simulation_running: boolean;
  uptime: number;
  version: string;
}

export interface ROS2Node {
  name: string;
  namespace: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  published_topics: string[];
  subscribed_topics: string[];
  source: string;
}

export interface ROS2Topic {
  name: string;
  type: string;
  publisher: string;
  subscribers: string[];
  rate: number;
  status: 'ACTIVE' | 'INACTIVE';
  last_received: number;
  source: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  source: string;
}

export interface EdgeDevice {
  name: string;
  inference_time_ms: number;
  fps: number;
  memory_mb: number;
  model: string;
  power_watts: number;
  source: string;
}

export interface Experiment {
  experiment_id: string;
  name: string;
  description: string;
  simulation_environment: string;
  drone_model: string;
  cv_algorithm: string;
  status: string;
  configuration?: Record<string, any>;
  created_at: string;
  started_at?: string;
  ended_at?: string;
  results?: Record<string, any>;
}

export interface DatabaseStatus {
  connected: boolean;
  database: string;
  provider: string;
  message?: string;
  error?: string;
}

export interface SimulationRun {
  run_id: string;
  experiment_id?: string;
  simulation_mode: string;
  environment: string;
  drone_model: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  status: string;
  configuration?: Record<string, any>;
  summary?: Record<string, any>;
}

export interface HistoricalTelemetry {
  experiment_id?: string;
  run_id?: string;
  timestamp: number;
  altitude: number;
  velocity: number;
  latitude: number;
  longitude: number;
  heading: number;
  pitch: number;
  roll: number;
  yaw: number;
  battery: number;
  signal: number;
  flight_state: string;
  source: string;
}

