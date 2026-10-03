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
  INFO:  'text-text-secondary',
  WARN:  'text-status-amber',
  ERROR: 'text-status-red',
  DEBUG: 'text-status-blue',
};

const levelBadge: Record<string, string> = {
  INFO:  'bg-surface-5 text-text-muted',
  WARN:  'bg-status-amber-dim text-status-amber',
  ERROR: 'bg-status-red-dim text-status-red',
  DEBUG: 'bg-status-blue-dim text-status-blue',
};

function LogLine({ log }: { log: LogEntry }) {
  const style = levelStyle[log.level] ?? 'text-text-secondary';
  const badge = levelBadge[log.level] ?? 'bg-surface-5 text-text-muted';

  const time = (() => {
    try {
      return new Date(log.timestamp).toLocaleTimeString('en-GB', { hour12: false });
    } catch {
      return log.timestamp;
    }
  })();

  return (
    <div className={`flex items-start gap-3 py-1 px-3 hover:bg-surface-3 group text-xs font-mono`}>
      <span className="text-text-muted shrink-0 w-20">{time}</span>
      <span className={`shrink-0 w-14 px-1.5 py-0.5 rounded text-center text-2xs font-bold tracking-wide ${badge}`}>
        {log.level}
      </span>
      <span className={`flex-1 ${style}`}>{log.message}</span>
      <span className="shrink-0 text-text-muted text-2xs opacity-0 group-hover:opacity-100 transition-opacity">
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
    filtered.forEach(() => {}); // no-op — in real app dispatch CLEAR_LOGS
  };

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-text-primary font-mono tracking-tight">Avionics & Simulation Engineering Logs</h2>
          <div className="flex items-center gap-1.5">
            <div className={`status-dot ${connected ? 'bg-status-green' : 'bg-surface-5'}`} />
            <span className="text-xs text-text-muted font-mono">
              {connected ? 'LIVE STREAM' : 'OFFLINE'}
            </span>
          </div>
          <span className="text-xs text-text-muted">{filtered.length} entries</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={e => setAutoScroll(e.target.checked)}
              className="w-3 h-3 accent-accent"
            />
            <span className="text-xs text-text-muted">Auto-scroll</span>
          </label>
          <button
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
            onClick={clearLogs}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Level filter */}
        <div className="flex gap-1">
          {LEVELS.map(l => (
            <button
              key={l}
              onClick={() => setFilter(l)}
              className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                filter === l
                  ? 'bg-accent text-white'
                  : 'bg-surface-3 text-text-muted hover:text-text-primary'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="w-full bg-surface-3 border border-border-subtle rounded pl-8 pr-3 py-1 text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Log viewer */}
      <div className="flex-1 min-h-0 panel overflow-hidden flex flex-col">
        <div className="panel-header shrink-0 bg-surface-1 rounded-t-xl">
          <div className="flex gap-4 text-2xs font-mono text-text-muted">
            <span className="w-20">TIME</span>
            <span className="w-14">LEVEL</span>
            <span className="flex-1">MESSAGE</span>
            <span>SOURCE</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-surface-1 py-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center">
                <ChevronDown className="w-4 h-4 text-text-muted" />
              </div>
              <span className="text-xs text-text-muted">No log entries yet. Logs will appear here as events occur.</span>
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
