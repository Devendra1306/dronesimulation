import { useEffect, useRef } from 'react';
import type { TelemetryData } from '../../types';

interface PFDProps {
  telemetry: TelemetryData | null;
  isRunning?: boolean;
}

export default function PrimaryFlightDisplay({ telemetry, isRunning = true }: PFDProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Extract telemetry values with defaults
      const pitch = telemetry?.pitch ?? 0; // degrees
      const roll = telemetry?.roll ?? 0;   // degrees
      const heading = telemetry?.heading ?? 0; // degrees
      const altitude = telemetry?.altitude ?? 0; // meters
      const velocity = telemetry?.velocity ?? 0; // m/s
      const mode = telemetry?.mode ?? 'IDLE';

      ctx.clearRect(0, 0, w, h);

      // --- 1. Artificial Horizon (Sky / Ground) ---
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((-roll * Math.PI) / 180);

      const pitchOffset = (pitch * h) / 60; // 60 deg field of view
      ctx.translate(0, pitchOffset);

      // Sky
      const skyGrad = ctx.createLinearGradient(0, -h, 0, 0);
      skyGrad.addColorStop(0, '#0a2239');
      skyGrad.addColorStop(1, '#133e68');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-w * 1.5, -h * 2, w * 3, h * 2);

      // Ground
      const gndGrad = ctx.createLinearGradient(0, 0, 0, h);
      gndGrad.addColorStop(0, '#1c1b18');
      gndGrad.addColorStop(1, '#0e0e0c');
      ctx.fillStyle = gndGrad;
      ctx.fillRect(-w * 1.5, 0, w * 3, h * 2);

      // Horizon line
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-w * 1.5, 0);
      ctx.lineTo(w * 1.5, 0);
      ctx.stroke();

      // Pitch Ladder rungs
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';

      for (let p = -40; p <= 40; p += 10) {
        if (p === 0) continue;
        const y = (-p * h) / 60;
        const rungWidth = Math.abs(p) % 20 === 0 ? 60 : 35;
        
        ctx.beginPath();
        ctx.moveTo(-rungWidth / 2, y);
        ctx.lineTo(rungWidth / 2, y);
        ctx.stroke();

        ctx.fillText(`${Math.abs(p)}°`, rungWidth / 2 + 14, y + 3);
        ctx.fillText(`${Math.abs(p)}°`, -rungWidth / 2 - 14, y + 3);
      }

      ctx.restore();

      // --- 2. Aircraft Fixed Reticle (Crosshair) ---
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      // Left bar
      ctx.moveTo(cx - 50, cy);
      ctx.lineTo(cx - 20, cy);
      ctx.lineTo(cx - 20, cy + 10);
      // Right bar
      ctx.moveTo(cx + 50, cy);
      ctx.lineTo(cx + 20, cy);
      ctx.lineTo(cx + 20, cy + 10);
      // Center dot
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
      ctx.fill();

      // --- 3. Airspeed Tape (Left) ---
      const tapeWidth = 55;
      ctx.fillStyle = 'rgba(8, 10, 14, 0.75)';
      ctx.fillRect(8, 30, tapeWidth, h - 60);
      ctx.strokeStyle = '#253347';
      ctx.strokeRect(8, 30, tapeWidth, h - 60);

      ctx.fillStyle = '#8fa3bd';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('IAS m/s', 8 + tapeWidth / 2, 44);

      ctx.fillStyle = '#e8edf5';
      ctx.font = 'bold 14px JetBrains Mono, monospace';
      ctx.fillText(`${velocity.toFixed(1)}`, 8 + tapeWidth / 2, cy);

      // --- 4. Altitude Tape (Right) ---
      ctx.fillStyle = 'rgba(8, 10, 14, 0.75)';
      ctx.fillRect(w - tapeWidth - 8, 30, tapeWidth, h - 60);
      ctx.strokeStyle = '#253347';
      ctx.strokeRect(w - tapeWidth - 8, 30, tapeWidth, h - 60);

      ctx.fillStyle = '#8fa3bd';
      ctx.font = '9px Inter, sans-serif';
      ctx.fillText('ALT m', w - tapeWidth / 2 - 8, 44);

      ctx.fillStyle = '#1a9fd4';
      ctx.font = 'bold 14px JetBrains Mono, monospace';
      ctx.fillText(`${altitude.toFixed(1)}`, w - tapeWidth / 2 - 8, cy);

      // --- 5. Heading Tape (Top) ---
      const hdgBarH = 26;
      ctx.fillStyle = 'rgba(8, 10, 14, 0.85)';
      ctx.fillRect(cx - 100, 8, 200, hdgBarH);
      ctx.strokeStyle = '#253347';
      ctx.strokeRect(cx - 100, 8, 200, hdgBarH);

      ctx.fillStyle = '#e8edf5';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`HDG: ${heading.toFixed(0)}°`, cx, 24);

      // --- 6. Status Badges & HUD Information ---
      ctx.fillStyle = '#22c55e';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`MODE: ${mode}`, 14, h - 14);

      ctx.textAlign = 'right';
      ctx.fillStyle = isRunning ? '#22c55e' : '#f59e0b';
      ctx.fillText(isRunning ? 'SITL ENGINE: ACTIVE' : 'SITL ENGINE: PAUSED', w - 14, h - 14);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [telemetry, isRunning]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-surface-0 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={720}
        height={420}
        className="w-full h-full object-contain"
      />
    </div>
  );
}
