import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, Cpu, Play } from 'lucide-react';

interface MemoryRegion {
  id: number;
  color: 'Marked0' | 'Marked1' | 'Remapped';
  allocatedMB: number;
}

export const ZgcVisualizer: React.FC = () => {
  const [regions, setRegions] = useState<MemoryRegion[]>([
    { id: 1, color: 'Marked0', allocatedMB: 64 },
    { id: 2, color: 'Marked1', allocatedMB: 128 },
    { id: 3, color: 'Remapped', allocatedMB: 32 },
    { id: 4, color: 'Marked0', allocatedMB: 256 },
  ]);
  const [gcPhase, setGcPhase] = useState<'idle' | 'mark' | 'relocate'>('idle');
  const [zgcLog, setZgcLog] = useState<string>('ZGC Engine Active: Terabyte heap colored pointers active. Max pause time < 1ms.');

  const handleRunGcPhase = () => {
    if (gcPhase === 'idle') {
      setGcPhase('mark');
      setZgcLog(`ZGC PHASE 1: Concurrent Mark. Color metadata updated to Marked1 using 64-bit reference bits.`);
      setRegions(prev => prev.map(r => ({ ...r, color: 'Marked1' })));
    } else if (gcPhase === 'mark') {
      setGcPhase('relocate');
      setZgcLog(`ZGC PHASE 2: Concurrent Relocate. Forwarding table updated. Load barriers self-heal stale object pointers.`);
      setRegions(prev => prev.map(r => ({ ...r, color: 'Remapped' })));
    } else {
      setGcPhase('idle');
      setZgcLog(`ZGC COMPACTED: Heap regions defragmented without stopping application threads! Max GC pause < 0.5ms.`);
    }
  };

  return (
    <div className="w-full my-8 p-5 md:p-6 rounded-2xl border border-slate-800 bg-[#0b0f19] text-slate-100 shadow-2xl font-sans">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">ZGC & Shenandoah Pauseless Garbage Collection</h3>
            <p className="text-xs font-mono text-slate-400">64-bit Colored Pointers & Load Barriers for Sub-Millisecond Pauses</p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-blue-300">
          <span>Max Pause SLA:</span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-950 border border-blue-500/40 font-bold text-blue-300">
            &lt; 1.0 ms STW
          </span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="mt-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <button
          onClick={handleRunGcPhase}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-600/30"
        >
          <Play className="w-4 h-4" />
          <span>Advance Concurrent GC Phase ({gcPhase === 'idle' ? 'Start Mark' : gcPhase === 'mark' ? 'Relocate' : 'Reset'})</span>
        </button>

        <span className="text-[11px] text-slate-400">Colored Pointer State: 42..45 Reference Bit Flags</span>
      </div>

      {/* Regions Display */}
      <div className="mt-6 p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] text-slate-400">
          <span className="font-bold text-slate-300 uppercase tracking-wider">JVM Heap Regions (Colored Pointer Tags)</span>
          <span>Concurrent Load-Barrier Relocation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {regions.map((reg) => (
            <div
              key={reg.id}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
                reg.color === 'Marked1'
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                  : reg.color === 'Remapped'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : 'bg-blue-950/40 border-blue-500/50 text-blue-300'
              }`}
            >
              <div className="flex justify-between font-bold">
                <span>Region #{reg.id}</span>
                <span>{reg.allocatedMB} MB</span>
              </div>
              <div className="text-[10px] uppercase font-bold py-1 px-2 rounded bg-slate-900 border border-slate-800 text-center">
                Color: {reg.color}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Terminal Log */}
      <div className="mt-6 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-blue-300 flex items-center gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="truncate">{zgcLog}</span>
      </div>

    </div>
  );
};
