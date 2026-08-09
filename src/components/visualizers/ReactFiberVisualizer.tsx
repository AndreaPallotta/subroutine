import React, { useState } from 'react';
import { Atom, Play, RefreshCw, Cpu, Layers, CheckCircle2 } from 'lucide-react';

interface FiberNode {
  id: string;
  name: string;
  type: string;
  effectTag?: 'PLACEMENT' | 'UPDATE' | 'DELETION' | 'NONE';
  state: string;
  child?: FiberNode;
  sibling?: FiberNode;
}

export const ReactFiberVisualizer: React.FC = () => {
  const [phase, setPhase] = useState<'idle' | 'render' | 'commit'>('idle');
  const [activeTab, setActiveTab] = useState<'concurrent' | 'synchronous'>('concurrent');
  const [counter, setCounter] = useState<number>(0);
  const [fiberLog, setFiberLog] = useState<string>('React Fiber Engine Idle: Double-buffering current vs workInProgress trees.');

  const fiberTree: FiberNode = {
    id: 'root',
    name: '<App />',
    type: 'HostRoot',
    state: 'Root',
    effectTag: 'NONE',
    child: {
      id: 'header',
      name: '<Header />',
      type: 'Component',
      state: 'Static',
      effectTag: 'NONE',
      sibling: {
        id: 'counter',
        name: '<CounterButton />',
        type: 'Component',
        state: `count: ${counter}`,
        effectTag: counter > 0 ? 'UPDATE' : 'NONE',
        child: {
          id: 'text',
          name: '<span>Count: {count}</span>',
          type: 'HostComponent',
          state: `DOM Text`,
          effectTag: counter > 0 ? 'UPDATE' : 'NONE'
        }
      }
    }
  };

  const handleStateMutation = () => {
    setPhase('render');
    setFiberLog(`STATE MUTATION: setState(count => ${counter + 1}) triggered. Building workInProgress Fiber Tree offscreen...`);
    
    // Simulate Work-In-Progress Render Phase
    setTimeout(() => {
      setCounter(prev => prev + 1);
      setPhase('commit');
      setFiberLog(`COMMIT PHASE: Fiber diffing finished. Flushing atomic DOM mutations in single layout paint!`);
      
      setTimeout(() => {
        setPhase('idle');
      }, 800);
    }, 600);
  };

  return (
    <div className="w-full my-8 p-5 md:p-6 rounded-2xl border border-slate-800 bg-[#0b0f19] text-slate-100 shadow-2xl font-sans">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Atom className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">React Fiber Architecture & Reconciliation</h3>
            <p className="text-xs font-mono text-slate-400">Linked-List Work Tree: `child`, `sibling`, `return` Double-Buffering</p>
          </div>
        </div>

        {/* Phase Badge */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">Reconciler Phase:</span>
          <span className={`px-3 py-1 rounded-lg border font-bold uppercase ${
            phase === 'render' 
              ? 'bg-amber-950 border-amber-500/40 text-amber-300 animate-pulse'
              : phase === 'commit'
              ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-cyan-400'
          }`}>
            {phase === 'render' ? '1. Render (WorkInProgress)' : phase === 'commit' ? '2. Commit (DOM Paint)' : 'Idle'}
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="mt-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <button
          onClick={handleStateMutation}
          disabled={phase !== 'idle'}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold flex items-center gap-2 transition-all shadow-md shadow-cyan-600/30"
        >
          <Play className="w-4 h-4" />
          <span>Trigger setState({counter + 1}) Update</span>
        </button>

        <div className="text-[11px] text-slate-400 flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Frame Budget: 16.6ms (60 FPS Time-Slicing Scheduler)</span>
        </div>
      </div>

      {/* Fiber Linked-List Tree Rendering */}
      <div className="mt-6 p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-6 font-mono text-xs">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] text-slate-400">
          <span className="font-bold text-slate-300 uppercase tracking-wider">Fiber Linked-List Structure (workInProgress Tree)</span>
          <span>Pointer Connections: child | sibling | return</span>
        </div>

        {/* Tree Nodes Display */}
        <div className="space-y-4">
          
          {/* Root */}
          <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-cyan-300 text-sm">{fiberTree.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">HostRoot</span>
            </div>
            <span className="text-[10px] text-slate-500">child ➔ &lt;Header /&gt;</span>
          </div>

          {/* Child & Sibling Level */}
          <div className="pl-6 border-l-2 border-slate-800 space-y-3">
            
            {/* Header */}
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200">{fiberTree.child?.name}</span>
                <span className="text-[10px] text-slate-500">Pure Component</span>
              </div>
              <span className="text-[10px] text-slate-500">sibling ➔ &lt;CounterButton /&gt;</span>
            </div>

            {/* CounterButton (Target of setState) */}
            <div className={`p-3.5 rounded-xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
              counter > 0 
                ? 'border-amber-500/50 bg-amber-950/30 text-amber-200 shadow-md shadow-amber-500/10' 
                : 'border-slate-800 bg-slate-900/60 text-slate-300'
            }`}>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100">{fiberTree.child?.sibling?.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-bold text-amber-400">
                  {fiberTree.child?.sibling?.state}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-slate-500">effectTag:</span>
                <span className={`px-2 py-0.5 rounded font-bold ${
                  counter > 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {counter > 0 ? 'UPDATE' : 'NONE'}
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Reconciler Log Stream */}
      <div className="mt-6 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-cyan-300 flex items-center gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="truncate">{fiberLog}</span>
      </div>

    </div>
  );
};
