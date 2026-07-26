import React, { useState } from 'react';
import { RotateCcw, Volume2, VolumeX, Code2, Link, Unlink, Sparkles, ArrowDown, CheckCircle2, Trash2 } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';
import { CodeBlock } from '../ui/CodeBlock';

export type SupportedLanguage = 'cpp' | 'python' | 'java' | 'go' | 'rust' | 'ts';

interface HeapObject {
  id: string;
  name: string;
  sizeKb: number;
  pointers: string[]; // pointers to other object IDs
  state: 'unmarked' | 'marked' | 'swept';
}

const LANG_CONFIG: Record<SupportedLanguage, { label: string; fileExt: string }> = {
  go: { label: 'Go (Concurrent GC)', fileExt: 'go' },
  java: { label: 'Java (ZGC / G1)', fileExt: 'java' },
  cpp: { label: 'C++ (Raw Malloc vs Smart Pointers)', fileExt: 'cpp' },
  rust: { label: 'Rust (RAII Ownership)', fileExt: 'rs' },
  python: { label: 'Python (Refcount + GC)', fileExt: 'py' },
  ts: { label: 'TypeScript (V8 GC)', fileExt: 'ts' },
};

const CODE_EXAMPLES: Record<SupportedLanguage, string> = {
  cpp: `// C++ Memory Evolution: Raw Malloc vs. Smart Pointers (RAII)
#include <cstdlib>
#include <memory>

struct HeapNode {
    int payload[256];
    std::shared_ptr<HeapNode> next;
};

// 1. Unsafe Manual Allocation (Raw malloc/free)
void manualMallocDemo() {
    HeapNode* rawPtr = (HeapNode*)malloc(sizeof(HeapNode));
    // Manual cleanup required: forgetting free(rawPtr) causes a memory leak.
    // Calling free() twice causes a double-free heap corruption crash.
    free(rawPtr); 
}

// 2. Safe Deterministic Allocation (Smart Pointers via RAII)
void smartPointerDemo() {
    // Unique ownership: Freed instantly when scope ends (0 GC overhead)
    auto uniqueNode = std::make_unique<HeapNode>();

    // Shared ownership: Ref count deallocates memory when count hits 0
    auto root = std::make_shared<HeapNode>();
    root->next = std::make_shared<HeapNode>();

    // Sever reference -> Ref count drops to 0 -> Object freed instantly!
    root->next.reset();
}`,
  go: `// Go Garbage Collector (Tricolor Mark-and-Sweep)
package main

import "runtime"

type Node struct {
    Data []byte
    Next *Node
}

func allocateAndSweep() {
    // Objects allocated on heap are automatically tracked by Go GC
    root := &Node{Data: make([]byte, 1024)}
    root.Next = &Node{Data: make([]byte, 2048)}

    // Sever reference -> Node becomes unreachable garbage
    root.Next = nil 

    // Trigger concurrent tricolor mark-sweep GC
    runtime.GC()
}`,
  java: `// Java JVM Garbage Collection (G1 / ZGC Tracing)
public class GarbageCollectionDemo {
    static class HeapNode {
        byte[] payload = new byte[1024];
        HeapNode next;
    }

    public static void main(String[] args) {
        HeapNode root = new HeapNode();
        root.next = new HeapNode();

        // Break pointer reference
        root.next = null; // Unreachable object queued for GC

        // Explicit hint to request GC sweep
        System.gc();
    }
}`,
  rust: `// Rust Zero-Cost Memory Safety (No Garbage Collector Needed!)
struct HeapNode {
    payload: Vec<u8>,
    next: Option<Box<HeapNode>>,
}

fn demo_ownership() {
    let mut root = Box::new(HeapNode {
        payload: vec![0; 1024],
        next: Some(Box::new(HeapNode { payload: vec![0; 2048], next: None })),
    });

    // Sever pointer ownership
    root.next = None; // Dropped and deallocated instantly at compile-time boundary!
}`,
  python: `# Python Reference Counting + Generational Cyclic Garbage Collector
import sys
import gc

class HeapNode:
    def __init__(self):
        self.payload = bytearray(1024)
        self.next = None

root = HeapNode()
child = HeapNode()
root.next = child

# Sever reference -> Refcount drops to 0 -> Deallocated immediately
root.next = None

# For cyclic references, trigger generational GC
gc.collect()`,
  ts: `// TypeScript / JavaScript V8 Engine Garbage Collector (Orinoco GC)
class HeapNode {
  payload = new Uint8Array(1024);
  next: HeapNode | null = null;
}

function runV8GCDemo() {
  let root: HeapNode | null = new HeapNode();
  root.next = new HeapNode();

  // Sever pointer reference
  root.next = null; // V8 Scavenger / Mark-Sweep reclaims during idle phase
}`
};

export const GarbageCollectionVisualizer: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('go');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [gcStep, setGcStep] = useState<0 | 1 | 2>(0); // 0: Idle, 1: Marked, 2: Swept
  const [isReferenceBroken, setIsReferenceBroken] = useState<boolean>(false);

  // Stack Root Set pointing to Heap
  const rootPointers = isReferenceBroken ? ['O1'] : ['O1', 'O2'];

  const initialHeap: HeapObject[] = [
    { id: 'O1', name: 'User Profile', sizeKb: 128, pointers: ['O3'], state: 'unmarked' },
    { id: 'O2', name: 'Session Cache', sizeKb: 256, pointers: ['O4'], state: 'unmarked' },
    { id: 'O3', name: 'Avatar Texture', sizeKb: 512, pointers: [], state: 'unmarked' },
    { id: 'O4', name: 'DB Connection', sizeKb: 1024, pointers: [], state: 'unmarked' },
    { id: 'O5', name: 'Leaked Orphan', sizeKb: 2048, pointers: [], state: 'unmarked' },
  ];

  const [heap, setHeap] = useState<HeapObject[]>(initialHeap);

  // Toggle Sever Link
  const togglePointerLink = () => {
    const nextState = !isReferenceBroken;
    setIsReferenceBroken(nextState);
    setGcStep(0);
    setHeap(initialHeap);
  };

  // Step 1: Mark Phase (BFS from Root Set)
  const stepMarkPhase = () => {
    const reachable = new Set<string>();
    const queue = [...(isReferenceBroken ? ['O1'] : ['O1', 'O2'])];

    while (queue.length > 0) {
      const currId = queue.shift()!;
      if (!reachable.has(currId)) {
        reachable.add(currId);
        const obj = heap.find(h => h.id === currId);
        if (obj) queue.push(...obj.pointers);
      }
    }

    setHeap(prev => prev.map(obj => ({
      ...obj,
      state: reachable.has(obj.id) ? 'marked' : 'unmarked'
    })));
    setGcStep(1);
    audioEngine.playValueTone(523, 10, 100, 0.1); // C5 tone
  };

  // Step 2: Sweep Phase
  const stepSweepPhase = () => {
    if (gcStep === 0) stepMarkPhase();

    setTimeout(() => {
      setHeap(prev => prev.map(obj => ({
        ...obj,
        state: obj.state === 'marked' ? 'marked' : 'swept'
      })));
      setGcStep(2);
      audioEngine.playCompletionTone();
    }, 200);
  };

  const resetAll = () => {
    setGcStep(0);
    setIsReferenceBroken(false);
    setHeap(initialHeap);
  };

  const activeLangConfig = LANG_CONFIG[selectedLang];

  return (
    <div className="my-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Mark-and-Sweep Garbage Collector</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              Interactive Heap Tracing
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Follow the 2-step GC process: <strong className="text-emerald-400">Step 1: Mark</strong> reachable objects from Stack Roots, then <strong className="text-rose-400">Step 2: Sweep</strong> unreachable garbage memory!
          </p>
        </div>

        {/* Phase Badge */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
            <span className="text-slate-500">Current Phase: </span>
            <span className={
              gcStep === 2 ? 'text-rose-400 font-bold' :
              gcStep === 1 ? 'text-emerald-400 font-bold' : 'text-cyan-400 font-bold'
            }>
              {gcStep === 0 ? '0. Idle Heap' : gcStep === 1 ? '1. Mark Phase (Live Traced)' : '2. Sweep Phase (Garbage Freed)'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Memory Diagram */}
      <div className="p-6 bg-slate-950/90 border-b border-slate-800">
        
        {/* STACK FRAME (ROOT SET) */}
        <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
              Stack Frame / Root Set (Registers & Local Variables)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Pointers pointing into Heap</span>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 p-3 rounded-lg bg-slate-900 border border-indigo-500/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-white block">Root Reference 1</span>
                <span className="text-[10px] text-slate-400">Local Variable <code className="text-cyan-300">userPtr</code></span>
              </div>
              <div className="flex items-center gap-1 text-xs font-mono text-cyan-400 font-bold bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-500/30">
                <span>Points to → O1</span>
              </div>
            </div>

            <div className={`flex-1 p-3 rounded-lg border transition-all flex items-center justify-between ${
              isReferenceBroken 
                ? 'bg-rose-950/20 border-rose-500/40 text-rose-300' 
                : 'bg-slate-900 border-indigo-500/40 text-white'
            }`}>
              <div>
                <span className="text-xs font-mono font-bold block">Root Reference 2</span>
                <span className="text-[10px] text-slate-400">Local Variable <code className="text-cyan-300">sessionPtr</code></span>
              </div>
              <div className="flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded border">
                {isReferenceBroken ? (
                  <span className="text-rose-400 border-rose-500/30 bg-rose-950/60">SEVERED (NULL)</span>
                ) : (
                  <span className="text-cyan-400 border-cyan-500/30 bg-cyan-950/80">Points to → O2</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pointer Arrow Indicator */}
        <div className="flex justify-center -mt-6 mb-4 text-indigo-400">
          <ArrowDown className="w-6 h-6 animate-bounce" />
        </div>

        {/* HEAP MEMORY POOL */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Dynamic Heap Memory Pool (Objects Allocated in RAM)
            </span>
            <button
              onClick={togglePointerLink}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                isReferenceBroken
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                  : 'bg-amber-950 text-amber-300 border border-amber-500/40'
              }`}
            >
              {isReferenceBroken ? <Link className="w-3.5 h-3.5" /> : <Unlink className="w-3.5 h-3.5" />}
              <span>{isReferenceBroken ? 'Restore Root2 → O2 Link' : 'Sever Root2 → O2 Pointer'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {heap.map((obj) => {
              let cardBg = 'bg-slate-900 border-slate-800 text-slate-300';
              let statusLabel = 'UNTOUCHED';
              let badgeStyle = 'bg-slate-800 text-slate-400 border-slate-700';

              if (obj.state === 'marked') {
                cardBg = 'bg-emerald-950/50 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.25)]';
                statusLabel = 'LIVE (REACHABLE)';
                badgeStyle = 'bg-emerald-900/80 text-emerald-200 border-emerald-500/40 font-bold';
              } else if (obj.state === 'swept') {
                cardBg = 'bg-rose-950/40 border-rose-500/40 text-rose-400 opacity-40 scale-95';
                statusLabel = 'FREED / SWEPT';
                badgeStyle = 'bg-rose-900/80 text-rose-200 border-rose-500/40 font-bold';
              }

              return (
                <div key={obj.id} className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${cardBg}`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-base text-white">{obj.id}</span>
                      <span className="text-[10px] font-mono text-slate-400">{obj.sizeKb} KB</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 mb-3">{obj.name}</div>
                  </div>

                  <div>
                    <div className={`text-[9px] font-mono px-2 py-1 rounded text-center border mb-2 ${badgeStyle}`}>
                      {statusLabel}
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-2 flex items-center justify-between">
                      <span>Pointers:</span>
                      <span className="text-cyan-300 font-bold">
                        {obj.pointers.length > 0 ? `→ ${obj.pointers.join(', ')}` : 'None'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step-by-Step Action Bar */}
        <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-slate-800 mt-8">
          <button
            onClick={stepMarkPhase}
            className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-all ${
              gcStep === 1
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Step 1: Mark Reachable Objects</span>
          </button>

          <button
            onClick={stepSweepPhase}
            className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-all ${
              gcStep === 2
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30 ring-2 ring-rose-400'
                : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-md'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Step 2: Sweep Unreachable Memory</span>
          </button>

          <button
            onClick={resetAll}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            title="Reset Heap"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const nextState = !isAudioMuted;
              setIsAudioMuted(nextState);
              audioEngine.setMuted(nextState);
            }}
            className={`p-3 rounded-xl transition-all ${
              isAudioMuted ? 'bg-slate-800 text-rose-400' : 'bg-indigo-950/60 text-cyan-400 border border-cyan-500/30'
            }`}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Code Inspector */}
      <div className="p-6 bg-slate-950/95">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>Garbage Collection & Memory Strategy</span>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono">
            {(Object.keys(LANG_CONFIG) as SupportedLanguage[]).map((langKey) => (
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
          filename={`gc_demo.${activeLangConfig.fileExt}`}
          langLabel={activeLangConfig.label}
        />
      </div>
    </div>
  );
};
