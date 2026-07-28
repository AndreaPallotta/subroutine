import React, { useState, useEffect } from 'react';
import { Layers, Play, RotateCcw, ArrowDown } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';

type StackType = 'native' | 'react-native' | 'flutter';

export const NativeVsHybridStackVisualizer: React.FC = () => {
  const [stackType, setStackType] = useState<StackType>('react-native');
  const [activeLayerIdx, setActiveLayerIdx] = useState<number | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const stacks = {
    'native': {
      title: 'Native Stack (Swift / Kotlin)',
      totalLatency: '0.1 ms (Instant)',
      layers: [
        { name: '1. App Business Logic', sub: 'Swift / Kotlin Compiled ARM64 Code', thread: 'Main Thread', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40' },
        { name: '2. Native Framework API', sub: 'UIKit (iOS) / Jetpack Compose (Android)', thread: 'Main Thread', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40' },
        { name: '3. Platform Compositor', sub: 'CoreAnimation / WindowManager', thread: 'Render Thread', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40' },
        { name: '4. Hardware GPU Pipeline', sub: 'Direct Metal / Vulkan Command Buffers', thread: 'GPU HW', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40' }
      ]
    },
    'react-native': {
      title: 'React Native Stack (JSI / Hermes Engine)',
      totalLatency: '2.4 ms (Thread Marshalling)',
      layers: [
        { name: '1. JS App Bundle', sub: 'React / TypeScript Business Logic', thread: 'JS Thread', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40' },
        { name: '2. Hermes JS Engine', sub: 'Bytecode Execution & Garbage Collection', thread: 'JS Thread', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40' },
        { name: '3. JSI C++ Host Objects', sub: 'Direct C++ Function Pointers (Zero JSON serialization)', thread: 'Bridge FFI', color: 'text-amber-400 border-amber-500/40 bg-amber-950/40' },
        { name: '4. Shadow Tree & Yoga', sub: 'C++ Flexbox Layout Engine Calculation', thread: 'Shadow Thread', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40' },
        { name: '5. Native Platform Views', sub: 'UIKit / Android View Hierarchy Mutation', thread: 'Main Thread', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40' },
        { name: '6. Hardware GPU Pipeline', sub: 'Metal / Vulkan Rendering', thread: 'GPU HW', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40' }
      ]
    },
    'flutter': {
      title: 'Flutter Stack (Dart + Impeller Engine)',
      totalLatency: '0.8 ms (Direct GPU Canvas)',
      layers: [
        { name: '1. Dart App Logic', sub: 'Widget Tree Composition & State', thread: 'UI Runner Thread', color: 'text-indigo-400 border-indigo-500/40 bg-indigo-950/40' },
        { name: '2. Flutter Framework', sub: 'RenderObject & Layer Tree Generation', thread: 'UI Runner Thread', color: 'text-indigo-400 border-indigo-500/40 bg-indigo-950/40' },
        { name: '3. Dart AOT Engine', sub: 'Compiled Native C++ Engine Bindings', thread: 'Raster Thread', color: 'text-indigo-400 border-indigo-500/40 bg-indigo-950/40' },
        { name: '4. Impeller / Skia Engine', sub: 'Custom C++ GPU Display List Generation', thread: 'Raster Thread', color: 'text-indigo-400 border-indigo-500/40 bg-indigo-950/40' },
        { name: '5. Direct Metal / Vulkan GPU', sub: 'Pixel Shaders & Framebuffer Write', thread: 'GPU HW', color: 'text-indigo-400 border-indigo-500/40 bg-indigo-950/40' }
      ]
    }
  };

  const layersList = stacks[stackType].layers;

  useEffect(() => {
    if (!isSimulating) return;

    if (activeLayerIdx === null) {
      setActiveLayerIdx(0);
      audioEngine.playNote(300, 'sine', 0.1, 0.05);
      return;
    }

    if (activeLayerIdx < layersList.length - 1) {
      const timer = setTimeout(() => {
        const nextIdx = activeLayerIdx + 1;
        setActiveLayerIdx(nextIdx);
        audioEngine.playNote(300 + nextIdx * 70, 'sine', 0.1, 0.05);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setIsSimulating(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isSimulating, activeLayerIdx, layersList.length]);

  const handleSimulatePass = () => {
    setActiveLayerIdx(0);
    setIsSimulating(true);
    audioEngine.playNote(300, 'sine', 0.1, 0.05);
  };

  const handleReset = () => {
    setActiveLayerIdx(null);
    setIsSimulating(false);
  };

  return (
    <div className="my-8 rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>Mobile Stack Layer Execution Simulator</span>
          </h3>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Trace UI event dispatch down all layers of the software stack to the GPU
          </p>
        </div>

        {/* Stack Selector */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 font-mono text-xs">
          <button
            onClick={() => { setStackType('native'); handleReset(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              stackType === 'native' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Swift / Kotlin
          </button>
          <button
            onClick={() => { setStackType('react-native'); handleReset(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              stackType === 'react-native' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            React Native
          </button>
          <button
            onClick={() => { setStackType('flutter'); handleReset(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              stackType === 'flutter' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Flutter
          </button>
        </div>
      </div>

      {/* Stack Trace Visualization */}
      <div className="my-6 space-y-3">
        <div className="flex items-center justify-between font-mono text-xs text-slate-400 px-1">
          <span>{stacks[stackType].title}</span>
          <span className="text-amber-400 font-bold">Total Stack Delay: {stacks[stackType].totalLatency}</span>
        </div>

        <div className="space-y-2">
          {layersList.map((layer, idx) => {
            const isActive = activeLayerIdx === idx;

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border font-mono transition-all flex items-center justify-between gap-4 ${
                  isActive
                    ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/20 scale-[1.02] font-bold ring-2 ring-amber-500'
                    : layer.color
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-white block">{layer.name}</span>
                  <span className="text-[11px] text-slate-400">{layer.sub}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    {layer.thread}
                  </span>
                  {idx < layersList.length - 1 && (
                    <ArrowDown className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 font-mono text-xs flex items-center gap-1.5 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Stack Trace</span>
        </button>

        <button
          onClick={handleSimulatePass}
          disabled={isSimulating}
          className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-mono text-xs font-bold text-white flex items-center gap-2 transition-all shadow-md shadow-cyan-600/30"
        >
          <Play className="w-4 h-4" />
          <span>{isSimulating ? 'Tracing UI Event...' : 'Trace UI Event Down Stack'}</span>
        </button>
      </div>

    </div>
  );
};
