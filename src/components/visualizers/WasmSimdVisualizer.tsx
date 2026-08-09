import React, { useState } from 'react';
import { Cpu, Zap, Play, CheckCircle2 } from 'lucide-react';

export const WasmSimdVisualizer: React.FC = () => {
  const [vectorA, setVectorA] = useState<number[]>([1.5, 2.0, 3.5, 4.0]);
  const [vectorB, setVectorB] = useState<number[]>([2.0, 4.0, 1.0, 3.0]);
  const [result, setResult] = useState<number[]>([3.0, 8.0, 3.5, 12.0]);
  const [executionMode, setExecutionMode] = useState<'scalar' | 'simd'>('simd');
  const [wasmLog, setWasmLog] = useState<string>('Wasm V8 Engine Active: v128.mul executed 4 parallel float32 multiplications in 1 CPU cycle.');

  const handleExecute = () => {
    const newA = Array.from({ length: 4 }, () => parseFloat((Math.random() * 5 + 1).toFixed(1)));
    const newB = Array.from({ length: 4 }, () => parseFloat((Math.random() * 5 + 1).toFixed(1)));
    const newRes = newA.map((val, idx) => parseFloat((val * newB[idx]).toFixed(1)));

    setVectorA(newA);
    setVectorB(newB);
    setResult(newRes);

    if (executionMode === 'simd') {
      setWasmLog(`Wasm SIMD 128-bit Instruction (v128.mul): 4 parallel float32 lanes multiplied in single instruction!`);
    } else {
      setWasmLog(`Scalar Fallback Loop: Executed 4 sequential single-float iterations (4x latency penalty).`);
    }
  };

  return (
    <div className="w-full my-8 p-5 md:p-6 rounded-2xl border border-slate-800 bg-[#0b0f19] text-slate-100 shadow-2xl font-sans">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">WebAssembly (Wasm) 128-bit SIMD Vector Execution</h3>
            <p className="text-xs font-mono text-slate-400">Parallel Lane Processing: `v128.mul` 4x Float32 Parallel Speedup</p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setExecutionMode('simd')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              executionMode === 'simd'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>128-bit SIMD (Parallel)</span>
          </button>
          <button
            onClick={() => setExecutionMode('scalar')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              executionMode === 'scalar'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Scalar (Sequential)</span>
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="mt-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <button
          onClick={handleExecute}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-2 transition-all shadow-md shadow-purple-600/30"
        >
          <Play className="w-4 h-4" />
          <span>Execute Vector Instruction (v128.mul)</span>
        </button>

        <span className="text-[11px] text-slate-400">V8 Turbofan Liftoff Tier 2 JIT Compiler</span>
      </div>

      {/* SIMD Register Lanes Display */}
      <div className="mt-6 p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-6 font-mono text-xs">
        
        {/* Register A */}
        <div className="space-y-2">
          <span className="text-[11px] text-purple-400 font-bold uppercase tracking-wider">128-bit Vector Register A (4x f32 Lanes)</span>
          <div className="grid grid-cols-4 gap-3">
            {vectorA.map((val, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-center font-bold text-purple-200">
                Lane #{idx}: <span className="text-white">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Operation Sign */}
        <div className="text-center font-bold text-purple-400 text-sm">
          {executionMode === 'simd' ? '⚡ 128-bit v128.mul (1 CPU Cycle Parallel Multiply) ⚡' : '↓ Sequential Loop Iteration 1-by-1 ↓'}
        </div>

        {/* Register B */}
        <div className="space-y-2">
          <span className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider">128-bit Vector Register B (4x f32 Lanes)</span>
          <div className="grid grid-cols-4 gap-3">
            {vectorB.map((val, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-center font-bold text-cyan-200">
                Lane #{idx}: <span className="text-white">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Output Vector */}
        <div className="space-y-2 border-t border-slate-800 pt-4">
          <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">Output Result Register (A * B)</span>
          <div className="grid grid-cols-4 gap-3">
            {result.map((val, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center font-bold text-emerald-300">
                Lane #{idx}: <span className="text-white">{val}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Terminal Log */}
      <div className="mt-6 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-purple-300 flex items-center gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="truncate">{wasmLog}</span>
      </div>

    </div>
  );
};
