interface DroneVisualizerProps {
  heading?: number;
  altitude?: number;
  velocity?: number;
  mode?: string;
  isArmed?: boolean;
  isAirborne?: boolean;
  pitch?: number;
  roll?: number;
  source?: string;
  simTime?: number;
}

export default function DroneVisualizer({
  heading = 0,
  altitude = 0,
  velocity = 0,
  mode = 'IDLE',
  isArmed = false,
  isAirborne = false,
  pitch = 0,
  roll = 0,
  source = 'DEMO_SIMULATION',
  simTime = 0,
}: DroneVisualizerProps) {
  const scale = Math.max(0.75, Math.min(1.25, 1 + altitude / 60));
  const cx = 200;
  const cy = 200;
  const armLen = 78;

  const modeColors: Record<string, string> = {
    IDLE: '#64748b',
    ARMED: '#f59e0b',
    TAKING_OFF: '#06b6d4',
    HOVERING: '#22c55e',
    MOVING: '#3b82f6',
    LANDING: '#f97316',
  };

  const statusColor = modeColors[mode] ?? '#64748b';
  const isGazebo = source.includes('GAZEBO');
  const isDemo = source.includes('DEMO');

  // Rotor animation class based on flight state
  const rotorClassCW = !isArmed
    ? ''
    : isAirborne
    ? 'animate-spin-cw'
    : 'animate-spin-idle';

  const rotorClassCCW = !isArmed
    ? ''
    : isAirborne
    ? 'animate-spin-ccw'
    : 'animate-spin-idle';

  // Pitch offset clamped for HUD ladder
  const pitchOffset = Math.max(-60, Math.min(60, pitch * 2.2));

  return (
    <div className="relative w-full h-full bg-[#070a10] rounded-xl border border-border-subtle overflow-hidden flex flex-col select-none">
      {/* Top HUD Status Ticker */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-2/90 border-b border-border-subtle shrink-0 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isArmed ? 'bg-status-green shadow-[0_0_8px_#22c55e]' : 'bg-status-red'}`} />
            <span className="font-mono text-xs font-bold text-text-primary uppercase tracking-wider">
              {isArmed ? 'ARMED' : 'DISARMED'}
            </span>
          </div>
          <span className="text-border-DEFAULT">|</span>
          <span
            className="font-mono text-xs font-bold tracking-wider px-2 py-0.5 rounded"
            style={{ color: statusColor, backgroundColor: `${statusColor}18` }}
          >
            {mode}
          </span>
          <span className="text-border-DEFAULT">|</span>
          <span className="text-2xs font-mono text-text-muted">
            {isGazebo ? (
              <span className="text-status-green font-semibold">GAZEBO 3D ODE</span>
            ) : isDemo ? (
              <span className="text-amber-400">DEMO SIM</span>
            ) : (
              <span className="text-accent font-semibold">{source || 'ROS 2'}</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted text-2xs uppercase">SPD</span>
            <span className="text-text-primary font-bold">{velocity.toFixed(1)} <span className="text-text-muted font-normal text-2xs">m/s</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted text-2xs uppercase">ALT</span>
            <span className="text-accent font-bold">{altitude.toFixed(1)} <span className="text-text-muted font-normal text-2xs">m</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted text-2xs uppercase">HDG</span>
            <span className="text-status-amber font-bold">{heading.toFixed(0).padStart(3, '0')}°</span>
          </div>
        </div>
      </div>

      {/* Main Vector Display Stage */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center min-h-[300px]">
        {/* Subtle aerospace background grid */}
        <div 
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(26, 159, 212, 0.4) 0%, transparent 60%),
                              linear-gradient(#253347 1px, transparent 1px),
                              linear-gradient(90deg, #253347 1px, transparent 1px)`,
            backgroundSize: '100% 100%, 32px 32px, 32px 32px'
          }}
        />

        {/* Speed Tape (Left) */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-12 bg-surface-2/70 border border-border-subtle/80 rounded-lg p-1.5 flex flex-col items-center z-10 backdrop-blur-xs">
          <span className="text-[9px] font-mono font-bold text-text-muted tracking-widest uppercase mb-1">SPD</span>
          <div className="flex flex-col items-center gap-1 py-1 w-full border-y border-border-subtle/40 font-mono text-[10px] text-text-muted">
            <span>{(velocity + 2).toFixed(1)}</span>
            <span className="text-accent font-bold text-xs bg-accent/15 px-1 py-0.5 rounded w-full text-center">
              {velocity.toFixed(1)}
            </span>
            <span>{Math.max(0, velocity - 2).toFixed(1)}</span>
          </div>
          <span className="text-[8px] font-mono text-text-muted mt-1">M/S</span>
        </div>

        {/* Altitude Tape (Right) */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-12 bg-surface-2/70 border border-border-subtle/80 rounded-lg p-1.5 flex flex-col items-center z-10 backdrop-blur-xs">
          <span className="text-[9px] font-mono font-bold text-text-muted tracking-widest uppercase mb-1">ALT</span>
          <div className="flex flex-col items-center gap-1 py-1 w-full border-y border-border-subtle/40 font-mono text-[10px] text-text-muted">
            <span>{(altitude + 1).toFixed(1)}</span>
            <span className="text-accent font-bold text-xs bg-accent/15 px-1 py-0.5 rounded w-full text-center">
              {altitude.toFixed(1)}
            </span>
            <span>{Math.max(0, altitude - 1).toFixed(1)}</span>
          </div>
          <span className="text-[8px] font-mono text-text-muted mt-1">AGL (M)</span>
        </div>

        {/* Central HUD & Artificial Horizon / Attitude Layer */}
        <svg 
          className="w-full h-full max-w-[420px] max-h-[420px]" 
          viewBox="0 0 400 400" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Propeller blade pattern */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Artificial Horizon & Pitch Ladder (Tilts with Roll, Shifts with Pitch) */}
          <g transform={`translate(${cx}, ${cy}) rotate(${-roll})`}>
            {/* Pitch displacement container */}
            <g transform={`translate(0, ${pitchOffset})`}>
              {/* Horizon Line */}
              <line x1="-110" y1="0" x2="-35" y2="0" stroke="#0ea5e9" strokeWidth="1.5" strokeOpacity="0.7" />
              <line x1="35" y1="0" x2="110" y2="0" stroke="#0ea5e9" strokeWidth="1.5" strokeOpacity="0.7" />

              {/* Pitch Ladder Marks (+10°, +5°, -5°, -10°) */}
              {/* +10 deg pitch up */}
              <g transform="translate(0, -25)">
                <line x1="-30" y1="0" x2="30" y2="0" stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="6 4" />
                <line x1="-30" y1="0" x2="-30" y2="4" stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="30" y1="0" x2="30" y2="4" stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.4" />
                <text x="34" y="3" fontSize="8" fill="#0ea5e9" fillOpacity="0.5" fontFamily="monospace">+10</text>
              </g>

              {/* -10 deg pitch down */}
              <g transform="translate(0, 25)">
                <line x1="-30" y1="0" x2="30" y2="0" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="6 4" />
                <line x1="-30" y1="0" x2="-30" y2="-4" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="30" y1="0" x2="30" y2="-4" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.4" />
                <text x="34" y="3" fontSize="8" fill="#f59e0b" fillOpacity="0.5" fontFamily="monospace">-10</text>
              </g>
            </g>
          </g>

          {/* Aircraft Fixed Center Reticle / Boresight */}
          <g transform={`translate(${cx}, ${cy})`}>
            {/* Center dot */}
            <circle cx="0" cy="0" r="2.5" fill="#f59e0b" />
            {/* Left winglet */}
            <line x1="-22" y1="0" x2="-8" y2="0" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
            <line x1="-22" y1="0" x2="-22" y2="6" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
            {/* Right winglet */}
            <line x1="8" y1="0" x2="22" y2="0" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
            <line x1="22" y1="0" x2="22" y2="6" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Compass Outer Rings */}
          <circle cx={cx} cy={cy} r="162" fill="none" stroke="#1e293b" strokeWidth="1" />
          <circle cx={cx} cy={cy} r="145" fill="none" stroke="#1e293b" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.6" />

          {/* Compass Rose Degree Ticks (Every 30 degrees) */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const r1 = 158;
            const r2 = 163;
            const x1 = cx + r1 * Math.cos(rad);
            const y1 = cy + r1 * Math.sin(rad);
            const x2 = cx + r2 * Math.cos(rad);
            const y2 = cy + r2 * Math.sin(rad);

            const isCardinal = deg % 90 === 0;
            const cardinalLabels: Record<number, string> = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };

            return (
              <g key={deg}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={isCardinal ? '#38bdf8' : '#334155'} strokeWidth={isCardinal ? '2' : '1'} />
                {isCardinal && (
                  <text
                    x={cx + 174 * Math.cos(rad)}
                    y={cy + 174 * Math.sin(rad)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="700"
                    fill={deg === 0 ? '#ef4444' : '#94a3b8'}
                  >
                    {cardinalLabels[deg]}
                  </text>
                )}
              </g>
            );
          })}

          {/* Dynamic Heading Line */}
          <line
            x1={cx}
            y1={cy}
            x2={cx + 145 * Math.cos(((heading - 90) * Math.PI) / 180)}
            y2={cy + 145 * Math.sin(((heading - 90) * Math.PI) / 180)}
            stroke="#0ea5e9"
            strokeWidth="1.2"
            strokeDasharray="4 3"
            opacity="0.65"
          />

          {/* Ground Contact Shadow (grows/shrinks with altitude) */}
          {isAirborne && (
            <ellipse
              cx={cx}
              cy={cy + 18}
              rx={22 + altitude * 0.45}
              ry={9 + altitude * 0.18}
              fill="#0ea5e9"
              opacity="0.08"
            />
          )}

          {/* 3D Quadrotor Airframe Model (Rotates with Heading) */}
          <g
            transform={`translate(${cx}, ${cy}) rotate(${heading}) scale(${scale})`}
            style={{ transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            {/* Quadrotor X-Arm Carbon Booms */}
            {[45, 135, 225, 315].map((angle, idx) => {
              const rad = (angle * Math.PI) / 180;
              const mx = armLen * Math.cos(rad);
              const my = armLen * Math.sin(rad);
              const isFront = angle === 315 || angle === 45;
              const isCW = idx % 2 === 0;

              return (
                <g key={angle}>
                  {/* Carbon Boom Arm */}
                  <line
                    x1={0}
                    y1={0}
                    x2={mx}
                    y2={my}
                    stroke="#1e293b"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <line
                    x1={0}
                    y1={0}
                    x2={mx}
                    y2={my}
                    stroke="#334155"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Motor Mount Bell */}
                  <circle
                    cx={mx}
                    cy={my}
                    r="16"
                    fill="#0f172a"
                    stroke="#334155"
                    strokeWidth="1.5"
                  />

                  {/* Motor Core */}
                  <circle
                    cx={mx}
                    cy={my}
                    r="7"
                    fill={isArmed ? (isFront ? '#38bdf8' : '#64748b') : '#1e293b'}
                    stroke={isArmed ? '#0284c7' : '#334155'}
                    strokeWidth="1"
                  />

                  {/* Propeller Blade Disc (Animated Rotation when Armed) */}
                  <g transform={`translate(${mx}, ${my})`}>
                    <g className={isCW ? rotorClassCW : rotorClassCCW}>
                      {/* Propeller Blades */}
                      <path
                        d="M -22 -2.5 C -12 -5, 12 5, 22 2.5 C 12 5, -12 -5, -22 -2.5 Z"
                        fill={isArmed ? (isFront ? 'rgba(56, 189, 248, 0.45)' : 'rgba(148, 163, 184, 0.35)') : 'rgba(51, 65, 85, 0.5)'}
                      />
                      <circle cx="0" cy="0" r="3" fill="#0f172a" />
                    </g>
                    {/* Outer Rotor Safety Ring */}
                    <circle
                      cx="0"
                      cy="0"
                      r="22"
                      fill="none"
                      stroke={isArmed ? (isFront ? '#38bdf8' : '#64748b') : '#334155'}
                      strokeWidth="0.8"
                      strokeDasharray={isArmed ? '4 2' : 'none'}
                      opacity={isArmed ? 0.7 : 0.3}
                    />
                  </g>

                  {/* Nav Lights on Motor Stems */}
                  {isArmed && (
                    <circle
                      cx={mx * 0.85}
                      cy={my * 0.85}
                      r="2.5"
                      fill={
                        angle === 315
                          ? '#ef4444' // Port Front (Red)
                          : angle === 45
                          ? '#22c55e' // Starboard Front (Green)
                          : '#e2e8f0' // Aft (White)
                      }
                      filter="url(#glow)"
                    />
                  )}
                </g>
              );
            })}

            {/* Central Drone Avionics Pod */}
            <rect
              x="-18"
              y="-22"
              width="36"
              height="44"
              rx="6"
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            {/* Battery / Payload Hatch */}
            <rect
              x="-12"
              y="-14"
              width="24"
              height="28"
              rx="3"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1"
            />

            {/* Central Flight Controller Status LED */}
            <circle
              cx="0"
              cy="0"
              r="4.5"
              fill={statusColor}
              filter={isArmed ? 'url(#glow)' : undefined}
            />

            {/* Forward Orientation Nose Beacon (Red Arrow) */}
            <polygon
              points="0,-32 -7,-22 7,-22"
              fill="#ef4444"
              stroke="#dc2626"
              strokeWidth="0.5"
            />
          </g>
        </svg>

        {/* Attitude Angle Indicators (Bottom Left Overlay) */}
        <div className="absolute bottom-3 left-3 bg-surface-2/80 border border-border-subtle rounded-lg px-3 py-1.5 backdrop-blur-xs font-mono text-2xs z-10 flex items-center gap-3">
          <div>
            <span className="text-text-muted mr-1.5">PITCH:</span>
            <span className={`font-semibold ${Math.abs(pitch) > 15 ? 'text-status-amber' : 'text-text-primary'}`}>
              {pitch > 0 ? `+${pitch.toFixed(1)}` : pitch.toFixed(1)}°
            </span>
          </div>
          <div className="h-3 w-px bg-border-subtle" />
          <div>
            <span className="text-text-muted mr-1.5">ROLL:</span>
            <span className={`font-semibold ${Math.abs(roll) > 15 ? 'text-status-amber' : 'text-text-primary'}`}>
              {roll > 0 ? `+${roll.toFixed(1)}` : roll.toFixed(1)}°
            </span>
          </div>
        </div>

        {/* Flight State Indicator (Bottom Right Overlay) */}
        <div className="absolute bottom-3 right-3 bg-surface-2/80 border border-border-subtle rounded-lg px-3 py-1.5 backdrop-blur-xs font-mono text-2xs z-10 flex items-center gap-2">
          <span className="text-text-muted">AIRBORNE:</span>
          <span className={isAirborne ? 'text-status-green font-bold' : 'text-text-muted font-normal'}>
            {isAirborne ? 'ACTIVE CLIMB' : 'GROUND TAXI'}
          </span>
          <span className="text-border-subtle">|</span>
          <span className="text-text-muted">T+ {simTime.toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
}
