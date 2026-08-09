import React, { useState, useEffect, useRef } from 'react';
import { Eye, Sun, Sparkles, RefreshCw, Layers } from 'lucide-react';

export const RayTracingVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [renderMode, setRenderMode] = useState<'raytracing' | 'rasterization'>('raytracing');
  const [bounceCount, setBounceCount] = useState<number>(3);
  const [rayCount, setRayCount] = useState<number>(16);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#070a12';
    ctx.fillRect(0, 0, width, height);

    // Draw Obstacle Spheres
    const spheres = [
      { x: width * 0.45, y: height * 0.4, r: 45, color: '#3b82f6' }, // Blue reflective sphere
      { x: width * 0.75, y: height * 0.65, r: 55, color: '#10b981' }, // Emerald sphere
    ];

    spheres.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.color + '33';
      ctx.fill();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Camera Position (Left side)
    const camera = { x: 50, y: height / 2 };
    
    // Draw Camera Icon
    ctx.beginPath();
    ctx.arc(camera.x, camera.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    // Light Source (Top Right)
    const light = { x: width - 60, y: 50 };
    ctx.beginPath();
    ctx.arc(light.x, light.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();

    if (renderMode === 'raytracing') {
      // Ray Tracing Mode: Cast rays from camera into the scene and bounce off spheres
      for (let i = 0; i < rayCount; i++) {
        const angle = ((i - rayCount / 2) * 0.08);
        let currX = camera.x;
        let currY = camera.y;
        let dirX = Math.cos(angle);
        let dirY = Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(currX, currY);

        for (let b = 0; b < bounceCount; b++) {
          // Find closest sphere intersection
          let closestDist = 800;
          let hitNormalX = 0;
          let hitNormalY = 0;

          spheres.forEach(s => {
            const dx = s.x - currX;
            const dy = s.y - currY;
            const proj = dx * dirX + dy * dirY;
            if (proj > 0) {
              const perpDistSq = (dx * dx + dy * dy) - proj * proj;
              if (perpDistSq < s.r * s.r) {
                const distToHit = proj - Math.sqrt(s.r * s.r - perpDistSq);
                if (distToHit > 0.1 && distToHit < closestDist) {
                  closestDist = distToHit;
                  const hitX = currX + dirX * distToHit;
                  const hitY = currY + dirY * distToHit;
                  hitNormalX = (hitX - s.x) / s.r;
                  hitNormalY = (hitY - s.y) / s.r;
                }
              }
            }
          });

          if (closestDist < 700) {
            currX += dirX * closestDist;
            currY += dirY * closestDist;
            ctx.lineTo(currX, currY);

            // Calculate Specular Reflection vector R = D - 2(D . N)N
            const dot = dirX * hitNormalX + dirY * hitNormalY;
            dirX = dirX - 2 * dot * hitNormalX;
            dirY = dirY - 2 * dot * hitNormalY;
          } else {
            // Ray exits canvas
            currX += dirX * 400;
            currY += dirY * 400;
            ctx.lineTo(currX, currY);
            break;
          }
        }

        ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 + (i % 2) * 0.3})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    } else {
      // Rasterization Mode: Projected triangles with flat z-buffer lines
      spheres.forEach(s => {
        ctx.beginPath();
        ctx.moveTo(camera.x, camera.y);
        ctx.lineTo(s.x, s.y - s.r);
        ctx.lineTo(s.x, s.y + s.r);
        ctx.closePath();
        ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

  }, [renderMode, bounceCount, rayCount]);

  return (
    <div className="w-full my-8 p-5 md:p-6 rounded-2xl border border-slate-800 bg-[#0b0f19] text-slate-100 shadow-2xl font-sans">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">3D Graphics Rendering Pipeline</h3>
            <p className="text-xs font-mono text-slate-400">GPU Rasterization (Z-Buffer) vs. Monte Carlo Ray Tracing</p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setRenderMode('raytracing')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              renderMode === 'raytracing'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Path Ray Tracing</span>
          </button>
          <button
            onClick={() => setRenderMode('rasterization')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              renderMode === 'rasterization'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>GPU Rasterization</span>
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      {renderMode === 'raytracing' && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-6 font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-bold">Ray Bounces:</span>
            <input
              type="range"
              min="1"
              max="5"
              value={bounceCount}
              onChange={(e) => setBounceCount(parseInt(e.target.value))}
              className="w-28 accent-pink-500 cursor-pointer"
            />
            <span className="font-bold text-pink-400">{bounceCount} Bounces</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-bold">Ray Count:</span>
            <input
              type="range"
              min="4"
              max="32"
              step="4"
              value={rayCount}
              onChange={(e) => setRayCount(parseInt(e.target.value))}
              className="w-28 accent-pink-500 cursor-pointer"
            />
            <span className="font-bold text-pink-400">{rayCount} Rays</span>
          </div>
        </div>
      )}

      {/* Canvas Viewport */}
      <div className="mt-6 flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950 border border-slate-800 relative">
        <canvas
          ref={canvasRef}
          width={680}
          height={320}
          className="w-full max-w-full rounded-xl bg-[#070a12]"
        />

        <div className="absolute top-6 left-6 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-[10px] text-slate-300 backdrop-blur-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping"></span>
          <span>{renderMode === 'raytracing' ? 'Optical Ray Bounces Active' : 'Triangle Projection Rasterizer'}</span>
        </div>
      </div>

    </div>
  );
};
