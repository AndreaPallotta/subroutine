import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Code2, Sparkles, Zap } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';
import { CodeBlock } from '../ui/CodeBlock';

export type SupportedLanguage = 'python' | 'cpp' | 'go' | 'rust' | 'ts';

const LANG_CONFIG: Record<SupportedLanguage, { label: string; fileExt: string }> = {
  python: { label: 'Python (Qiskit)', fileExt: 'py' },
  cpp: { label: 'C++ (QuEST)', fileExt: 'cpp' },
  go: { label: 'Go (Quantum SDK)', fileExt: 'go' },
  rust: { label: 'Rust (Quantum Sim)', fileExt: 'rs' },
  ts: { label: 'TypeScript (Quantum.js)', fileExt: 'ts' },
};

const CODE_EXAMPLES: Record<SupportedLanguage, string> = {
  python: `# Quantum Circuit Simulation using Qiskit (Python)
from qiskit import QuantumCircuit, Aer, execute

# 1. Create a 1-qubit quantum circuit
circuit = QuantumCircuit(1, 1)

# 2. Apply Hadamard Gate (H) to create 50/50 Superposition
circuit.h(0)

# 3. Apply Pauli-X Gate (Bit Flip)
# circuit.x(0)

# 4. Measure Qubit State (Collapses Superposition)
circuit.measure(0, 0)

# Execute on Quantum Simulator Backend
backend = Aer.get_backend('qasm_simulator')
job = execute(circuit, backend, shots=1000)
result = job.result()
print("Measurement Counts:", result.get_counts())`,
  cpp: `// Quantum State Vector Simulation in C++ (QuEST Library)
#include "QuEST.h"
#include <iostream>

int main() {
    QuESTEnv env = createQuESTEnv();
    Qureg qubits = createQureg(1, env);

    // Initialize qubit in |0> ground state
    initZeroState(qubits);

    // Apply Hadamard Gate: |0> -> (|0> + |1>) / sqrt(2)
    hadamard(qubits, 0);

    // Measure Qubit (Probabilistic Collapse)
    int outcome = measure(qubits, 0);
    std::cout << "Quantum Measurement Outcome: |" << outcome << ">\\n";

    destroyQureg(qubits, env);
    destroyQuESTEnv(env);
    return 0;
}`,
  go: `// Quantum Gate Simulation in Go
package main

import (
	"fmt"
	"math/rand"
)

type Qubit struct {
	Theta float64 // Latitude [0, Pi]
	Phi   float64 // Longitude [0, 2*Pi]
}

func (q *Qubit) ApplyHadamard() {
	// Places qubit in equal superposition |+>
	q.Theta = 1.5707963 // Pi / 2
	q.Phi = 0
}

func (q *Qubit) Measure() int {
	// Probability of |0> is cos(Theta/2)^2
	probZero := Math.Cos(q.Theta/2) * Math.Cos(q.Theta/2)
	if rand.Float64() < probZero {
		return 0 // Collapsed to |0>
	}
	return 1 // Collapsed to |1>
}`,
  rust: `// Quantum State Vector Simulation in Rust
struct Qubit {
    theta: f64, // Latitude
    phi: f64,   // Longitude
}

impl Qubit {
    fn new() -> Self { Self { theta: 0.0, phi: 0.0 } }

    fn apply_hadamard(&mut self) {
        // Equal superposition state
        self.theta = std::f64::consts::FRAC_PI_2;
        self.phi = 0.0;
    }

    fn measure(&self) -> u8 {
        let prob_zero = (self.theta / 2.0).cos().powi(2);
        if rand::random::<f64>() < prob_zero { 0 } else { 1 }
    }
}`,
  ts: `// Quantum Circuit Simulation in TypeScript
class Qubit {
  theta = 0; // Latitude: 0 = |0>, Pi = |1>
  phi = 0;   // Longitude (Phase)

  applyHadamard(): void {
    // Hadamard Gate: |0> -> (|0> + |1>) / sqrt(2)
    this.theta = Math.PI / 2;
    this.phi = 0;
  }

  applyPauliX(): void {
    // Bit Flip Gate: |0> <-> |1>
    this.theta = Math.PI - this.theta;
  }

  measure(): 0 | 1 {
    const probZero = Math.pow(Math.cos(this.theta / 2), 2);
    return Math.random() < probZero ? 0 : 1;
  }
}`
};

export const BlochSphereVisualizer: React.FC = () => {
  const [theta, setTheta] = useState<number>(0); // 0 = |0>, PI = |1>
  const [phi, setPhi] = useState<number>(0);     // Phase angle
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('python');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [lastMeasurement, setLastMeasurement] = useState<0 | 1 | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Probability calculations
  const probZero = Math.pow(Math.cos(theta / 2), 2);
  const probOne = Math.pow(Math.sin(theta / 2), 2);

  // Apply Hadamard Gate (H)
  const applyHadamard = () => {
    setTheta(Math.PI / 2);
    setPhi(0);
    setLastMeasurement(null);
    audioEngine.playValueTone(587, 10, 100, 0.1); // D5
  };

  // Apply Pauli-X Gate (Bit Flip)
  const applyPauliX = () => {
    setTheta(prev => Math.PI - prev);
    setLastMeasurement(null);
    audioEngine.playValueTone(659, 10, 100, 0.1); // E5
  };

  // Apply Pauli-Z Gate (Phase Flip)
  const applyPauliZ = () => {
    setPhi(prev => (prev + Math.PI) % (2 * Math.PI));
    setLastMeasurement(null);
    audioEngine.playValueTone(440, 10, 100, 0.1); // A4
  };

  // Run Quantum Measurement Collapse
  const measureQubit = () => {
    const outcome = Math.random() < probZero ? 0 : 1;
    setLastMeasurement(outcome);
    setTheta(outcome === 0 ? 0 : Math.PI);
    setPhi(0);
    if (outcome === 0) {
      audioEngine.playValueTone(880, 10, 100, 0.15);
    } else {
      audioEngine.playValueTone(330, 10, 100, 0.15);
    }
  };

  // Render Bloch Sphere 2D Orthographic Projection
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = 110;

    ctx.fillStyle = '#080c16';
    ctx.fillRect(0, 0, width, height);

    // Draw Outer Sphere Wireframe
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Equator Ellipse
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius, radius * 0.35, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    // Z-Axis (|0> top, |1> bottom)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath(); ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius); ctx.stroke();

    // Pole Labels
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px Fira Code';
    ctx.fillText('|0⟩', cx - 10, cy - radius - 10);
    ctx.fillStyle = '#ec4899';
    ctx.fillText('|1⟩', cx - 10, cy + radius + 20);

    // Calculate Qubit Vector (x, y, z) on sphere
    const x = Math.sin(theta) * Math.cos(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(theta);

    // Project 3D vector to 2D canvas
    const px = cx + (x * Math.cos(0.4) - y * Math.sin(0.4)) * radius;
    const py = cy - z * radius + (x * Math.sin(0.2) + y * Math.cos(0.2)) * radius * 0.25;

    // Draw Vector Line
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#6366f1';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Draw Qubit Tip Dot
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [theta, phi]);

  const activeLangConfig = LANG_CONFIG[selectedLang];

  return (
    <div className="my-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Bloch Sphere Quantum Simulator</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-purple-950 text-purple-300 border border-purple-500/30">
              Qubit State |ψ⟩
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Manipulate single-qubit quantum state vector <code className="text-purple-300">|ψ⟩ = α|0⟩ + β|1⟩</code> using Hadamard and Pauli gates!
          </p>
        </div>

        {/* Measurement Display */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500">Last Collapse: </span>
            <span className={lastMeasurement === 0 ? 'text-cyan-400 font-bold' : lastMeasurement === 1 ? 'text-pink-400 font-bold' : 'text-slate-400'}>
              {lastMeasurement !== null ? `|${lastMeasurement}⟩` : 'Unmeasured Superposition'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Bloch Sphere & Controls */}
      <div className="p-6 bg-slate-950/90 flex flex-col md:flex-row items-center justify-center gap-8 border-b border-slate-800">
        <canvas ref={canvasRef} width={320} height={300} className="rounded-xl bg-slate-950 border border-slate-800 shadow-inner" />

        <div className="flex-1 max-w-md space-y-4 text-xs font-mono">
          {/* Probabilities */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-cyan-400 font-bold">P(|0⟩) Ground State:</span>
              <span className="text-white font-bold">{Math.round(probZero * 100)}%</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
              <div className="bg-cyan-400 h-full transition-all duration-150" style={{ width: `${probZero * 100}%` }} />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-pink-400 font-bold">P(|1⟩) Excited State:</span>
              <span className="text-white font-bold">{Math.round(probOne * 100)}%</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
              <div className="bg-pink-400 h-full transition-all duration-150" style={{ width: `${probOne * 100}%` }} />
            </div>
          </div>

          {/* Quantum Gate Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={applyHadamard}
              className="px-3 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-200 font-bold text-xs shadow transition-all"
            >
              Hadamard (H)
            </button>
            <button
              onClick={applyPauliX}
              className="px-3 py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 font-bold text-xs shadow transition-all"
            >
              Pauli-X (Bit Flip)
            </button>
            <button
              onClick={applyPauliZ}
              className="px-3 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 font-bold text-xs shadow transition-all"
            >
              Pauli-Z (Phase)
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={measureQubit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25 transition-all"
            >
              <Zap className="w-4 h-4" />
              <span>Measure Qubit (Collapse Superposition)</span>
            </button>

            <button
              onClick={() => { setTheta(0); setPhi(0); setLastMeasurement(null); }}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              title="Reset Qubit to |0>"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const nextState = !isAudioMuted;
                setIsAudioMuted(nextState);
                audioEngine.setMuted(nextState);
              }}
              className={`p-2.5 rounded-xl transition-all ${
                isAudioMuted ? 'bg-slate-800 text-rose-400' : 'bg-indigo-950/60 text-cyan-400 border border-cyan-500/30'
              }`}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Code Inspector */}
      <div className="p-6 bg-slate-950/95">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>Quantum Circuit Code Implementation</span>
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
          filename={`quantum_circuit.${activeLangConfig.fileExt}`}
          langLabel={activeLangConfig.label}
        />
      </div>
    </div>
  );
};
