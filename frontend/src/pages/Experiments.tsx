import { useState, useEffect, useCallback } from 'react';
import Panel from '../components/common/Panel';
import { 
  getExperiments, createExperiment, deleteExperiment, 
  getTelemetryHistory, getCVResults, getSystemEvents 
} from '../services/api';
import type { Experiment } from '../types';
import { 
  FlaskConical, Plus, CheckCircle, Clock, PlayCircle, 
  Search, RefreshCw, Trash2, Eye, Database, Activity, 
  FileText, X, AlertTriangle 
} from 'lucide-react';

export default function Experiments() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);
  const [expTelemetry, setExpTelemetry] = useState<any[]>([]);
  const [expCVResults, setExpCVResults] = useState<any[]>([]);
  const [expEvents, setExpEvents] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    simulation_environment: 'urban_airfield_sitl',
    drone_model: 'quadrotor_x500_px4',
    cv_algorithm: 'opencv_canny_hierarchy',
  });

  const fetchExperiments = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;
      const res = await getExperiments(params);
      setExperiments(res.data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchExperiments();
  }, [fetchExperiments]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      await createExperiment({
        name: formData.name,
        description: formData.description,
        simulation_environment: formData.simulation_environment,
        drone_model: formData.drone_model,
        cv_algorithm: formData.cv_algorithm,
        status: 'RUNNING',
      });
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        simulation_environment: 'urban_airfield_sitl',
        drone_model: 'quadrotor_x500_px4',
        cv_algorithm: 'opencv_canny_hierarchy',
      });
      await fetchExperiments();
    } catch (err) {
      console.error('Failed to create experiment:', err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete experiment ${id}?`)) return;
    try {
      await deleteExperiment(id);
      if (selectedExp?.experiment_id === id) {
        setSelectedExp(null);
      }
      await fetchExperiments();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleOpenDetails = async (exp: Experiment) => {
    setSelectedExp(exp);
    setLoadingDetails(true);
    try {
      const [tRes, cvRes, evRes] = await Promise.all([
        getTelemetryHistory({ experiment_id: exp.experiment_id, limit: 30 }).catch(() => ({ data: [] })),
        getCVResults({ experiment_id: exp.experiment_id, limit: 20 }).catch(() => ({ data: [] })),
        getSystemEvents({ limit: 20 }).catch(() => ({ data: [] }))
      ]);
      setExpTelemetry(tRes.data);
      setExpCVResults(cvRes.data);
      setExpEvents(evRes.data.filter((e: any) => !e.experiment_id || e.experiment_id === exp.experiment_id));
    } catch {
      // Keep empty
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      {/* Page Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-text-primary">Research & Experiment Registry</h2>
          <span className="badge-active flex items-center gap-1 font-mono">
            <Database className="w-3 h-3" />
            MONGODB PERSISTENCE
          </span>
          <span className="text-xs text-text-muted">{experiments.length} trials recorded</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchExperiments}
            className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3 font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Experiment
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center justify-between gap-4 shrink-0 bg-surface-2 p-2.5 rounded-lg border border-border-subtle">
        <div className="flex items-center gap-2">
          {['ALL', 'RUNNING', 'COMPLETED', 'FAILED', 'DRAFT'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-2xs font-semibold px-2.5 py-1 rounded transition-colors ${
                statusFilter === st
                  ? 'bg-accent text-white'
                  : 'bg-surface-3 text-text-muted hover:text-text-primary'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search experiments…"
            className="w-full bg-surface-3 border border-border-subtle rounded pl-8 pr-3 py-1 text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 overflow-y-auto pr-1">
        {experiments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-text-muted">
            <FlaskConical className="w-8 h-8 opacity-40 text-accent" />
            <span className="text-xs">No persisted experiments matching current filters.</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {experiments.map((exp) => (
              <div
                key={exp.experiment_id}
                onClick={() => handleOpenDetails(exp)}
                className={`bg-surface-2 border rounded-xl p-4 flex flex-col justify-between transition-colors shadow-sm cursor-pointer ${
                  selectedExp?.experiment_id === exp.experiment_id
                    ? 'border-accent ring-1 ring-accent/30'
                    : 'border-border-subtle hover:border-border-DEFAULT'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-accent" />
                      <span className="font-mono text-xs font-bold text-text-primary">{exp.experiment_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-2xs font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 ${
                          exp.status === 'COMPLETED'
                            ? 'bg-status-green-dim text-status-green'
                            : exp.status === 'RUNNING'
                            ? 'bg-status-blue-dim text-status-blue animate-pulse'
                            : exp.status === 'FAILED'
                            ? 'bg-status-red-dim text-status-red'
                            : 'bg-surface-4 text-text-muted'
                        }`}
                      >
                        {exp.status === 'COMPLETED' && <CheckCircle className="w-3 h-3" />}
                        {exp.status === 'RUNNING' && <PlayCircle className="w-3 h-3" />}
                        {exp.status}
                      </span>
                      <button
                        onClick={(e) => handleDelete(exp.experiment_id, e)}
                        title="Delete from MongoDB"
                        className="text-text-muted hover:text-status-red transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-text-primary mb-1.5">{exp.name}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed mb-3">{exp.description}</p>

                  <div className="bg-surface-1 rounded-lg p-2.5 space-y-1.5 text-2xs font-mono border border-border-subtle mb-3">
                    <div className="flex justify-between">
                      <span className="text-text-muted">ENV:</span>
                      <span className="text-text-primary truncate max-w-[200px]">{exp.simulation_environment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">AIRFRAME:</span>
                      <span className="text-text-primary truncate max-w-[200px]">{exp.drone_model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">CV PIPELINE:</span>
                      <span className="text-accent truncate max-w-[200px]">{exp.cv_algorithm}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-2xs font-mono text-text-muted">
                  <span>CREATED: {exp.created_at ? new Date(exp.created_at).toLocaleString() : '—'}</span>
                  <span className="text-accent flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Inspect
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Experiment Details Drawer / Modal */}
      {selectedExp && (
        <div className="fixed inset-0 bg-surface-0/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-surface-2 border border-border rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border-subtle flex items-center justify-between bg-surface-1">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-accent" />
                <span className="font-mono text-sm font-bold text-text-primary">{selectedExp.experiment_id}</span>
                <span className="text-text-muted text-xs">— {selectedExp.name}</span>
              </div>
              <button
                onClick={() => setSelectedExp(null)}
                className="text-text-muted hover:text-text-primary p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs font-mono">
              {/* Overview Specs */}
              <div className="grid grid-cols-3 gap-3 bg-surface-3 p-3 rounded-lg border border-border-subtle">
                <div>
                  <div className="telemetry-label text-2xs mb-1">STATUS</div>
                  <span className="font-bold text-accent">{selectedExp.status}</span>
                </div>
                <div>
                  <div className="telemetry-label text-2xs mb-1">ENVIRONMENT</div>
                  <span className="text-text-primary">{selectedExp.simulation_environment}</span>
                </div>
                <div>
                  <div className="telemetry-label text-2xs mb-1">MODEL</div>
                  <span className="text-text-primary">{selectedExp.drone_model}</span>
                </div>
              </div>

              {/* Persisted Telemetry Samples */}
              <div className="panel p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="telemetry-label">MONGODB TELEMETRY SNAPSHOTS</span>
                  <span className="text-2xs text-text-muted">{expTelemetry.length} samples in collection</span>
                </div>
                {loadingDetails ? (
                  <div className="py-4 text-center text-text-muted text-2xs">Querying MongoDB cluster...</div>
                ) : expTelemetry.length === 0 ? (
                  <div className="py-4 text-center text-text-muted text-2xs">
                    No telemetry written for this trial yet. Run simulation to stream and persist samples.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-36">
                    <table className="w-full text-left text-2xs">
                      <thead className="text-text-muted border-b border-border-subtle">
                        <tr>
                          <th className="p-1">TIME</th>
                          <th className="p-1">ALT (m)</th>
                          <th className="p-1">VEL (m/s)</th>
                          <th className="p-1">BAT (%)</th>
                          <th className="p-1">MODE</th>
                          <th className="p-1">SOURCE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle/30">
                        {expTelemetry.map((t, idx) => (
                          <tr key={idx} className="hover:bg-surface-3">
                            <td className="p-1 text-text-muted">{new Date(t.timestamp * 1000).toLocaleTimeString()}</td>
                            <td className="p-1 text-accent font-bold">{t.altitude?.toFixed(1)}</td>
                            <td className="p-1 text-text-primary">{t.velocity?.toFixed(1)}</td>
                            <td className="p-1 text-text-secondary">{t.battery?.toFixed(0)}</td>
                            <td className="p-1 text-status-green">{t.flight_state}</td>
                            <td className="p-1 text-text-muted">{t.source}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* CV Results */}
              <div className="panel p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="telemetry-label">PERSISTED COMPUTER VISION DETECTIONS</span>
                  <span className="text-2xs text-text-muted">{expCVResults.length} records</span>
                </div>
                {expCVResults.length === 0 ? (
                  <div className="py-3 text-center text-text-muted text-2xs">
                    No vision frames logged. Use Computer Vision Lab to execute and persist frame detections.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-28 overflow-y-auto">
                    {expCVResults.map((c, i) => (
                      <div key={i} className="flex justify-between p-1.5 bg-surface-1 rounded border border-border-subtle text-2xs">
                        <span className="text-text-primary">{c.algorithm}</span>
                        <span className="text-accent">{c.detection_count} contours/detections</span>
                        <span className="text-text-muted">{c.processing_time_ms}ms latency</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Experiment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-surface-0/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-2 border border-border rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-text-primary mb-1">Create MongoDB Experiment Record</h3>
            <p className="text-xs text-text-muted mb-4">
              Trial configuration will be stored persistently in MongoDB Atlas.
            </p>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="text-text-muted block mb-1">Experiment Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Optical Flow Ground Track Test"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface-3 border border-border-subtle rounded p-2 text-text-primary focus:border-accent outline-none"
                />
              </div>

              <div>
                <label className="text-text-muted block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Test objectives and hypothesis..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-surface-3 border border-border-subtle rounded p-2 text-text-primary focus:border-accent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-text-muted block mb-1">Environment</label>
                  <select
                    value={formData.simulation_environment}
                    onChange={(e) => setFormData({ ...formData, simulation_environment: e.target.value })}
                    className="w-full bg-surface-3 border border-border-subtle rounded p-2 text-text-primary focus:border-accent outline-none"
                  >
                    <option value="urban_airfield_sitl">Urban Airfield SITL</option>
                    <option value="wind_field_demo">Windfield Demo</option>
                    <option value="gazebo_forest_canopy">Gazebo Forest Canopy</option>
                  </select>
                </div>
                <div>
                  <label className="text-text-muted block mb-1">Airframe</label>
                  <select
                    value={formData.drone_model}
                    onChange={(e) => setFormData({ ...formData, drone_model: e.target.value })}
                    className="w-full bg-surface-3 border border-border-subtle rounded p-2 text-text-primary focus:border-accent outline-none"
                  >
                    <option value="quadrotor_x500_px4">Quadrotor X500 PX4</option>
                    <option value="hexacopter_long_range">Hexacopter Long-Range</option>
                    <option value="vtol_fixed_wing">VTOL Fixed-Wing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-text-muted block mb-1">CV Pipeline / Model</label>
                <input
                  type="text"
                  value={formData.cv_algorithm}
                  onChange={(e) => setFormData({ ...formData, cv_algorithm: e.target.value })}
                  className="w-full bg-surface-3 border border-border-subtle rounded p-2 text-text-primary focus:border-accent outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary py-1.5 px-3 text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-1.5 px-4 text-xs font-semibold">
                  Save to MongoDB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
