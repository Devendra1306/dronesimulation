import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TelemetryChartProps {
  data: any[];
  dataKey: string;
  color?: string;
  name?: string;
  unit?: string;
}

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-card">
        <p className="font-mono text-[10px] text-slate-400 mb-0.5">{`t+${typeof label === 'number' ? label : label}s`}</p>
        <p className="font-mono text-xs font-bold text-slate-900">
          {payload[0].value?.toFixed(2)}
          <span className="text-slate-400 font-normal ml-1">{unit}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function TelemetryChart({
  data,
  dataKey,
  color = '#0EA5E9',
  name = '',
  unit = '',
}: TelemetryChartProps) {
  const indexed = data.map((d, i) => ({ ...d, _index: i }));

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-card h-full flex flex-col overflow-hidden">
      {/* Analytics Card Header */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold text-slate-800 tracking-wide font-sans">{name}</span>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          LIVE
        </span>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={indexed} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.16} />
                <stop offset="95%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="_index"
              tick={false}
              axisLine={{ stroke: '#F1F5F9' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
              width={38}
            />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#gradient-${dataKey})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
