import { useState } from 'react';
import Panel from '../components/common/Panel';
import { FlaskConical, Plus, CheckCircle, Clock, AlertCircle, PlayCircle } from 'lucide-react';

interface ExperimentItem {
  id: string;
  name: string;
  description: string;
  environment: string;
  drone_config: string;
  algorithm: string;
  status: 'Running' | 'Completed' | 'Pending' | 'Failed';
  result?: string;
  start_time: string;
  source: string;
}

const INITIAL_EXPERIMENTS: ExperimentItem[] = [
  {
    id: 'EXP-001',
    name: 'Obstacle Detection & Avoidance',
    description: 'YOLOv8n model evaluated on urban simulated obstacle field with stereo camera disparity validation.',
    environment: 'Gazebo Urban Airfield',
    drone_config: 'Quadrotor X500 (Forward FPV Gimbal)',
    algorithm: 'YOLOv8n + Depth Disparity Filter',
    status: 'Completed',
    result: '92.4% Detection Accuracy (18ms avg inference)',
    start_time: '2026-10-03 14:10:00',
    source: 'DEMO_SAMPLE',
  },
  {
    id: 'EXP-002',
    name: 'Altitude Hold PID Stability Under Gusts',
    description: 'Closed-loop Z-velocity step response under simulated 12 knot crosswinds.',
    environment: 'Demo Windfield World',
    drone_config: 'PX4 Generic Multicopter',
    algorithm: 'Discrete PID Controller (Kp=1.4, Ki=0.08, Kd=0.35)',
    status: 'Completed',
    result: '±0.28m RMS deviation achieved',
    start_time: '2026-10-03 14:35:12',
    source: 'DEMO_SAMPLE',
  },
  {
    id: 'EXP-003',
    name: 'GPS Waypoint Trajectory Following',
    description: 'Multi-node polynomial trajectory interpolation across 8 spatial geofence coordinates.',
    environment: 'Demoware GPS Coordinates',
    drone_config: 'Autonomous Hexacopter Long-Range',
    algorithm: 'Dubins Path Planner',
    status: 'Running',
    result: 'In progress (Waypoint 5 of 8)',
    start_time: '2026-10-03 15:02:44',
    source: 'DEMO_SAMPLE',
  },
  {
    id: 'EXP-004',
    name: 'Edge AI Quantization (FP16 vs INT8)',
    description: 'Latency vs accuracy benchmark testing TensorRT acceleration on NVIDIA Jetson Xavier NX edge target.',
    environment: 'Hardware-in-the-Loop Edge Testbed',
    drone_config: 'Embedded Companion Board',
    algorithm: 'MobileNetV3-SSD TensorRT',
    status: 'Pending',
    result: 'Queued for hardware bench',
    start_time: '2026-10-03 15:45:00',
    source: 'DEMO_SAMPLE',
  },
];

export default function Experiments() {
  const [experiments, setExperiments] = useState<ExperimentItem[]>(INITIAL_EXPERIMENTS);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    environment: 'Gazebo Urban Airfield',
    drone_config: 'Quadrotor X500',
    algorithm: 'YOLOv8n Vision Adapter',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const newExp: ExperimentItem = {
      id: `EXP-00${experiments.length + 1}`,
      name: formData.name,
      description: formData.description,
      environment: formData.environment,
      drone_config: formData.drone_config,
      algorithm: formData.algorithm,
      status: 'Running',
      result: 'Experiment benchmark initialized...',
      start_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      source: 'DEMO_SAMPLE',
    };

    setExperiments([newExp, ...experiments]);
    setShowModal(false);
    setFormData({
      name: '',
      description: '',
      environment: 'Gazebo Urban Airfield',
      drone_config: 'Quadrotor X500',
      algorithm: 'YOLOv8n Vision Adapter',
    });
  };

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      {/* Page Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-text-primary">Research & Experiment Registry</h2>
          <span className="badge-demo">DEMO / BENCHMARK ARCHIVE</span>
          <span className="text-xs text-text-muted">{experiments.length} recorded experimental trials</span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
        >
          <Plus className="w-3.5 h-3.5" />
          Create New Trial
        </button>
      </div>

      {/* Grid of Experiments */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-4">
          {experiments.map((exp) => (
            <div
              key={exp.id}
              className="bg-surface-2 border border-border-subtle hover:border-border-DEFAULT rounded-xl p-4 flex flex-col justify-between transition-colors shadow-sm"
            >
              <div>
                {/* Header row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-accent" />
                    <span className="font-mono text-xs font-bold text-text-primary">{exp.id}</span>
                  </div>
                  <span
                    className={`text-2xs font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 ${
                      exp.status === 'Completed'
                        ? 'bg-status-green-dim text-status-green'
                        : exp.status === 'Running'
                        ? 'bg-status-blue-dim text-status-blue animate-pulse'
                        : 'bg-surface-4 text-text-muted'
                    }`}
                  >
                    {exp.status === 'Completed' && <CheckCircle className="w-3 h-3" />}
                    {exp.status === 'Running' && <PlayCircle className="w-3 h-3" />}
                    {exp.status === 'Pending' && <Clock className="w-3 h-3" />}
                    {exp.status}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-sm font-semibold text-text-primary mb-1.5">{exp.name}</h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-3">{exp.description}</p>

                {/* Configuration Specs */}
                <div className="bg-surface-1 rounded-lg p-2.5 space-y-1.5 text-2xs font-mono border border-border-subtle mb-3">
                  <div className="flex justify-between">
                    <span className="text-text-muted">WORLD:</span>
                    <span className="text-text-primary truncate max-w-[200px]">{exp.environment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">AIRFRAME:</span>
                    <span className="text-text-primary truncate max-w-[200px]">{exp.drone_config}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">MODEL/PIPELINE:</span>
                    <span className="text-accent truncate max-w-[200px]">{exp.algorithm}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Result & Timestamp */}
              <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-2xs">
                <div className="font-mono text-text-primary font-medium truncate max-w-[240px]">
                  <span className="text-text-muted mr-1">OUTCOME:</span>
                  {exp.result}
                </div>
                <div className="text-text-muted font-mono">{exp.start_time.substring(5, 16)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Creating Experiment */}
      {showModal && (
        <div className="fixed inset-0 bg-surface-0/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-2 border border-border rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-text-primary mb-1">Create New Trial Experiment</h3>
            <p className="text-xs text-text-muted mb-4">
              Configure simulation parameters, airframe model, and algorithm evaluation benchmark.
            </p>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="text-text-muted block mb-1">Experiment Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Optical Flow Ground Velocity Tracking"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface-3 border border-border-subtle rounded p-2 text-text-primary focus:border-accent outline-none"
                />
              </div>

              <div>
                <label className="text-text-muted block mb-1">Description & Objective</label>
                <textarea
                  rows={2}
                  placeholder="Benchmarking Lucas-Kanade optical flow vs GPS velocity estimator..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-surface-3 border border-border-subtle rounded p-2 text-text-primary focus:border-accent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-text-muted block mb-1">Environment</label>
                  <select
                    value={formData.environment}
                    onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                    className="w-full bg-surface-3 border border-border-subtle rounded p-2 text-text-primary focus:border-accent outline-none"
                  >
                    <option>Gazebo Urban Airfield</option>
                    <option>Demo Windfield World</option>
                    <option>Forest Canopy Obstacle Maze</option>
                  </select>
                </div>
                <div>
                  <label className="text-text-muted block mb-1">Airframe Config</label>
                  <select
                    value={formData.drone_config}
                    onChange={(e) => setFormData({ ...formData, drone_config: e.target.value })}
                    className="w-full bg-surface-3 border border-border-subtle rounded p-2 text-text-primary focus:border-accent outline-none"
                  >
                    <option>Quadrotor X500</option>
                    <option>Autonomous Hexacopter</option>
                    <option>Fixed-Wing VTOL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-text-muted block mb-1">Algorithm / Pipeline Target</label>
                <input
                  type="text"
                  value={formData.algorithm}
                  onChange={(e) => setFormData({ ...formData, algorithm: e.target.value })}
                  className="w-full bg-surface-3 border border-border-subtle rounded p-2 text-text-primary focus:border-accent outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary py-1.5 px-3 text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-1.5 px-4 text-xs font-semibold">
                  Launch Experiment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
