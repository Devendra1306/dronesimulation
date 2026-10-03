export default function StatusDot({ status }: { status: 'ok' | 'warning' | 'error' | 'inactive' }) {
  const colors = {
    ok: 'bg-status-green',
    warning: 'bg-status-amber',
    error: 'bg-status-red',
    inactive: 'bg-surface-5'
  };
  return <div className={`status-dot ${colors[status]}`}></div>;
}
