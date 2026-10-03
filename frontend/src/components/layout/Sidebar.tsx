import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Plane, Network, Eye, Activity, 
  BarChart2, Cpu, FlaskConical, Terminal, Settings 
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Mission Control', path: '/' },
  { icon: Plane, label: 'Drone Simulator', path: '/simulator' },
  { icon: Network, label: 'ROS2 & Gazebo', path: '/ros2' },
  { icon: Eye, label: 'Drone Vision', path: '/cv' },
  { icon: Activity, label: 'Flight Sensors', path: '/sensors' },
  { icon: BarChart2, label: 'Flight Data', path: '/data' },
  { icon: Cpu, label: 'UAV Edge AI', path: '/edge' },
  { icon: FlaskConical, label: 'Simulation Experiments', path: '/experiments' },
  { icon: Terminal, label: 'System Logs', path: '/logs' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-56 bg-surface-2 border-r border-border flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-border-subtle">
        <Plane className="w-5 h-5 text-accent mr-2" />
        <div className="flex flex-col">
          <span className="font-bold text-accent tracking-wide leading-tight">ROBOEDGE</span>
          <span className="text-2xs text-text-muted font-medium uppercase tracking-widest leading-tight">AI Lab</span>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-2 rounded-lg text-sm transition-colors ${
                isActive 
                  ? 'bg-surface-3 text-accent border-l-2 border-accent font-medium' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-3 border-l-2 border-transparent'
              }`}
            >
              <item.icon className={`w-4 h-4 mr-3 ${isActive ? 'text-accent' : 'text-text-muted'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border-subtle bg-surface-2/50 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-text-muted">Status</span>
          <div className="flex items-center gap-1.5">
            <div className="status-dot bg-status-green"></div>
            <span className="text-text-secondary font-medium">Online</span>
          </div>
        </div>
        <div className="text-text-muted text-2xs">v0.1.0-alpha</div>
      </div>
    </aside>
  );
}
