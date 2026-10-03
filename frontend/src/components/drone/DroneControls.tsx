import { useState } from 'react';
import { droneArm, droneDisarm, droneTakeoff, droneLand, droneHover, droneStop, droneMove } from '../../services/api';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';

type CommandState = 'idle' | 'pending' | 'success' | 'error';

export default function DroneControls() {
  const [cmdState, setCmdState] = useState<Record<string, CommandState>>({});

  const runCommand = async (key: string, fn: () => Promise<unknown>) => {
    setCmdState(s => ({ ...s, [key]: 'pending' }));
    try {
      await fn();
      setCmdState(s => ({ ...s, [key]: 'success' }));
      setTimeout(() => setCmdState(s => ({ ...s, [key]: 'idle' })), 1500);
    } catch {
      setCmdState(s => ({ ...s, [key]: 'error' }));
      setTimeout(() => setCmdState(s => ({ ...s, [key]: 'idle' })), 2000);
    }
  };

  const btnClass = (key: string, base: string) => {
    const s = cmdState[key] ?? 'idle';
    if (s === 'pending') return `${base} opacity-60 cursor-wait`;
    if (s === 'success') return `${base} ring-1 ring-status-green`;
    if (s === 'error') return `${base} ring-1 ring-status-red`;
    return base;
  };

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto">
      <div className="telemetry-label pb-1 border-b border-border-subtle">FLIGHT COMMANDS</div>

      {/* Arm / Disarm */}
      <div className="grid grid-cols-2 gap-2">
        <button
          className={btnClass('arm', 'btn-secondary text-xs py-2')}
          onClick={() => runCommand('arm', droneArm)}
          disabled={cmdState['arm'] === 'pending'}
        >
          {cmdState['arm'] === 'pending' ? '...' : 'ARM'}
        </button>
        <button
          className={btnClass('disarm', 'btn-secondary text-xs py-2')}
          onClick={() => runCommand('disarm', droneDisarm)}
          disabled={cmdState['disarm'] === 'pending'}
        >
          DISARM
        </button>
      </div>

      {/* Take off / Land */}
      <div className="grid grid-cols-2 gap-2">
        <button
          className={btnClass('takeoff', 'btn-primary text-xs py-2')}
          onClick={() => runCommand('takeoff', droneTakeoff)}
          disabled={cmdState['takeoff'] === 'pending'}
        >
          TAKE OFF
        </button>
        <button
          className={btnClass('land', 'btn-secondary text-xs py-2')}
          onClick={() => runCommand('land', droneLand)}
          disabled={cmdState['land'] === 'pending'}
        >
          LAND
        </button>
      </div>

      {/* Hover */}
      <button
        className={btnClass('hover', 'btn-secondary w-full text-xs py-2')}
        onClick={() => runCommand('hover', droneHover)}
        disabled={cmdState['hover'] === 'pending'}
      >
        HOVER / HOLD POSITION
      </button>

      {/* Emergency stop — prominent */}
      <button
        className={btnClass('stop', 'btn-danger w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold tracking-widest')}
        onClick={() => runCommand('stop', droneStop)}
        disabled={cmdState['stop'] === 'pending'}
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        EMERGENCY STOP
      </button>

      {/* Directional control */}
      <div className="mt-1">
        <div className="telemetry-label pb-2">DIRECTIONAL</div>
        <div className="grid grid-cols-3 gap-1.5 w-28 mx-auto">
          <div />
          <button
            className="bg-surface-3 hover:bg-surface-4 border border-border-subtle p-2 rounded flex justify-center transition-colors"
            onClick={() => runCommand('fwd', () => droneMove('forward', 1))}
          >
            <ArrowUp className="w-4 h-4 text-text-primary" />
          </button>
          <div />
          <button
            className="bg-surface-3 hover:bg-surface-4 border border-border-subtle p-2 rounded flex justify-center transition-colors"
            onClick={() => runCommand('left', () => droneMove('left', 1))}
          >
            <ArrowLeft className="w-4 h-4 text-text-primary" />
          </button>
          <button
            className="bg-surface-3 hover:bg-surface-4 border border-border-subtle p-2 rounded flex justify-center transition-colors"
            onClick={() => runCommand('back', () => droneMove('back', 1))}
          >
            <ArrowDown className="w-4 h-4 text-text-primary" />
          </button>
          <button
            className="bg-surface-3 hover:bg-surface-4 border border-border-subtle p-2 rounded flex justify-center transition-colors"
            onClick={() => runCommand('right', () => droneMove('right', 1))}
          >
            <ArrowRight className="w-4 h-4 text-text-primary" />
          </button>
        </div>
      </div>

      {/* Altitude nudge */}
      <div>
        <div className="telemetry-label pb-2">ALTITUDE</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="btn-secondary text-xs py-1.5"
            onClick={() => runCommand('alt-up', () => droneMove('up', 1))}
          >
            ALT +
          </button>
          <button
            className="btn-secondary text-xs py-1.5"
            onClick={() => runCommand('alt-dn', () => droneMove('down', 1))}
          >
            ALT −
          </button>
        </div>
      </div>
    </div>
  );
}
