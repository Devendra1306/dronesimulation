interface DroneVisualizerProps {
  heading?: number;
  altitude?: number;
  mode?: string;
  isArmed?: boolean;
  isAirborne?: boolean;
  pitch?: number;
  roll?: number;
}

export default function DroneVisualizer({
  heading = 0,
  altitude = 0,
  mode = 'IDLE',
  isArmed = false,
  isAirborne = false,
  pitch = 0,
  roll = 0,
}: DroneVisualizerProps) {
  const scale = Math.max(0.7, Math.min(1.3, 1 + altitude / 80));
  const cx = 160;
  const cy = 160;
  const armLen = 70;

  const armAngles = [45, 135, 225, 315];

  const modeColor: Record<string, string> = {
    IDLE: '#4d6380',
    ARMED: '#f59e0b',
    TAKING_OFF: '#1a9fd4',
    HOVERING: '#22c55e',
    MOVING: '#1a9fd4',
    LANDING: '#f59e0b',
  };

  const statusColor = modeColor[mode] ?? '#4d6380';

  return (
    <div className="relative w-full h-full bg-surface-1 rounded-lg overflow-hidden flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle bg-surface-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="telemetry-label">DRONE VISUALIZATION</span>
          <span className="badge-demo">DEMO SIMULATION</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-text-muted">ALT</span>
          <span className="text-accent font-medium">{altitude.toFixed(1)}m</span>
          <span className="text-text-muted">HDG</span>
          <span className="text-accent font-medium">{heading.toFixed(0)}°</span>
        </div>
      </div>

      {/* SVG visualization area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Grid background */}
        <svg
          className="absolute inset-0 w-full h-full opacity-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#253347" strokeWidth="0.5" />
            </pattern>
            <pattern id="grid-major" width="128" height="128" patternUnits="userSpaceOnUse">
              <rect width="128" height="128" fill="url(#grid)" />
              <path d="M 128 0 L 0 0 0 128" fill="none" stroke="#2d3f57" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-major)" />
        </svg>

        {/* Center crosshair */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg">
          {/* Compass ring */}
          <circle cx={cx} cy={cy} r="130" fill="none" stroke="#1e2a3a" strokeWidth="1" />
          <circle cx={cx} cy={cy} r="100" fill="none" stroke="#1e2a3a" strokeWidth="0.5" strokeDasharray="2 4" />

          {/* Cardinal directions */}
          {[
            { label: 'N', angle: -90, r: 140 },
            { label: 'E', angle: 0, r: 140 },
            { label: 'S', angle: 90, r: 140 },
            { label: 'W', angle: 180, r: 140 },
          ].map(({ label, angle, r }) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <text
                key={label}
                x={cx + r * Math.cos(rad)}
                y={cy + r * Math.sin(rad)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fontFamily="Inter, sans-serif"
                fontWeight="600"
                letterSpacing="0.1em"
                fill={label === 'N' ? '#ef4444' : '#4d6380'}
              >
                {label}
              </text>
            );
          })}

          {/* Heading indicator line */}
          <line
            x1={cx}
            y1={cy}
            x2={cx + 125 * Math.cos(((heading - 90) * Math.PI) / 180)}
            y2={cy + 125 * Math.sin(((heading - 90) * Math.PI) / 180)}
            stroke="#1a9fd4"
            strokeWidth="1"
            strokeDasharray="4 3"
            opacity="0.5"
          />

          {/* Drone body — rotates with heading */}
          <g
            transform={`translate(${cx}, ${cy}) rotate(${heading}) scale(${scale})`}
            style={{ transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)' }}
          >
            {/* Arms */}
            {armAngles.map((angle) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <g key={angle}>
                  <line
                    x1={0}
                    y1={0}
                    x2={armLen * Math.cos(rad)}
                    y2={armLen * Math.sin(rad)}
                    stroke="#2d3f57"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  {/* Motor/prop circles */}
                  <circle
                    cx={armLen * Math.cos(rad)}
                    cy={armLen * Math.sin(rad)}
                    r="14"
                    fill="none"
                    stroke={isArmed ? '#1a9fd4' : '#253347'}
                    strokeWidth="1.5"
                    opacity={isArmed ? 0.8 : 0.4}
                  />
                  <circle
                    cx={armLen * Math.cos(rad)}
                    cy={armLen * Math.sin(rad)}
                    r="7"
                    fill={isArmed ? '#1a9fd420' : '#1e2a3a'}
                    stroke={isArmed ? '#1a9fd4' : '#2d3f57'}
                    strokeWidth="1"
                  />
                </g>
              );
            })}

            {/* Body center */}
            <rect x={-14} y={-14} width={28} height={28} rx={4} fill="#1a2535" stroke="#253347" strokeWidth="1.5" />
            <rect x={-9} y={-9} width={18} height={18} rx={3} fill="#1a9fd4" opacity="0.9" />

            {/* Forward indicator (red tip) */}
            <polygon points="0,-22 -5,-14 5,-14" fill="#ef4444" />
          </g>

          {/* Altitude shadow ring (scaled by altitude) */}
          {isAirborne && (
            <ellipse
              cx={cx}
              cy={cy + 10}
              rx={20 + altitude * 0.3}
              ry={8 + altitude * 0.1}
              fill="none"
              stroke="#1a9fd4"
              strokeWidth="0.5"
              opacity="0.15"
            />
          )}

          {/* Mode label */}
          <text
            x={cx}
            y={cy + 150}
            textAnchor="middle"
            fontSize="9"
            fontFamily="Inter, sans-serif"
            fontWeight="700"
            letterSpacing="0.12em"
            fill={statusColor}
          >
            {mode}
          </text>
        </svg>

        {/* Status indicators */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <div className={`status-dot ${isArmed ? 'bg-status-amber' : 'bg-status-red'}`} />
            <span className="text-2xs font-mono text-text-secondary uppercase tracking-wider">
              {isArmed ? 'ARMED' : 'DISARMED'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`status-dot ${isAirborne ? 'bg-status-green' : 'bg-text-muted'}`} />
            <span className="text-2xs font-mono text-text-secondary uppercase tracking-wider">
              {isAirborne ? 'AIRBORNE' : 'GROUNDED'}
            </span>
          </div>
        </div>

        {/* Pitch/Roll indicator — bottom right */}
        <div className="absolute bottom-3 right-3 bg-surface-3 border border-border-subtle rounded-lg px-3 py-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="telemetry-label text-2xs">PITCH</span>
            <span className="font-mono text-xs text-text-primary">{pitch.toFixed(1)}°</span>
            <span className="telemetry-label text-2xs">ROLL</span>
            <span className="font-mono text-xs text-text-primary">{roll.toFixed(1)}°</span>
          </div>
        </div>
      </div>
    </div>
  );
}
