export default function TelemetryCard({ label, value, unit }: { label: string, value: string | number, unit?: string }) {
  return (
    <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 flex flex-col justify-between h-20 shadow-subtle">
      <span className="text-[11px] font-medium text-slate-500 font-sans">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-xl font-bold text-slate-900 tracking-tight">{value}</span>
        {unit && <span className="text-xs text-slate-400 font-mono">{unit}</span>}
      </div>
    </div>
  );
}
