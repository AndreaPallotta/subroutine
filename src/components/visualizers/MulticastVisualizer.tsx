import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Zap, Layers, Network } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';

type Mode = 'tcp' | 'udp' | 'multicast';

export const MulticastVisualizer: React.FC = () => {
  const [mode, setMode] = useState<Mode>('multicast');
  const [isPlaying, setIsPlaying] = useState(false);
  const [packetLoss, setPacketLoss] = useState(25);

  const [packetsSent, setPacketsSent] = useState(0);
  const [packetsReceived, setPacketsReceived] = useState(0);
  const [packetsLost, setPacketsLost] = useState(0);
  const [retransmissions, setRetransmissions] = useState(0);
  const [duplicates, setDuplicates] = useState(0);

  const [packetHistory, setPacketHistory] = useState<Array<{ id: number; status: 'delivered' | 'lost' | 'retransmitted' | 'duplicate'; path: string }>>([]);

  const nextIdRef = useRef(1);

  // Simulation tick
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const currentId = nextIdRef.current++;
      setPacketsSent(s => s + 1);

      const isLost = (Math.random() * 100) < packetLoss;
      audioEngine.playNote(220 + (currentId % 8) * 30, 'sine', 0.1, 0.05);

      if (mode === 'tcp') {
        if (isLost) {
          setRetransmissions(r => r + 1);
          setPacketsLost(l => l + 1);
          setPacketsReceived(r => r + 1); // Delivered after TCP RTO retransmission
          setPacketHistory(prev => [
            { id: currentId, status: 'retransmitted', path: 'Sender -> TCP Buffer Stall (RTO Retransmit) -> Receiver' },
            ...prev.slice(0, 7)
          ]);
        } else {
          setPacketsReceived(r => r + 1);
          setPacketHistory(prev => [
            { id: currentId, status: 'delivered', path: 'Sender -> Receiver (ACK Received)' },
            ...prev.slice(0, 7)
          ]);
        }
      } else if (mode === 'udp') {
        if (isLost) {
          setPacketsLost(l => l + 1);
          // UDP packet dropped permanently - packetsReceived is NOT incremented!
          setPacketHistory(prev => [
            { id: currentId, status: 'lost', path: 'Sender -> [Dropped at Switch - Lost Permanently]' },
            ...prev.slice(0, 7)
          ]);
        } else {
          setPacketsReceived(r => r + 1);
          setPacketHistory(prev => [
            { id: currentId, status: 'delivered', path: 'Sender -> Receiver (Fire & Forget)' },
            ...prev.slice(0, 7)
          ]);
        }
      } else if (mode === 'multicast') {
        if (isLost) {
          setPacketsLost(l => l + 1);
          setPacketHistory(prev => [
            { id: currentId, status: 'lost', path: 'Publisher -> IGMP Group 239.255.0.1 (Dropped at Switch)' },
            ...prev.slice(0, 7)
          ]);
        } else {
          const isDuplicate = Math.random() < 0.30; // 30% chance of duplicate packet delivery on PIM tree join
          if (isDuplicate) {
            setDuplicates(d => d + 1);
            setPacketsReceived(r => r + 1);
            setPacketHistory(prev => [
              { id: currentId, status: 'duplicate', path: 'Publisher -> PIM-SM Tree -> Recv A & Recv B (Duplicate Packet)' },
              ...prev.slice(0, 7)
            ]);
          } else {
            setPacketsReceived(r => r + 1);
            setPacketHistory(prev => [
              { id: currentId, status: 'delivered', path: 'Publisher -> PIM-SM Tree -> 3 Subscribers' },
              ...prev.slice(0, 7)
            ]);
          }
        }
      }
    }, 900);

    return () => clearInterval(interval);
  }, [isPlaying, mode, packetLoss]);

  const handleReset = () => {
    setIsPlaying(false);
    nextIdRef.current = 1;
    setPacketsSent(0);
    setPacketsReceived(0);
    setPacketsLost(0);
    setRetransmissions(0);
    setDuplicates(0);
    setPacketHistory([]);
  };

  return (
    <div className="my-8 rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <Network className="w-5 h-5 text-blue-400" />
            <span>Market Data Transmission Visualizer</span>
          </h3>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Compare Unicast TCP, Raw UDP, and IP Multicast packet distribution
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 font-mono text-xs">
          <button
            onClick={() => { setMode('tcp'); handleReset(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              mode === 'tcp' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            TCP Unicast
          </button>
          <button
            onClick={() => { setMode('udp'); handleReset(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              mode === 'udp' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Raw UDP
          </button>
          <button
            onClick={() => { setMode('multicast'); handleReset(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              mode === 'multicast' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            IP Multicast
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
        <div className="space-y-2">
          <label className="text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>Simulated Network Packet Loss:</span>
            <span className="text-amber-400 font-bold">{packetLoss}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="60"
            value={packetLoss}
            onChange={e => setPacketLoss(Number(e.target.value))}
            className="w-full accent-blue-500 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-5 py-2.5 rounded-xl font-mono font-bold text-xs flex items-center gap-2 transition-all shadow-lg ${
              isPlaying ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause Stream' : 'Start Transmission'}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Sent</span>
            <span className="text-white font-bold text-base">{packetsSent}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Received</span>
            <span className="text-emerald-400 font-bold text-base">{packetsReceived}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">
              {mode === 'tcp' ? 'Retrans' : mode === 'multicast' ? 'Duplicates' : 'Dropped'}
            </span>
            <span className="text-amber-400 font-bold text-base">
              {mode === 'tcp' ? retransmissions : mode === 'multicast' ? duplicates : packetsLost}
            </span>
          </div>
        </div>
      </div>

      {/* Network Topology Visualization Canvas */}
      <div className="relative h-60 rounded-xl bg-[#090d16] border border-slate-800 p-4 flex flex-col justify-between overflow-hidden">
        
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800/80 pb-2">
          <span className="flex items-center gap-1.5 text-blue-400 font-bold">
            <Zap className="w-3.5 h-3.5" />
            Sender / Publisher (10.0.1.10)
          </span>
          <span className="text-slate-500">Router / PIM Rendezvous Point</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Layers className="w-3.5 h-3.5" />
            {mode === 'multicast' ? 'IGMP Group 239.255.0.1 (3 Subscribers)' : 'Unicast Receiver (10.0.2.20)'}
          </span>
        </div>

        {/* Live Packet Motion Animation */}
        <div className="flex-1 flex items-center justify-around relative my-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-950/80 border border-blue-500/50 flex flex-col items-center justify-center font-mono text-[10px] text-blue-300 font-bold shadow-lg shadow-blue-500/20">
            <span>PUB</span>
            <span className="text-[9px] text-slate-400">Host A</span>
          </div>

          {/* Dynamic Beam Line */}
          <div className="flex-1 h-1 mx-4 bg-slate-800 relative rounded-full overflow-hidden">
            {isPlaying && (
              <div className={`h-full animate-pulse transition-all ${
                mode === 'tcp' ? 'bg-blue-500' : mode === 'udp' ? 'bg-amber-500' : 'bg-emerald-500'
              }`} style={{ width: '100%' }} />
            )}
          </div>

          <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex flex-col items-center justify-center font-mono text-[10px] text-emerald-300 font-bold shadow-lg shadow-emerald-500/20">
            <span>RECV</span>
            <span className="text-[9px] text-slate-400">{mode === 'multicast' ? 'Group' : 'Host B'}</span>
          </div>
        </div>

        {/* Dynamic Mode Explainer Bar */}
        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono leading-relaxed">
          {mode === 'tcp' && (
            <span className="text-blue-300">
              <strong>TCP Unicast:</strong> Guarantees byte order & delivery. Packet loss triggers <strong>Head-of-Line Blocking</strong> and TCP retransmission timeouts (RTO), stalling latency-critical feeds.
            </span>
          )}
          {mode === 'udp' && (
            <span className="text-amber-300">
              <strong>Raw UDP:</strong> Unreliable Datagram Protocol. Zero retransmission overhead or head-of-line blocking, but dropped packets are lost forever unless handled at the application layer.
            </span>
          )}
          {mode === 'multicast' && (
            <span className="text-emerald-300">
              <strong>IP Multicast (IGMP/PIM-SM):</strong> Single packet copied by hardware switches to all joined IGMP group members. Saves bandwidth, but PIM tree re-convergence can produce duplicate packets!
            </span>
          )}
        </div>
      </div>

      {/* Packet Event Log */}
      <div className="mt-4 space-y-2">
        <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">Live Packet Audit Log</span>
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {packetHistory.length === 0 ? (
            <div className="text-xs font-mono text-slate-500 py-3 text-center bg-slate-900/50 rounded-xl border border-slate-800/60">
              Click &quot;Start Transmission&quot; to begin streaming network datagrams...
            </div>
          ) : (
            packetHistory.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-xs font-mono">
                <span className="text-slate-400">Packet #{item.id}</span>
                <span className="text-slate-300">{item.path}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  item.status === 'delivered' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30' :
                  item.status === 'retransmitted' ? 'bg-blue-950 text-blue-300 border-blue-500/30' :
                  item.status === 'duplicate' ? 'bg-purple-950 text-purple-300 border-purple-500/30' :
                  'bg-rose-950 text-rose-300 border-rose-500/30'
                }`}>
                  {item.status.toUpperCase()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
