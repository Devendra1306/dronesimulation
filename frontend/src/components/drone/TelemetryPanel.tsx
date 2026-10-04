import { TelemetryData } from '../../types';
import { Battery, Radio, Gauge, MapPin, Activity, ShieldCheck, ShieldAlert, WifiOff } from 'lucide-react';

interface TelemetryPanelProps {
  data: TelemetryData | null;
}

export default function TelemetryPanel({ data }: TelemetryPanelProps) {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-3 text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <WifiOff className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-slate-700 mb-1">Telemetry Offline</h4>
          <p className="text-[11px] text-slate-400 max-w-[200px] leading-relaxed">
            Waiting for avionics telemetry stream from simulator
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span className="text-[11px] font-mono text-amber-600 font-medium">Listening on WS</span>
        </div>
      </div>
    );
  }

  const modeBadgeStyles: Record<string, string> = {
    IDLE: 'text-slate-600 bg-slate-100 border-slate-200',
    ARMED: 'text-amber-700 bg-amber-50 border-amber-200',
    TAKING_OFF: 'text-sky-700 bg-sky-50 border-sky-200',
    HOVERING: 'text-emerald-700 bg-emerald-50 border-emerald-200 font-semibold',
    MOVING: 'text-blue-700 bg-blue-50 border-blue-200',
    LANDING: 'text-orange-700 bg-orange-50 border-orange-200',
  };

  const modeStyle = modeBadgeStyles[data.mode] ?? 'text-slate-600 bg-slate-100 border-slate-200';

  // Battery health & voltage estimate (4S LiPo 13.8V - 16.8V)
  const battVoltage = (13.8 + (data.battery / 100) * 3.0).toFixed(1);
  const battColor =
    data.battery > 50 ? 'text-emerald-600' : data.battery > 20 ? 'text-amber-600' : 'text-rose-600';
  const battBarColor =
    data.battery > 50 ? 'bg-emerald-500' : data.battery > 20 ? 'bg-amber-500' : 'bg-rose-500';

  // Cardinal direction helper
  const getCardinal = (deg: number) => {
    const val = Math.floor(deg / 22.5 + 0.5);
    const arr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return arr[val % 16];
  };

  return (
    <div className="flex flex-col gap-3.5 h-full text-xs font-sans">
      {/* Flight State & Sim Clock */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {data.is_armed ? (
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-slate-400" />
          )}
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Flight Mode</div>
            <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border inline-block mt-0.5 ${modeStyle}`}>
              {data.mode}
            </span>
          </div>
        </div>

        <div className="text-right font-mono">
          <div className="text-[10px] text-slate-400 font-sans font-medium">Sim Time</div>
          <span className="text-sm font-semibold text-slate-900">
            {data.simulation_time.toFixed(1)}s
          </span>
        </div>
      </div>

      {/* Primary Flight Dynamics */}
      <div>
        <div className="text-[11px] font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-sky-600" />
          <span>Primary Dynamics</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Altitude */}
          <div className="bg-slate-50/60 border border-slate-200/70 rounded-xl p-2.5">
            <div className="text-[10px] text-slate-400 font-medium">ALTITUDE (AGL)</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono text-lg font-bold text-sky-600">
                {data.altitude.toFixed(2)}
              </span>
              <span className="font-mono text-[11px] text-slate-400">m</span>
            </div>
          </div>

          {/* Velocity */}
          <div className="bg-slate-50/60 border border-slate-200/70 rounded-xl p-2.5">
            <div className="text-[10px] text-slate-400 font-medium">GROUND SPEED</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono text-lg font-bold text-slate-900">
                {data.velocity.toFixed(2)}
              </span>
              <span className="font-mono text-[11px] text-slate-400">m/s</span>
            </div>
          </div>

          {/* Heading */}
          <div className="bg-slate-50/60 border border-slate-200/70 rounded-xl p-2.5">
            <div className="text-[10px] text-slate-400 font-medium">HEADING / BEARING</div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="font-mono text-base font-bold text-slate-900">
                {data.heading.toFixed(0).padStart(3, '0')}°
              </span>
              <span className="font-mono text-xs font-semibold text-sky-600">
                {getCardinal(data.heading)}
              </span>
            </div>
          </div>

          {/* Yaw */}
          <div className="bg-slate-50/60 border border-slate-200/70 rounded-xl p-2.5">
            <div className="text-[10px] text-slate-400 font-medium">YAW ANGLE</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono text-base font-bold text-slate-900">
                {data.yaw.toFixed(1)}
              </span>
              <span className="font-mono text-[11px] text-slate-400">°</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spatial Attitude */}
      <div>
        <div className="text-[11px] font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-sky-600" />
          <span>Spatial Attitude</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Pitch */}
          <div className="bg-slate-50/60 border border-slate-200/70 rounded-xl p-2.5">
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1 font-mono">
              <span>PITCH</span>
              <span className={`font-semibold ${Math.abs(data.pitch) > 15 ? 'text-amber-600' : 'text-slate-800'}`}>
                {data.pitch.toFixed(1)}°
              </span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden flex items-center justify-center relative">
              <div
                className="h-full bg-sky-500 transition-all duration-150"
                style={{
                  width: `${Math.min(100, Math.abs(data.pitch) * 3)}%`,
                  transform: data.pitch < 0 ? 'scaleX(-1)' : 'none',
                }}
              />
            </div>
          </div>

          {/* Roll */}
          <div className="bg-slate-50/60 border border-slate-200/70 rounded-xl p-2.5">
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1 font-mono">
              <span>ROLL</span>
              <span className={`font-semibold ${Math.abs(data.roll) > 15 ? 'text-amber-600' : 'text-slate-800'}`}>
                {data.roll.toFixed(1)}°
              </span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden flex items-center justify-center relative">
              <div
                className="h-full bg-sky-500 transition-all duration-150"
                style={{
                  width: `${Math.min(100, Math.abs(data.roll) * 3)}%`,
                  transform: data.roll < 0 ? 'scaleX(-1)' : 'none',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Battery & RF Link */}
      <div>
        <div className="text-[11px] font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
          <Battery className="w-3.5 h-3.5 text-sky-600" />
          <span>Power & Link</span>
        </div>

        <div className="bg-slate-50/60 border border-slate-200/70 rounded-xl p-3 flex flex-col gap-2">
          {/* Battery */}
          <div>
            <div className="flex items-center justify-between font-mono mb-1 text-[11px]">
              <span className="text-slate-400 font-sans">4S LiPo Battery</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">{battVoltage}V</span>
                <span className={`font-bold ${battColor}`}>{data.battery.toFixed(0)}%</span>
              </div>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${battBarColor} transition-all duration-300`}
                style={{ width: `${Math.max(0, Math.min(100, data.battery))}%` }}
              />
            </div>
          </div>

          {/* RF Link */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 font-mono text-[11px]">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-slate-500 font-sans">RF Link Signal</span>
            </div>
            <span className="font-semibold text-slate-800">
              {data.signal_strength.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* GPS GNSS */}
      <div className="bg-slate-50/60 border border-slate-200/70 rounded-xl p-3">
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2 font-mono">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-sans font-medium text-slate-600">GNSS / GPS Fix</span>
          </div>
          <span className="text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            3D DGPS LOCK
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
          <div className="bg-white border border-slate-200/80 rounded-lg p-2 shadow-subtle">
            <div className="text-[10px] text-slate-400 font-sans">Latitude</div>
            <div className="text-slate-800 font-semibold truncate">{data.latitude.toFixed(6)}°</div>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-lg p-2 shadow-subtle">
            <div className="text-[10px] text-slate-400 font-sans">Longitude</div>
            <div className="text-slate-800 font-semibold truncate">{data.longitude.toFixed(6)}°</div>
          </div>
        </div>
      </div>

      {/* Origin link */}
      <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between font-mono text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Source:</span>
        </div>
        <span className="text-slate-700 font-semibold truncate max-w-[180px]" title={data.source}>
          {data.source}
        </span>
      </div>
    </div>
  );
}
