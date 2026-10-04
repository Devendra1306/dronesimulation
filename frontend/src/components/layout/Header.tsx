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
      <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-slate-600'}`} />
      <span className={`text-[11px] font-mono tracking-wider ${connected ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
        {label}
      </span>
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
    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
      DEMO SIMULATION
    </span>
  ) : gazeboConnected ? (
    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
      GAZEBO ACTIVE
    </span>
  ) : ros2Connected ? (
    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
      ROS2 ACTIVE
    </span>
  ) : (
    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
      ROS2 STANDBY
    </span>
  );

  return (
    <header className="h-14 bg-[#111827] border-b border-slate-800/90 flex items-center justify-between px-6 shrink-0 select-none">
      {/* Left: App Identity + Simulation Mode */}
      <div className="flex items-center gap-4">
        <span className="text-white text-xs font-semibold tracking-wider font-mono">
          ROBOEDGE UAS LAB
        </span>
        <div className="h-4 w-px bg-slate-700/60" />
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium">MODE</span>
          {modeBadge}
        </div>
      </div>

      {/* Center/Right: Subsystem Status (TELEMETRY | ROS2 | GAZEBO | DATABASE) */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-4 bg-slate-900/80 px-3.5 py-1.5 rounded-lg border border-slate-800">
          <StatusPip
            connected={wsConnected}
            label="TELEMETRY"
            title={wsConnected ? "FastAPI WebSocket Stream: ACTIVE" : "FastAPI WebSocket Stream: OFFLINE"}
          />
          <div className="h-3 w-px bg-slate-700/50" />
          <StatusPip
            connected={ros2Connected}
            label="ROS2"
            title={ros2Connected ? "ROS2 Link: CONNECTED" : "ROS2 Link: DISCONNECTED"}
          />
          <div className="h-3 w-px bg-slate-700/50" />
          <StatusPip
            connected={gazeboConnected}
            label="GAZEBO"
            title={gazeboConnected ? "Gazebo Physics Stream: ACTIVE" : "Gazebo Physics Stream: DISCONNECTED"}
          />
          <div className="h-3 w-px bg-slate-700/50" />
          <div className="flex items-center gap-1.5" title={dbStatus?.message || (dbConnected ? "MongoDB Atlas Connected" : "MongoDB Offline")}>
            <span className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-slate-600'}`} />
            <span className={`text-[11px] font-mono tracking-wider ${dbConnected ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
              DATABASE
            </span>
          </div>
        </div>

        {/* Latency / Ping indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/40 border border-slate-700/40 text-xs">
          {wsConnected ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span className="font-mono text-slate-300 text-[11px]">
            {latency !== null ? `${latency}ms` : 'OFFLINE'}
          </span>
        </div>

        <div className="h-4 w-px bg-slate-700/60" />

        <Link
          to="/settings"
          className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-800"
          title="Platform Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
}
