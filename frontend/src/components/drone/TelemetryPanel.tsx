import { TelemetryData } from '../../types';
import { Compass, Battery, Radio, Gauge, MapPin, Activity, ShieldCheck, ShieldAlert } from 'lucide-react';

interface TelemetryPanelProps {
  data: TelemetryData | null;
}

export default function TelemetryPanel({ data }: TelemetryPanelProps) {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-3 text-center p-4">
        <div className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
        <span className="text-text-muted text-xs font-mono uppercase tracking-widest">
          Awaiting Avionics Telemetry Stream...
        </span>
      </div>
    );
  }

  const modeColors: Record<string, string> = {
    IDLE: 'text-text-muted bg-surface-3',
    ARMED: 'text-status-amber bg-status-amber/10 border-status-amber/30',
    TAKING_OFF: 'text-accent bg-accent/10 border-accent/30',
    HOVERING: 'text-status-green bg-status-green/10 border-status-green/30',
    MOVING: 'text-accent bg-accent/10 border-accent/30',
    LANDING: 'text-status-amber bg-status-amber/10 border-status-amber/30',
  };

  const modeStyle = modeColors[data.mode] ?? 'text-text-muted bg-surface-3';

  // Battery health & voltage approximation (4S LiPo 14.0V - 16.8V)
  const battVoltage = (13.8 + (data.battery / 100) * 3.0).toFixed(1);
  const battColor =
    data.battery > 50 ? 'text-status-green' : data.battery > 20 ? 'text-status-amber' : 'text-status-red';
  const battBg =
    data.battery > 50 ? 'bg-status-green' : data.battery > 20 ? 'bg-status-amber' : 'bg-status-red';

  // Cardinal direction calculator
  const getCardinal = (deg: number) => {
    const val = Math.floor((deg / 22.5) + 0.5);
    const arr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return arr[val % 16];
  };

  return (
    <div className="flex flex-col gap-3.5 h-full text-xs font-sans">
      {/* Flight State & Sim Clock Banner */}
      <div className="bg-surface-3 border border-border-subtle rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {data.is_armed ? (
            <ShieldCheck className="w-4 h-4 text-status-green" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-text-muted" />
          )}
          <div>
            <div className="telemetry-label text-[10px] text-text-muted">FLIGHT MODE</div>
            <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border inline-block mt-0.5 ${modeStyle}`}>
              {data.mode}
            </span>
          </div>
        </div>

        <div className="text-right font-mono">
          <div className="telemetry-label text-[10px] text-text-muted">SIM TIME</div>
          <span className="text-sm font-semibold text-text-primary">
            {data.simulation_time.toFixed(1)}s
          </span>
        </div>
      </div>

      {/* Primary Flight Dynamics Grid */}
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1.5">
          <Gauge className="w-3 h-3 text-accent" />
          <span>PRIMARY DYNAMICS</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Altitude */}
          <div className="bg-surface-3 border border-border-subtle rounded-xl p-2.5">
            <div className="text-[10px] font-mono text-text-muted">ALTITUDE (AGL)</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono text-xl font-bold text-accent">
                {data.altitude.toFixed(2)}
              </span>
              <span className="font-mono text-[11px] text-text-muted">m</span>
            </div>
          </div>

          {/* Velocity */}
          <div className="bg-surface-3 border border-border-subtle rounded-xl p-2.5">
            <div className="text-[10px] font-mono text-text-muted">GROUND SPEED</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono text-xl font-bold text-text-primary">
                {data.velocity.toFixed(2)}
              </span>
              <span className="font-mono text-[11px] text-text-muted">m/s</span>
            </div>
          </div>

          {/* Heading */}
          <div className="bg-surface-3 border border-border-subtle rounded-xl p-2.5">
            <div className="text-[10px] font-mono text-text-muted">HEADING / BEARING</div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="font-mono text-lg font-bold text-text-primary">
                {data.heading.toFixed(0).padStart(3, '0')}°
              </span>
              <span className="font-mono text-xs font-semibold text-accent">
                {getCardinal(data.heading)}
              </span>
            </div>
          </div>

          {/* Yaw */}
          <div className="bg-surface-3 border border-border-subtle rounded-xl p-2.5">
            <div className="text-[10px] font-mono text-text-muted">YAW ANGLE</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono text-lg font-bold text-text-primary">
                {data.yaw.toFixed(1)}
              </span>
              <span className="font-mono text-[11px] text-text-muted">°</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spatial Attitude: Pitch & Roll */}
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-accent" />
          <span>SPATIAL ATTITUDE</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Pitch */}
          <div className="bg-surface-3 border border-border-subtle rounded-xl p-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-text-muted mb-1">
              <span>PITCH</span>
              <span className={`font-semibold ${Math.abs(data.pitch) > 15 ? 'text-status-amber' : 'text-text-primary'}`}>
                {data.pitch.toFixed(1)}°
              </span>
            </div>
            {/* Visual Level Bar */}
            <div className="h-1.5 bg-surface-1 rounded-full overflow-hidden flex items-center justify-center relative">
              <div
                className="h-full bg-accent transition-all duration-150"
                style={{
                  width: `${Math.min(100, Math.abs(data.pitch) * 3)}%`,
                  transform: data.pitch < 0 ? 'scaleX(-1)' : 'none',
                }}
              />
            </div>
          </div>

          {/* Roll */}
          <div className="bg-surface-3 border border-border-subtle rounded-xl p-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-text-muted mb-1">
              <span>ROLL</span>
              <span className={`font-semibold ${Math.abs(data.roll) > 15 ? 'text-status-amber' : 'text-text-primary'}`}>
                {data.roll.toFixed(1)}°
              </span>
            </div>
            {/* Visual Level Bar */}
            <div className="h-1.5 bg-surface-1 rounded-full overflow-hidden flex items-center justify-center relative">
              <div
                className="h-full bg-accent transition-all duration-150"
                style={{
                  width: `${Math.min(100, Math.abs(data.roll) * 3)}%`,
                  transform: data.roll < 0 ? 'scaleX(-1)' : 'none',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Power & RF Link Telemetry */}
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1.5">
          <Battery className="w-3 h-3 text-accent" />
          <span>POWER & AVIONICS LINK</span>
        </div>

        <div className="bg-surface-3 border border-border-subtle rounded-xl p-3 flex flex-col gap-2.5">
          {/* Battery meter */}
          <div>
            <div className="flex items-center justify-between font-mono mb-1">
              <span className="text-[10px] text-text-muted">4S LIPO BATTERY</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-text-muted">{battVoltage}V</span>
                <span className={`text-xs font-bold ${battColor}`}>{data.battery.toFixed(0)}%</span>
              </div>
            </div>
            <div className="h-2 bg-surface-1 rounded-full overflow-hidden">
              <div
                className={`h-full ${battBg} transition-all duration-300`}
                style={{ width: `${Math.max(0, Math.min(100, data.battery))}%` }}
              />
            </div>
          </div>

          {/* Signal & Link Status */}
          <div className="flex items-center justify-between pt-2 border-t border-border-subtle/50 font-mono">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-accent" />
              <span className="text-[10px] text-text-muted">RF LINK SIGNAL</span>
            </div>
            <span className="text-xs font-semibold text-text-primary">
              {data.signal_strength.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* GPS Coordinate Deck */}
      <div className="bg-surface-3 border border-border-subtle rounded-xl p-3">
        <div className="flex items-center justify-between text-[10px] font-mono text-text-muted mb-2">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-status-green" />
            <span className="tracking-wider uppercase">GNSS / GPS FIX</span>
          </div>
          <span className="text-status-green font-semibold">3D DGPS LOCK</span>
        </div>
        <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
          <div className="bg-surface-2/60 border border-border-subtle/40 rounded-lg p-2">
            <div className="text-[9px] text-text-muted">LATITUDE</div>
            <div className="text-text-primary font-semibold truncate">{data.latitude.toFixed(6)}°</div>
          </div>
          <div className="bg-surface-2/60 border border-border-subtle/40 rounded-lg p-2">
            <div className="text-[9px] text-text-muted">LONGITUDE</div>
            <div className="text-text-primary font-semibold truncate">{data.longitude.toFixed(6)}°</div>
          </div>
        </div>
      </div>

      {/* Telemetry Hardware Link Stamp */}
      <div className="mt-auto pt-2 border-t border-border-subtle flex items-center justify-between font-mono text-[10px] text-text-muted">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-status-green" />
          <span>SOURCE:</span>
        </div>
        <span className="text-text-primary font-semibold truncate max-w-[170px]" title={data.source}>
          {data.source}
        </span>
      </div>
    </div>
  );
}
