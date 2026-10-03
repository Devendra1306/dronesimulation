import { useEffect, useState } from 'react';
import { getEdgeDevices, runEdgeBenchmark } from '../services/api';
import type { EdgeDevice } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Cpu, Zap, BatteryCharging, Clock, Play, RefreshCw, Layers } from 'lucide-react';

const COLORS = ['#1a9fd4', '#22c55e', '#f59e0b', '#a855f7', '#38bdf8'];

function ArchDiagram() {
  const steps = [
    { label: 'UAV PLATFORM', sub: 'Airframe & Power', color: '#161d2a' },
    { label: 'SENSORS & CAMERA', sub: 'IMU / MIPI CSI-2', color: '#1a2537' },
    { label: 'EDGE COMPUTER', sub: 'Jetson / Companion Pi', color: '#1e2d42' },
    { label: 'ON-DEVICE AI', sub: 'TensorRT / TFLite', color: '#1a2537' },
    { label: 'MISSION DECISION', sub: 'Avoidance / Guidance', color: '#161d2a' },
    { label: 'FLIGHT ACTION', sub: 'PX4 / ArduPilot / ROS2', color: '#111620' },
  ];

  return (
    <div className="flex items-center gap-2 py-3 px-3 overflow-x-auto bg-surface-2 rounded-xl border border-border-subtle">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2 shrink-0">
          <div
            className="border border-border-subtle rounded-lg px-3.5 py-2.5 text-center min-w-[125px]"
            style={{ background: s.color }}
          >
            <div className="font-mono text-2xs font-bold text-text-primary mb-0.5 tracking-wider">{s.label}</div>
            <div className="text-[10px] text-text-muted font-mono">{s.sub}</div>
          </div>
          {i < steps.length - 1 && (
            <svg width="20" height="14" className="shrink-0">
              <path d="M 0 7 L 14 7 M 9 3 L 14 7 L 9 11" stroke="#2d3f57" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}

function DeviceRow({ device, i }: { device: EdgeDevice; i: number }) {
  const barPct = Math.min(100, (device.inference_time_ms / 350) * 100);
  const isSample = device.source.includes('DEMO') || device.source.includes('SAMPLE');

  return (
    <tr className="border-b border-border-subtle hover:bg-surface-3 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-accent" />
          <span className="text-xs text-text-primary font-medium font-mono">{device.name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-surface-0 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${barPct}%`, background: COLORS[i % COLORS.length] }}
            />
          </div>
          <span className="font-mono text-xs text-text-primary">{device.inference_time_ms} ms</span>
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-text-primary">{device.fps} FPS</td>
      <td className="px-4 py-3 font-mono text-xs text-text-secondary">{device.memory_mb} MB</td>
      <td className="px-4 py-3 text-xs text-text-secondary font-mono">{device.model}</td>
      <td className="px-4 py-3 font-mono text-xs text-text-secondary">{device.power_watts} W</td>
      <td className="px-4 py-3">
        {isSample ? (
          <span className="badge-demo text-[10px] font-mono">SAMPLE PROFILE</span>
        ) : (
          <span className="badge-active text-[10px] font-mono">HOST BENCHMARK</span>
        )}
      </td>
    </tr>
  );
}

export default function EdgeAI() {
  const [devices, setDevices] = useState<EdgeDevice[]>([]);
  const [benchmarking, setBenchmarking] = useState(false);

  useEffect(() => {
    getEdgeDevices().then(r => setDevices(r.data)).catch(() => {});
  }, []);

  const handleBenchmark = async () => {
    setBenchmarking(true);
    try {
      const res = await runEdgeBenchmark();
      setDevices(prev => {
        const withoutHost = prev.filter(d => !d.name.includes('Host'));
        return [
          ...withoutHost,
          {
            name: 'Local Dev Machine (Host)',
            inference_time_ms: res.data.inference_time_ms,
            fps: res.data.fps,
            memory_mb: res.data.memory_mb,
            model: res.data.model,
            power_watts: res.data.power_watts,
            source: 'MEASURED_HOST_HARDWARE',
          },
        ];
      });
    } catch (err) {
      console.error('Benchmark failed:', err);
    } finally {
      setBenchmarking(false);
    }
  };

  const chartData = devices.map(d => ({
    name: d.name.replace('NVIDIA ', '').replace('Local Dev Machine ', 'Host Dev '),
    ms: d.inference_time_ms
  }));

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-text-primary font-mono tracking-tight">
            UAV Edge AI Architecture & Deployment
          </h2>
          <span className="badge-demo text-[10px] font-mono">EMBEDDED HW PROFILING</span>
        </div>
        <button
          onClick={handleBenchmark}
          disabled={benchmarking}
          className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3 font-semibold disabled:opacity-50 font-mono"
        >
          {benchmarking ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Running Local CNN Inference Layer...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              Profile Local Host GPU/CPU
            </>
          )}
        </button>
      </div>

      {/* Autonomous Perception-to-Action Flow Diagram */}
      <div className="shrink-0 flex flex-col gap-1.5">
        <span className="telemetry-label text-2xs font-mono">AUTONOMOUS EDGE PIPELINE ARCHITECTURE</span>
        <ArchDiagram />
      </div>

      {/* Engineering Trade-off Cards */}
      <div className="grid grid-cols-3 gap-3 shrink-0">
        <div className="bg-surface-2 border border-border-subtle rounded-xl p-3.5 flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-accent" />
            <span className="font-mono text-xs font-bold text-text-primary">Sub-40ms Flight Latency</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Autonomous obstacle avoidance at 12 m/s requires tight sub-40ms reaction loops. Edge companion computers process frames locally without cloud round-trip delay.
          </p>
        </div>

        <div className="bg-surface-2 border border-border-subtle rounded-xl p-3.5 flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <BatteryCharging className="w-4 h-4 text-status-amber" />
            <span className="font-mono text-xs font-bold text-text-primary">SWaP Constraints (Size & Power)</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Drones balance payload weight with battery capacity. Targets like NVIDIA Jetson Nano operate within a strict 5W–15W power envelope directly off 4S/6S LiPo power distribution.
          </p>
        </div>

        <div className="bg-surface-2 border border-border-subtle rounded-xl p-3.5 flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-status-green" />
            <span className="font-mono text-xs font-bold text-text-primary">Flight Controller Link (MAVLink)</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            The edge board sends high-level avoidance setpoints to the flight controller (PX4/ArduPilot) via MAVLink over UART or ROS2 micro-XRCE-DDS bridge.
          </p>
        </div>
      </div>

      {/* Device comparison table + Latency Chart */}
      <div className="grid grid-cols-5 gap-4 shrink-0 pb-4">
        {/* Table */}
        <div className="col-span-3 panel overflow-hidden flex flex-col">
          <div className="panel-header shrink-0">
            <span className="telemetry-label font-mono">EMBEDDED UAV TARGET PROFILES</span>
            <span className="text-2xs text-text-muted font-mono">Sample Specifications for UAS Payloads</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-2">
                  <th className="px-4 py-2 telemetry-label text-2xs">HARDWARE TARGET</th>
                  <th className="px-4 py-2 telemetry-label text-2xs">LATENCY</th>
                  <th className="px-4 py-2 telemetry-label text-2xs">THROUGHPUT</th>
                  <th className="px-4 py-2 telemetry-label text-2xs">RAM</th>
                  <th className="px-4 py-2 telemetry-label text-2xs">MODEL</th>
                  <th className="px-4 py-2 telemetry-label text-2xs">POWER</th>
                  <th className="px-4 py-2 telemetry-label text-2xs">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d, i) => <DeviceRow key={d.name} device={d} i={i} />)}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart */}
        <div className="col-span-2 panel overflow-hidden flex flex-col">
          <div className="panel-header shrink-0">
            <span className="telemetry-label font-mono">INFERENCE LATENCY COMPARISON</span>
            <span className="text-2xs text-text-muted font-mono">Lower is faster (ms)</span>
          </div>
          <div className="flex-1 p-3 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" vertical={false} />
                <XAxis dataKey="name" stroke="#4d6380" tick={{ fontSize: 10, fill: '#8fa3bd' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#4d6380" tick={{ fontSize: 10, fill: '#8fa3bd' }} unit="ms" />
                <Tooltip
                  contentStyle={{ background: '#111620', border: '1px solid #1e2a3a', borderRadius: '6px', fontSize: '11px', color: '#e8edf5' }}
                  formatter={(v: any) => [`${v} ms`, 'Latency']}
                />
                <Bar dataKey="ms" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
