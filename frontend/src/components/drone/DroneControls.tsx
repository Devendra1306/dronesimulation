import { useState } from 'react';
import {
  droneArm,
  droneDisarm,
  droneTakeoff,
  droneLand,
  droneHover,
  droneStop,
  droneMove,
} from '../../services/api';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  AlertOctagon,
  ShieldCheck,
  ShieldAlert,
  PlaneTakeoff,
  PlaneLanding,
  Pause,
  ChevronUp,
  ChevronDown,
  Radio,
} from 'lucide-react';

interface DroneControlsProps {
  isArmed?: boolean;
  isAirborne?: boolean;
  mode?: string;
  source?: string;
  onCommandSent?: (cmd: string) => void;
}

type CommandState = 'idle' | 'pending' | 'success' | 'error';

export default function DroneControls({
  isArmed = false,
  isAirborne = false,
  mode = 'IDLE',
  source = '',
  onCommandSent,
}: DroneControlsProps) {
  const [cmdState, setCmdState] = useState<Record<string, CommandState>>({});
  const [speed, setSpeed] = useState<number>(1.5);

  const runCommand = async (key: string, fn: () => Promise<unknown>) => {
    setCmdState((s) => ({ ...s, [key]: 'pending' }));
    try {
      await fn();
      setCmdState((s) => ({ ...s, [key]: 'success' }));
      onCommandSent?.(key);
      setTimeout(() => setCmdState((s) => ({ ...s, [key]: 'idle' })), 1200);
    } catch {
      setCmdState((s) => ({ ...s, [key]: 'error' }));
      setTimeout(() => setCmdState((s) => ({ ...s, [key]: 'idle' })), 2000);
    }
  };

  const btnStateStyle = (key: string, defaultClass: string) => {
    const s = cmdState[key] ?? 'idle';
    if (s === 'pending') return `${defaultClass} opacity-60 cursor-wait animate-pulse`;
    if (s === 'success') return `${defaultClass} ring-2 ring-status-green bg-status-green/15 text-status-green`;
    if (s === 'error') return `${defaultClass} ring-2 ring-status-red bg-status-red/15 text-status-red`;
    return defaultClass;
  };

  const isGazebo = source.includes('GAZEBO');

  return (
    <div className="flex flex-col h-full gap-3.5 select-none text-xs">
      {/* Header & Hardware Link Status */}
      <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle">
        <div className="flex items-center gap-1.5">
          <span className="telemetry-label font-mono text-[11px]">FLIGHT DIRECTIVES</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-2xs">
          <Radio className={`w-3 h-3 ${isGazebo ? 'text-status-green' : 'text-accent'}`} />
          <span className={isGazebo ? 'text-status-green font-bold' : 'text-accent font-semibold'}>
            {isGazebo ? 'GAZEBO 3D ODE' : source ? source.substring(0, 16) : 'READY'}
          </span>
        </div>
      </div>

      {/* Safety Interlock: ARM / DISARM */}
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-1.5 flex items-center justify-between">
          <span>SAFETY INTERLOCK</span>
          <span className={`font-semibold ${isArmed ? 'text-status-green' : 'text-status-amber'}`}>
            {isArmed ? 'ARMED / LIVE' : 'DISARMED / SAFE'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {/* ARM button */}
          <button
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-mono font-semibold transition-all border ${
              isArmed
                ? 'bg-status-green/10 border-status-green/40 text-status-green'
                : btnStateStyle(
                    'arm',
                    'bg-surface-3 hover:bg-surface-4 border-border text-text-primary active:scale-98'
                  )
            }`}
            onClick={() => runCommand('arm', droneArm)}
            disabled={cmdState['arm'] === 'pending'}
          >
            <ShieldCheck className={`w-4 h-4 ${isArmed ? 'text-status-green' : 'text-status-amber'}`} />
            <span>{cmdState['arm'] === 'pending' ? 'ARMING...' : isArmed ? 'ARMED' : 'ARM'}</span>
          </button>

          {/* DISARM button */}
          <button
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-mono font-semibold transition-all border ${
              !isArmed
                ? 'bg-surface-4/40 border-border-subtle text-text-muted cursor-not-allowed opacity-60'
                : btnStateStyle(
                    'disarm',
                    'bg-surface-3 hover:bg-surface-4 border-border text-text-primary active:scale-98'
                  )
            }`}
            onClick={() => runCommand('disarm', droneDisarm)}
            disabled={cmdState['disarm'] === 'pending' || !isArmed || isAirborne}
            title={isAirborne ? 'Cannot disarm while airborne' : 'Safe disarm motors'}
          >
            <ShieldAlert className="w-4 h-4 text-status-amber" />
            <span>
              {cmdState['disarm'] === 'pending'
                ? 'DISARMING...'
                : isAirborne
                ? 'LOCKED'
                : 'DISARM'}
            </span>
          </button>
        </div>
      </div>

      {/* Flight Execution Phase: TAKEOFF / LAND */}
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-1.5 flex items-center justify-between">
          <span>FLIGHT PHASES</span>
          <span className="text-text-muted font-mono text-[10px]">MODE: {mode}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* TAKEOFF */}
          <button
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-mono font-bold transition-all shadow-sm ${btnStateStyle(
              'takeoff',
              'bg-accent hover:bg-accent-light text-white active:scale-98'
            )}`}
            onClick={() => runCommand('takeoff', droneTakeoff)}
            disabled={cmdState['takeoff'] === 'pending'}
          >
            <PlaneTakeoff className="w-4 h-4" />
            <span>{cmdState['takeoff'] === 'pending' ? 'CLIMBING...' : 'TAKEOFF'}</span>
          </button>

          {/* LAND */}
          <button
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-mono font-bold transition-all border ${btnStateStyle(
              'land',
              'bg-surface-3 hover:bg-surface-4 border-border text-text-primary active:scale-98'
            )}`}
            onClick={() => runCommand('land', droneLand)}
            disabled={cmdState['land'] === 'pending'}
          >
            <PlaneLanding className="w-4 h-4 text-status-amber" />
            <span>{cmdState['land'] === 'pending' ? 'DESCENDING...' : 'LAND'}</span>
          </button>
        </div>

        {/* Position Hold / Hover */}
        <button
          className={`w-full mt-2 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-mono font-medium border ${btnStateStyle(
            'hover',
            'bg-surface-3 hover:bg-surface-4 border-border text-text-secondary hover:text-text-primary active:scale-98'
          )}`}
          onClick={() => runCommand('hover', droneHover)}
          disabled={cmdState['hover'] === 'pending'}
        >
          <Pause className="w-3.5 h-3.5 text-status-green" />
          <span>POSITION HOLD / HOVER</span>
        </button>
      </div>

      {/* Emergency Motor Cut */}
      <div>
        <button
          className={`w-full py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 font-mono font-bold tracking-wider uppercase text-white shadow-md transition-all active:scale-98 ${btnStateStyle(
            'stop',
            'bg-status-red hover:bg-red-600'
          )}`}
          onClick={() => runCommand('stop', droneStop)}
          disabled={cmdState['stop'] === 'pending'}
        >
          <AlertOctagon className="w-4 h-4 animate-pulse" />
          <span>EMERGENCY MOTOR CUT</span>
        </button>
      </div>

      {/* Directional Vector Flight D-Pad */}
      <div className="bg-surface-1/70 border border-border-subtle rounded-xl p-3 mt-auto">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
            MANUAL FLIGHT VECTOR
          </span>
          <div className="flex items-center gap-1 font-mono text-[10px]">
            <span className="text-text-muted">SPEED:</span>
            <div className="flex gap-1 bg-surface-2 p-0.5 rounded border border-border-subtle">
              {[0.5, 1.5, 2.5, 4.0].map((v) => (
                <button
                  key={v}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    speed === v ? 'bg-accent text-white font-bold' : 'text-text-muted hover:text-text-primary'
                  }`}
                  onClick={() => setSpeed(v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Directional D-Pad */}
        <div className="grid grid-cols-3 gap-2 max-w-[160px] mx-auto py-1">
          <div />
          <button
            className="h-10 rounded-lg bg-surface-3 hover:bg-surface-4 border border-border-subtle flex items-center justify-center text-text-primary hover:text-accent transition-all active:scale-95 shadow-sm"
            onClick={() => runCommand('fwd', () => droneMove('forward', speed))}
            title="Pitch Forward (+X)"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <div />

          <button
            className="h-10 rounded-lg bg-surface-3 hover:bg-surface-4 border border-border-subtle flex items-center justify-center text-text-primary hover:text-accent transition-all active:scale-95 shadow-sm"
            onClick={() => runCommand('left', () => droneMove('left', speed))}
            title="Roll Left (-Y)"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            className="h-10 rounded-lg bg-surface-3 hover:bg-surface-4 border border-border-subtle flex items-center justify-center text-text-primary hover:text-accent transition-all active:scale-95 shadow-sm"
            onClick={() => runCommand('back', () => droneMove('back', speed))}
            title="Pitch Backward (-X)"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            className="h-10 rounded-lg bg-surface-3 hover:bg-surface-4 border border-border-subtle flex items-center justify-center text-text-primary hover:text-accent transition-all active:scale-95 shadow-sm"
            onClick={() => runCommand('right', () => droneMove('right', speed))}
            title="Roll Right (+Y)"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Vertical Altitude Nudges */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-border-subtle/50">
          <button
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-surface-3 hover:bg-surface-4 border border-border-subtle text-xs font-mono text-text-secondary hover:text-accent transition-all active:scale-95"
            onClick={() => runCommand('alt-up', () => droneMove('up', speed))}
          >
            <ChevronUp className="w-4 h-4 text-accent" />
            <span>ALT +0.5M</span>
          </button>
          <button
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-surface-3 hover:bg-surface-4 border border-border-subtle text-xs font-mono text-text-secondary hover:text-accent transition-all active:scale-95"
            onClick={() => runCommand('alt-dn', () => droneMove('down', speed))}
          >
            <ChevronDown className="w-4 h-4 text-status-amber" />
            <span>ALT −0.5M</span>
          </button>
        </div>
      </div>
    </div>
  );
}
