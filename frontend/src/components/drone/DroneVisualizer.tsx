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
  const armLen = 76;

  const modeBadgeStyles: Record<string, string> = {
    IDLE: 'bg-slate-100 text-slate-700 border-slate-200',
    ARMED: 'bg-amber-50 text-amber-700 border-amber-200',
    TAKING_OFF: 'bg-sky-50 text-sky-700 border-sky-200',
    HOVERING: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
    MOVING: 'bg-blue-50 text-blue-700 border-blue-200',
    LANDING: 'bg-orange-50 text-orange-700 border-orange-200',
  };

  const modeStyle = modeBadgeStyles[mode] ?? 'bg-slate-100 text-slate-700 border-slate-200';
  const isGazebo = source.includes('GAZEBO');
  const isDemo = source.includes('DEMO');

  // Propeller spin animations
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

  // Pitch ladder vertical displacement
  const pitchOffset = Math.max(-50, Math.min(50, pitch * 2.0));

  return (
    <div className="relative w-full h-full bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden flex flex-col select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isArmed ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'
              }`}
            />
            <span className="text-xs font-semibold text-slate-800 tracking-wide font-mono">
              {isArmed ? 'ARMED' : 'DISARMED'}
            </span>
          </div>

          <div className="h-3.5 w-px bg-slate-200" />

          <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${modeStyle}`}>
            {mode}
          </span>

          <div className="h-3.5 w-px bg-slate-200" />

          <span className="text-[11px] font-mono text-slate-500">
            {isGazebo ? (
              <span className="text-emerald-600 font-medium">GAZEBO 3D ODE</span>
            ) : isDemo ? (
              <span className="text-amber-600 font-medium">DEMO SIMULATION</span>
            ) : (
              <span className="text-sky-600 font-medium">{source || 'ROS 2'}</span>
            )}
          </span>
        </div>

        {/* Top-Right Quick Values */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">SPD</span>
            <span className="font-semibold text-slate-800">
              {velocity.toFixed(1)} <span className="text-slate-400 text-[10px] font-normal">m/s</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">ALT</span>
            <span className="font-semibold text-sky-600">
              {altitude.toFixed(1)} <span className="text-slate-400 text-[10px] font-normal">m</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">HDG</span>
            <span className="font-semibold text-slate-800">
              {heading.toFixed(0).padStart(3, '0')}°
            </span>
          </div>
        </div>
      </div>

      {/* Main Vector Display Stage (Clean white canvas with subtle grid) */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center min-h-[300px] bg-slate-50/50">
        {/* Subtle engineering grid */}
        <div
          className="absolute inset-0 opacity-[0.4] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Speed Tape (Left Floating Card) */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-14 bg-white/95 border border-slate-200/90 rounded-xl p-2 flex flex-col items-center z-10 shadow-subtle backdrop-blur-xs">
          <span className="text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-wider mb-1">
            SPD
          </span>
          <div className="flex flex-col items-center gap-1 py-1 w-full border-y border-slate-100 font-mono text-[10px] text-slate-400">
            <span>{(velocity + 2).toFixed(1)}</span>
            <span className="text-sky-600 font-bold text-xs bg-sky-50 px-1.5 py-0.5 rounded-md w-full text-center border border-sky-100">
              {velocity.toFixed(1)}
            </span>
            <span>{Math.max(0, velocity - 2).toFixed(1)}</span>
          </div>
          <span className="text-[9px] font-mono text-slate-400 mt-1">M/S</span>
        </div>

        {/* Altitude Tape (Right Floating Card) */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-14 bg-white/95 border border-slate-200/90 rounded-xl p-2 flex flex-col items-center z-10 shadow-subtle backdrop-blur-xs">
          <span className="text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-wider mb-1">
            ALT
          </span>
          <div className="flex flex-col items-center gap-1 py-1 w-full border-y border-slate-100 font-mono text-[10px] text-slate-400">
            <span>{(altitude + 1).toFixed(1)}</span>
            <span className="text-sky-600 font-bold text-xs bg-sky-50 px-1.5 py-0.5 rounded-md w-full text-center border border-sky-100">
              {altitude.toFixed(1)}
            </span>
            <span>{Math.max(0, altitude - 1).toFixed(1)}</span>
          </div>
          <span className="text-[9px] font-mono text-slate-400 mt-1">AGL (M)</span>
        </div>

        {/* Central HUD & Artificial Horizon / Attitude Layer */}
        <svg
          className="w-full h-full max-w-[420px] max-h-[420px]"
          viewBox="0 0 400 400"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Subtle cyan illumination under the drone */}
            <radialGradient id="drone-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.18" />
              <stop offset="60%" stopColor="#0EA5E9" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Artificial Horizon & Pitch Ladder (Tilts with Roll, Shifts with Pitch) */}
          <g transform={`translate(${cx}, ${cy}) rotate(${-roll})`}>
            <g transform={`translate(0, ${pitchOffset})`}>
              {/* Horizon Line */}
              <line x1="-100" y1="0" x2="-35" y2="0" stroke="#0EA5E9" strokeWidth="1.2" strokeOpacity="0.75" />
              <line x1="35" y1="0" x2="100" y2="0" stroke="#0EA5E9" strokeWidth="1.2" strokeOpacity="0.75" />

              {/* Pitch Ladder Marks (+10°, -10°) */}
              <g transform="translate(0, -24)">
                <line x1="-24" y1="0" x2="24" y2="0" stroke="#0EA5E9" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4 3" />
                <line x1="-24" y1="0" x2="-24" y2="3" stroke="#0EA5E9" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="24" y1="0" x2="24" y2="3" stroke="#0EA5E9" strokeWidth="1" strokeOpacity="0.4" />
                <text x="28" y="3" fontSize="8" fill="#0EA5E9" fillOpacity="0.6" fontFamily="monospace">+10</text>
              </g>

              <g transform="translate(0, 24)">
                <line x1="-24" y1="0" x2="24" y2="0" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4 3" />
                <line x1="-24" y1="0" x2="-24" y2="-3" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="24" y1="0" x2="24" y2="-3" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.4" />
                <text x="28" y="3" fontSize="8" fill="#F59E0B" fillOpacity="0.6" fontFamily="monospace">-10</text>
              </g>
            </g>
          </g>

          {/* Center Boresight Reticle */}
          <g transform={`translate(${cx}, ${cy})`}>
            <circle cx="0" cy="0" r="2.5" fill="#F59E0B" />
            <line x1="-18" y1="0" x2="-6" y2="0" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="6" y1="0" x2="18" y2="0" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Thin Radar / Compass Rings */}
          <circle cx={cx} cy={cy} r="162" fill="none" stroke="#E2E8F0" strokeWidth="1" />
          <circle cx={cx} cy={cy} r="145" fill="none" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3 3" />

          {/* Compass Cardinal Marks */}
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
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isCardinal ? '#0EA5E9' : '#CBD5E1'}
                  strokeWidth={isCardinal ? '1.5' : '0.8'}
                />
                {isCardinal && (
                  <text
                    x={cx + 175 * Math.cos(rad)}
                    y={cy + 175 * Math.sin(rad)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="11"
                    fontFamily="Inter, sans-serif"
                    fontWeight="600"
                    fill={deg === 0 ? '#EF4444' : '#64748B'}
                  >
                    {cardinalLabels[deg]}
                  </text>
                )}
              </g>
            );
          })}

          {/* Heading Line */}
          <line
            x1={cx}
            y1={cy}
            x2={cx + 145 * Math.cos(((heading - 90) * Math.PI) / 180)}
            y2={cy + 145 * Math.sin(((heading - 90) * Math.PI) / 180)}
            stroke="#0EA5E9"
            strokeWidth="1.2"
            strokeDasharray="4 3"
            opacity="0.75"
          />

          {/* Ambient Cyan Lighting Underneath Drone */}
          <circle cx={cx} cy={cy} r="65" fill="url(#drone-glow)" />

          {/* Ground Contact Shadow */}
          {isAirborne && (
            <ellipse
              cx={cx}
              cy={cy + 16}
              rx={22 + altitude * 0.4}
              ry={8 + altitude * 0.16}
              fill="#94A3B8"
              opacity="0.18"
            />
          )}

          {/* Professional Vector UAV Airframe (Rotates with Heading) */}
          <g
            transform={`translate(${cx}, ${cy}) rotate(${heading}) scale(${scale})`}
            style={{ transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            {/* 4 Carbon Arms */}
            {[45, 135, 225, 315].map((angle, idx) => {
              const rad = (angle * Math.PI) / 180;
              const mx = armLen * Math.cos(rad);
              const my = armLen * Math.sin(rad);
              const isFront = angle === 315 || angle === 45;
              const isCW = idx % 2 === 0;

              return (
                <g key={angle}>
                  {/* Structural Boom Arm */}
                  <line
                    x1={0}
                    y1={0}
                    x2={mx}
                    y2={my}
                    stroke="#1E293B"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  <line
                    x1={0}
                    y1={0}
                    x2={mx}
                    y2={my}
                    stroke="#475569"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />

                  {/* Motor Mount Bell */}
                  <circle
                    cx={mx}
                    cy={my}
                    r="15"
                    fill="#0F172A"
                    stroke="#334155"
                    strokeWidth="1.2"
                  />
                  <circle
                    cx={mx}
                    cy={my}
                    r="6.5"
                    fill={isArmed ? (isFront ? '#0EA5E9' : '#64748B') : '#1E293B'}
                  />

                  {/* Propeller Blade Disc (Animated Rotation when Armed) */}
                  <g transform={`translate(${mx}, ${my})`}>
                    <g className={isCW ? rotorClassCW : rotorClassCCW}>
                      <path
                        d="M -22 -2 C -12 -4, 12 4, 22 2 C 12 4, -12 -4, -22 -2 Z"
                        fill={
                          isArmed
                            ? isFront
                              ? 'rgba(14, 165, 233, 0.6)'
                              : 'rgba(71, 85, 105, 0.5)'
                            : 'rgba(148, 163, 184, 0.4)'
                        }
                      />
                      <circle cx="0" cy="0" r="2.5" fill="#0F172A" />
                    </g>
                    {/* Outer Rotor Safety Ring */}
                    <circle
                      cx="0"
                      cy="0"
                      r="22"
                      fill="none"
                      stroke={isArmed ? (isFront ? '#0EA5E9' : '#64748B') : '#CBD5E1'}
                      strokeWidth="0.8"
                      strokeDasharray={isArmed ? '4 2' : 'none'}
                      opacity={isArmed ? 0.8 : 0.4}
                    />
                  </g>

                  {/* Nav Lights */}
                  {isArmed && (
                    <circle
                      cx={mx * 0.84}
                      cy={my * 0.84}
                      r="2.5"
                      fill={
                        angle === 315
                          ? '#EF4444' // Port Front (Red)
                          : angle === 45
                          ? '#16A34A' // Starboard Front (Green)
                          : '#F8FAFC' // Aft (White)
                      }
                    />
                  )}
                </g>
              );
            })}

            {/* Central UAV Fuselage Pod */}
            <rect
              x="-16"
              y="-20"
              width="32"
              height="40"
              rx="6"
              fill="#0F172A"
              stroke="#334155"
              strokeWidth="1.2"
            />
            {/* Canopy Shell */}
            <rect
              x="-11"
              y="-13"
              width="22"
              height="26"
              rx="3.5"
              fill="#1E293B"
              stroke="#0EA5E9"
              strokeWidth="0.8"
            />

            {/* Central Status LED */}
            <circle
              cx="0"
              cy="0"
              r="3.5"
              fill={isArmed ? (isAirborne ? '#0EA5E9' : '#16A34A') : '#64748B'}
            />

            {/* Forward Orientation Nose Beacon (Red Arrow) */}
            <polygon
              points="0,-28 -6,-20 6,-20"
              fill="#EF4444"
              stroke="#DC2626"
              strokeWidth="0.5"
            />
          </g>
        </svg>

        {/* Pitch & Roll Badge (Bottom Left Floating Card) */}
        <div className="absolute bottom-4 left-4 bg-white/95 border border-slate-200/90 rounded-xl px-3.5 py-1.5 shadow-subtle font-mono text-[11px] z-10 flex items-center gap-3 backdrop-blur-xs">
          <div>
            <span className="text-slate-400 mr-1.5 font-sans">PITCH:</span>
            <span className={`font-semibold ${Math.abs(pitch) > 15 ? 'text-amber-600' : 'text-slate-800'}`}>
              {pitch > 0 ? `+${pitch.toFixed(1)}` : pitch.toFixed(1)}°
            </span>
          </div>
          <div className="h-3 w-px bg-slate-200" />
          <div>
            <span className="text-slate-400 mr-1.5 font-sans">ROLL:</span>
            <span className={`font-semibold ${Math.abs(roll) > 15 ? 'text-amber-600' : 'text-slate-800'}`}>
              {roll > 0 ? `+${roll.toFixed(1)}` : roll.toFixed(1)}°
            </span>
          </div>
        </div>

        {/* Flight State & Mission Time (Bottom Right Floating Card) */}
        <div className="absolute bottom-4 right-4 bg-white/95 border border-slate-200/90 rounded-xl px-3.5 py-1.5 shadow-subtle font-mono text-[11px] z-10 flex items-center gap-2.5 backdrop-blur-xs">
          <span className="text-slate-400 font-sans">STATE:</span>
          <span className={isAirborne ? 'text-emerald-600 font-semibold' : 'text-slate-600'}>
            {isAirborne ? 'AIRBORNE' : 'GROUND'}
          </span>
          <div className="h-3 w-px bg-slate-200" />
          <span className="text-slate-500">T+ {simTime.toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
}
