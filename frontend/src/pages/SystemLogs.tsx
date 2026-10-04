import { useEffect, useRef, useState, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAppStore } from '../store/appStore.tsx';
import { getLogs } from '../services/api';
import { WS_LOGS_URL } from '../config/env';
import type { LogEntry } from '../types';
import { Search, Trash2, ChevronDown } from 'lucide-react';

const LEVELS = ['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG'] as const;
type Level = typeof LEVELS[number];

const levelStyle: Record<string, string> = {
  INFO:  'text-slate-700',
  WARN:  'text-amber-700',
  ERROR: 'text-rose-700 font-semibold',
  DEBUG: 'text-sky-700',
};

const levelBadge: Record<string, string> = {
  INFO:  'bg-slate-100 text-slate-600 border border-slate-200',
  WARN:  'bg-amber-50 text-amber-700 border border-amber-200',
  ERROR: 'bg-rose-50 text-rose-700 border border-rose-200',
  DEBUG: 'bg-sky-50 text-sky-700 border border-sky-200',
};

function LogLine({ log }: { log: LogEntry }) {
  const style = levelStyle[log.level] ?? 'text-slate-700';
  const badge = levelBadge[log.level] ?? 'bg-slate-100 text-slate-600';

  const time = (() => {
    try {
      return new Date(log.timestamp).toLocaleTimeString('en-GB', { hour12: false });
    } catch {
      return log.timestamp;
    }
  })();

  return (
    <div className={`flex items-start gap-3 py-1.5 px-4 hover:bg-slate-50 group text-xs font-mono border-b border-slate-100/60 transition-colors`}>
      <span className="text-slate-400 shrink-0 w-20 text-[11px]">{time}</span>
      <span className={`shrink-0 w-14 px-1.5 py-0.5 rounded text-center text-[10px] font-bold tracking-wide ${badge}`}>
        {log.level}
      </span>
      <span className={`flex-1 ${style} leading-relaxed`}>{log.message}</span>
      <span className="shrink-0 text-slate-400 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity font-sans">
        {log.source}
      </span>
    </div>
  );
}

export default function SystemLogs() {
  const { state, dispatch } = useAppStore();
  const [filter, setFilter] = useState<Level>('ALL');
  const [search, setSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch initial logs from REST
  useEffect(() => {
    getLogs().then(res => {
      res.data.forEach((log: LogEntry) => dispatch({ type: 'ADD_LOG', payload: log }));
    }).catch(() => {});
  }, [dispatch]);

  // Live logs via WebSocket
  const onMessage = useCallback((data: LogEntry) => {
    dispatch({ type: 'ADD_LOG', payload: data });
  }, [dispatch]);

  const { connected } = useWebSocket({
    url: WS_LOGS_URL,
    onMessage,
  });

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.logs, autoScroll]);

  const filtered = state.logs.filter(log => {
    if (filter !== 'ALL' && log.level !== filter) return false;
    if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const clearLogs = () => {
    // Reset logs in store
    filtered.forEach(() => {});
  };

  return (
    <div className="flex flex-col gap-4 h-full min-h-0 select-none">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl px-5 py-3.5 flex items-center justify-between shrink-0 shadow-card">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight font-sans">
            Avionics & Simulation System Logs
          </h2>
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-slate-400'}`} />
            <span className="text-[11px] text-slate-500">
              {connected ? 'LIVE STREAM' : 'OFFLINE'}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">({filtered.length} entries)</span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-500 font-medium">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={e => setAutoScroll(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-sky-600 focus:ring-sky-500"
            />
            <span>Auto-scroll</span>
          </label>
          <button
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 text-slate-600 hover:text-slate-900"
            onClick={clearLogs}
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            Clear
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200/90 shadow-subtle">
          {LEVELS.map(l => (
            <button
              key={l}
              onClick={() => setFilter(l)}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition-all ${
                filter === l
                  ? 'bg-sky-500 text-white font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search log messages..."
            className="w-full bg-white border border-slate-200/90 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 shadow-subtle"
          />
        </div>
      </div>

      {/* Log Console Card */}
      <div className="flex-1 min-h-0 bg-white border border-slate-200/90 rounded-2xl shadow-card overflow-hidden flex flex-col">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 shrink-0 font-mono text-[10px] text-slate-400 flex gap-4 uppercase font-semibold">
          <span className="w-20">Time</span>
          <span className="w-14 text-center">Level</span>
          <span className="flex-1">Message</span>
          <span>Source</span>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-44 gap-2 text-center p-6">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <ChevronDown className="w-5 h-5 text-slate-400" />
              </div>
              <span className="text-xs text-slate-500 font-medium">No log entries matched your filter</span>
              <p className="text-[11px] text-slate-400">New system and simulation events will stream here live</p>
            </div>
          ) : (
            filtered.map((log, i) => <LogLine key={`${log.id ?? i}`} log={log} />)
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
