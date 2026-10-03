import { useEffect, useState } from 'react';
import { Settings, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSystemStatus, getDatabaseStatus } from '../../services/api';
import type { SystemStatus, DatabaseStatus } from '../../types';

interface StatusPipProps {
  connected: boolean;
  label: string;
}
function StatusPip({ connected, label }: StatusPipProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`status-dot ${connected ? 'bg-status-green' : 'bg-surface-5'}`} />
      <span className={`text-xs font-medium ${connected ? 'text-text-secondary' : 'text-text-muted'}`}>{label}</span>
    </div>
  );
}

export default function Header() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      const start = Date.now();
      try {
        const [res, dbRes] = await Promise.all([
          getSystemStatus(),
          getDatabaseStatus().catch(() => ({ data: { connected: false, database: '', provider: 'mongodb' } }))
        ]);
        setLatency(Date.now() - start);
        setStatus(res.data);
        setDbStatus(dbRes.data);
        setWsConnected(true);
      } catch {
        setWsConnected(false);
        setLatency(null);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const dbConnected = dbStatus?.connected ?? false;

  const isDemo = status?.is_demo ?? true;
  const ros2Connected = status?.ros2_connected ?? false;
  const gazeboConnected = status?.gazebo_connected ?? false;

  return (
    <header className="h-12 bg-surface-2 border-b border-border-subtle flex items-center justify-between px-5 shrink-0">
      {/* Left: app name + mode */}
      <div className="flex items-center gap-3">
        <span className="text-text-muted text-xs uppercase tracking-widest font-medium">RoboEdge AI Lab</span>
        <div className="h-4 w-px bg-border-subtle" />
        <span className="text-xs font-mono font-medium text-text-muted">
          ENV:
        </span>
        {isDemo ? (
          <span className="badge-demo">DEMO SIMULATION</span>
        ) : gazeboConnected ? (
          <span className="badge-active">GAZEBO</span>
        ) : (
          <span className="badge-active">ROS2</span>
        )}
      </div>

      {/* Right: status indicators */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-4">
          <StatusPip connected={wsConnected} label="SIM" />
          <StatusPip connected={ros2Connected} label="ROS2" />
          <StatusPip connected={gazeboConnected} label="GAZEBO" />
          <div className="flex items-center gap-1.5" title={dbStatus?.message || (dbConnected ? "MongoDB Atlas Connected" : "MongoDB Offline")}>
            <div className={`status-dot ${dbConnected ? 'bg-status-green' : 'bg-surface-5 border border-text-muted/40'}`} />
            <span className={`text-xs font-medium ${dbConnected ? 'text-text-secondary' : 'text-text-muted'}`}>
              MongoDB
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-border-subtle" />

        <div className="flex items-center gap-1.5 text-xs">
          {wsConnected ? (
            <Wifi className="w-3.5 h-3.5 text-text-muted" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-text-muted" />
          )}
          <span className="font-mono text-text-secondary">
            {latency !== null ? `${latency}ms` : '—'}
          </span>
        </div>

        <div className="h-4 w-px bg-border-subtle" />

        <Link to="/settings" className="text-text-muted hover:text-text-primary transition-colors">
          <Settings className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
}
