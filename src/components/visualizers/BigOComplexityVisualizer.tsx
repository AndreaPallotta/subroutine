import React, { useState } from 'react';
import { Activity, BarChart2 } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';

type ComplexityType = 'O(1)' | 'O(log N)' | 'O(N)' | 'O(N log N)' | 'O(N^2)';

export const BigOComplexityVisualizer: React.FC = () => {
  const [nSize, setNSize] = useState(100);
  const [selectedComplexity, setSelectedComplexity] = useState<ComplexityType>('O(N log N)');

  const complexities: Record<ComplexityType, { 
    name: string; 
    formulaOps: (n: number) => number; 
    formulaBytes: (n: number) => number; 
    desc: string; 
    example: string;
    opsFormulaText: string;
    spaceFormulaText: string;
  }> = {
    'O(1)': {
      name: 'Constant Complexity O(1)',
      formulaOps: () => 1,
      formulaBytes: () => 64, // Fixed stack frame allocation (64 bytes for local variables & register saves)
      opsFormulaText: '1 primitive operation',
      spaceFormulaText: 'Fixed 64 B (Single stack frame)',
      desc: 'Execution time and auxiliary memory stay identical regardless of input size N. Direct array index retrieval or hash map bucket lookup.',
      example: 'return array[0] or hashMap.get("key")'
    },
    'O(log N)': {
      name: 'Logarithmic Complexity O(log N)',
      formulaOps: (n) => Math.ceil(Math.log2(Math.max(1, n))),
      formulaBytes: (n) => Math.ceil(Math.log2(Math.max(1, n))) * 64, // Recursion stack depth of log2(N) frames * 64 bytes
      opsFormulaText: 'ceil(log2(N)) comparison steps',
      spaceFormulaText: 'log2(N) recursion frames * 64 B',
      desc: 'Halves the search space on each step. Requires log2(N) comparisons and recursive call stack frames.',
      example: 'Binary Search over sorted array, B-Tree lookups'
    },
    'O(N)': {
      name: 'Linear Complexity O(N)',
      formulaOps: (n) => n,
      formulaBytes: (n) => n * 8, // N 64-bit (8-byte) integers or pointers allocated in auxiliary memory
      opsFormulaText: 'N loop iterations',
      spaceFormulaText: 'N elements * 8 Bytes (64-bit integers)',
      desc: 'Execution time and memory scale linearly with input size N. Single loop traversal or copy of an N-element array.',
      example: 'Linear search, copying an array'
    },
    'O(N log N)': {
      name: 'Linearithmic Complexity O(N log N)',
      formulaOps: (n) => Math.round(n * Math.log2(Math.max(1, n))),
      formulaBytes: (n) => n * 8 + Math.ceil(Math.log2(Math.max(1, n))) * 64, // MergeSort auxiliary buffer (8N bytes) + recursion stack
      opsFormulaText: 'N * log2(N) comparison steps',
      spaceFormulaText: 'Auxiliary buffer (8N B) + Recursion stack',
      desc: 'The optimal theoretical bound for comparison-based sorting. Divides input into log2(N) levels, processing N items per level.',
      example: 'Merge Sort, Quick Sort, Heap Sort'
    },
    'O(N^2)': {
      name: 'Quadratic Complexity O(N^2)',
      formulaOps: (n) => n * n,
      formulaBytes: (n) => n * n * 8, // N x N matrix of 64-bit (8-byte) values
      opsFormulaText: 'N^2 nested loop operations',
      spaceFormulaText: 'N^2 matrix elements * 8 Bytes',
      desc: 'Nested loops traversing N elements N times. Step count and 2D matrix memory explode quadratically as N grows.',
      example: 'Bubble Sort, All-Pairs Shortest Path, Adjacency Matrix'
    }
  };

  const currentOps = complexities[selectedComplexity].formulaOps(nSize);
  const currentBytes = complexities[selectedComplexity].formulaBytes(nSize);

  const handleSliderChange = (newN: number) => {
    setNSize(newN);
    audioEngine.playNote(250 + (newN % 10) * 20, 'sine', 0.05, 0.03);
  };

  const handleComplexitySelect = (type: ComplexityType) => {
    setSelectedComplexity(type);
    audioEngine.playNote(400, 'triangle', 0.1, 0.05);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} Bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="my-8 rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Big O Algorithmic Complexity Analyzer</span>
          </h3>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Simulate primitive operation count and 64-bit memory allocations as N scales
          </p>
        </div>

        {/* Complexity Selector */}
        <div className="flex flex-wrap rounded-xl bg-slate-900 p-1 border border-slate-800 font-mono text-xs">
          {(Object.keys(complexities) as ComplexityType[]).map((key) => (
            <button
              key={key}
              onClick={() => handleComplexitySelect(key)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                selectedComplexity === key ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Input Slider */}
      <div className="my-6 space-y-2">
        <div className="flex items-center justify-between font-mono text-xs text-slate-400">
          <span>Input Elements (N):</span>
          <span className="text-cyan-400 font-bold text-sm">N = {nSize.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min="10"
          max="1000"
          step="10"
          value={nSize}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          className="w-full accent-cyan-500 bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>

      {/* Output Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono">
          <span className="text-slate-500 block text-xs uppercase">Time Complexity (Primitive Operations)</span>
          <span className="text-2xl font-bold text-cyan-400 block my-1">
            {currentOps.toLocaleString()} ops
          </span>
          <span className="text-[11px] text-slate-400 block">
            Formula: {complexities[selectedComplexity].opsFormulaText}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono">
          <span className="text-slate-500 block text-xs uppercase">Auxiliary Space (64-bit Memory Allocated)</span>
          <span className="text-2xl font-bold text-indigo-400 block my-1">
            {formatBytes(currentBytes)}
          </span>
          <span className="text-[11px] text-slate-400 block">
            Formula: {complexities[selectedComplexity].spaceFormulaText}
          </span>
        </div>
      </div>

      {/* Algorithm Detail Box */}
      <div className="p-6 rounded-xl bg-[#090d16] border border-slate-800 space-y-3 font-mono">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <span className="text-sm font-bold text-white">{complexities[selectedComplexity].name}</span>
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px]">
            {selectedComplexity}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans">{complexities[selectedComplexity].desc}</p>

        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-amber-300 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-amber-400" />
          <span>Typical Implementation: {complexities[selectedComplexity].example}</span>
        </div>
      </div>

    </div>
  );
};
