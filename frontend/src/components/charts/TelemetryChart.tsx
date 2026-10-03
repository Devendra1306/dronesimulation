import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
      <div className="bg-surface-3 border border-border px-3 py-2 rounded-lg shadow-lg">
        <p className="font-mono text-xs text-text-muted mb-1">{`t+${typeof label === 'number' ? label : label}s`}</p>
        <p className="font-mono text-sm font-medium text-text-primary">
          {payload[0].value?.toFixed(2)}
          <span className="text-text-muted ml-1">{unit}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function TelemetryChart({ data, dataKey, color = '#1a9fd4', name = '', unit = '' }: TelemetryChartProps) {
  const indexed = data.map((d, i) => ({ ...d, _index: i }));

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header shrink-0">
        <span className="telemetry-label">{name}</span>
        <span className="badge-demo">LIVE</span>
      </div>
      <div className="flex-1 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={indexed} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" vertical={false} />
            <XAxis
              dataKey="_index"
              tick={false}
              axisLine={{ stroke: '#1e2a3a' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#4d6380', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: color, stroke: 'none' }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
