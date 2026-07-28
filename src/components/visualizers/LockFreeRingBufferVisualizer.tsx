import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Cpu, Lock, CheckCircle2 } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';

type Mode = 'mutex' | 'lockfree';

export const LockFreeRingBufferVisualizer: React.FC = () => {
  const [mode, setMode] = useState<Mode>('lockfree');
  const [isPlaying, setIsPlaying] = useState(false);
  const [buffer, setBuffer] = useState<Array<number | null>>([null, null, null, null, null, null, null, null]);
  const [head, setHead] = useState(0); // Producer head pointer
  const [tail, setTail] = useState(0); // Consumer tail pointer
  const [itemsProduced, setItemsProduced] = useState(0);
  const [itemsConsumed, setItemsConsumed] = useState(0);
  const [mutexContentionCount, setMutexContentionCount] = useState(0);

  // Simulation tick
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const isProducerTurn = Math.random() > 0.4; // 60% produce, 40% consume

      if (isProducerTurn) {
        // Produce item
        const nextHead = (head + 1) % 8;
        if (nextHead !== tail) { // Not full
          if (mode === 'mutex' && Math.random() < 0.35) {
            setMutexContentionCount(prev => prev + 1); // Simulated Mutex Thread Lock Contention
          } else {
            const val = itemsProduced + 1;
            setBuffer(prev => {
              const next = [...prev];
              next[head] = val;
              return next;
            });
            setHead(nextHead);
            setItemsProduced(prev => prev + 1);
            audioEngine.playNote(400 + (head * 40), 'triangle', 0.08, 0.04);
          }
        }
      } else {
        // Consume item
        if (head !== tail) { // Not empty
          if (mode === 'mutex' && Math.random() < 0.35) {
            setMutexContentionCount(prev => prev + 1);
          } else {
            setBuffer(prev => {
              const next = [...prev];
              next[tail] = null;
              return next;
            });
            setTail(prev => (prev + 1) % 8);
            setItemsConsumed(prev => prev + 1);
            audioEngine.playNote(300 + (tail * 40), 'sine', 0.08, 0.04);
          }
        }
      }
    }, 600);

    return () => clearInterval(interval);
  }, [isPlaying, mode, head, tail, itemsProduced, itemsConsumed]);

  const handleReset = () => {
    setIsPlaying(false);
    setBuffer([null, null, null, null, null, null, null, null]);
    setHead(0);
    setTail(0);
    setItemsProduced(0);
    setItemsConsumed(0);
    setMutexContentionCount(0);
  };

  return (
    <div className="my-8 rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <span>Lock-Free SPSC Ring Buffer Visualizer</span>
          </h3>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Compare Mutex Thread Lock contention against Atomic CAS Lock-Free Ring Buffers
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 font-mono text-xs">
          <button
            onClick={() => { setMode('mutex'); handleReset(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              mode === 'mutex' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            std::mutex Queue
          </button>
          <button
            onClick={() => { setMode('lockfree'); handleReset(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              mode === 'lockfree' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            std::atomic SPSC Ring
          </button>
        </div>
      </div>

      {/* Ring Buffer Memory Array */}
      <div className="my-8 space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Producer Head (index {head})
          </span>
          <span className="flex items-center gap-1.5 text-blue-400 font-bold">
            Consumer Tail (index {tail})
          </span>
        </div>

        <div className="grid grid-cols-8 gap-2">
          {buffer.map((val, idx) => {
            const isHead = idx === head;
            const isTail = idx === tail;

            return (
              <div
                key={idx}
                className={`h-20 rounded-xl border flex flex-col items-center justify-between p-2 font-mono transition-all relative ${
                  val !== null
                    ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-900 border-slate-800 text-slate-600'
                }`}
              >
                <span className="text-[10px] text-slate-500">[{idx}]</span>
                <span className="text-sm font-bold text-white">{val !== null ? `#${val}` : '-'}</span>
                
                {/* Pointer Indicators */}
                <div className="flex gap-1">
                  {isHead && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" title="Head Pointer" />}
                  {isTail && <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" title="Tail Pointer" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md ${
              isPlaying ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause Threads' : 'Run Concurrent Threads'}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-6 text-slate-300">
          <div>
            <span className="text-slate-500 text-[10px] uppercase block">Produced</span>
            <span className="text-emerald-400 font-bold text-sm">{itemsProduced}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase block">Consumed</span>
            <span className="text-blue-400 font-bold text-sm">{itemsConsumed}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase block">Mutex Lock Contention</span>
            <span className={`font-bold text-sm flex items-center gap-1 ${mode === 'mutex' ? 'text-amber-400' : 'text-slate-500'}`}>
              <Lock className="w-3.5 h-3.5" />
              <span>{mode === 'mutex' ? mutexContentionCount : '0 (Lock-Free)'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
