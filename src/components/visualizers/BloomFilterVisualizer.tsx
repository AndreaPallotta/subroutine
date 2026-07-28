import React, { useState } from 'react';
import { Search, Plus, RotateCcw, ShieldCheck, AlertTriangle } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';

export const BloomFilterVisualizer: React.FC = () => {
  const [bitArray, setBitArray] = useState<number[]>(new Array(16).fill(0));
  const [addedItems, setAddedItems] = useState<string[]>(['user_402', 'session_891', 'tx_9921']);
  const [searchQuery, setSearchQuery] = useState('user_402');
  const [searchResult, setSearchResult] = useState<string | null>(null);

  // Simple string hash functions (Murmur3 / FNV-1a simulation)
  const hash1 = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) % 16;
    return Math.abs(hash);
  };

  const hash2 = (str: string) => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) + hash + str.charCodeAt(i)) % 16;
    return Math.abs(hash);
  };

  const handleAddItem = () => {
    if (!searchQuery.trim()) return;
    const idx1 = hash1(searchQuery);
    const idx2 = hash2(searchQuery);

    setBitArray(prev => {
      const next = [...prev];
      next[idx1] = 1;
      next[idx2] = 1;
      return next;
    });

    if (!addedItems.includes(searchQuery)) {
      setAddedItems(prev => [...prev, searchQuery]);
    }

    setSearchResult(`Added "${searchQuery}" to Bloom Filter (Bits #${idx1} and #${idx2} set)`);
    audioEngine.playNote(500, 'sine', 0.15, 0.08);
  };

  const handleTestMembership = () => {
    if (!searchQuery.trim()) return;
    const idx1 = hash1(searchQuery);
    const idx2 = hash2(searchQuery);

    const isBit1Set = bitArray[idx1] === 1;
    const isBit2Set = bitArray[idx2] === 1;

    if (isBit1Set && isBit2Set) {
      const isActuallyPresent = addedItems.includes(searchQuery);
      if (isActuallyPresent) {
        setSearchResult(`MAYBE IN SET (Bits #${idx1} and #${idx2} are 1). Guaranteed TRUE POSITIVE!`);
        audioEngine.playNote(650, 'sine', 0.2, 0.1);
      } else {
        setSearchResult(`FALSE POSITIVE! (Bits #${idx1} and #${idx2} set by other items, but "${searchQuery}" was NEVER added!)`);
        audioEngine.playNote(220, 'sawtooth', 0.2, 0.1);
      }
    } else {
      setSearchResult(`DEFINITELY NOT IN SET! (Bit #${!isBit1Set ? idx1 : idx2} is 0). Bypassed Disk/DB Lookup with 100% certainty!`);
      audioEngine.playNote(300, 'square', 0.15, 0.08);
    }
  };

  const handleReset = () => {
    setBitArray(new Array(16).fill(0));
    setAddedItems([]);
    setSearchResult(null);
  };

  return (
    <div className="my-8 rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <Search className="w-5 h-5 text-emerald-400" />
            <span>Bloom Filter & Probabilistic Indexing Simulator</span>
          </h3>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Demonstrate $O(k)$ constant time membership queries, false positive probabilities, and zero false negatives
          </p>
        </div>

        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-slate-500 block text-[10px] uppercase">Bit Array Size (m)</span>
            <span className="text-emerald-400 font-bold text-sm">16 Bits</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-slate-500 block text-[10px] uppercase">Hash Functions (k)</span>
            <span className="text-indigo-400 font-bold text-sm">k = 2</span>
          </div>
        </div>
      </div>

      {/* Input Controls */}
      <div className="my-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Enter key e.g. user_101..."
          className="flex-1 min-w-[200px] bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
        />

        <button
          onClick={handleAddItem}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Insert Key</span>
        </button>

        <button
          onClick={handleTestMembership}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30"
        >
          <Search className="w-4 h-4" />
          <span>Test Membership</span>
        </button>

        <button
          onClick={handleReset}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Bit Array Visualizer Grid */}
      <div className="my-6 p-6 rounded-xl bg-[#090d16] border border-slate-800 space-y-4">
        <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block">
          In-Memory Bit Vector Array (16 Bits)
        </span>

        <div className="grid grid-cols-8 md:grid-cols-16 gap-2">
          {bitArray.map((bit, idx) => (
            <div
              key={idx}
              className={`h-12 rounded-lg border flex flex-col items-center justify-center font-mono text-xs transition-all ${
                bit === 1
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold shadow-md shadow-emerald-500/20 scale-105'
                  : 'bg-slate-900 border-slate-800 text-slate-600'
              }`}
            >
              <span className="text-[9px] text-slate-500">[{idx}]</span>
              <span>{bit}</span>
            </div>
          ))}
        </div>

        {/* Live Result Banner */}
        {searchResult && (
          <div className={`p-3 rounded-lg border font-mono text-xs flex items-center gap-2 ${
            searchResult.includes('DEFINITELY NOT')
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
              : searchResult.includes('FALSE POSITIVE')
              ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
              : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
          }`}>
            {searchResult.includes('FALSE POSITIVE') ? (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
            <span>{searchResult}</span>
          </div>
        )}
      </div>

    </div>
  );
};
