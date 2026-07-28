import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Server, Activity } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';

type EngineMode = 'select' | 'epoll' | 'iouring';

export const EpollIoUringVisualizer: React.FC = () => {
  const [mode, setMode] = useState<EngineMode>('iouring');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSockets, setActiveSockets] = useState(1000); // 1,000 concurrent sockets
  const [processedEvents, setProcessedEvents] = useState(0);
  const [syscallCount, setSyscallCount] = useState(0);
  const [ringSubmission, setRingSubmission] = useState(0);
  const [ringCompletion, setRingCompletion] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const activeBatch = Math.floor(Math.random() * 15) + 5; // 5-20 active socket events

      if (mode === 'select') {
        // select/poll scans all 1,000 sockets O(N)
        setSyscallCount(prev => prev + 1);
        setProcessedEvents(prev => prev + activeBatch);
        audioEngine.playNote(250, 'sawtooth', 0.05, 0.03);
      } else if (mode === 'epoll') {
        // epoll_wait only returns active sockets O(1)
        setSyscallCount(prev => prev + 1);
        setProcessedEvents(prev => prev + activeBatch);
        audioEngine.playNote(400, 'sine', 0.05, 0.03);
      } else if (mode === 'iouring') {
        // io_uring batched submission queue (0 syscalls during SQ/CQ polling)
        setRingSubmission(prev => prev + activeBatch);
        setRingCompletion(prev => prev + activeBatch);
        setProcessedEvents(prev => prev + activeBatch);
        audioEngine.playNote(600, 'triangle', 0.05, 0.03);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying, mode, activeSockets]);

  const handleReset = () => {
    setIsPlaying(false);
    setProcessedEvents(0);
    setSyscallCount(0);
    setRingSubmission(0);
    setRingCompletion(0);
  };

  return (
    <div className="my-8 rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <Server className="w-5 h-5 text-blue-400" />
            <span>Linux Async I/O & Event Loop Benchmark</span>
          </h3>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Compare O(N) select/poll vs O(1) epoll vs Zero-Syscall io_uring Ring Buffers
          </p>
        </div>

        {/* Engine Selector */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 font-mono text-xs">
          <button
            onClick={() => { setMode('select'); handleReset(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              mode === 'select' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            select / poll O(N)
          </button>
          <button
            onClick={() => { setMode('epoll'); handleReset(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              mode === 'epoll' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            epoll O(1)
          </button>
          <button
            onClick={() => { setMode('iouring'); handleReset(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              mode === 'iouring' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            io_uring Ring
          </button>
        </div>
      </div>

      {/* Concurrent Sockets Control */}
      <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>Concurrent Network Sockets:</span>
            <span className="text-blue-400 font-bold">{activeSockets.toLocaleString()} Connections</span>
          </label>
          <input
            type="range"
            min="100"
            max="10000"
            step="100"
            value={activeSockets}
            onChange={e => setActiveSockets(Number(e.target.value))}
            className="w-full accent-blue-500 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-5 py-2.5 rounded-xl font-mono font-bold text-xs flex items-center gap-2 transition-all shadow-lg ${
              isPlaying ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause Workload' : 'Simulate Workload'}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Visualization Display */}
      <div className="p-6 rounded-xl bg-[#090d16] border border-slate-800 space-y-6">
        
        {/* Ring Buffer / Event Queue Diagram */}
        {mode === 'iouring' ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                Submission Queue (SQ)
              </span>
              <p className="text-[11px] text-slate-300 font-mono">User Space writes I/O requests without syscalls</p>
              <div className="text-lg font-bold font-mono text-emerald-300">{ringSubmission} Entries</div>
            </div>
            <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/40 space-y-2">
              <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider block">
                Completion Queue (CQ)
              </span>
              <p className="text-[11px] text-slate-300 font-mono">Kernel posts completed I/O results asynchronously</p>
              <div className="text-lg font-bold font-mono text-blue-300">{ringCompletion} Completed</div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-400" />
              {mode === 'select' ? 'POSIX select() Socket Array Scan' : 'Linux epoll_wait Red-Black Tree List'}
            </span>
            <p className="text-xs text-slate-300 font-mono">
              {mode === 'select'
                ? `Scanning all ${activeSockets.toLocaleString()} file descriptors linearly on every iteration.`
                : `Iterating only over active ready list. Linear scaling overhead is zero.`}
            </p>
          </div>
        )}

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 text-center font-mono text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Processed Events</span>
            <span className="text-white font-bold text-lg">{processedEvents.toLocaleString()}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Kernel Syscalls</span>
            <span className={`font-bold text-lg ${mode === 'iouring' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {mode === 'iouring' ? '0 (Polled Ring)' : syscallCount.toLocaleString()}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Time Complexity</span>
            <span className="text-blue-400 font-bold text-lg">
              {mode === 'select' ? 'O(N)' : mode === 'epoll' ? 'O(1)' : 'O(1) Ring'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
