import axios from 'axios';
import { 
  SystemStatus, TelemetryData, ROS2Node, ROS2Topic, 
  LogEntry, EdgeDevice 
} from '../types';

const api = axios.create({ baseURL: 'http://localhost:8000', timeout: 10000 });

export const getSystemStatus = () => api.get<SystemStatus>('/api/system/status');
export const getTelemetry = () => api.get<TelemetryData>('/api/drone/telemetry');
export const droneArm = () => api.post('/api/drone/arm');
export const droneDisarm = () => api.post('/api/drone/disarm');
export const droneTakeoff = () => api.post('/api/drone/takeoff');
export const droneLand = () => api.post('/api/drone/land');
export const droneHover = () => api.post('/api/drone/hover');
export const droneStop = () => api.post('/api/drone/stop');
export const droneMove = (direction: string, speed: number) => api.post('/api/drone/move', {direction, speed});
export const getROS2Nodes = () => api.get<ROS2Node[]>('/api/ros2/nodes');
export const getROS2Topics = () => api.get<ROS2Topic[]>('/api/ros2/topics');
export const getSimulationStatus = () => api.get('/api/simulation/status');
export const startSimulation = () => api.post('/api/simulation/start');
export const pauseSimulation = () => api.post('/api/simulation/pause');
export const resetSimulation = () => api.post('/api/simulation/reset');
export const processImage = (formData: FormData) => api.post('/api/cv/process', formData);
export const analyzeData = (formData: FormData) => api.post('/api/data/analyze', formData);
export const getEdgeDevices = () => api.get<EdgeDevice[]>('/api/edge/devices');
export const getLogs = () => api.get<LogEntry[]>('/api/logs');

export default api;
