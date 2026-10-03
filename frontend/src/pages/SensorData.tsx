import { useState, useCallback, useEffect } from 'react';
import TelemetryChart from '../components/charts/TelemetryChart';
import { useWebSocket } from '../hooks/useWebSocket';
import type { TelemetryData } from '../types';
import { getTelemetry } from '../services/api';
import { WS_TELEMETRY_URL } from '../config/env';
import { Activity, Navigation, Battery, Radio, Gauge, Compass } from 'lucide-react';

interface SensorCardProps {
  label: string;
  sublabel: string;
  value: string;
  unit: string;
  ok: boolean;
  icon: React.ElementType;
}

function SensorCard({ label, sublabel, value, unit, ok, icon: Icon }: SensorCardProps) {
  return (
    <div className="bg-surface-3 border border-border-subtle rounded-xl p-3.5 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-accent" />
          <span className="telemetry-label text-2xs">{label}</span>
        </div>
        <div className={`status-dot ${ok ? 'bg-status-green' : 'bg-status-red'}`} />
      </div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="font-mono text-xl font-bold text-text-primary">{value}</span>
        <span className="text-xs text-text-muted font-mono">{unit}</span>
      </div>
      <div className="flex items-center justify-between text-[10px] text-text-muted font-mono pt-1 border-t border-border-subtle/40">
        <span>{sublabel}</span>
        <span className={ok ? 'text-status-green font-medium' : 'text-status-red font-medium'}>
          {ok ? 'NOMINAL' : 'FAULT'}
        </span>
      </div>
    </div>
  );
}

export default function SensorData() {
  const [history, setHistory] = useState<TelemetryData[]>([]);

  useEffect(() => {
    getTelemetry().then(res => {
      setHistory([res.data]);
    }).catch(() => {});
  }, []);

  const onMessage = useCallback((data: TelemetryData) => {
    setHistory(prev => [...prev, data].slice(-120));
  }, []);

  useWebSocket({ url: WS_TELEMETRY_URL, onMessage });

  const latest = history[history.length - 1];
  const isDemo = !latest?.source || latest.source.includes('DEMO');

  const sensors = [
    { label: 'IMU / GYRO', sublabel: '6-DOF Attitude', value: latest ? latest.pitch.toFixed(1) : '—', unit: '°', ok: true, icon: Activity },
    { label: 'GNSS / GPS', sublabel: 'SatNav Fix', value: latest ? latest.latitude.toFixed(4) : '—', unit: '°N', ok: !!latest, icon: Navigation },
    { label: 'BAROMETER', sublabel: 'Baro Altimeter', value: latest ? latest.altitude.toFixed(1) : '—', unit: 'm', ok: !!latest, icon: Gauge },
    { label: 'PITOT SPEED', sublabel: 'Ground/Air Vel', value: latest ? latest.velocity.toFixed(1) : '—', unit: 'm/s', ok: !!latest, icon: Compass },
    { label: 'AVIONICS BMS', sublabel: 'LiPo Pack', value: latest ? latest.battery.toFixed(0) : '—', unit: '%', ok: (latest?.battery ?? 100) > 20, icon: Battery },
    { label: 'RF TELEMETRY', sublabel: '915MHz Link', value: latest ? latest.signal_strength.toFixed(0) : '—', unit: '%', ok: (latest?.signal_strength ?? 100) > 30, icon: Radio },
  ];

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-text-primary font-mono tracking-tight">Flight Sensors & Avionics Telemetry</h2>
          {isDemo ? (
            <span className="badge-demo text-[10px] font-mono">SIMULATED SENSORS (DEMO)</span>
          ) : (
            <span className="badge-active text-[10px] font-mono">LIVE AVIONICS SENSORS</span>
          )}
          <span className="text-xs text-text-muted font-mono">{history.length} samples stream buffer</span>
        </div>
        <div className="text-2xs font-mono text-text-muted bg-surface-2 px-2.5 py-1 rounded border border-border-subtle">
          BUS: I2C / SPI / CAN / UART
        </div>
      </div>

      {/* Sensor status cards */}
      <div className="grid grid-cols-6 gap-3 shrink-0">
        {sensors.map(s => <SensorCard key={s.label} {...s} />)}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-2 gap-4 shrink-0" style={{ height: 220 }}>
        <TelemetryChart data={history} dataKey="altitude" color="#1a9fd4" name="BAROMETRIC ALTITUDE" unit="m" />
        <TelemetryChart data={history} dataKey="velocity" color="#22c55e" name="FLIGHT VELOCITY" unit="m/s" />
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-2 gap-4 shrink-0" style={{ height: 220 }}>
        <TelemetryChart data={history} dataKey="battery" color="#f59e0b" name="BATTERY VOLTAGE CAPACITY" unit="%" />
        <TelemetryChart data={history} dataKey="signal_strength" color="#8fa3bd" name="TELEMETRY RSSI SIGNAL" unit="%" />
      </div>

      {/* IMU chart */}
      <div className="shrink-0" style={{ height: 220 }}>
        <TelemetryChart data={history} dataKey="pitch" color="#ef4444" name="IMU INERTIAL ATTITUDE — PITCH" unit="°" />
      </div>
    </div>
  );
}
