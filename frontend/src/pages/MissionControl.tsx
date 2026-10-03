import { useEffect, useState, useCallback } from 'react';
import DroneVisualizer from '../components/drone/DroneVisualizer';
import TelemetryPanel from '../components/drone/TelemetryPanel';
import DroneControls from '../components/drone/DroneControls';
import TelemetryChart from '../components/charts/TelemetryChart';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAppStore } from '../store/appStore.tsx';
import { getTelemetry } from '../services/api';
import { WS_TELEMETRY_URL } from '../config/env';
import type { TelemetryData } from '../types';
import { Sliders, Activity, Columns, Radio, Clock, ShieldCheck, ShieldAlert } from 'lucide-react';

type DeckTab = 'split' | 'controls' | 'telemetry';

export default function MissionControl() {
  const { state, dispatch } = useAppStore();
  const [chartData, setChartData] = useState<TelemetryData[]>([]);
  const [deckTab, setDeckTab] = useState<DeckTab>('split');

  // Baseline fetch on mount
  useEffect(() => {
    getTelemetry()
      .then((res) => {
        dispatch({ type: 'SET_TELEMETRY', payload: res.data });
        setChartData([res.data]);
      })
      .catch(() => {});
  }, [dispatch]);

  const onMessage = useCallback(
    (data: TelemetryData) => {
      dispatch({ type: 'SET_TELEMETRY', payload: data });
      setChartData((prev) => [...prev, data].slice(-80));
    },
    [dispatch]
  );

  const { connected } = useWebSocket({
    url: WS_TELEMETRY_URL,
    onMessage,
  });

  const telem = state.telemetry;

  return (
    <div className="flex flex-col gap-4 h-full min-h-0 select-none pb-2">
      {/* Top Aerospace Mission Header Strip */}
      <div className="bg-surface-2 border border-border-subtle rounded-xl px-4 py-2.5 flex items-center justify-between shrink-0 shadow-sm">
        {/* Left: Stream Health & Source */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connected
                  ? 'bg-status-green shadow-[0_0_8px_#22c55e]'
                  : 'bg-status-red shadow-[0_0_8px_#ef4444] animate-pulse'
              }`}
            />
            <span className="font-mono text-xs font-bold text-text-primary uppercase tracking-wider">
              {connected ? 'AVIONICS STREAM LIVE' : 'CONNECTING TELEMETRY…'}
            </span>
          </div>

          <span className="text-border-DEFAULT">|</span>

          <div className="flex items-center gap-1.5 font-mono text-2xs text-text-muted">
            <Radio className="w-3 h-3 text-accent" />
            <span>ORIGIN:</span>
            <span className="text-text-primary font-semibold">
              {telem?.source || 'SIMULATION ODE'}
            </span>
          </div>
        </div>

        {/* Center: Mission Clock & Flight Status */}
        <div className="hidden md:flex items-center gap-4 font-mono text-xs">
          <div className="flex items-center gap-1.5 bg-surface-3 px-2.5 py-1 rounded-lg border border-border-subtle">
            <Clock className="w-3.5 h-3.5 text-accent" />
            <span className="text-text-muted text-2xs">MISSION TIME:</span>
            <span className="text-text-primary font-bold">
              {telem?.simulation_time ? `${telem.simulation_time.toFixed(1)}s` : '0.0s'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-surface-3 px-2.5 py-1 rounded-lg border border-border-subtle">
            {telem?.is_armed ? (
              <ShieldCheck className="w-3.5 h-3.5 text-status-green" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-status-amber" />
            )}
            <span className="text-text-muted text-2xs">INTERLOCK:</span>
            <span
              className={`font-bold ${
                telem?.is_armed ? 'text-status-green' : 'text-status-amber'
              }`}
            >
              {telem?.is_armed ? 'ARMED' : 'DISARMED'}
            </span>
          </div>
        </div>

        {/* Right: Operations Deck Tab Switcher */}
        <div className="flex items-center gap-1 bg-surface-3 p-1 rounded-lg border border-border-subtle font-mono text-xs">
          <button
            onClick={() => setDeckTab('split')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
              deckTab === 'split'
                ? 'bg-accent text-white font-bold shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
            title="Side-by-side Flight Controls & Avionics"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">DUAL DECK</span>
          </button>

          <button
            onClick={() => setDeckTab('controls')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
              deckTab === 'controls'
                ? 'bg-accent text-white font-bold shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
            title="Focus on Flight Controls"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CONTROLS</span>
          </button>

          <button
            onClick={() => setDeckTab('telemetry')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
              deckTab === 'telemetry'
                ? 'bg-accent text-white font-bold shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
            title="Focus on Telemetry Sensors"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">TELEMETRY</span>
          </button>
        </div>
      </div>

      {/* Main Mission Operations Grid */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-[460px]">
        {/* Left Stage: Primary Flight Display & Spatial HUD (Full flex width) */}
        <div className="flex-1 min-w-0 min-h-[380px] h-full flex flex-col">
          <DroneVisualizer
            heading={telem?.heading}
            altitude={telem?.altitude}
            velocity={telem?.velocity}
            mode={telem?.mode}
            isArmed={telem?.is_armed}
            isAirborne={telem?.is_airborne}
            pitch={telem?.pitch}
            roll={telem?.roll}
            source={telem?.source}
            simTime={telem?.simulation_time}
          />
        </div>

        {/* Right Stage: Mission Operations Deck */}
        <div className="shrink-0 flex gap-4 h-full">
          {/* Flight Controls Panel */}
          {(deckTab === 'split' || deckTab === 'controls') && (
            <div className="w-[285px] sm:w-[305px] panel p-3.5 flex flex-col h-full overflow-y-auto">
              <DroneControls
                isArmed={telem?.is_armed}
                isAirborne={telem?.is_airborne}
                mode={telem?.mode}
                source={telem?.source}
              />
            </div>
          )}

          {/* Telemetry Sensor Panel */}
          {(deckTab === 'split' || deckTab === 'telemetry') && (
            <div className="w-[285px] sm:w-[315px] panel p-3.5 flex flex-col h-full overflow-y-auto">
              <TelemetryPanel data={telem ?? null} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Stage: Synchronous Sensor Telemetry Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-48 shrink-0">
        <div className="min-w-0 h-full">
          <TelemetryChart
            data={chartData}
            dataKey="altitude"
            color="#0ea5e9"
            name="ALTITUDE PROFILE"
            unit="m"
          />
        </div>
        <div className="min-w-0 h-full">
          <TelemetryChart
            data={chartData}
            dataKey="velocity"
            color="#22c55e"
            name="GROUND VELOCITY"
            unit="m/s"
          />
        </div>
        <div className="min-w-0 h-full">
          <TelemetryChart
            data={chartData}
            dataKey="battery"
            color="#f59e0b"
            name="BATTERY LEVEL"
            unit="%"
          />
        </div>
      </div>
    </div>
  );
}
