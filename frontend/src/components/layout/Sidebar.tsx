import { Link, useLocation } from 'react-router-dom';
import { 
  Navigation, Plane, Network, Eye, Radio, 
  Cpu, FlaskConical, Terminal, Settings 
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: Navigation, label: 'Mission Control', path: '/' },
  { icon: Plane, label: 'Drone Simulator', path: '/simulator' },
  { icon: Network, label: 'ROS2 & Gazebo', path: '/ros2' },
  { icon: Eye, label: 'Drone Vision', path: '/cv' },
  { icon: Radio, label: 'Flight Sensors', path: '/sensors' },
  { icon: Cpu, label: 'UAV Edge AI', path: '/edge' },
  { icon: FlaskConical, label: 'Simulation Experiments', path: '/experiments' },
  { icon: Terminal, label: 'System Logs', path: '/logs' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-60 bg-surface-2 border-r border-border flex flex-col shrink-0 select-none">
      {/* Header / Brand */}
      <div className="h-14 flex items-center px-5 border-b border-border-subtle">
        <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center mr-3 text-accent shrink-0">
          <Plane className="w-4 h-4 transform -rotate-45" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-accent tracking-wider text-sm leading-tight font-mono">ROBOEDGE</span>
          <span className="text-[10px] text-text-muted font-semibold uppercase tracking-widest leading-tight">UAS SIMULATION</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 flex flex-col gap-0.5 px-2.5">
        <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted/70">
          Platform Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                isActive 
                  ? 'bg-accent/10 text-accent font-semibold border border-accent/20 shadow-sm' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-3/80'
              }`}
            >
              <item.icon className={`w-4 h-4 mr-3 shrink-0 ${isActive ? 'text-accent' : 'text-text-muted'}`} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Engineering Footer */}
      <div className="p-3.5 border-t border-border-subtle bg-surface-1/40 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-text-muted font-medium">GCS Link</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />
            <span className="text-[11px] text-text-secondary font-mono">NOMINAL</span>
          </div>
        </div>
        <div className="text-text-muted text-[10px] font-mono flex items-center justify-between">
          <span>UAS ENG LAB</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
