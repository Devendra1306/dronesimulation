export default function TelemetryCard({ label, value, unit }: { label: string, value: string | number, unit?: string }) {
  return (
    <div className="bg-surface-3 p-3 rounded-lg border border-border-subtle flex flex-col justify-between h-20">
      <span className="telemetry-label">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="telemetry-value">{value}</span>
        {unit && <span className="text-xs text-text-secondary font-mono">{unit}</span>}
      </div>
    </div>
  );
}
