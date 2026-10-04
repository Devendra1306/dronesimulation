// Configuration resolver for local development vs Vercel / Remote Robotics Host

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('roboedge_api_url');
    if (saved && saved.trim()) return saved.trim().replace(/\/+$/, '');
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://follow-gathering-annie-requests.trycloudflare.com';
  }
  return 'http://localhost:8000';
}

export function setApiBaseUrl(newUrl: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('roboedge_api_url', newUrl.trim().replace(/\/+$/, ''));
  }
}

export function getWsBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const savedWs = localStorage.getItem('roboedge_ws_url');
    if (savedWs && savedWs.trim()) return savedWs.trim().replace(/\/+$/, '');
  }
  const apiUrl = getApiBaseUrl();
  return apiUrl.startsWith('https://')
    ? apiUrl.replace('https://', 'wss://')
    : apiUrl.replace('http://', 'ws://');
}

export const API_BASE_URL: string = getApiBaseUrl();
export const WS_BASE_URL: string = getWsBaseUrl();

export const WS_TELEMETRY_URL = `${WS_BASE_URL}/ws/telemetry`;
export const WS_ROS2_URL = `${WS_BASE_URL}/ws/ros2`;
export const WS_LOGS_URL = `${WS_BASE_URL}/ws/logs`;

