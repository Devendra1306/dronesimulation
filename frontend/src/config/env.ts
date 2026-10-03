// Configuration resolver for local development vs Vercel / Remote Robotics Host

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const WS_BASE_URL: string =
  import.meta.env.VITE_WS_BASE_URL ||
  (API_BASE_URL.startsWith('https://')
    ? API_BASE_URL.replace('https://', 'wss://')
    : API_BASE_URL.replace('http://', 'ws://'));

export const WS_TELEMETRY_URL = `${WS_BASE_URL}/ws/telemetry`;
export const WS_ROS2_URL = `${WS_BASE_URL}/ws/ros2`;
export const WS_LOGS_URL = `${WS_BASE_URL}/ws/logs`;
