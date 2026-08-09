import React, { useState } from 'react';
import { ShieldCheck, Lock, Key, CheckCircle2, Play } from 'lucide-react';

export const ZkProofVisualizer: React.FC = () => {
  const [secretX, setSecretX] = useState<number>(7);
  const [proofGenerated, setProofGenerated] = useState<boolean>(false);
  const [zkLog, setZkLog] = useState<string>('zk-SNARK Engine Ready: Prover holds secret x. Verifier checks proof without learning x.');

  // Polynomial P(x) = x^2 - 49. Secret x = 7 -> P(7) = 0
  const evaluateProof = () => {
    const isRoot = secretX * secretX === 49;
    setProofGenerated(true);
    if (isRoot) {
      setZkLog(`PROOF VERIFIED (Succinct & Non-Interactive): Elliptic curve pairing e(A, B) == e(C, D) passed! Prover knows valid secret root.`);
    } else {
      setZkLog(`PROOF FAILED: Polynomial evaluation P(${secretX}) != 0. Homomorphic pairing check failed.`);
    }
  };

  return (
    <div className="w-full my-8 p-5 md:p-6 rounded-2xl border border-slate-800 bg-[#0b0f19] text-slate-100 shadow-2xl font-sans">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Zero-Knowledge Proofs (zk-SNARKs) & KZG Commitments</h3>
            <p className="text-xs font-mono text-slate-400">Prove knowledge of secret $x$ such that $P(x) = 0$ without revealing $x$</p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-emerald-300">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Zero-Knowledge Privacy</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="mt-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-bold">Prover Secret Input ($x$):</span>
          <input
            type="number"
            value={secretX}
            onChange={(e) => {
              setSecretX(parseInt(e.target.value) || 0);
              setProofGenerated(false);
            }}
            className="w-20 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={evaluateProof}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Generate & Verify Proof</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400">Target Polynomial: $P(x) = x^2 - 49$</span>
      </div>

      {/* Prover vs Verifier Card Pipeline */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
        
        {/* Prover Card */}
        <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
            <span className="text-emerald-300 font-bold uppercase text-[11px] flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span>Prover (Holds Secret)</span>
            </span>
            <span className="text-[10px] text-slate-500">Private Input</span>
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Secret Variable $x$:</span>
              <span className="font-bold text-emerald-300">Hidden ({secretX})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Polynomial Root Check:</span>
              <span className="font-bold text-slate-200">${secretX}^2 - 49 = {secretX * secretX - 49}$</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-2">
              <span className="text-slate-400">Generated Proof $\pi$:</span>
              <span className="font-bold text-emerald-400">
                {proofGenerated ? '0x8f3c...b291 (288 bytes)' : 'Not Generated'}
              </span>
            </div>
          </div>
        </div>

        {/* Verifier Card */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-cyan-300 font-bold uppercase text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Verifier (Public Auditor)</span>
            </span>
            <span className="text-[10px] text-slate-500">Zero Knowledge</span>
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Learns Secret $x$?</span>
              <span className="font-bold text-rose-400">NO (Zero-Knowledge)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Bilinear Pairing Check:</span>
              <span className="font-bold text-cyan-300">e(A, B) == e(C, D)</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-2">
              <span className="text-slate-400">Verification Result:</span>
              <span className={`font-bold ${
                proofGenerated && secretX * secretX === 49
                  ? 'text-emerald-400'
                  : proofGenerated
                  ? 'text-rose-400'
                  : 'text-slate-500'
              }`}>
                {proofGenerated && secretX * secretX === 49
                  ? 'VALID PROOF ✓'
                  : proofGenerated
                  ? 'INVALID PROOF ✗'
                  : 'Awaiting Proof'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Execution Terminal Log */}
      <div className="mt-6 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-emerald-300 flex items-center gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="truncate">{zkLog}</span>
      </div>

    </div>
  );
};
