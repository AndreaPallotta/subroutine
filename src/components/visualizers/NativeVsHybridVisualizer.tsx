import React, { useState } from 'react';
import { Smartphone, Cpu, Layers, Play, RefreshCw, Zap } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';

type Framework = 'native' | 'react-native' | 'flutter';

export const NativeVsHybridVisualizer: React.FC = () => {
  const [framework, setFramework] = useState<Framework>('native');
  const [fps, setFps] = useState(60);
  const [memoryMB, setMemoryMB] = useState(35);
  const [bridgeLatencyMs, setBridgeLatencyMs] = useState(0.2);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);

  const frameworkInfo = {
    'native': {
      title: 'Swift / Kotlin (Pure Native)',
      desc: 'Compiles directly to machine ARM64 bytecode. Zero bridge overhead. Direct access to Metal/Vulkan GPU APIs.',
      bridge: '0.0ms (Direct Native Call)',
      memory: '35 MB Base Overhead',
      rendering: 'Native Platform Views (UIKit / Jetpack Compose)',
      pros: ['Zero marshalling overhead', 'Lowest RAM footprint', 'Instant access to new OS APIs'],
      cons: ['Separate iOS & Android codebases', 'Slower developer iteration speed']
    },
    'react-native': {
      title: 'React Native (JSI / Hermes engine)',
      desc: 'JS code runs in Hermes engine. Uses JSI (JavaScript Interface) C++ bindings to communicate with native platform views.',
      bridge: '2.4ms (JSI C++ Thread Marshalling)',
      memory: '85 MB Base Overhead',
      rendering: 'Native Platform Views bridged via Shadow Tree',
      pros: ['Single JavaScript/TypeScript codebase', 'Hot Reloading for instant dev iteration', 'Vast npm ecosystem'],
      cons: ['Thread marshalling overhead for heavy animations', 'Hermes JS engine memory footprint']
    },
    'flutter': {
      title: 'Flutter (Dart + Impeller/Skia C++ Engine)',
      desc: 'Bypasses native platform UI controls entirely. Renders pixel-by-pixel to a Skia/Impeller GPU canvas in C++.',
      bridge: '0.8ms (Platform Channel FFI)',
      memory: '65 MB Base Overhead',
      rendering: 'Custom Skia/Impeller GPU Canvas Rendering',
      pros: ['Identical pixel-perfect UI across iOS & Android', '60-120 FPS high performance graphics', 'Rich built-in widget library'],
      cons: ['App binary size bloat (~15MB baseline)', 'Non-standard OS UI look and feel']
    }
  };

  const handleRunBenchmark = () => {
    setIsRunningBenchmark(true);
    audioEngine.playNote(440, 'sine', 0.1, 0.05);

    if (framework === 'native') {
      setFps(120);
      setMemoryMB(38);
      setBridgeLatencyMs(0.1);
    } else if (framework === 'react-native') {
      setFps(55);
      setMemoryMB(92);
      setBridgeLatencyMs(3.2);
    } else {
      setFps(60);
      setMemoryMB(70);
      setBridgeLatencyMs(0.9);
    }

    setTimeout(() => setIsRunningBenchmark(false), 800);
  };

  return (
    <div className="my-8 rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <span>Mobile Architecture Benchmark: Native vs React Native vs Flutter</span>
          </h3>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Simulate runtime thread marshalling, memory footprint, and GPU render engines
          </p>
        </div>

        {/* Framework Selector */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setFramework('native')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              framework === 'native' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Swift / Kotlin
          </button>
          <button
            onClick={() => setFramework('react-native')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              framework === 'react-native' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            React Native
          </button>
          <button
            onClick={() => setFramework('flutter')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              framework === 'flutter' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Flutter
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono">
          <span className="text-slate-500 block text-xs uppercase">Frame Rate (FPS)</span>
          <span className={`text-xl font-bold ${fps >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {fps} FPS
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono">
          <span className="text-slate-500 block text-xs uppercase">RAM Baseline</span>
          <span className="text-xl font-bold text-cyan-400">
            {memoryMB} MB
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono">
          <span className="text-slate-500 block text-xs uppercase">Bridge / FFI Latency</span>
          <span className="text-xl font-bold text-indigo-400">
            {bridgeLatencyMs} ms
          </span>
        </div>
      </div>

      {/* Architecture Detail Card */}
      <div className="p-6 rounded-xl bg-[#090d16] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <span className="text-sm font-bold font-mono text-white">{frameworkInfo[framework].title}</span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-mono text-[10px]">
            {frameworkInfo[framework].rendering}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">{frameworkInfo[framework].desc}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-2">
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 space-y-1">
            <span className="font-bold block text-[11px]">Key Advantages:</span>
            {frameworkInfo[framework].pros.map((p, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>{p}</span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 space-y-1">
            <span className="font-bold block text-[11px]">Trade-offs & Bottlenecks:</span>
            {frameworkInfo[framework].cons.map((c, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                <Layers className="w-3 h-3 text-rose-400" />
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Control Action */}
      <div className="mt-6 flex items-center justify-between">
        <span className="text-xs font-mono text-slate-500">
          Click "Run Stress Benchmark" to simulate 60Hz animation loop execution
        </span>

        <button
          onClick={handleRunBenchmark}
          disabled={isRunningBenchmark}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-mono text-xs font-bold text-white flex items-center gap-2 transition-all shadow-md shadow-emerald-600/30"
        >
          {isRunningBenchmark ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>{isRunningBenchmark ? 'Benchmarking...' : 'Run Stress Benchmark'}</span>
        </button>
      </div>

    </div>
  );
};
