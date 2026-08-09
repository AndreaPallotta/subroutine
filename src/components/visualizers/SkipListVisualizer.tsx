import React, { useState } from 'react';
import { Layers, Plus, RefreshCw, Play, CheckCircle2 } from 'lucide-react';

interface SkipListNode {
  value: number;
  levels: number;
}

export const SkipListVisualizer: React.FC = () => {
  const [nodes, setNodes] = useState<SkipListNode[]>([
    { value: 12, levels: 3 },
    { value: 25, levels: 1 },
    { value: 37, levels: 2 },
    { value: 48, levels: 4 },
    { value: 64, levels: 1 },
    { value: 89, levels: 2 }
  ]);
  const [newValue, setNewValue] = useState<number>(55);
  const [skipLog, setSkipLog] = useState<string>('SkipList initialized with max height 4. Search performance: O(log N).');

  const handleInsert = () => {
    if (!newValue || isNaN(newValue)) return;
    
    // Simulate coin flip for height (probabilistic promotion p=0.5)
    let randomLevels = 1;
    while (Math.random() < 0.5 && randomLevels < 4) {
      randomLevels++;
    }

    const newNode = { value: newValue, levels: randomLevels };
    setNodes(prev => [...prev, newNode].sort((a, b) => a.value - b.value));
    setSkipLog(`Inserted node [${newValue}] with coin-flip tower height L${randomLevels}. CAS pointer update completed.`);
    setNewValue(Math.floor(Math.random() * 90) + 10);
  };

  return (
    <div className="w-full my-8 p-5 md:p-6 rounded-2xl border border-slate-800 bg-[#0b0f19] text-slate-100 shadow-2xl font-sans">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">SkipList Probabilistic Multi-Level Search</h3>
            <p className="text-xs font-mono text-slate-400">Lock-Free O(log N) Search & Insertion via Coin-Flip Tower Heights</p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-amber-300">
          <span>Max Level:</span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-950 border border-amber-500/40 font-bold text-amber-300">
            L4 Tower Height
          </span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="mt-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold">Value to Insert:</span>
          <input
            type="number"
            value={newValue}
            onChange={(e) => setNewValue(parseInt(e.target.value) || 0)}
            className="w-20 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={handleInsert}
            className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-600/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Coin Flip & Insert</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400">Probabilistic Promotion Factor p = 0.5</span>
      </div>

      {/* Multi-Level Tower Visualization */}
      <div className="mt-6 p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs overflow-x-auto">
        {[4, 3, 2, 1].map((level) => (
          <div key={level} className="flex items-center gap-3">
            <span className="w-12 text-[11px] text-amber-400 font-bold shrink-0">Level {level}</span>
            <div className="flex items-center gap-4 min-w-max">
              {nodes.map((node) => {
                const isActiveInLevel = node.levels >= level;
                return (
                  <div
                    key={node.value}
                    className={`w-12 h-9 rounded-xl border flex items-center justify-center font-bold text-xs transition-all ${
                      isActiveInLevel
                        ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10'
                        : 'bg-slate-900/20 border-slate-800/40 text-slate-700 opacity-20'
                    }`}
                  >
                    {isActiveInLevel ? node.value : '-'}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Execution Terminal Log */}
      <div className="mt-6 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-amber-300 flex items-center gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="truncate">{skipLog}</span>
      </div>

    </div>
  );
};
