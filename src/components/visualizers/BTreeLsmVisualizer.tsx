import React, { useState } from 'react';
import { Database, Layers, Plus, RotateCcw, Play, CheckCircle2, ArrowRight } from 'lucide-react';

interface BTreeNode {
  keys: number[];
  children?: BTreeNode[];
  isLeaf: boolean;
}

interface MemtableEntry {
  key: string;
  value: string;
  timestamp: string;
}

interface SSTable {
  id: number;
  level: number;
  entries: { key: string; value: string }[];
}

export const BTreeLsmVisualizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'btree' | 'lsm'>('btree');

  // B-Tree State
  const [btreeRoot, setBtreeRoot] = useState<BTreeNode>({
    keys: [20, 50],
    isLeaf: false,
    children: [
      { keys: [10, 15], isLeaf: true },
      { keys: [30, 42], isLeaf: true },
      { keys: [60, 85, 99], isLeaf: true }
    ]
  });
  const [newBTreeKey, setNewBTreeKey] = useState<number>(45);
  const [bTreeLog, setBTreeLog] = useState<string>('B+ Tree initialized with Order M=4. Max 3 keys per node.');

  // LSM-Tree State
  const [walLogs, setWalLogs] = useState<string[]>([
    'SET user:101 = "Alice"',
    'SET user:102 = "Bob"',
    'SET user:103 = "Charlie"'
  ]);
  const [memtable, setMemtable] = useState<MemtableEntry[]>([
    { key: 'user:101', value: '"Alice"', timestamp: '10:00:01' },
    { key: 'user:102', value: '"Bob"', timestamp: '10:00:02' },
    { key: 'user:103', value: '"Charlie"', timestamp: '10:00:03' }
  ]);
  const [ssTables, setSsTables] = useState<SSTable[]>([
    {
      id: 1,
      level: 1,
      entries: [
        { key: 'user:088', value: '"Dave"' },
        { key: 'user:095', value: '"Eve"' }
      ]
    }
  ]);
  const [inputKey, setInputKey] = useState<string>('user:104');
  const [inputValue, setInputValue] = useState<string>('"Frank"');
  const [lsmLog, setLsmLog] = useState<string>('LSM-Tree active: Writes append to WAL & Memtable in $O(1)$ time.');

  // B-Tree Insert Helper
  const handleInsertBTree = () => {
    if (!newBTreeKey || isNaN(newBTreeKey)) return;
    setBTreeLog(`Inserting key [${newBTreeKey}]... Traversing root [20, 50] -> Routing to middle leaf [30, 42].`);
    
    // Simulate insertion
    setTimeout(() => {
      setBtreeRoot(prev => {
        const newRoot = JSON.parse(JSON.stringify(prev)) as BTreeNode;
        if (newRoot.children && newRoot.children[1]) {
          newRoot.children[1].keys.push(newBTreeKey);
          newRoot.children[1].keys.sort((a, b) => a - b);
        }
        return newRoot;
      });
      setBTreeLog(`Inserted [${newBTreeKey}] into leaf node. Node keys: [30, 42, ${newBTreeKey}]. Memory page remains aligned.`);
      setNewBTreeKey(Math.floor(Math.random() * 90) + 10);
    }, 400);
  };

  // LSM-Tree Insert Helper
  const handleInsertLSM = () => {
    if (!inputKey || !inputValue) return;
    const time = new Date().toLocaleTimeString();
    const walEntry = `SET ${inputKey} = ${inputValue}`;
    
    setWalLogs(prev => [walEntry, ...prev.slice(0, 4)]);
    setMemtable(prev => [
      ...prev,
      { key: inputKey, value: inputValue, timestamp: time }
    ].sort((a, b) => a.key.localeCompare(b.key)));

    setLsmLog(`Write Success: Appended "${walEntry}" to Disk WAL and RAM Memtable ($O(1)$ sequential write).`);
    setInputKey(`user:${Math.floor(Math.random() * 800) + 100}`);
  };

  // LSM-Tree Flush Memtable to SSTable
  const handleFlushMemtable = () => {
    if (memtable.length === 0) return;
    const newSSTableId = ssTables.length + 1;
    const flushedEntries = [...memtable];
    
    setSsTables(prev => [
      ...prev,
      { id: newSSTableId, level: 0, entries: flushedEntries }
    ]);
    setMemtable([]);
    setLsmLog(`Flushed ${flushedEntries.length} RAM Memtable entries to immutable L0 SSTable #${newSSTableId} on disk.`);
  };

  return (
    <div className="w-full my-8 p-5 md:p-6 rounded-2xl border border-slate-800 bg-[#0b0f19] text-slate-100 shadow-2xl font-sans">
      
      {/* Top Header & Tab Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Database Storage Engine Architecture</h3>
            <p className="text-xs font-mono text-slate-400">Comparing In-Place B+ Tree Pages vs. Append-Only LSM-Tree Compaction</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setActiveTab('btree')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'btree'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>B+ Tree (In-Place)</span>
          </button>
          <button
            onClick={() => setActiveTab('lsm')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'lsm'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>LSM-Tree (Append-Only)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: B+ TREE INTERACTIVE DEMO */}
      {activeTab === 'btree' && (
        <div className="mt-6 space-y-6 animate-in fade-in duration-200">
          
          {/* Controls Bar */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">Insert Key (1-99):</span>
              <input
                type="number"
                value={newBTreeKey}
                onChange={(e) => setNewBTreeKey(parseInt(e.target.value) || 0)}
                className="w-20 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 font-bold"
              />
              <button
                onClick={handleInsertBTree}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Insert Page Key</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-500">Order M=4 (Max 3 keys / page node)</span>
          </div>

          {/* B+ Tree Visual Nodes Display */}
          <div className="p-6 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-8 min-h-[220px] flex flex-col justify-center items-center font-mono">
            
            {/* Root Node */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] text-blue-400 uppercase tracking-wider font-bold">Root Index Node (RAM/Disk Page)</span>
              <div className="flex items-center border-2 border-blue-500/50 bg-blue-950/40 rounded-xl overflow-hidden shadow-lg shadow-blue-500/10">
                {btreeRoot.keys.map((k, i) => (
                  <span key={i} className="px-4 py-2 text-sm font-extrabold text-blue-300 border-r border-blue-500/30 last:border-r-0">
                    {k}
                  </span>
                ))}
              </div>
            </div>

            {/* Pointer Lines */}
            <div className="w-64 h-4 border-t-2 border-slate-700 flex justify-between relative">
              <div className="w-0.5 h-4 bg-slate-700 absolute left-0"></div>
              <div className="w-0.5 h-4 bg-slate-700 absolute left-1/2 -translate-x-1/2"></div>
              <div className="w-0.5 h-4 bg-slate-700 absolute right-0"></div>
            </div>

            {/* Child Leaf Nodes */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
              {btreeRoot.children?.map((child, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <span className="text-[9px] text-slate-500 uppercase font-bold">Leaf Page #{idx + 1}</span>
                  <div className="flex items-center border border-slate-700 bg-slate-900 rounded-xl overflow-hidden shadow-md">
                    {child.keys.map((k, i) => (
                      <span key={i} className="px-3 py-1.5 text-xs font-bold text-slate-200 border-r border-slate-800 last:border-r-0">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Terminal Execution Log */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-blue-400 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{bTreeLog}</span>
          </div>

        </div>
      )}

      {/* TAB 2: LSM-TREE INTERACTIVE DEMO */}
      {activeTab === 'lsm' && (
        <div className="mt-6 space-y-6 animate-in fade-in duration-200">
          
          {/* Form & Controls */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Key (e.g. user:104)"
                className="w-28 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 font-bold"
              />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Value"
                className="w-28 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 font-bold"
              />
              <button
                onClick={handleInsertLSM}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Write (WAL + Memtable)</span>
              </button>
            </div>

            <button
              onClick={handleFlushMemtable}
              disabled={memtable.length === 0}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Flush Memtable to SSTable</span>
            </button>
          </div>

          {/* LSM Architecture Pipeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            
            {/* Column 1: Write-Ahead Log (WAL) */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-amber-400 font-bold text-[11px] uppercase tracking-wider">1. Disk WAL (Append-Only)</span>
                <span className="text-[10px] text-slate-500">Sequential IO</span>
              </div>
              <div className="space-y-2">
                {walLogs.map((log, i) => (
                  <div key={i} className="p-2 rounded-lg bg-amber-950/20 border border-amber-500/20 text-amber-300 text-[11px] truncate">
                    {log}
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: In-Memory Memtable (SkipList / Red-Black Tree) */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-blue-400 font-bold text-[11px] uppercase tracking-wider">2. RAM Memtable (Sorted)</span>
                <span className="text-[10px] text-slate-500">{memtable.length} Entries</span>
              </div>
              <div className="space-y-2">
                {memtable.length === 0 ? (
                  <div className="text-slate-600 text-center py-6 italic text-[11px]">Memtable flushed to disk</div>
                ) : (
                  memtable.map((m, i) => (
                    <div key={i} className="p-2 rounded-lg bg-blue-950/30 border border-blue-500/30 text-blue-200 text-[11px] flex justify-between">
                      <span className="font-bold">{m.key}</span>
                      <span className="text-slate-400">{m.value}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 3: Disk SSTables (Level 0 / Level 1 Compaction) */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-emerald-400 font-bold text-[11px] uppercase tracking-wider">3. Disk SSTables (L0 Files)</span>
                <span className="text-[10px] text-slate-500">{ssTables.length} Files</span>
              </div>
              <div className="space-y-3">
                {ssTables.map((sst) => (
                  <div key={sst.id} className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold">
                      <span>SSTable #{sst.id} (Level {sst.level})</span>
                      <span>Immutable</span>
                    </div>
                    {sst.entries.map((e, idx) => (
                      <div key={idx} className="text-[10px] text-slate-300 flex justify-between">
                        <span>{e.key}</span>
                        <span className="text-slate-500">{e.value}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Execution Terminal Log */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-emerald-400 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{lsmLog}</span>
          </div>

        </div>
      )}

    </div>
  );
};
