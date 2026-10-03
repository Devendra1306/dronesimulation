import { useState, useCallback, useEffect } from 'react';
import TelemetryChart from '../components/charts/TelemetryChart';
import { useWebSocket } from '../hooks/useWebSocket';
import type { TelemetryData } from '../types';
import { Activity, Navigation, Battery, Radio, Camera, Cpu } from 'lucide-react';

interface SensorCardProps {
  label: string;
  value: string;
  unit: string;
  ok: boolean;
  icon: React.ElementType;
}

function SensorCard({ label, value, unit, ok, icon: Icon }: SensorCardProps) {
  return (
    <div className="bg-surface-3 border border-border-subtle rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-text-muted" />
          <span className="telemetry-label text-2xs">{label}</span>
        </div>
        <div className={`status-dot ${ok ? 'bg-status-green' : 'bg-status-red'}`} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-xl font-medium text-text-primary">{value}</span>
        <span className="text-xs text-text-muted font-mono">{unit}</span>
      </div>
      <span className="text-2xs text-text-muted">{ok ? 'NOMINAL' : 'FAULT'}</span>
    </div>
  );
}

export default function SensorData() {
  const [history, setHistory] = useState<TelemetryData[]>([]);

  const onMessage = useCallback((data: TelemetryData) => {
    setHistory(prev => [...prev, data].slice(-120));
  }, []);

  useWebSocket({ url: 'ws://localhost:8000/ws/telemetry', onMessage });

  const latest = history[history.length - 1];

  const sensors = [
    { label: 'IMU',      value: latest ? latest.pitch.toFixed(1) : '—', unit: '°',   ok: true, icon: Activity },
    { label: 'GPS',      value: latest ? latest.latitude.toFixed(4) : '—', unit: '°N', ok: !!latest, icon: Navigation },
    { label: 'ALTITUDE', value: latest ? latest.altitude.toFixed(1) : '—', unit: 'm',  ok: !!latest, icon: Activity },
    { label: 'VELOCITY', value: latest ? latest.velocity.toFixed(1) : '—', unit: 'm/s', ok: !!latest, icon: Activity },
    { label: 'BATTERY',  value: latest ? latest.battery.toFixed(0) : '—', unit: '%',  ok: (latest?.battery ?? 100) > 20, icon: Battery },
    { label: 'SIGNAL',   value: latest ? latest.signal_strength.toFixed(0) : '—', unit: '%', ok: (latest?.signal_strength ?? 100) > 30, icon: Radio },
  ];

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Demo label */}
      <div className="flex items-center gap-3 shrink-0">
        <h2 className="text-base font-bold text-text-primary">Sensor Data</h2>
        <span className="badge-demo">DEMO SIMULATION</span>
        <span className="text-xs text-text-muted">{history.length} samples recorded</span>
      </div>

      {/* Sensor status cards */}
      <div className="grid grid-cols-6 gap-3 shrink-0">
        {sensors.map(s => <SensorCard key={s.label} {...s} />)}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-2 gap-4 shrink-0" style={{ height: 220 }}>
        <TelemetryChart data={history} dataKey="altitude" color="#1a9fd4" name="ALTITUDE" unit="m" />
        <TelemetryChart data={history} dataKey="velocity" color="#22c55e" name="VELOCITY" unit="m/s" />
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-2 gap-4 shrink-0" style={{ height: 220 }}>
        <TelemetryChart data={history} dataKey="battery" color="#f59e0b" name="BATTERY" unit="%" />
        <TelemetryChart data={history} dataKey="signal_strength" color="#8fa3bd" name="SIGNAL" unit="%" />
      </div>

      {/* IMU chart */}
      <div className="shrink-0" style={{ height: 220 }}>
        <TelemetryChart data={history} dataKey="pitch" color="#ef4444" name="IMU — PITCH" unit="°" />
      </div>
    </div>
  );
}
