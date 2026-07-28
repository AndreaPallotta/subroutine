import React, { useState } from 'react';
import { Activity, Play, RefreshCw, BarChart2 } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';

type ComplexityType = 'O(1)' | 'O(log N)' | 'O(N)' | 'O(N log N)' | 'O(N^2)';

export const BigOComplexityVisualizer: React.FC = () => {
  const [nSize, setNSize] = useState(100);
  const [selectedComplexity, setSelectedComplexity] = useState<ComplexityType>('O(N log N)');
  const [operationsCount, setOperationsCount] = useState(664); // 100 * log2(100) = 664
  const [spaceKB, setSpaceKB] = useState(0.8);

  const complexities: Record<ComplexityType, { name: string; formula: (n: number) => number; space: (n: number) => number; desc: string; example: string }> = {
    'O(1)': {
      name: 'Constant Time O(1)',
      formula: () => 1,
      space: () => 0.1,
      desc: 'Execution time remains identical regardless of input size N. Instant hash map lookup or array index retrieval.',
      example: 'return array[0] or hashMap.get("key")'
    },
    'O(log N)': {
      name: 'Logarithmic Time O(log N)',
      formula: (n) => Math.round(Math.log2(Math.max(1, n))),
      space: (n) => Math.round(Math.log2(Math.max(1, n)) * 0.05 * 10) / 10,
      desc: 'Halves the search space on each step. Binary Search over a sorted array.',
      example: 'Binary Search, B-Tree lookups'
    },
    'O(N)': {
      name: 'Linear Time O(N)',
      formula: (n) => n,
      space: (n) => Math.round((n * 0.008) * 10) / 10,
      desc: 'Execution time scales proportionally with input size N. Single loop iteration over array items.',
      example: 'Linear search, array traversal'
    },
    'O(N log N)': {
      name: 'Linearithmic Time O(N log N)',
      formula: (n) => Math.round(n * Math.log2(Math.max(1, n))),
      space: (n) => Math.round((n * 0.016) * 10) / 10,
      desc: 'Optimal comparison-based sorting complexity. Divide and conquer algorithms.',
      example: 'Merge Sort, Quick Sort, Heap Sort'
    },
    'O(N^2)': {
      name: 'Quadratic Time O(N^2)',
      formula: (n) => n * n,
      space: (n) => Math.round((n * n * 0.004) * 10) / 10,
      desc: 'Nested loops traversing N items N times. Performance degrades rapidly for large N.',
      example: 'Bubble Sort, Selection Sort, All-Pairs Comparisons'
    }
  };

  const handleSliderChange = (newN: number) => {
    setNSize(newN);
    const ops = complexities[selectedComplexity].formula(newN);
    const sp = complexities[selectedComplexity].space(newN);
    setOperationsCount(ops);
    setSpaceKB(sp);
    audioEngine.playNote(250 + (newN % 10) * 20, 'sine', 0.05, 0.03);
  };

  const handleComplexitySelect = (type: ComplexityType) => {
    setSelectedComplexity(type);
    const ops = complexities[type].formula(nSize);
    const sp = complexities[type].space(nSize);
    setOperationsCount(ops);
    setSpaceKB(sp);
    audioEngine.playNote(400, 'triangle', 0.1, 0.05);
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
            Simulate step growth rate and space allocation as input size N scales
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
          <span className="text-slate-500 block text-xs uppercase">Time Complexity Step Operations</span>
          <span className="text-2xl font-bold text-cyan-400">
            {operationsCount.toLocaleString()} ops
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono">
          <span className="text-slate-500 block text-xs uppercase">Auxiliary Space Complexity</span>
          <span className="text-2xl font-bold text-indigo-400">
            {spaceKB < 1024 ? `${spaceKB.toFixed(1)} KB` : `${(spaceKB / 1024).toFixed(2)} MB`}
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
