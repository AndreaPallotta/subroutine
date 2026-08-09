import React, { useState, useEffect } from 'react';
import { Server, Zap, RefreshCw, ShieldAlert, CheckCircle2, Play, Power } from 'lucide-react';

interface RaftNode {
  id: number;
  role: 'Leader' | 'Follower' | 'Candidate' | 'Dead';
  term: number;
  votedFor: number | null;
  logCount: number;
}

export const RaftConsensusVisualizer: React.FC = () => {
  const [nodes, setNodes] = useState<RaftNode[]>([
    { id: 1, role: 'Leader', term: 1, votedFor: 1, logCount: 3 },
    { id: 2, role: 'Follower', term: 1, votedFor: 1, logCount: 3 },
    { id: 3, role: 'Follower', term: 1, votedFor: 1, logCount: 3 },
    { id: 4, role: 'Follower', term: 1, votedFor: 1, logCount: 3 },
    { id: 5, role: 'Follower', term: 1, votedFor: 1, logCount: 3 }
  ]);
  const [currentTerm, setCurrentTerm] = useState<number>(1);
  const [raftLog, setRaftLog] = useState<string>('Raft Cluster Operational: Node 1 active as Leader for Term 1 (Quorum: 3/5 nodes).');

  // Trigger Leader Failure
  const handleKillLeader = () => {
    const leader = nodes.find(n => n.role === 'Leader');
    if (!leader) return;

    const nextTerm = currentTerm + 1;
    setCurrentTerm(nextTerm);

    setNodes(prev => prev.map(n => {
      if (n.id === leader.id) return { ...n, role: 'Dead' };
      if (n.id === 2) return { ...n, role: 'Candidate', term: nextTerm, votedFor: 2 };
      return { ...n, term: nextTerm, votedFor: null };
    }));

    setRaftLog(`LEADER FAILURE: Node ${leader.id} killed! Node 2 election timeout expired -> Candidate for Term ${nextTerm}. Requesting votes...`);

    // Simulate election resolution after 600ms
    setTimeout(() => {
      setNodes(prev => prev.map(n => {
        if (n.id === 2) return { ...n, role: 'Leader' };
        if (n.role !== 'Dead') return { ...n, votedFor: 2 };
        return n;
      }));
      setRaftLog(`ELECTION SUCCESS: Node 2 elected Leader for Term ${nextTerm} (Received 3 votes from Nodes 2, 3, 4).`);
    }, 700);
  };

  // Toggle individual node power
  const handleToggleNode = (id: number) => {
    setNodes(prev => prev.map(n => {
      if (n.id === id) {
        const nextRole = n.role === 'Dead' ? 'Follower' : 'Dead';
        return { ...n, role: nextRole };
      }
      return n;
    }));
  };

  // Client Append Log Entry
  const handleAppendLog = () => {
    const leader = nodes.find(n => n.role === 'Leader');
    if (!leader) {
      setRaftLog('APPEND ERROR: No active Leader in cluster to accept write command!');
      return;
    }

    setNodes(prev => prev.map(n => {
      if (n.role !== 'Dead') return { ...n, logCount: n.logCount + 1 };
      return n;
    }));

    setRaftLog(`CLIENT WRITE: Leader Node ${leader.id} appended entry #${leader.logCount + 1} and replicated to quorum majority.`);
  };

  return (
    <div className="w-full my-8 p-5 md:p-6 rounded-2xl border border-slate-800 bg-[#0b0f19] text-slate-100 shadow-2xl font-sans">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Raft Distributed Consensus & Leader Election</h3>
            <p className="text-xs font-mono text-slate-400">5-Node Cluster Simulation (Quorum Majority: $\lfloor 5/2 \rfloor + 1 = 3$)</p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-indigo-300">
          <span>Current Term:</span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-500/40 font-bold text-indigo-300">
            Term #{currentTerm}
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="mt-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleKillLeader}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/30"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Kill Active Leader Node</span>
          </button>
          
          <button
            onClick={handleAppendLog}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
          >
            <Play className="w-4 h-4" />
            <span>Append Client Log Entry</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400">Click any server node card to toggle node power state</span>
      </div>

      {/* 5-Node Cluster Grid */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 font-mono text-xs">
        {nodes.map((node) => {
          const isLeader = node.role === 'Leader';
          const isCandidate = node.role === 'Candidate';
          const isDead = node.role === 'Dead';

          return (
            <div
              key={node.id}
              onClick={() => handleToggleNode(node.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                isLeader
                  ? 'bg-indigo-950/60 border-indigo-400 shadow-lg shadow-indigo-500/20 scale-105'
                  : isCandidate
                  ? 'bg-amber-950/60 border-amber-400 shadow-lg shadow-amber-500/20 animate-pulse'
                  : isDead
                  ? 'bg-slate-950 border-slate-800 opacity-50'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">Node #{node.id}</span>
                <Power className={`w-3.5 h-3.5 ${isDead ? 'text-rose-500' : 'text-emerald-400'}`} />
              </div>

              {/* Status Badge */}
              <div className="py-1 px-2.5 rounded-lg border text-[10px] font-bold text-center uppercase tracking-wider">
                {isLeader && <span className="text-indigo-300 border-indigo-500/40 bg-indigo-950">Leader ★</span>}
                {isCandidate && <span className="text-amber-300 border-amber-500/40 bg-amber-950">Candidate...</span>}
                {node.role === 'Follower' && <span className="text-slate-400 border-slate-700 bg-slate-900">Follower</span>}
                {isDead && <span className="text-rose-400 border-rose-500/40 bg-rose-950">Offline</span>}
              </div>

              {/* Node Details */}
              <div className="space-y-1 text-[11px] text-slate-400 border-t border-slate-800 pt-2">
                <div className="flex justify-between">
                  <span>Term:</span>
                  <span className="font-bold text-slate-200">{node.term}</span>
                </div>
                <div className="flex justify-between">
                  <span>Log Length:</span>
                  <span className="font-bold text-indigo-400">{node.logCount} entries</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal Cluster Output Stream */}
      <div className="mt-6 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-indigo-300 flex items-center gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="truncate">{raftLog}</span>
      </div>

    </div>
  );
};
