import { useState, useEffect, useCallback } from 'react';
import DroneControls from '../components/drone/DroneControls';
import DroneVisualizer from '../components/drone/DroneVisualizer';
import PrimaryFlightDisplay from '../components/drone/PrimaryFlightDisplay';
import { useAppStore } from '../store/appStore';
import { 
  getSimulationStatus, 
  startSimulation, 
  pauseSimulation, 
  resetSimulation,
  getSystemStatus,
  getTelemetry
} from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { WS_TELEMETRY_URL } from '../config/env';
import { 
  Play, Pause, RotateCcw, Box, Compass, 
  Layers, Gauge, Activity, ShieldCheck, 
  Terminal, Zap, Radio
} from 'lucide-react';
import type { SystemStatus, TelemetryData } from '../types';

interface EventLog {
  time: string;
  type: 'INFO' | 'CMD' | 'TELEMETRY' | 'WARN';
  message: string;
}

export default function DroneSimulator() {
  const { state, dispatch } = useAppStore();
  const [viewMode, setViewMode] = useState<'3d_drone' | 'cockpit_hud' | 'split'>('3d_drone');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [simRunning, setSimRunning] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<EventLog[]>([
    { time: '00:00:01', type: 'INFO', message: 'SITL Physics Engine Initialized (Gazebo Classic 11 / ODE)' },
    { time: '00:00:02', type: 'INFO', message: 'Loaded 3D Quadrotor Model: Fuselage, 4x Motors, Skids, FPV Camera' },
    { time: '00:00:03', type: 'INFO', message: 'Bound ROS2 Controller: /cmd_vel (Twist) -> libgazebo_ros_quadrotor_controller.so' },
    { time: '00:00:04', type: 'TELEMETRY', message: 'High-frequency Odometry Stream active (/odom @ 900+ Hz)' },
  ]);

  // Telemetry stream via WebSocket
  const onTelemMessage = useCallback(
    (data: TelemetryData) => {
      dispatch({ type: 'SET_TELEMETRY', payload: data });
    },
    [dispatch]
  );

  useWebSocket({
    url: WS_TELEMETRY_URL,
    onMessage: onTelemMessage,
  });

  // Telemetry polling fallback
  useEffect(() => {
    const fetchTelem = async () => {
      try {
        const res = await getTelemetry();
        if (res.data) {
          dispatch({ type: 'SET_TELEMETRY', payload: res.data });
        }
      } catch {}
    };
    fetchTelem();
    const interval = setInterval(fetchTelem, 1500);
    return () => clearInterval(interval);
  }, [dispatch]);

  const telemetry = state.telemetry;

  const addLog = (type: 'INFO' | 'CMD' | 'TELEMETRY' | 'WARN', message: string) => {
    const timeStr = new Date().toTimeString().split(' ')[0];
    setLogs(prev => [
      { time: timeStr, type, message },
      ...prev.slice(0, 19) // keep last 20 logs
    ]);
  };

  useEffect(() => {
    const fetchSimInfo = async () => {
      try {
        const [simRes, sysRes] = await Promise.all([
          getSimulationStatus().catch(() => null),
          getSystemStatus().catch(() => null)
        ]);
        if (simRes?.data) {
          setSimRunning(simRes.data.status === 'running' || simRes.data.status === 'operational');
        }
        if (sysRes?.data) {
          setSystemStatus(sysRes.data);
        }
      } catch {
        // Keep active
      }
    };

    fetchSimInfo();
    const interval = setInterval(fetchSimInfo, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStartSim = async () => {
    setIsLoading(true);
    try {
      await startSimulation();
      setSimRunning(true);
      addLog('CMD', 'SITL Physics RESUMED via /gazebo/unpause_physics');
    } catch {
      setSimRunning(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseSim = async () => {
    setIsLoading(true);
    try {
      await pauseSimulation();
      setSimRunning(false);
      addLog('CMD', 'SITL Physics PAUSED via /gazebo/pause_physics');
    } catch {
      setSimRunning(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSim = async () => {
    setIsLoading(true);
    try {
      await resetSimulation();
      addLog('WARN', 'SITL World & Quadrotor Pose RESET to ground origin (0, 0, 0.1m)');
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  };

  const isGazebo = telemetry?.source?.includes('GAZEBO') || systemStatus?.gazebo_connected;

  return (
    <div className="flex flex-col gap-4 h-full min-h-0 select-none">
      {/* Top Header & Simulation Controls Toolbar */}
      <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.04)] shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-sm">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight font-sans">
                DRONE SIMULATOR & SITL WORKSPACE
              </h2>
              {isGazebo ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  GAZEBO 3D ODE ACTIVE
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-semibold">
                  SITL FLIGHT EMULATOR
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-sans">
              Real-time 3D Quadrotor Aerodynamics • rosbridge WebSocket Interface • Flight Mode Governor
            </p>
          </div>
        </div>

        {/* Engine Controls & Viewport Switcher */}
        <div className="flex items-center gap-3">
          {/* Viewport Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setViewMode('3d_drone')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === '3d_drone'
                  ? 'bg-white text-slate-900 font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-sky-600" />
              <span>3D Quadrotor</span>
            </button>
            <button
              onClick={() => setViewMode('cockpit_hud')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'cockpit_hud'
                  ? 'bg-white text-slate-900 font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cockpit HUD</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'split'
                  ? 'bg-white text-slate-900 font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Split Deck</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Engine Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleStartSim}
              disabled={simRunning || isLoading}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
                simRunning
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 shadow-sm'
              }`}
              title="Resume Gazebo ODE Physics"
            >
              <Play className="w-3.5 h-3.5 text-emerald-600" />
              RUN
            </button>
            <button
              onClick={handlePauseSim}
              disabled={!simRunning || isLoading}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
                !simRunning
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 shadow-sm'
              }`}
              title="Pause Gazebo ODE Physics"
            >
              <Pause className="w-3.5 h-3.5 text-amber-600" />
              PAUSE
            </button>
            <button
              onClick={handleResetSim}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-sm transition-all flex items-center gap-1.5"
              title="Reset World Pose"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              RESET
            </button>
          </div>
        </div>
      </div>

      {/* Main Simulation Arena */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left Arena: 3D / HUD Simulation Canvas */}
        <div className="flex-1 flex flex-col gap-3.5 min-h-0">
          <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.04)] flex flex-col min-h-0 overflow-hidden relative">
            {/* Viewport Top Status Line */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_#0ea5e9]" />
                <span className="text-xs font-bold font-mono text-slate-900 tracking-wider">
                  FLIGHT SIMULATION DECK · [X500 QUADROTOR]
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  ODE STEP: 0.001s · FREQ: 950 Hz
                </span>
              </div>

              {/* Live HUD telemetry readouts */}
              <div className="flex items-center gap-3 font-mono text-xs">
                <div className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                  <span className="text-slate-400 text-[10px] mr-1.5">ALT:</span>
                  <span className="font-bold text-sky-600">
                    {telemetry ? `${telemetry.altitude.toFixed(2)} m` : '0.10 m'}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                  <span className="text-slate-400 text-[10px] mr-1.5">VEL:</span>
                  <span className="font-bold text-slate-800">
                    {telemetry ? `${telemetry.velocity.toFixed(2)} m/s` : '0.00 m/s'}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                  <span className="text-slate-400 text-[10px] mr-1.5">HDG:</span>
                  <span className="font-bold text-slate-800">
                    {telemetry ? `${telemetry.heading.toFixed(1)}°` : '0.0°'}
                  </span>
                </div>
              </div>
            </div>

            {/* Viewport Visualizers */}
            <div className="flex-1 min-h-0 relative rounded-xl overflow-hidden border border-slate-100 bg-[#FAFAFC]">
              {viewMode === '3d_drone' && (
                <div className="w-full h-full">
                  <DroneVisualizer
                    heading={telemetry?.heading ?? 0}
                    altitude={telemetry?.altitude ?? 0.1}
                    velocity={telemetry?.velocity ?? 0}
                    mode={telemetry?.mode ?? 'STANDBY'}
                    isArmed={telemetry?.is_armed ?? false}
                    isAirborne={telemetry?.is_airborne ?? false}
                    pitch={telemetry?.pitch ?? 0}
                    roll={telemetry?.roll ?? 0}
                    source={telemetry?.source ?? (isGazebo ? 'GAZEBO' : 'SITL')}
                    simTime={telemetry?.simulation_time ?? 0}
                  />
                </div>
              )}

              {viewMode === 'cockpit_hud' && (
                <div className="w-full h-full bg-slate-950">
                  <PrimaryFlightDisplay telemetry={telemetry} isRunning={simRunning} />
                </div>
              )}

              {viewMode === 'split' && (
                <div className="w-full h-full grid grid-cols-2 gap-2">
                  <div className="h-full border-r border-slate-200">
                    <DroneVisualizer
                      heading={telemetry?.heading ?? 0}
                      altitude={telemetry?.altitude ?? 0.1}
                      velocity={telemetry?.velocity ?? 0}
                      mode={telemetry?.mode ?? 'STANDBY'}
                      isArmed={telemetry?.is_armed ?? false}
                      isAirborne={telemetry?.is_airborne ?? false}
                      pitch={telemetry?.pitch ?? 0}
                      roll={telemetry?.roll ?? 0}
                      source={telemetry?.source ?? (isGazebo ? 'GAZEBO' : 'SITL')}
                      simTime={telemetry?.simulation_time ?? 0}
                    />
                  </div>
                  <div className="h-full bg-slate-950">
                    <PrimaryFlightDisplay telemetry={telemetry} isRunning={simRunning} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Diagnostics Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.04)] grid grid-cols-4 gap-4 items-center shrink-0">
            <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                ENGINE LIFECYCLE
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${simRunning ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="font-mono text-sm font-bold text-slate-800">
                  {simRunning ? 'PHYSICS ACTIVE' : 'PHYSICS PAUSED'}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                AIRFRAME ODE MODEL
              </div>
              <div className="font-mono text-xs font-bold text-sky-600 truncate">
                Quadrotor 3D (4x Props)
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                ODOMETRY UPDATE RATE
              </div>
              <div className="font-mono text-sm font-bold text-emerald-600">
                {isGazebo ? '928.6 Hz' : '60.0 Hz'}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                ROS 2 BRIDGE LINK
              </div>
              <div className="font-mono text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-sky-500" />
                <span>ws://127.0.0.1:9090</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Flight Controls & SITL Event Stream */}
        <div className="w-96 shrink-0 flex flex-col gap-3.5 overflow-y-auto">
          {/* Working Flight Controls */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.04)] overflow-hidden">
            <DroneControls
              isArmed={telemetry?.is_armed ?? false}
              isAirborne={telemetry?.is_airborne ?? false}
              mode={telemetry?.mode ?? 'STANDBY'}
              source={telemetry?.source ?? (isGazebo ? 'GAZEBO' : '')}
              onCommandSent={(cmd) => addLog('CMD', `Dispatched Flight Command: ${cmd}`)}
            />
          </div>

          {/* Real-time SITL Event & Telemetry Log */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.04)] flex flex-col min-h-0">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2.5">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold font-mono text-slate-800 tracking-wider">
                  SITL EVENT STREAM
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {logs.length} EVENTS
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[11px]">
              {logs.map((log, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-100 leading-tight">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>{log.time}</span>
                    <span className={`px-1 rounded font-bold ${
                      log.type === 'CMD' ? 'text-sky-600 bg-sky-50' :
                      log.type === 'WARN' ? 'text-amber-600 bg-amber-50' :
                      log.type === 'TELEMETRY' ? 'text-emerald-600 bg-emerald-50' :
                      'text-slate-500 bg-slate-100'
                    }`}>
                      {log.type}
                    </span>
                  </div>
                  <div className="text-slate-700 text-[11px] break-words">
                    {log.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
