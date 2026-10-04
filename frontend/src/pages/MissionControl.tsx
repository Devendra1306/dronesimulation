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
      {/* 4. Elegant White/Light Telemetry Status Panel */}
      <div className="bg-white border border-slate-200/90 rounded-2xl px-5 py-3 flex items-center justify-between shrink-0 shadow-card">
        {/* Left: Stream Health & Origin */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connected
                  ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                  : 'bg-rose-500 shadow-[0_0_8px_#ef4444] animate-pulse'
              }`}
            />
            <span className="font-semibold text-xs text-slate-800 tracking-wide font-mono">
              {connected ? 'AVIONICS STREAM ACTIVE' : 'CONNECTING TELEMETRY…'}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Radio className="w-3.5 h-3.5 text-sky-600" />
            <span className="text-slate-400 font-sans">Origin:</span>
            <span className="text-slate-700 font-medium font-mono">
              {telem?.source || 'SIMULATION ODE'}
            </span>
          </div>
        </div>

        {/* Center: Mission Clock & Interlock Status */}
        <div className="hidden md:flex items-center gap-5 text-xs font-mono">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span className="text-slate-400 font-sans text-[11px]">Mission Time:</span>
            <span className="text-slate-800 font-bold">
              {telem?.simulation_time ? `${telem.simulation_time.toFixed(1)}s` : '0.0s'}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70">
            {telem?.is_armed ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span className="text-slate-400 font-sans text-[11px]">Interlock:</span>
            <span
              className={`font-bold ${
                telem?.is_armed ? 'text-emerald-600' : 'text-slate-600'
              }`}
            >
              {telem?.is_armed ? 'ARMED' : 'DISARMED'}
            </span>
          </div>
        </div>

        {/* Right: Operations Deck Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/70 text-xs font-medium">
          <button
            onClick={() => setDeckTab('split')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              deckTab === 'split'
                ? 'bg-white text-slate-900 font-semibold shadow-subtle border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Side-by-side Flight Controls & Avionics"
          >
            <Columns className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">DUAL DECK</span>
          </button>

          <button
            onClick={() => setDeckTab('controls')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              deckTab === 'controls'
                ? 'bg-white text-slate-900 font-semibold shadow-subtle border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Focus on Flight Controls"
          >
            <Sliders className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">CONTROLS</span>
          </button>

          <button
            onClick={() => setDeckTab('telemetry')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              deckTab === 'telemetry'
                ? 'bg-white text-slate-900 font-semibold shadow-subtle border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Focus on Telemetry Sensors"
          >
            <Activity className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">TELEMETRY</span>
          </button>
        </div>
      </div>

      {/* Main Operations Grid */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-[460px]">
        {/* Left: Primary Flight Display (Central Drone View) */}
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

        {/* Right: Operations Deck */}
        <div className="shrink-0 flex gap-4 h-full">
          {/* Flight Controls Panel */}
          {(deckTab === 'split' || deckTab === 'controls') && (
            <div className="w-[285px] sm:w-[305px] bg-white border border-slate-200/90 rounded-2xl shadow-card p-4 flex flex-col h-full overflow-y-auto">
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
            <div className="w-[285px] sm:w-[315px] bg-white border border-slate-200/90 rounded-2xl shadow-card p-4 flex flex-col h-full overflow-y-auto">
              <TelemetryPanel data={telem ?? null} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Stage: Synchronous Sensor Telemetry Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-48 shrink-0">
        <div className="min-w-0 h-full">
          <TelemetryChart
            data={chartData}
            dataKey="altitude"
            color="#0EA5E9"
            name="ALTITUDE PROFILE"
            unit="m"
          />
        </div>
        <div className="min-w-0 h-full">
          <TelemetryChart
            data={chartData}
            dataKey="velocity"
            color="#16A34A"
            name="GROUND VELOCITY"
            unit="m/s"
          />
        </div>
        <div className="min-w-0 h-full">
          <TelemetryChart
            data={chartData}
            dataKey="battery"
            color="#F59E0B"
            name="BATTERY LEVEL"
            unit="%"
          />
        </div>
      </div>
    </div>
  );
}
