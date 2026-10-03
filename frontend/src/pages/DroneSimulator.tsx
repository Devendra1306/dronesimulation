import { useState, useEffect } from 'react';
import Panel from '../components/common/Panel';
import DroneControls from '../components/drone/DroneControls';
import PrimaryFlightDisplay from '../components/drone/PrimaryFlightDisplay';
import { useAppStore } from '../store/appStore';
import { getSimulationStatus, startSimulation, pauseSimulation, resetSimulation } from '../services/api';
import { Play, Pause, RotateCcw } from 'lucide-react';

export default function DroneSimulator() {
  const { state } = useAppStore();
  const [simState, setSimState] = useState<{
    running: boolean;
    sim_time: number;
    physics_fps: number;
    world_name: string;
    drone_model: string;
    source: string;
  }>({
    running: true,
    sim_time: 142.6,
    physics_fps: 60.0,
    world_name: 'UAS_Outdoor_Airfield.world',
    drone_model: 'X500_Quadrotor_PX4',
    source: 'DEMO_SIMULATION',
  });

  const [isLoading, setIsLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await getSimulationStatus();
      if (res.data) {
        setSimState(prev => ({
          ...prev,
          running: res.data.running ?? prev.running,
          sim_time: res.data.sim_time ?? prev.sim_time,
          physics_fps: res.data.physics_fps ?? 60.0,
          world_name: res.data.world_name ?? prev.world_name,
          drone_model: res.data.drone_model ?? prev.drone_model,
          source: res.data.source ?? 'DEMO_SIMULATION',
        }));
      }
    } catch {
      // Keep state in demo mode
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    setIsLoading(true);
    await startSimulation().catch(() => {});
    setSimState(s => ({ ...s, running: true }));
    setIsLoading(false);
  };

  const handlePause = async () => {
    setIsLoading(true);
    await pauseSimulation().catch(() => {});
    setSimState(s => ({ ...s, running: false }));
    setIsLoading(false);
  };

  const handleReset = async () => {
    setIsLoading(true);
    await resetSimulation().catch(() => {});
    setSimState(s => ({ ...s, sim_time: 0.0 }));
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      {/* Page Title & Simulator Controls */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-text-primary font-mono tracking-tight">Drone Simulator SITL Workspace</h2>
          {simState.source.includes('GAZEBO') ? (
            <span className="badge-active text-[10px] font-mono">GAZEBO PHYSICS ACTIVE</span>
          ) : (
            <span className="badge-demo text-[10px] font-mono">DEMO SITL PHYSICS</span>
          )}
          <span className="text-xs text-text-muted font-mono">{simState.drone_model} · {simState.world_name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleStart}
            disabled={simState.running || isLoading}
            className={`btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 ${
              simState.running ? 'opacity-50 cursor-not-allowed' : 'text-status-green hover:border-status-green'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            Start SITL
          </button>
          <button
            onClick={handlePause}
            disabled={!simState.running || isLoading}
            className={`btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 ${
              !simState.running ? 'opacity-50 cursor-not-allowed' : 'text-status-amber hover:border-status-amber'
            }`}
          >
            <Pause className="w-3.5 h-3.5" />
            Pause
          </button>
          <button
            onClick={handleReset}
            disabled={isLoading}
            className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 hover:text-text-primary"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset World
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Main Simulation Viewport (Camera/Synthetic sensor stream) */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <Panel title="SYNTHETIC UAV ON-BOARD CAMERA FEED" className="flex-1 flex flex-col min-h-0 relative">
            <div className="flex-1 bg-surface-1 rounded-lg border border-border-subtle overflow-hidden relative flex items-center justify-center">
              {/* Synthetic HUD overlay */}
              <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between font-mono text-2xs z-10">
                <div className="flex justify-between items-start text-accent">
                  <div className="bg-surface-0/80 px-2.5 py-1.5 rounded border border-border-subtle backdrop-blur-sm">
                    <div>CAM: FPV_OPTICAL_GIMBAL</div>
                    <div>FPS: {simState.running ? '59.8' : '0.0'} | RES: 1280x720</div>
                    <div>FORMAT: RAW_BGR8</div>
                  </div>
                  <div className="bg-surface-0/80 px-2.5 py-1.5 rounded border border-border-subtle text-right backdrop-blur-sm">
                    <div>LATENCY: 14.2 ms</div>
                    <div>SIM TIME: {simState.sim_time.toFixed(1)}s</div>
                    <div className="text-status-green">STREAM: /camera/image_raw</div>
                  </div>
                </div>

                {/* Center Reticle */}
                <div className="self-center flex flex-col items-center opacity-60">
                  <div className="w-16 h-16 border border-accent/40 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                  </div>
                  <div className="text-accent text-3xs mt-1">CROSSHAIR LOCKED</div>
                </div>

                <div className="flex justify-between items-end text-text-muted">
                  <div className="bg-surface-0/80 px-2.5 py-1.5 rounded border border-border-subtle">
                    <span>MODE: PX4_OFFBOARD</span>
                  </div>
                  <div className="bg-surface-0/80 px-2.5 py-1.5 rounded border border-border-subtle text-status-amber">
                    <span>[DEMO SYNTHETIC CAMERA ACTIVE]</span>
                  </div>
                </div>
              </div>

              {/* Real-time Primary Flight Display / Synthetic Camera Feed */}
              <div className="w-full h-full relative">
                <PrimaryFlightDisplay telemetry={state.telemetry} isRunning={simState.running} />
              </div>
            </div>
          </Panel>

          {/* Physics Engine Diagnostics */}
          <div className="h-28 shrink-0 grid grid-cols-4 gap-4">
            <div className="bg-surface-2 border border-border-subtle rounded-xl p-3.5">
              <div className="telemetry-label text-2xs mb-1">ENGINE STATUS</div>
              <div className="flex items-center gap-2">
                <div className={`status-dot ${simState.running ? 'bg-status-green' : 'bg-status-amber'}`} />
                <span className="font-mono text-sm font-bold text-text-primary">
                  {simState.running ? 'RUNNING (SITL)' : 'PAUSED'}
                </span>
              </div>
            </div>

            <div className="bg-surface-2 border border-border-subtle rounded-xl p-3.5">
              <div className="telemetry-label text-2xs mb-1">ACTIVE WORLD</div>
              <div className="font-mono text-xs font-semibold text-accent truncate" title={simState.world_name}>
                {simState.world_name}
              </div>
            </div>

            <div className="bg-surface-2 border border-border-subtle rounded-xl p-3.5">
              <div className="telemetry-label text-2xs mb-1">AIRFRAME MODEL</div>
              <div className="font-mono text-xs font-semibold text-text-primary truncate" title={simState.drone_model}>
                {simState.drone_model}
              </div>
            </div>

            <div className="bg-surface-2 border border-border-subtle rounded-xl p-3.5">
              <div className="telemetry-label text-2xs mb-1">PHYSICS UPDATE RATE</div>
              <div className="font-mono text-base font-bold text-status-green">
                {simState.physics_fps} Hz
              </div>
            </div>
          </div>
        </div>

        {/* Right Command & Flight Control Panel */}
        <div className="w-80 shrink-0 flex flex-col gap-4">
          <Panel title="DIRECT UAS CONTROL PAD" className="h-auto">
            <DroneControls />
          </Panel>

          <Panel title="SITL TELEMETRY ADAPTER LOG" className="flex-1 flex flex-col min-h-0 text-xs font-mono">
            <div className="space-y-2 text-text-muted overflow-y-auto pr-1">
              <div className="text-text-secondary">
                <span className="text-accent">[0.00]</span> Initialized DemoSimulationAdapter
              </div>
              <div className="text-text-secondary">
                <span className="text-accent">[0.12]</span> Loaded Airframe URDF parameters
              </div>
              <div className="text-text-secondary">
                <span className="text-accent">[0.25]</span> Virtual IMU (MPU-6000) bound to 100Hz
              </div>
              <div className="text-text-secondary">
                <span className="text-accent">[0.31]</span> Barometer (MS5611) active with drift
              </div>
              <div className="text-text-secondary">
                <span className="text-accent">[1.40]</span> Simulation bridge ready for Offboard commands
              </div>
              <div className="text-status-green">
                <span className="text-accent">[*]</span> Adapter Source: {simState.source}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
