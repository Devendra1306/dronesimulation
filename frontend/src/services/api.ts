import axios from 'axios';
import { 
  SystemStatus, TelemetryData, ROS2Node, ROS2Topic, 
  LogEntry, EdgeDevice, DatabaseStatus, Experiment, 
  SimulationRun, HistoricalTelemetry 
} from '../types';

import { API_BASE_URL, getApiBaseUrl } from '../config/env';

const api = axios.create({ baseURL: API_BASE_URL, timeout: 10000 });

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  return config;
});

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
export const runEdgeBenchmark = () => api.post('/api/edge/benchmark');
export const getLogs = () => api.get<LogEntry[]>('/api/logs');

// MongoDB Database & Persistence Endpoints
export const getDatabaseStatus = () => api.get<DatabaseStatus>('/api/database/status');

export const getExperiments = (params?: { status?: string; search?: string }) => 
  api.get<Experiment[]>('/api/experiments', { params });

export const createExperiment = (data: Partial<Experiment>) => 
  api.post<Experiment>('/api/experiments', data);

export const getExperimentById = (id: string) => 
  api.get<Experiment>(`/api/experiments/${id}`);

export const deleteExperiment = (id: string) => 
  api.delete(`/api/experiments/${id}`);

export const getSimulationRuns = (params?: { experiment_id?: string }) => 
  api.get<SimulationRun[]>('/api/simulation/runs', { params });

export const getTelemetryHistory = (params?: { experiment_id?: string; run_id?: string; limit?: number }) => 
  api.get<HistoricalTelemetry[]>('/api/telemetry/history', { params });

export const getTelemetrySummary = (params?: { experiment_id?: string; run_id?: string }) => 
  api.get<Record<string, any>>('/api/telemetry/summary', { params });

export const getSensorHistory = (params?: { sensor_type?: string; limit?: number }) => 
  api.get<any[]>('/api/sensors/history', { params });

export const getCVResults = (params?: { experiment_id?: string; limit?: number }) => 
  api.get<any[]>('/api/cv/results', { params });

export const getSystemEvents = (params?: { severity?: string; limit?: number }) => 
  api.get<any[]>('/api/events', { params });

export default api;
