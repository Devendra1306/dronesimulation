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

  const isGazebo = source.includes('GAZEBO');

  const btnStyle = (key: string, base: string) => {
    const s = cmdState[key] ?? 'idle';
    if (s === 'pending') return `${base} opacity-60 cursor-wait animate-pulse`;
    if (s === 'success') return `${base} ring-2 ring-emerald-500 bg-emerald-50 text-emerald-700`;
    if (s === 'error') return `${base} ring-2 ring-rose-500 bg-rose-50 text-rose-700`;
    return base;
  };

  return (
    <div className="flex flex-col h-full gap-4 select-none text-xs">
      {/* Header & Link status */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900 text-sm">Flight Directives</h3>
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <Radio className={`w-3.5 h-3.5 ${isGazebo ? 'text-emerald-600' : 'text-sky-600'}`} />
          <span className={isGazebo ? 'text-emerald-700 font-semibold' : 'text-slate-600 font-medium'}>
            {isGazebo ? 'GAZEBO 3D ODE' : source ? source.substring(0, 16) : 'READY'}
          </span>
        </div>
      </div>

      {/* Safety Interlock: ARM / DISARM */}
      <div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
          <span className="font-medium">Safety Interlock</span>
          <span className={`font-semibold font-mono ${isArmed ? 'text-emerald-600' : 'text-slate-500'}`}>
            {isArmed ? 'ARMED / LIVE' : 'DISARMED / SAFE'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* ARM button */}
          <button
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-[10px] font-medium transition-all text-xs border ${
              isArmed
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-xs'
                : btnStyle(
                    'arm',
                    'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-subtle hover:border-slate-300 active:scale-[0.98]'
                  )
            }`}
            onClick={() => runCommand('arm', droneArm)}
            disabled={cmdState['arm'] === 'pending'}
          >
            <ShieldCheck className={`w-4 h-4 ${isArmed ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>{cmdState['arm'] === 'pending' ? 'Arming...' : isArmed ? 'Armed' : 'ARM'}</span>
          </button>

          {/* DISARM button */}
          <button
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-[10px] font-medium transition-all text-xs border ${
              !isArmed
                ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                : btnStyle(
                    'disarm',
                    'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-subtle hover:border-slate-300 active:scale-[0.98]'
                  )
            }`}
            onClick={() => runCommand('disarm', droneDisarm)}
            disabled={cmdState['disarm'] === 'pending' || !isArmed || isAirborne}
            title={isAirborne ? 'Cannot disarm while airborne' : 'Safe disarm motors'}
          >
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>
              {cmdState['disarm'] === 'pending'
                ? 'Disarming...'
                : isAirborne
                ? 'Locked'
                : 'DISARM'}
            </span>
          </button>
        </div>
      </div>

      {/* Flight Execution Phase: TAKEOFF / LAND */}
      <div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
          <span className="font-medium">Flight Phase</span>
          <span className="font-mono text-[10px] text-slate-400">Mode: {mode}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* TAKEOFF */}
          <button
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-[10px] font-semibold text-xs transition-all shadow-sm ${btnStyle(
              'takeoff',
              'bg-[#0EA5E9] hover:bg-[#0284C7] text-white active:scale-[0.98]'
            )}`}
            onClick={() => runCommand('takeoff', droneTakeoff)}
            disabled={cmdState['takeoff'] === 'pending'}
          >
            <PlaneTakeoff className="w-4 h-4" />
            <span>{cmdState['takeoff'] === 'pending' ? 'Climbing...' : 'TAKEOFF'}</span>
          </button>

          {/* LAND */}
          <button
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-[10px] font-semibold text-xs transition-all border ${btnStyle(
              'land',
              'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-subtle hover:border-slate-300 active:scale-[0.98]'
            )}`}
            onClick={() => runCommand('land', droneLand)}
            disabled={cmdState['land'] === 'pending'}
          >
            <PlaneLanding className="w-4 h-4 text-amber-500" />
            <span>{cmdState['land'] === 'pending' ? 'Landing...' : 'LAND'}</span>
          </button>
        </div>

        {/* Position Hold / Hover */}
        <button
          className={`w-full mt-2 flex items-center justify-center gap-2 py-2 px-3 rounded-[10px] font-medium text-xs border ${btnStyle(
            'hover',
            'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200 text-slate-700 active:scale-[0.98]'
          )}`}
          onClick={() => runCommand('hover', droneHover)}
          disabled={cmdState['hover'] === 'pending'}
        >
          <Pause className="w-3.5 h-3.5 text-emerald-600" />
          <span>POSITION HOLD / HOVER</span>
        </button>
      </div>

      {/* Emergency Motor Cut (Refined, clean) */}
      <div>
        <button
          className={`w-full py-2.5 px-3 rounded-[10px] flex items-center justify-center gap-2 font-semibold text-xs tracking-wide uppercase text-white shadow-sm transition-all active:scale-[0.98] ${btnStyle(
            'stop',
            'bg-[#EF4444] hover:bg-[#DC2626]'
          )}`}
          onClick={() => runCommand('stop', droneStop)}
          disabled={cmdState['stop'] === 'pending'}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>⚠ EMERGENCY MOTOR CUT</span>
        </button>
      </div>

      {/* Directional Vector Flight Controls */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 mt-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-slate-600">Manual Flight</span>
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-400">Speed:</span>
            <div className="flex gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
              {[0.5, 1.5, 2.5, 4.0].map((v) => (
                <button
                  key={v}
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono transition-colors ${
                    speed === v
                      ? 'bg-sky-500 text-white font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  onClick={() => setSpeed(v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Directional Pad */}
        <div className="grid grid-cols-3 gap-2 max-w-[150px] mx-auto py-1">
          <div />
          <button
            className="h-9 w-9 mx-auto rounded-xl bg-white hover:bg-slate-100 border border-slate-200 shadow-subtle flex items-center justify-center text-slate-700 hover:text-sky-600 transition-all active:scale-95"
            onClick={() => runCommand('fwd', () => droneMove('forward', speed))}
            title="Pitch Forward (+X)"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <div />

          <button
            className="h-9 w-9 mx-auto rounded-xl bg-white hover:bg-slate-100 border border-slate-200 shadow-subtle flex items-center justify-center text-slate-700 hover:text-sky-600 transition-all active:scale-95"
            onClick={() => runCommand('left', () => droneMove('left', speed))}
            title="Roll Left (-Y)"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            className="h-9 w-9 mx-auto rounded-xl bg-white hover:bg-slate-100 border border-slate-200 shadow-subtle flex items-center justify-center text-slate-700 hover:text-sky-600 transition-all active:scale-95"
            onClick={() => runCommand('back', () => droneMove('back', speed))}
            title="Pitch Backward (-X)"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            className="h-9 w-9 mx-auto rounded-xl bg-white hover:bg-slate-100 border border-slate-200 shadow-subtle flex items-center justify-center text-slate-700 hover:text-sky-600 transition-all active:scale-95"
            onClick={() => runCommand('right', () => droneMove('right', speed))}
            title="Roll Right (+Y)"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Altitude Nudge Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-200/70">
          <button
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 hover:text-sky-600 shadow-subtle transition-all active:scale-95"
            onClick={() => runCommand('alt-up', () => droneMove('up', speed))}
          >
            <ChevronUp className="w-3.5 h-3.5 text-sky-600" />
            <span>ALT +0.5M</span>
          </button>
          <button
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 hover:text-amber-600 shadow-subtle transition-all active:scale-95"
            onClick={() => runCommand('alt-dn', () => droneMove('down', speed))}
          >
            <ChevronDown className="w-3.5 h-3.5 text-amber-500" />
            <span>ALT −0.5M</span>
          </button>
        </div>
      </div>
    </div>
  );
}
