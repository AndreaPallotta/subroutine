import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Code2, Cpu, Lock, Unlock } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';
import { CodeBlock } from '../ui/CodeBlock';

export type ConcurrencyMode = 'gil' | 'free_python' | 'go_channels' | 'cpp_threads';
export type SupportedLanguage = 'python' | 'go' | 'cpp' | 'java' | 'rust' | 'ts';

const MODE_CONFIG: Record<ConcurrencyMode, { name: string; desc: string }> = {
  gil: {
    name: 'Legacy Python GIL (Single Core Lock)',
    desc: 'Global Interpreter Lock (GIL) forces CPU threads to serialize execution. Only 1 CPU core runs Python bytecode at a time.'
  },
  free_python: {
    name: 'Free-Threaded Python 3.13+ (No GIL / PEP 703)',
    desc: 'Bi-directional thread safety without global lock. Multi-threaded Python CPU tasks execute across all cores in parallel!'
  },
  go_channels: {
    name: 'Go CSP & Channels (Goroutine M:N Scheduler)',
    desc: 'Communicating Sequential Processes (CSP). Thousands of lightweight goroutines multiplexed across OS threads.'
  },
  cpp_threads: {
    name: 'C++ std::jthread & POSIX Threads',
    desc: 'Direct OS-level native thread dispatch with mutex locks and lock-free atomic primitives.'
  }
};

const LANG_CONFIG: Record<SupportedLanguage, { label: string; fileExt: string }> = {
  python: { label: 'Python (Free-Threaded / GIL-Free)', fileExt: 'py' },
  go: { label: 'Go (Goroutines & Channels)', fileExt: 'go' },
  cpp: { label: 'C++ (std::jthread & Mutex)', fileExt: 'cpp' },
  java: { label: 'Java (Project Loom Virtual Threads)', fileExt: 'java' },
  rust: { label: 'Rust (Tokio & Rayon)', fileExt: 'rs' },
  ts: { label: 'TypeScript (Worker Threads)', fileExt: 'ts' },
};

const CODE_EXAMPLES: Record<SupportedLanguage, string> = {
  python: `# Free-Threaded Python (Python 3.13+ PEP 703 GIL-Free Build)
import threading
import sys

# Verify GIL status in Python 3.13+
gil_enabled = getattr(sys, "_is_gil_enabled", lambda: True)()
print(f"GIL Active: {gil_enabled}")

def cpu_bound_task(n):
    total = 0
    for i in range(n):
        total += i * i
    return total

# True parallel execution across CPU cores without GIL bottleneck!
threads = [
    threading.Thread(target=cpu_bound_task, args=(10_000_000,))
    for _ in range(4)
]

for t in threads: t.start()
for t in threads: t.join()`,
  go: `// Go Concurrency Model: CSP Channels & Goroutines
package main

import (
	"fmt"
	"sync"
)

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
	defer wg.Done()
	for j := range jobs {
		results <- j * j
	}
}

func main() {
	jobs := make(chan int, 100)
	results := make(chan int, 100)
	var wg sync.WaitGroup

	// Spawn worker goroutines across CPU cores
	for w := 1; w <= 4; w++ {
		wg.Add(1)
		go worker(w, jobs, results, &wg)
	}

	for j := 1; j <= 10; j++ { jobs <- j }
	close(jobs)
	wg.Wait()
}`,
  cpp: `// C++ Native Multi-Threading (std::jthread & Lock-Free Atomics)
#include <iostream>
#include <thread>
#include <vector>
#include <numeric>

void cpuWork(int id, long iterations) {
    long sum = 0;
    for (long i = 0; i < iterations; ++i) {
        sum += i * i;
    }
}

int main() {
    std::vector<std::jthread> threads;
    
    // Launch threads on hardware CPU cores
    for (int i = 0; i < 4; ++i) {
        threads.emplace_back(cpuWork, i, 10'000'000);
    }
    // Automatically joins upon scope exit
}`,
  java: `// Java Project Loom: Millions of Lightweight Virtual Threads
import java.util.concurrent.Executors;

public class VirtualThreadDemo {
    public static void main(String[] args) {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 1_000; i++) {
                final int taskId = i;
                executor.submit(() -> {
                    long sum = 0;
                    for (int j = 0; j < 100_000; j++) sum += j;
                    return sum;
                });
            }
        } // Auto-closes and waits for virtual thread tasks
    }
}`,
  rust: `// Rust Parallel Processing with Rayon & Tokio
use rayon::prelude::*;

fn main() {
    let numbers: Vec<i64> = (0..10_000_000).collect();

    // Parallel iterator automatically distributes work across thread pools
    let sum: i64 = numbers.par_iter()
        .map(|&x| x * x)
        .sum();

    println!("Sum: {}", sum);
}`,
  ts: `// TypeScript / Node.js Worker Threads (Bypassing Single-Thread Loop)
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

if (isMainThread) {
  // Main Thread Spawns Parallel Worker Threads
  const worker = new Worker(__filename, { workerData: { iterations: 10_000_000 } });
  worker.on('message', (result) => console.log('Result:', result));
} else {
  // Worker Thread executes CPU-intensive computation
  let sum = 0;
  for (let i = 0; i < workerData.iterations; i++) sum += i * i;
  parentPort?.postMessage(sum);
}`
};

export const ConcurrencyVisualizer: React.FC = () => {
  const [mode, setMode] = useState<ConcurrencyMode>('gil');
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('python');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [coreProgress, setCoreProgress] = useState<number[]>([0, 0, 0, 0]);
  const [gilLockOwner, setGilLockOwner] = useState<number>(0);
  const [timeElapsedMs, setTimeElapsedMs] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startSimulation = () => {
    if (isRunning) {
      setIsRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setIsRunning(true);
    setCoreProgress([0, 0, 0, 0]);
    setTimeElapsedMs(0);

    let progress = [0, 0, 0, 0];
    let activeLockOwner = 0;
    let elapsed = 0;

    timerRef.current = setInterval(() => {
      elapsed += 30;
      setTimeElapsedMs(elapsed);

      if (mode === 'gil') {
        // Only 1 core progresses at a time due to GIL lock!
        progress[activeLockOwner] += 6;
        if (progress[activeLockOwner] >= 100) {
          progress[activeLockOwner] = 100;
          if (activeLockOwner < 3) {
            activeLockOwner++;
            setGilLockOwner(activeLockOwner);
          }
        }
      } else {
        // Parallel execution across all cores!
        const step = mode === 'free_python' ? 5 : mode === 'go_channels' ? 7 : 8;
        progress = progress.map(p => Math.min(100, p + step));
      }

      setCoreProgress([...progress]);

      if (progress.every(p => p >= 100)) {
        setIsRunning(false);
        if (timerRef.current) clearInterval(timerRef.current);
        audioEngine.playCompletionTone();
      } else {
        audioEngine.playValueTone(300 + progress[0] * 3, 10, 100, 0.05);
      }
    }, 40);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setCoreProgress([0, 0, 0, 0]);
    setTimeElapsedMs(0);
    setGilLockOwner(0);
  };

  const activeModeConfig = MODE_CONFIG[mode];
  const activeLangConfig = LANG_CONFIG[selectedLang];

  return (
    <div className="my-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Top Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Concurrency & Threading Simulator</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/30">
              Multi-Core CPU Pipeline
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            {activeModeConfig.desc}
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
          {(Object.keys(MODE_CONFIG) as ConcurrencyMode[]).map(mKey => (
            <button
              key={mKey}
              onClick={() => {
                setMode(mKey);
                resetSimulation();
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === mKey
                  ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {mKey === 'gil' ? 'Legacy GIL' : mKey === 'free_python' ? 'Free Python 3.13+' : mKey === 'go_channels' ? 'Go Channels' : 'C++ Threads'}
            </button>
          ))}
        </div>
      </div>

      {/* 4 CPU Cores Execution Pipeline */}
      <div className="p-6 bg-slate-950/90 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4 text-xs font-mono">
          <span className="font-bold text-slate-300 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            4-Core Hardware Execution Plane
          </span>
          <span className="text-indigo-400 font-bold">Elapsed Time: {timeElapsedMs} ms</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {coreProgress.map((prog, idx) => {
            const isLockedByGIL = mode === 'gil' && gilLockOwner !== idx && isRunning && prog < 100;
            const isActiveWorker = mode === 'gil' ? gilLockOwner === idx : prog > 0 && prog < 100;

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  isLockedByGIL
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                    : isActiveWorker
                    ? 'bg-indigo-950/60 border-indigo-500/60 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                    : prog >= 100
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono font-bold text-sm">CPU Core {idx}</span>
                  {mode === 'gil' && (
                    <span className="text-[10px] font-mono flex items-center gap-1">
                      {isLockedByGIL ? (
                        <span className="text-rose-400 flex items-center gap-1"><Lock className="w-3 h-3" /> GIL BLOCKED</span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1"><Unlock className="w-3 h-3" /> HAS GIL</span>
                      )}
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 mb-2">
                  <div
                    className={`h-full transition-all duration-75 ${
                      isLockedByGIL
                        ? 'bg-rose-500/50'
                        : prog >= 100
                        ? 'bg-emerald-400'
                        : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                    }`}
                    style={{ width: `${prog}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span>Task Workload</span>
                  <span className="font-bold">{prog}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-800">
          <button
            onClick={startSimulation}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white shadow-lg transition-all"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? 'Pause CPU Simulation' : 'Run Parallel CPU Benchmark'}</span>
          </button>

          <button
            onClick={resetSimulation}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            title="Reset Simulation"
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

      {/* Code Inspector */}
      <div className="p-6 bg-slate-950/95">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>Concurrency Code Implementation</span>
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
          filename={`concurrency_demo.${activeLangConfig.fileExt}`}
          langLabel={activeLangConfig.label}
        />
      </div>
    </div>
  );
};
