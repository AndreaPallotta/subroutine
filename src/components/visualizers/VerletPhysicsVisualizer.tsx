import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Code2, Activity } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';
import { CodeBlock } from '../ui/CodeBlock';

export type IntegrationMethod = 'euler' | 'verlet';
export type SupportedLanguage = 'cpp' | 'python' | 'java' | 'go' | 'rust' | 'ts';

const LANG_CONFIG: Record<SupportedLanguage, { label: string; fileExt: string }> = {
  cpp: { label: 'C++', fileExt: 'cpp' },
  python: { label: 'Python', fileExt: 'py' },
  java: { label: 'Java', fileExt: 'java' },
  go: { label: 'Go', fileExt: 'go' },
  rust: { label: 'Rust', fileExt: 'rs' },
  ts: { label: 'TypeScript', fileExt: 'ts' },
};

const CODE_EXAMPLES: Record<SupportedLanguage, string> = {
  cpp: `// Verlet vs. Explicit Euler Numerical Integration in C++
struct Particle {
    double x, y;
    double oldX, oldY; // For Verlet Integration
    double vx, vy;     // For Euler Integration
    double ax, ay;
};

// 1. Explicit Euler Integration (Unstable for orbits & springs)
void stepEuler(Particle& p, double dt) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx += p.ax * dt;
    p.vy += p.ay * dt;
}

// 2. Verlet Integration (Symplectic & Energy Preserving)
void stepVerlet(Particle& p, double dt) {
    double nextX = 2 * p.x - p.oldX + p.ax * dt * dt;
    double nextY = 2 * p.y - p.oldY + p.ay * dt * dt;
    p.oldX = p.x; p.oldY = p.y;
    p.x = nextX; p.y = nextY;
}`,
  python: `# Numerical Integration: Verlet vs Explicit Euler in Python

def step_euler(x, y, vx, vy, ax, ay, dt):
    # Accumulates truncation energy drift over time
    x += vx * dt
    y += vy * dt
    vx += ax * dt
    vy += ay * dt
    return x, y, vx, vy

def step_verlet(x, y, old_x, old_y, ax, ay, dt):
    # Time-reversible, conserves mechanical energy
    next_x = 2 * x - old_x + ax * (dt ** 2)
    next_y = 2 * y - old_y + ay * (dt ** 2)
    return next_x, next_y, x, y`,
  java: `// Verlet vs Euler Physics Integration in Java
public class PhysicsEngine {
    public static class Particle {
        public double x, y, oldX, oldY, vx, vy, ax, ay;
    }

    public static void stepEuler(Particle p, double dt) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx += p.ax * dt; p.vy += p.ay * dt;
    }

    public static void stepVerlet(Particle p, double dt) {
        double nextX = 2 * p.x - p.oldX + p.ax * dt * dt;
        double nextY = 2 * p.y - p.oldY + p.ay * dt * dt;
        p.oldX = p.x; p.oldY = p.y;
        p.x = nextX; p.y = nextY;
    }
}`,
  go: `// Symplectic Verlet Position Integration in Go
package main

type Particle struct {
	X, Y       float64
	OldX, OldY float64
	AX, AY     float64
}

func StepVerlet(p *Particle, dt float64) {
	nextX := 2*p.X - p.OldX + p.AX*dt*dt
	nextY := 2*p.Y - p.OldY + p.AY*dt*dt
	p.OldX, p.OldY = p.X, p.Y
	p.X, p.Y = nextX, nextY
}`,
  rust: `// Symplectic Verlet Position Integration in Rust
pub struct Particle {
    pub x: f64, pub y: f64,
    pub old_x: f64, pub old_y: f64,
    pub ax: f64, pub ay: f64,
}

impl Particle {
    pub fn step_verlet(&mut self, dt: f64) {
        let next_x = 2.0 * self.x - self.old_x + self.ax * dt * dt;
        let next_y = 2.0 * self.y - self.old_y + self.ay * dt * dt;
        self.old_x = self.x; self.old_y = self.y;
        self.x = next_x; self.y = next_y;
    }
}`,
  ts: `// Symplectic Verlet Position Integration in TypeScript
export interface Particle {
  x: number; y: number;
  oldX: number; oldY: number;
  ax: number; ay: number;
}

export function stepVerlet(p: Particle, dt: number): void {
  const nextX = 2 * p.x - p.oldX + p.ax * dt * dt;
  const nextY = 2 * p.y - p.oldY + p.ay * dt * dt;
  p.oldX = p.x; p.oldY = p.y;
  p.x = nextX; p.y = nextY;
}`
};

export const VerletPhysicsVisualizer: React.FC = () => {
  const [method, setMethod] = useState<IntegrationMethod>('verlet');
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('cpp');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [totalEnergy, setTotalEnergy] = useState<number>(100);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  // Pendulum State
  const stateRef = useRef({
    x: 0, y: 1.2,
    oldX: -0.05, oldY: 1.2,
    vx: 0.8, vy: 0,
    originX: 0, originY: 0,
    length: 1.2,
    g: 9.81,
    dt: 0.02
  });

  const resetPhysics = () => {
    stateRef.current = {
      x: 0, y: 1.2,
      oldX: -0.05, oldY: 1.2,
      vx: 0.8, vy: 0,
      originX: 0, originY: 0,
      length: 1.2,
      g: 9.81,
      dt: 0.02
    };
    setTotalEnergy(100);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 3;
    const scale = 120;

    const render = () => {
      const s = stateRef.current;
      const dt = s.dt;

      if (isRunning) {
        // Pendulum acceleration (Restoring gravity force along arc)
        const dx = s.x - s.originX;
        const dy = s.y - s.originY;
        const dist = Math.hypot(dx, dy);
        const ax = -s.g * (dx / dist);
        const ay = -s.g * (dy / dist);

        if (method === 'euler') {
          // Explicit Euler (Energy accumulates endlessly)
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.vx += ax * dt;
          s.vy += ay * dt;
        } else {
          // Verlet Integration (Conserves energy)
          const nextX = 2 * s.x - s.oldX + ax * dt * dt;
          const nextY = 2 * s.y - s.oldY + ay * dt * dt;
          s.oldX = s.x; s.oldY = s.y;
          s.x = nextX; s.y = nextY;
          s.vx = (s.x - s.oldX) / dt;
          s.vy = (s.y - s.oldY) / dt;
        }

        // Mechanical Energy (Kinetic + Potential)
        const vSq = s.vx * s.vx + s.vy * s.vy;
        const energy = 0.5 * vSq + s.g * (s.y - 0.5);
        setTotalEnergy(Math.round(energy * 10));
      }

      ctx.fillStyle = '#080c16';
      ctx.fillRect(0, 0, width, height);

      // Draw Pendulum Arm String
      const px = cx + s.x * scale;
      const py = cy + s.y * scale;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Anchor Pivot
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();

      // Bob Mass
      ctx.fillStyle = method === 'verlet' ? '#10b981' : '#f43f5e';
      ctx.shadowColor = method === 'verlet' ? '#10b981' : '#f43f5e';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isRunning, method]);

  const activeLangConfig = LANG_CONFIG[selectedLang];

  return (
    <div className="my-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
      <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Numerical Integration Physics Engine</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-purple-950 text-purple-300 border border-purple-500/30">
              Verlet vs Explicit Euler
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Observe how <strong className="text-rose-400">Explicit Euler</strong> gains non-physical energy and explodes, whereas <strong className="text-emerald-400">Verlet Integration</strong> conserves mechanical energy!
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => { setMethod('verlet'); resetPhysics(); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              method === 'verlet' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Verlet Integration (Stable)
          </button>
          <button
            onClick={() => { setMethod('euler'); resetPhysics(); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              method === 'euler' ? 'bg-rose-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Explicit Euler (Unstable)
          </button>
        </div>
      </div>

      <div className="p-6 bg-slate-950/90 flex flex-col md:flex-row items-center justify-center gap-8 border-b border-slate-800">
        <canvas ref={canvasRef} width={340} height={280} className="rounded-xl bg-slate-950 border border-slate-800 shadow-inner" />

        <div className="flex-1 max-w-md space-y-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Mechanical Energy Metric:
              </span>
              <span className={method === 'verlet' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {totalEnergy} Joules
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${method === 'verlet' ? 'bg-emerald-400' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(100, (totalEnergy / 200) * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs shadow-lg transition-all ${
                isRunning
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isRunning ? 'Pause Simulation' : 'Start Simulation'}</span>
            </button>

            <button
              onClick={resetPhysics}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
              title="Reset Simulation State"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const nextState = !isAudioMuted;
                setIsAudioMuted(nextState);
                audioEngine.setMuted(nextState);
              }}
              className={`p-3 rounded-xl transition-all border ${
                isAudioMuted ? 'bg-slate-800 text-rose-400 border-rose-500/30' : 'bg-indigo-950/60 text-cyan-400 border-cyan-500/30'
              }`}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-950/95">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>Numerical Integration Code</span>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono">
            {(Object.keys(LANG_CONFIG) as SupportedLanguage[]).map(langKey => (
              <button
                key={langKey}
                onClick={() => setSelectedLang(langKey)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  selectedLang === langKey
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {LANG_CONFIG[langKey].label}
              </button>
            ))}
          </div>
        </div>

        <CodeBlock
          code={CODE_EXAMPLES[selectedLang]}
          language={selectedLang}
          filename={`physics_integration.${activeLangConfig.fileExt}`}
          langLabel={activeLangConfig.label}
        />
      </div>
    </div>
  );
};
