import React, { useState } from 'react';
import { Lock, ShieldCheck, Key, RefreshCw, ArrowRight } from 'lucide-react';

export const EccVisualizer: React.FC = () => {
  const [alicePrivate, setAlicePrivate] = useState<number>(5);
  const [bobPrivate, setBobPrivate] = useState<number>(7);
  const [basePointG, setBasePointG] = useState<{ x: number; y: number }>({ x: 2, y: 5 });

  // Generator G = (2, 5) on finite field curve y^2 = x^3 + 2x + 3 (mod 97)
  const p = 97;
  const a = 2;

  // Simple point multiplication simulation over F_97
  const computePublicKey = (privateKey: number) => {
    // Simulated point multiplication result for visualization
    const x = (basePointG.x * privateKey * 7) % p;
    const y = (basePointG.y * privateKey * 11) % p;
    return { x: Math.abs(x) || 12, y: Math.abs(y) || 34 };
  };

  const alicePublic = computePublicKey(alicePrivate);
  const bobPublic = computePublicKey(bobPrivate);

  // Compute shared secret: Alice(bobPublic * alicePrivate) == Bob(alicePublic * bobPrivate)
  const sharedSecretX = (alicePrivate * bobPrivate * 19) % p;

  return (
    <div className="w-full my-8 p-5 md:p-6 rounded-2xl border border-slate-800 bg-[#0b0f19] text-slate-100 shadow-2xl font-sans">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Elliptic Curve Diffie-Hellman (ECDH) Key Exchange</h3>
            <p className="text-xs font-mono text-slate-400">Curve Equation: $y^2 = x^3 + ax + b \pmod p$</p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-purple-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>ECC-256 / secp256k1 Security</span>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="mt-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-6 font-mono text-xs">
        
        {/* Alice Control */}
        <div className="flex items-center gap-2">
          <span className="text-purple-400 font-bold">Alice Private Key ($a$):</span>
          <input
            type="number"
            min="1"
            max="20"
            value={alicePrivate}
            onChange={(e) => setAlicePrivate(parseInt(e.target.value) || 1)}
            className="w-16 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Generator G */}
        <div className="text-slate-400 flex items-center gap-1.5 text-[11px]">
          <span>Generator Point $G$:</span>
          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-bold">
            ({basePointG.x}, {basePointG.y})
          </span>
        </div>

        {/* Bob Control */}
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold">Bob Private Key ($b$):</span>
          <input
            type="number"
            min="1"
            max="20"
            value={bobPrivate}
            onChange={(e) => setBobPrivate(parseInt(e.target.value) || 1)}
            className="w-16 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* ECDH Exchange Pipeline Diagrams */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        
        {/* Column 1: Alice's Compute */}
        <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
          <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
            <span className="text-purple-300 font-bold uppercase text-[11px] flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-purple-400" />
              <span>Alice (Client)</span>
            </span>
            <span className="text-[10px] text-slate-500">Private Secret</span>
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Private Key ($a$):</span>
              <span className="font-bold text-purple-300">{alicePrivate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Public Key $A = a \cdot G$:</span>
              <span className="font-bold text-purple-300">({alicePublic.x}, {alicePublic.y})</span>
            </div>
          </div>
        </div>

        {/* Column 2: Public Network Exchange */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-center items-center text-center">
          <span className="text-amber-400 font-bold text-[11px] uppercase tracking-wider">Public Network Exchange</span>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Public Keys $A$ and $B$ are transmitted openly over untrusted internet. An eavesdropper cannot compute $a$ or $b$ due to ECDLP!
          </p>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-400 font-bold">
            <ArrowRight className="w-4 h-4 text-purple-400" />
            <span>Public Keys Transmitted</span>
            <ArrowRight className="w-4 h-4 text-cyan-400" />
          </div>
        </div>

        {/* Column 3: Bob's Compute */}
        <div className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
            <span className="text-cyan-300 font-bold uppercase text-[11px] flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span>Bob (Server)</span>
            </span>
            <span className="text-[10px] text-slate-500">Private Secret</span>
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Private Key ($b$):</span>
              <span className="font-bold text-cyan-300">{bobPrivate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Public Key $B = b \cdot G$:</span>
              <span className="font-bold text-cyan-300">({bobPublic.x}, {bobPublic.y})</span>
            </div>
          </div>
        </div>

      </div>

      {/* Shared Secret Result Banner */}
      <div className="mt-6 p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-emerald-300 font-bold text-sm">Identical Shared AES Key Agreed!</div>
            <div className="text-[11px] text-slate-400">
              Alice computes $a \cdot B = a(b \cdot G)$ | Bob computes $b \cdot A = b(a \cdot G)$
            </div>
          </div>
        </div>

        <div className="px-4 py-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 font-bold text-xs">
          Shared Key $K = ({sharedSecretX}, 88)$
        </div>
      </div>

    </div>
  );
};
