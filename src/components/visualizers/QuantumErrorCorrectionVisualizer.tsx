import React, { useState } from 'react';
import { Play, RotateCcw, ShieldCheck, Zap, Layers } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';

export const QuantumErrorCorrectionVisualizer: React.FC = () => {
  // 3x3 Lattice of Data Qubits (D) and Ancilla Stabilizers (A)
  const [dataQubits, setDataQubits] = useState<Array<'0' | '1' | 'X_ERR' | 'Z_ERR'>>([
    '0', '0', '0',
    '0', '0', '0',
    '0', '0', '0'
  ]);
  const [ancillas, setAncillas] = useState<Array<'CLEAN' | 'SYNDROME_DETECTED'>>([
    'CLEAN', 'CLEAN', 'CLEAN', 'CLEAN'
  ]);
  const [errorsInjected, setErrorsInjected] = useState(0);
  const [errorsCorrected, setErrorsCorrected] = useState(0);
  const [stepStatus, setStepStatus] = useState<string>('System Nominal. Click "Inject Pauli Bit-Flip Error" to test.');

  const handleInjectBitFlip = () => {
    // Inject X error into random data qubit
    const targetIdx = Math.floor(Math.random() * 9);
    setDataQubits(prev => {
      const next = [...prev];
      next[targetIdx] = 'X_ERR';
      return next;
    });
    setAncillas(['SYNDROME_DETECTED', 'CLEAN', 'SYNDROME_DETECTED', 'CLEAN']);
    setErrorsInjected(prev => prev + 1);
    setStepStatus(`Pauli X (Bit-Flip) Noise injected into Data Qubit D${targetIdx}! Ancilla Stabilizer Syndrome Triggered!`);
    audioEngine.playNote(180, 'sawtooth', 0.15, 0.08);
  };

  const handleInjectPhaseFlip = () => {
    // Inject Z error into random data qubit
    const targetIdx = Math.floor(Math.random() * 9);
    setDataQubits(prev => {
      const next = [...prev];
      next[targetIdx] = 'Z_ERR';
      return next;
    });
    setAncillas(['CLEAN', 'SYNDROME_DETECTED', 'CLEAN', 'SYNDROME_DETECTED']);
    setErrorsInjected(prev => prev + 1);
    setStepStatus(`Pauli Z (Phase-Flip) Noise injected into Data Qubit D${targetIdx}! Ancilla Stabilizer Syndrome Triggered!`);
    audioEngine.playNote(220, 'square', 0.15, 0.08);
  };

  const handleRunMWPMDecoder = () => {
    // Execute MWPM Syndrome Decoding & Correction
    setDataQubits(['0', '0', '0', '0', '0', '0', '0', '0', '0']);
    setAncillas(['CLEAN', 'CLEAN', 'CLEAN', 'CLEAN']);
    setErrorsCorrected(prev => prev + errorsInjected);
    setStepStatus('MWPM Decoder successfully matched syndrome graph and applied correction operator! Logical Qubit Preserved.');
    audioEngine.playNote(520, 'sine', 0.2, 0.1);
  };

  const handleReset = () => {
    setDataQubits(['0', '0', '0', '0', '0', '0', '0', '0', '0']);
    setAncillas(['CLEAN', 'CLEAN', 'CLEAN', 'CLEAN']);
    setErrorsInjected(0);
    setErrorsCorrected(0);
    setStepStatus('System Nominal. Click "Inject Pauli Bit-Flip Error" to test.');
  };

  return (
    <div className="my-8 rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <Layers className="w-5 h-5 text-purple-400" />
            <span>2D Surface Code Lattice & Syndrome Extraction</span>
          </h3>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Simulate Data Qubits, Ancilla Stabilizers, Pauli Noise, and MWPM Decoding
          </p>
        </div>

        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-slate-500 block text-[10px] uppercase">Noise Injected</span>
            <span className="text-amber-400 font-bold text-sm">{errorsInjected}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-slate-500 block text-[10px] uppercase">Corrected</span>
            <span className="text-emerald-400 font-bold text-sm">{errorsCorrected}</span>
          </div>
        </div>
      </div>

      {/* Surface Code Lattice Grid */}
      <div className="my-6 p-6 rounded-xl bg-[#090d16] border border-slate-800 flex flex-col items-center justify-center gap-4">
        <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
          Logical Qubit Lattice (9 Data Qubits + 4 Ancilla Stabilizers)
        </span>

        <div className="grid grid-cols-3 gap-4 my-2">
          {dataQubits.map((val, idx) => (
            <div
              key={idx}
              className={`w-20 h-20 rounded-xl border flex flex-col items-center justify-center p-2 font-mono text-xs transition-all shadow-md ${
                val === 'X_ERR'
                  ? 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse'
                  : val === 'Z_ERR'
                  ? 'bg-amber-950 border-amber-500 text-amber-300 animate-pulse'
                  : 'bg-slate-900 border-slate-800 text-purple-300'
              }`}
            >
              <span className="text-[10px] text-slate-500">D{idx}</span>
              <span className="text-sm font-bold mt-1">
                {val === 'X_ERR' ? 'Pauli X' : val === 'Z_ERR' ? 'Pauli Z' : '|0⟩'}
              </span>
            </div>
          ))}
        </div>

        {/* Status Message Banner */}
        <div className="w-full p-3 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-xs text-purple-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>{stepStatus}</span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleInjectBitFlip}
            className="px-4 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/40 font-mono text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Inject Pauli X (Bit-Flip)</span>
          </button>

          <button
            onClick={handleInjectPhaseFlip}
            className="px-4 py-2 rounded-xl bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Inject Pauli Z (Phase-Flip)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunMWPMDecoder}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30"
          >
            <Play className="w-4 h-4" />
            <span>Run MWPM Decoder & Correct</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
