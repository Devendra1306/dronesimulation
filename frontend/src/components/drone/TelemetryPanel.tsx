import { TelemetryData } from '../../types';

interface MetricProps {
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
}

function Metric({ label, value, unit, accent = false }: MetricProps) {
  return (
    <div className="bg-surface-3 border border-border-subtle rounded-lg p-3">
      <div className="telemetry-label text-2xs mb-1.5">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono text-lg font-medium leading-none ${accent ? 'text-accent' : 'text-text-primary'}`}>
          {value}
        </span>
        <span className="text-text-muted text-xs font-mono">{unit}</span>
      </div>
    </div>
  );
}

function BatteryBar({ pct }: { pct: number }) {
  const color = pct > 60 ? 'bg-status-green' : pct > 25 ? 'bg-status-amber' : 'bg-status-red';
  return (
    <div className="bg-surface-3 border border-border-subtle rounded-lg p-3">
      <div className="telemetry-label text-2xs mb-2">BATTERY</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-surface-0 rounded-full overflow-hidden">
          <div
            className={`h-full ${color} transition-all duration-500`}
            style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
          />
        </div>
        <span className="font-mono text-sm font-medium text-text-primary w-10 text-right">{pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

export default function TelemetryPanel({ data }: { data: TelemetryData | null }) {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-2 h-2 rounded-full bg-text-muted animate-pulse" />
        <span className="text-text-muted text-xs uppercase tracking-widest">Waiting for telemetry</span>
      </div>
    );
  }

  const modeColors: Record<string, string> = {
    IDLE: 'text-text-muted',
    ARMED: 'text-status-amber',
    TAKING_OFF: 'text-accent',
    HOVERING: 'text-status-green',
    MOVING: 'text-accent',
    LANDING: 'text-status-amber',
  };
  const modeColor = modeColors[data.mode] ?? 'text-text-muted';

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto">
      {/* Mode banner */}
      <div className="bg-surface-3 border border-border-subtle rounded-lg px-3 py-2 flex items-center justify-between">
        <div>
          <div className="telemetry-label text-2xs mb-0.5">FLIGHT MODE</div>
          <span className={`font-mono text-sm font-bold tracking-wider ${modeColor}`}>{data.mode}</span>
        </div>
        <div className="text-right">
          <div className="telemetry-label text-2xs mb-0.5">SIM TIME</div>
          <span className="font-mono text-sm text-text-primary">{data.simulation_time.toFixed(1)}s</span>
        </div>
      </div>

      {/* Primary metrics 2-col */}
      <div className="grid grid-cols-2 gap-2">
        <Metric label="ALTITUDE" value={data.altitude.toFixed(1)} unit="m" accent />
        <Metric label="VELOCITY" value={data.velocity.toFixed(1)} unit="m/s" />
        <Metric label="HEADING" value={data.heading.toFixed(0)} unit="°" />
        <Metric label="YAW" value={data.yaw.toFixed(1)} unit="°" />
        <Metric label="PITCH" value={data.pitch.toFixed(1)} unit="°" />
        <Metric label="ROLL" value={data.roll.toFixed(1)} unit="°" />
      </div>

      {/* Battery */}
      <BatteryBar pct={data.battery} />

      {/* Signal */}
      <Metric label="SIGNAL" value={data.signal_strength.toFixed(0)} unit="%" />

      {/* GPS */}
      <div className="bg-surface-3 border border-border-subtle rounded-lg p-3">
        <div className="telemetry-label text-2xs mb-2">GPS POSITION</div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          <span className="text-text-muted text-2xs font-mono">LAT</span>
          <span className="font-mono text-xs text-text-primary text-right">{data.latitude.toFixed(6)}</span>
          <span className="text-text-muted text-2xs font-mono">LON</span>
          <span className="font-mono text-xs text-text-primary text-right">{data.longitude.toFixed(6)}</span>
        </div>
      </div>

      {/* Source label */}
      <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-border-subtle">
        <div className="status-dot bg-status-amber" />
        <span className="text-2xs text-text-muted uppercase tracking-wider font-mono">{data.source}</span>
      </div>
    </div>
  );
}
