import { useEffect, useState, useCallback } from 'react';
import { getROS2Nodes, getROS2Topics } from '../services/api';
import type { ROS2Node, ROS2Topic } from '../types';
import { Search, RefreshCw } from 'lucide-react';

// ─── Node Graph ───────────────────────────────────────────────────────────────

const NODE_LAYOUT: Record<string, { x: number; y: number }> = {
  camera_node:       { x: 80,  y: 60  },
  imu_node:          { x: 80,  y: 160 },
  gps_node:          { x: 80,  y: 260 },
  cv_node:           { x: 320, y: 60  },
  drone_controller:  { x: 560, y: 160 },
  mission_planner:   { x: 560, y: 300 },
};

const EDGES = [
  { from: 'camera_node',      to: 'cv_node',           label: '/camera/image_raw' },
  { from: 'cv_node',          to: 'drone_controller',  label: '/detections' },
  { from: 'imu_node',         to: 'drone_controller',  label: '/imu/data' },
  { from: 'gps_node',         to: 'drone_controller',  label: '/gps/fix' },
  { from: 'drone_controller', to: 'mission_planner',   label: '/drone/state' },
];

function NodeGraph({ nodes, selected, onSelect }: {
  nodes: ROS2Node[];
  selected: ROS2Node | null;
  onSelect: (n: ROS2Node | null) => void;
}) {
  const nodeMap = Object.fromEntries(nodes.map(n => [n.name, n]));

  return (
    <div className="relative w-full h-full overflow-hidden bg-surface-1 rounded-lg">
      {/* Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="ros2-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#253347" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ros2-grid)" />
      </svg>

      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 760 380" preserveAspectRatio="xMidYMid meet">
        {/* Edges */}
        {EDGES.map((edge, i) => {
          const src = NODE_LAYOUT[edge.from];
          const dst = NODE_LAYOUT[edge.to];
          if (!src || !dst) return null;
          const mx = (src.x + 100 + dst.x) / 2;
          const my = (src.y + 20 + dst.y + 20) / 2;
          return (
            <g key={i}>
              <line
                x1={src.x + 100} y1={src.y + 20}
                x2={dst.x} y2={dst.y + 20}
                stroke="#1e2a3a" strokeWidth="1.5"
                markerEnd="url(#arrow)"
              />
              <text
                x={mx} y={my - 6}
                textAnchor="middle"
                fontSize="8"
                fill="#4d6380"
                fontFamily="JetBrains Mono, monospace"
              >
                {edge.label}
              </text>
            </g>
          );
        })}

        {/* Arrow marker */}
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#253347" />
          </marker>
        </defs>

        {/* Nodes */}
        {Object.entries(NODE_LAYOUT).map(([name, pos]) => {
          const node = nodeMap[name];
          const isActive = node?.status === 'ACTIVE';
          const isSelected = selected?.name === name;
          return (
            <g
              key={name}
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={() => onSelect(selected?.name === name ? null : (node ?? null))}
              style={{ cursor: 'pointer' }}
            >
              <rect
                width="100" height="40" rx="4"
                fill={isSelected ? '#1a2535' : '#111620'}
                stroke={isSelected ? '#1a9fd4' : isActive ? '#253347' : '#1e2a3a'}
                strokeWidth={isSelected ? 1.5 : 1}
              />
              <circle
                cx="12" cy="20" r="4"
                fill={isActive ? '#22c55e' : '#4d6380'}
              />
              <text
                x="22" y="16"
                fontSize="9"
                fill="#e8edf5"
                fontFamily="Inter, sans-serif"
                fontWeight="600"
              >
                {name.replace('_', '\n')}
              </text>
              <text
                x="22" y="28"
                fontSize="7.5"
                fill="#4d6380"
                fontFamily="JetBrains Mono, monospace"
              >
                {node?.status ?? '—'}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Topic Table ──────────────────────────────────────────────────────────────

function TopicRow({ t }: { t: ROS2Topic }) {
  return (
    <tr className="border-b border-border-subtle hover:bg-surface-3 transition-colors">
      <td className="py-2 px-3 font-mono text-xs text-accent">{t.name}</td>
      <td className="py-2 px-3 font-mono text-xs text-text-muted">{t.type.split('/').pop()}</td>
      <td className="py-2 px-3 text-xs text-text-secondary">{t.publisher}</td>
      <td className="py-2 px-3 text-xs text-text-secondary">{t.subscribers.join(', ')}</td>
      <td className="py-2 px-3 font-mono text-xs text-text-primary">{t.rate} Hz</td>
      <td className="py-2 px-3">
        <span className={t.status === 'ACTIVE' ? 'badge-active' : 'badge-error'}>
          {t.status}
        </span>
      </td>
    </tr>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ROS2Lab() {
  const [nodes, setNodes] = useState<ROS2Node[]>([]);
  const [topics, setTopics] = useState<ROS2Topic[]>([]);
  const [selected, setSelected] = useState<ROS2Node | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [nr, tr] = await Promise.all([getROS2Nodes(), getROS2Topics()]);
      setNodes(nr.data);
      setTopics(tr.data);
    } catch {
      // silently keep old data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 3000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const filteredTopics = topics.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-text-primary tracking-tight">ROS2 Lab</h2>
          <span className="badge-demo">DEMO SIMULATION</span>
          <span className="text-text-muted text-xs">{nodes.length} nodes · {topics.length} topics</span>
        </div>
        <button
          className="btn-secondary flex items-center gap-2 text-xs py-1.5 px-3"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Top: Node graph + node detail */}
      <div className="flex gap-4 h-80 shrink-0">
        <div className="flex-1 panel overflow-hidden">
          <div className="panel-header">
            <span className="telemetry-label">NODE GRAPH</span>
            <span className="text-2xs text-text-muted font-mono">Click a node for details</span>
          </div>
          <div className="h-[calc(100%-44px)]">
            <NodeGraph nodes={nodes} selected={selected} onSelect={setSelected} />
          </div>
        </div>

        {/* Node detail panel */}
        <div className="w-64 shrink-0 panel overflow-hidden">
          <div className="panel-header">
            <span className="telemetry-label">NODE DETAIL</span>
          </div>
          <div className="p-4 text-sm">
            {selected ? (
              <div className="flex flex-col gap-3">
                <div>
                  <div className="telemetry-label text-2xs mb-1">NAME</div>
                  <p className="font-mono text-sm text-text-primary">{selected.name}</p>
                </div>
                <div>
                  <div className="telemetry-label text-2xs mb-1">NAMESPACE</div>
                  <p className="font-mono text-xs text-text-secondary">{selected.namespace}</p>
                </div>
                <div>
                  <div className="telemetry-label text-2xs mb-1">STATUS</div>
                  <span className={selected.status === 'ACTIVE' ? 'badge-active' : 'badge-error'}>
                    {selected.status}
                  </span>
                </div>
                <div>
                  <div className="telemetry-label text-2xs mb-2">PUBLISHES</div>
                  {selected.published_topics.length > 0 ? (
                    selected.published_topics.map(t => (
                      <p key={t} className="font-mono text-xs text-accent mb-1">{t}</p>
                    ))
                  ) : (
                    <p className="text-xs text-text-muted">—</p>
                  )}
                </div>
                <div>
                  <div className="telemetry-label text-2xs mb-2">SUBSCRIBES</div>
                  {selected.subscribed_topics.length > 0 ? (
                    selected.subscribed_topics.map(t => (
                      <p key={t} className="font-mono text-xs text-text-secondary mb-1">{t}</p>
                    ))
                  ) : (
                    <p className="text-xs text-text-muted">—</p>
                  )}
                </div>
                <div className="pt-2 border-t border-border-subtle">
                  <p className="text-2xs text-text-muted font-mono">{selected.source}</p>
                </div>
              </div>
            ) : (
              <p className="text-text-muted text-xs">Select a node in the graph to view details.</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Topic monitor */}
      <div className="flex-1 min-h-0 panel flex flex-col overflow-hidden">
        <div className="panel-header shrink-0">
          <span className="telemetry-label">TOPIC MONITOR</span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter topics…"
                className="bg-surface-3 border border-border-subtle rounded pl-8 pr-3 py-1 text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent w-48"
              />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface-2 z-10">
              <tr className="border-b border-border-subtle">
                {['TOPIC', 'TYPE', 'PUBLISHER', 'SUBSCRIBERS', 'RATE', 'STATUS'].map(h => (
                  <th key={h} className="px-3 py-2 telemetry-label text-2xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTopics.map(t => <TopicRow key={t.name} t={t} />)}
            </tbody>
          </table>
          {filteredTopics.length === 0 && (
            <div className="flex items-center justify-center h-24 text-text-muted text-xs">
              No topics matching "{search}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
