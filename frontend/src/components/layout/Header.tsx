import { useEffect, useState } from 'react';
import { Settings, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSystemStatus, getDatabaseStatus } from '../../services/api';
import type { SystemStatus, DatabaseStatus } from '../../types';

interface StatusPipProps {
  connected: boolean;
  label: string;
  title?: string;
}
function StatusPip({ connected, label, title }: StatusPipProps) {
  return (
    <div className="flex items-center gap-1.5" title={title || `${label}: ${connected ? 'CONNECTED' : 'DISCONNECTED'}`}>
      <div className={`status-dot ${connected ? 'bg-status-green ring-2 ring-status-green/20' : 'bg-surface-5 border border-text-muted/30'}`} />
      <span className={`text-[11px] font-mono tracking-wider ${connected ? 'text-text-primary' : 'text-text-muted'}`}>{label}</span>
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
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const dbConnected = dbStatus?.connected ?? false;
  const isDemo = status?.is_demo ?? true;
  const ros2Connected = status?.ros2_connected ?? false;
  const gazeboConnected = status?.gazebo_connected ?? false;

  const modeBadge = isDemo ? (
    <span className="badge-demo text-[10px] font-mono">DEMO SIMULATION</span>
  ) : gazeboConnected ? (
    <span className="badge-active text-[10px] font-mono">GAZEBO ACTIVE</span>
  ) : ros2Connected ? (
    <span className="badge-active text-[10px] font-mono">ROS2 ACTIVE</span>
  ) : (
    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-4 text-text-muted border border-border">ROS2 STANDBY</span>
  );

  return (
    <header className="h-12 bg-surface-2 border-b border-border-subtle flex items-center justify-between px-5 shrink-0 select-none">
      {/* Left: App Identity + Simulation Mode */}
      <div className="flex items-center gap-3">
        <span className="text-text-secondary text-xs uppercase tracking-widest font-mono font-semibold">
          ROBOEDGE UAS LAB
        </span>
        <div className="h-4 w-px bg-border-subtle" />
        <span className="text-[11px] font-mono text-text-muted">MODE:</span>
        {modeBadge}
      </div>

      {/* Center/Right: GCS Subsystem Status (MODE | ROS2 | GAZEBO | TELEMETRY | DATABASE) */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-4 bg-surface-1/60 px-3 py-1 rounded-md border border-border-subtle">
          <StatusPip
            connected={wsConnected}
            label="TELEMETRY"
            title={wsConnected ? "FastAPI WebSocket Stream: ACTIVE" : "FastAPI WebSocket Stream: OFFLINE"}
          />
          <div className="h-3 w-px bg-border-subtle" />
          <StatusPip
            connected={ros2Connected}
            label="ROS2"
            title={ros2Connected ? "ROS2 Link: CONNECTED (ws://localhost:9090)" : "ROS2 Link: DISCONNECTED (Waiting for rosbridge_server)"}
          />
          <div className="h-3 w-px bg-border-subtle" />
          <StatusPip
            connected={gazeboConnected}
            label="GAZEBO"
            title={gazeboConnected ? "Gazebo Physics Stream: ACTIVE" : "Gazebo Physics Stream: DISCONNECTED (Start Gazebo simulation world)"}
          />
          <div className="h-3 w-px bg-border-subtle" />
          <div className="flex items-center gap-1.5" title={dbStatus?.message || (dbConnected ? "MongoDB Atlas Connected" : "MongoDB Offline")}>
            <div className={`status-dot ${dbConnected ? 'bg-status-green ring-2 ring-status-green/20' : 'bg-surface-5'}`} />
            <span className={`text-[11px] font-mono tracking-wider ${dbConnected ? 'text-text-primary' : 'text-text-muted'}`}>
              DATABASE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {wsConnected ? (
            <Wifi className="w-3.5 h-3.5 text-status-green" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-status-red" />
          )}
          <span className="font-mono text-text-secondary text-[11px]">
            {latency !== null ? `${latency}ms` : 'OFFLINE'}
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
