import { useEffect, useState } from 'react';
import { getEdgeDevices } from '../services/api';
import type { EdgeDevice } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Cpu, Zap, Database, Clock } from 'lucide-react';

const COLORS = ['#1a9fd4', '#22c55e', '#f59e0b', '#a855f7'];

function ArchDiagram() {
  const steps = [
    { label: 'CAMERA', sub: 'Image capture', color: '#253347' },
    { label: 'EDGE DEVICE', sub: 'Jetson / RPi', color: '#1a2535' },
    { label: 'AI MODEL', sub: 'YOLOv8 / MobileNet', color: '#1a2535' },
    { label: 'INFERENCE', sub: 'On-device compute', color: '#1a2535' },
    { label: 'RESULT', sub: 'Detections + Action', color: '#1a2535' },
  ];

  return (
    <div className="flex items-center gap-2 py-4 px-2 overflow-x-auto">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2 shrink-0">
          <div
            className="border border-border rounded-lg px-4 py-3 text-center min-w-[110px]"
            style={{ background: s.color }}
          >
            <div className="font-mono text-xs font-bold text-text-primary mb-1">{s.label}</div>
            <div className="text-2xs text-text-muted">{s.sub}</div>
          </div>
          {i < steps.length - 1 && (
            <svg width="24" height="16" className="shrink-0">
              <path d="M 0 8 L 18 8 M 12 3 L 18 8 L 12 13" stroke="#253347" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}

function DeviceRow({ device, i }: { device: EdgeDevice; i: number }) {
  const barPct = Math.min(100, (device.inference_time_ms / 400) * 100);
  return (
    <tr className="border-b border-border-subtle hover:bg-surface-3 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-text-muted" />
          <span className="text-sm text-text-primary font-medium">{device.name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-surface-0 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${barPct}%`, background: COLORS[i % COLORS.length] }}
            />
          </div>
          <span className="font-mono text-xs text-text-primary">{device.inference_time_ms}ms</span>
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-text-primary">{device.fps} fps</td>
      <td className="px-4 py-3 font-mono text-xs text-text-secondary">{device.memory_mb} MB</td>
      <td className="px-4 py-3 text-xs text-text-secondary">{device.model}</td>
      <td className="px-4 py-3 font-mono text-xs text-text-secondary">{device.power_watts}W</td>
      <td className="px-4 py-3">
        <span className="badge-demo">{device.source}</span>
      </td>
    </tr>
  );
}

export default function EdgeAI() {
  const [devices, setDevices] = useState<EdgeDevice[]>([]);

  useEffect(() => {
    getEdgeDevices().then(r => setDevices(r.data)).catch(() => {});
  }, []);

  const chartData = devices.map(d => ({ name: d.name.replace('NVIDIA ', ''), ms: d.inference_time_ms }));

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <h2 className="text-base font-bold text-text-primary">Edge AI</h2>
        <span className="badge-demo">DEMO / SAMPLE DATA</span>
      </div>

      {/* Explainer cards */}
      <div className="grid grid-cols-3 gap-3 shrink-0">
        {[
          {
            icon: Zap,
            title: 'What is Edge AI?',
            body: 'Edge AI runs inference on-device rather than in the cloud. This reduces latency, bandwidth, and privacy concerns — critical for autonomous drone operations.',
          },
          {
            icon: Clock,
            title: 'Why Deploy on the Edge?',
            body: 'Drones need sub-50ms reaction times for obstacle avoidance. Cloud round-trips add 100–500ms. Edge inference enables real-time control at speed.',
          },
          {
            icon: Database,
            title: 'Jetson vs Raspberry Pi',
            body: 'Jetson provides a dedicated GPU for 10–80ms inference. Raspberry Pi 4 uses CPU only, resulting in 300–500ms latency. Trade-off: cost vs performance.',
          },
        ].map(c => (
          <div key={c.title} className="panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <c.icon className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-text-primary">{c.title}</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>

      {/* Architecture flow */}
      <div className="panel shrink-0">
        <div className="panel-header">
          <span className="telemetry-label">EDGE INFERENCE PIPELINE</span>
        </div>
        <div className="px-4">
          <ArchDiagram />
        </div>
      </div>

      {/* Inference time bar chart */}
      <div className="panel shrink-0" style={{ height: 200 }}>
        <div className="panel-header">
          <span className="telemetry-label">INFERENCE TIME COMPARISON</span>
          <span className="badge-demo">SAMPLE</span>
        </div>
        <div className="px-4 pb-4" style={{ height: 148 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" horizontal vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#4d6380', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4d6380', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#161d2a', border: '1px solid #253347', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#8fa3bd' }}
                itemStyle={{ color: '#e8edf5', fontFamily: 'JetBrains Mono' }}
                formatter={(v: number) => [`${v}ms`, 'Inference']}
              />
              <Bar dataKey="ms" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Device table */}
      <div className="panel shrink-0">
        <div className="panel-header">
          <span className="telemetry-label">DEVICE COMPARISON</span>
          <span className="badge-demo">SAMPLE DATA — NOT MEASURED FROM REAL HARDWARE</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-subtle">
                {['DEVICE', 'INFERENCE TIME', 'FPS', 'MEMORY', 'MODEL', 'POWER', 'SOURCE'].map(h => (
                  <th key={h} className="px-4 py-2 telemetry-label text-2xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devices.map((d, i) => <DeviceRow key={d.name} device={d} i={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
