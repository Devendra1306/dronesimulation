import { useEffect, useState, useCallback } from 'react';
import DroneVisualizer from '../components/drone/DroneVisualizer';
import TelemetryPanel from '../components/drone/TelemetryPanel';
import DroneControls from '../components/drone/DroneControls';
import TelemetryChart from '../components/charts/TelemetryChart';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAppStore } from '../store/appStore.tsx';
import { getTelemetry } from '../services/api';
import type { TelemetryData } from '../types';

export default function MissionControl() {
  const { state, dispatch } = useAppStore();
  const [chartData, setChartData] = useState<TelemetryData[]>([]);

  // Instant baseline fetch on mount
  useEffect(() => {
    getTelemetry().then(res => {
      dispatch({ type: 'SET_TELEMETRY', payload: res.data });
      setChartData([res.data]);
    }).catch(() => {});
  }, [dispatch]);

  const onMessage = useCallback((data: TelemetryData) => {
    dispatch({ type: 'SET_TELEMETRY', payload: data });
    setChartData(prev => [...prev, data].slice(-80));
  }, [dispatch]);

  const { connected } = useWebSocket({
    url: 'ws://localhost:8000/ws/telemetry',
    onMessage,
  });

  const telem = state.telemetry;

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">

      {/* Top row: visualizer + controls + telemetry */}
      <div className="flex gap-4 flex-1 min-h-0" style={{ minHeight: 360 }}>

        {/* Drone visualizer — largest section */}
        <div className="flex-1 min-w-0">
          <DroneVisualizer
            heading={telem?.heading}
            altitude={telem?.altitude}
            mode={telem?.mode}
            isArmed={telem?.is_armed}
            isAirborne={telem?.is_airborne}
            pitch={telem?.pitch}
            roll={telem?.roll}
          />
        </div>

        {/* Drone command controls */}
        <div className="w-44 shrink-0">
          <div className="panel h-full p-3">
            <DroneControls />
          </div>
        </div>

        {/* Telemetry panel */}
        <div className="w-52 shrink-0">
          <div className="panel h-full p-3 overflow-y-auto">
            <TelemetryPanel data={telem ?? null} />
          </div>
        </div>
      </div>

      {/* WebSocket status bar */}
      <div className="flex items-center gap-2 px-1">
        <div className={`status-dot ${connected ? 'bg-status-green' : 'bg-status-red'}`} />
        <span className="text-xs text-text-muted font-mono uppercase tracking-wider">
          {connected ? 'TELEMETRY STREAM ACTIVE' : 'CONNECTING TO TELEMETRY…'}
        </span>
        {telem && (
          <>
            <span className="text-border-strong">|</span>
            <span className="text-xs font-mono text-text-muted">{telem.source}</span>
          </>
        )}
      </div>

      {/* Bottom row: charts */}
      <div className="flex gap-4 h-44 shrink-0">
        <div className="flex-1 min-w-0">
          <TelemetryChart
            data={chartData}
            dataKey="altitude"
            color="#1a9fd4"
            name="ALTITUDE"
            unit="m"
          />
        </div>
        <div className="flex-1 min-w-0">
          <TelemetryChart
            data={chartData}
            dataKey="velocity"
            color="#22c55e"
            name="VELOCITY"
            unit="m/s"
          />
        </div>
        <div className="flex-1 min-w-0">
          <TelemetryChart
            data={chartData}
            dataKey="battery"
            color="#f59e0b"
            name="BATTERY"
            unit="%"
          />
        </div>
      </div>
    </div>
  );
}
