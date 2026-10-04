import { useState } from 'react';
import Panel from '../components/common/Panel';
import { Sliders, Cpu, Network, Database, Shield, Save, Check } from 'lucide-react';
import { API_BASE_URL, WS_BASE_URL } from '../config/env';

export default function Settings() {
  const [savedNotice, setSavedNotice] = useState(false);
  const [config, setConfig] = useState({
    simMode: 'gazebo',
    apiUrl: API_BASE_URL,
    wsUrl: WS_BASE_URL,
    rosBridgeUrl: 'ws://127.0.0.1:9090',
    telemetryRateHz: 10,
    cvModelPath: 'models/yolo.pt',
    edgeTargetDevice: 'jetson_xavier',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-text-primary">System & Adapter Configuration</h2>
          <span className="badge-active">REAL HARDWARE & SIMULATION LINK</span>
        </div>
        {savedNotice && (
          <span className="text-xs text-status-green flex items-center gap-1.5 font-mono animate-fade-in">
            <Check className="w-3.5 h-3.5" />
            Parameters saved in session memory!
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        <form onSubmit={handleSave} className="max-w-3xl space-y-4 text-xs">
          {/* Simulation & Adapter Mode */}
          <Panel title="SIMULATION RUNTIME & ADAPTER ROUTING">
            <div className="space-y-3">
              <div>
                <label className="text-text-muted block mb-1 font-medium">Adapter Layer Mode</label>
                <select
                  value={config.simMode}
                  onChange={(e) => setConfig({ ...config, simMode: e.target.value })}
                  className="w-full bg-surface-3 border border-border-subtle rounded-lg p-2.5 text-text-primary focus:border-accent outline-none"
                >
                  <option value="gazebo">GazeboSimulationAdapter (Authentic 3D Quadrotor ODE in WSL2)</option>
                  <option value="ros2">ROS2Adapter (rosbridge WebSocket link to ROS2 Humble nodes)</option>
                  <option value="demo">DemoSimulationAdapter (Fallback synthetic physics & telemetry)</option>
                </select>
                <p className="text-3xs text-text-muted mt-1.5 leading-relaxed">
                  Active Mode: GazeboSimulationAdapter connects to rosbridge (<code className="text-accent">ws://127.0.0.1:9090</code>) which drives the Gazebo 3D ODE physics simulator and realistic quadrotor model.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-text-muted block mb-1 font-medium">ROS 2 rosbridge WebSocket Gateway</label>
                  <input
                    type="text"
                    value={config.rosBridgeUrl}
                    onChange={(e) => setConfig({ ...config, rosBridgeUrl: e.target.value })}
                    className="w-full bg-surface-3 border border-border-subtle rounded p-2 text-text-primary font-mono focus:border-accent outline-none"
                  />
                </div>
                <div>
                  <label className="text-text-muted block mb-1 font-medium">Gazebo Simulation Engine</label>
                  <input
                    type="text"
                    disabled
                    value="Gazebo Classic 11 / ODE Physics (Local WSL2)"
                    className="w-full bg-surface-1 border border-border-subtle rounded p-2 text-status-green font-mono text-2xs cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </Panel>

          {/* Web Communication & API URLs */}
          <Panel title="FASTAPI BACKEND & WEBSOCKET NETWORKING">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-text-muted block mb-1 font-medium">Backend REST Endpoint</label>
                <input
                  type="text"
                  value={config.apiUrl}
                  onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                  className="w-full bg-surface-3 border border-border-subtle rounded p-2 text-text-primary font-mono focus:border-accent outline-none"
                />
              </div>
              <div>
                <label className="text-text-muted block mb-1 font-medium">WebSocket Streaming Gateway</label>
                <input
                  type="text"
                  value={config.wsUrl}
                  onChange={(e) => setConfig({ ...config, wsUrl: e.target.value })}
                  className="w-full bg-surface-3 border border-border-subtle rounded p-2 text-text-primary font-mono focus:border-accent outline-none"
                />
              </div>
              <div>
                <label className="text-text-muted block mb-1 font-medium">Telemetry Broadcaster Rate</label>
                <select
                  value={config.telemetryRateHz}
                  onChange={(e) => setConfig({ ...config, telemetryRateHz: Number(e.target.value) })}
                  className="w-full bg-surface-3 border border-border-subtle rounded p-2 text-text-primary focus:border-accent outline-none"
                >
                  <option value={5}>5 Hz (Low Bandwidth)</option>
                  <option value={10}>10 Hz (Recommended UAS Default)</option>
                  <option value={20}>20 Hz (High Precision SITL)</option>
                </select>
              </div>
              <div>
                <label className="text-text-muted block mb-1 font-medium">Database Persistence Provider</label>
                <input
                  type="text"
                  disabled
                  value="MongoDB Atlas (Replica Set Cluster / Motor AsyncIO)"
                  className="w-full bg-surface-1 border border-border-subtle rounded p-2 text-status-green font-mono text-2xs cursor-not-allowed"
                />
              </div>
            </div>
          </Panel>

          {/* Edge AI & CV Parameters */}
          <Panel title="COMPUTER VISION & EDGE HARDWARE ACCELERATION">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-text-muted block mb-1 font-medium">Target Neural Weights (.pt / .onnx)</label>
                <input
                  type="text"
                  value={config.cvModelPath}
                  onChange={(e) => setConfig({ ...config, cvModelPath: e.target.value })}
                  className="w-full bg-surface-3 border border-border-subtle rounded p-2 text-text-primary font-mono focus:border-accent outline-none"
                />
              </div>
              <div>
                <label className="text-text-muted block mb-1 font-medium">Target Edge Compute Device</label>
                <select
                  value={config.edgeTargetDevice}
                  onChange={(e) => setConfig({ ...config, edgeTargetDevice: e.target.value })}
                  className="w-full bg-surface-3 border border-border-subtle rounded p-2 text-text-primary focus:border-accent outline-none"
                >
                  <option value="jetson_xavier">NVIDIA Jetson Xavier NX (TensorRT FP16)</option>
                  <option value="jetson_nano">NVIDIA Jetson Nano (4GB Core)</option>
                  <option value="rpi4">Raspberry Pi 4B (NCNN / ONNXRuntime)</option>
                  <option value="cuda_laptop">Discrete Laptop GPU (CUDA 12.x)</option>
                </select>
              </div>
            </div>
          </Panel>

          {/* Architecture Summary */}
          <Panel title="SYSTEM TOPOLOGY">
            <div className="bg-surface-1 p-3 rounded-lg border border-border-subtle font-mono text-2xs text-text-secondary leading-relaxed space-y-1">
              <div>Vercel React Dashboard &rarr; Cloudflare Tunnel &rarr; Local FastAPI (:8000)</div>
              <div>FastAPI GazeboSimulationAdapter &rarr; rosbridge (:9090) &rarr; ROS 2 Humble</div>
              <div>ROS 2 (/cmd_vel) &rarr; Gazebo 3D ODE Flight Controller &rarr; 3D Quadrotor</div>
              <div>3D Quadrotor Physics &rarr; /odom, /imu/data, /gps/fix, /camera/image_raw &rarr; Live Telemetry</div>
            </div>
          </Panel>

          {/* Security Note & Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-border-subtle">
            <div className="flex items-center gap-1.5 text-text-muted text-2xs">
              <Shield className="w-3.5 h-3.5 text-accent" />
              <span>Production secrets & keys are strictly loaded from .env file.</span>
            </div>
            <button
              type="submit"
              className="btn-primary text-xs flex items-center gap-1.5 py-2 px-5 font-semibold"
            >
              <Save className="w-3.5 h-3.5" />
              Save Configurations
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
