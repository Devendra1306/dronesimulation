import { Link, useLocation } from 'react-router-dom';
import { 
  Compass, Plane, Eye, 
  FlaskConical, Terminal, Settings 
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: Compass, label: 'Mission Control', path: '/' },
  { icon: Plane, label: 'Drone Simulator', path: '/simulator' },
  { icon: Eye, label: 'Drone Vision', path: '/cv' },
  { icon: FlaskConical, label: 'Simulation Experiments', path: '/experiments' },
  { icon: Terminal, label: 'System Logs', path: '/logs' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-56 bg-[#0F172A] border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Header / Brand */}
      <div className="h-14 flex items-center px-4 border-b border-slate-800/80">
        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mr-3 text-sky-400 shrink-0">
          <Plane className="w-4 h-4 transform -rotate-45" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-white tracking-wider text-sm leading-tight font-mono">ROBOEDGE</span>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide leading-tight">UAS Simulation</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-2.5">
        <div className="px-3 py-1 text-[11px] font-semibold text-slate-400/80 uppercase tracking-wider mb-1">
          Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                isActive 
                  ? 'bg-sky-500/10 text-sky-400 font-semibold border-l-2 border-sky-400' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <item.icon className={`w-4 h-4 mr-2.5 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Engineering Footer */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-900/60 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-slate-400 font-medium">GCS Link</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-slate-300 font-mono">NOMINAL</span>
          </div>
        </div>
        <div className="text-slate-400 text-[10px] font-mono flex items-center justify-between">
          <span>UAS ENG LAB</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
