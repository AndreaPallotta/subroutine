import React, { useState } from 'react';
import { Cpu, Zap } from 'lucide-react';

const SAMPLE_TOKENS = ['The', 'animal', 'didn\'t', 'cross', 'the', 'street', 'because', 'it', 'was', 'too', 'tired'];

// Pre-computed normalized attention weights matrix for the sentence
const ATTENTION_MATRIX: number[][] = [
  // The, animal, didn't, cross, the, street, because, it, was, too, tired
  [0.60, 0.15, 0.05, 0.02, 0.08, 0.04, 0.02, 0.02, 0.01, 0.00, 0.01], // The
  [0.05, 0.70, 0.05, 0.04, 0.02, 0.04, 0.03, 0.04, 0.01, 0.01, 0.01], // animal
  [0.02, 0.08, 0.65, 0.12, 0.02, 0.03, 0.04, 0.02, 0.01, 0.00, 0.01], // didn't
  [0.01, 0.05, 0.10, 0.60, 0.04, 0.15, 0.02, 0.01, 0.01, 0.00, 0.01], // cross
  [0.02, 0.03, 0.01, 0.04, 0.55, 0.30, 0.02, 0.01, 0.01, 0.00, 0.01], // the
  [0.01, 0.04, 0.02, 0.18, 0.15, 0.55, 0.02, 0.01, 0.01, 0.00, 0.01], // street
  [0.02, 0.05, 0.03, 0.04, 0.02, 0.04, 0.60, 0.05, 0.08, 0.04, 0.03], // because
  [0.02, 0.58, 0.02, 0.03, 0.01, 0.03, 0.05, 0.15, 0.04, 0.02, 0.05], // IT -> strongly attends to ANIMAL (0.58)!
  [0.01, 0.02, 0.01, 0.02, 0.01, 0.02, 0.05, 0.20, 0.50, 0.08, 0.08], // was
  [0.00, 0.01, 0.00, 0.01, 0.00, 0.01, 0.02, 0.02, 0.08, 0.50, 0.35], // too
  [0.01, 0.05, 0.01, 0.02, 0.01, 0.02, 0.03, 0.04, 0.10, 0.25, 0.46], // tired
];

export const TransformerAttentionVisualizer: React.FC = () => {
  const [selectedTokenIdx, setSelectedTokenIdx] = useState<number>(7); // Default token "it"

  const activeToken = SAMPLE_TOKENS[selectedTokenIdx];
  const activeWeights = ATTENTION_MATRIX[selectedTokenIdx];

  return (
    <div className="w-full my-8 p-5 md:p-6 rounded-2xl border border-slate-800 bg-[#0b0f19] text-slate-100 shadow-2xl font-sans">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Transformer Self-Attention Matrix Mechanics</h3>
            <p className="text-xs font-mono text-slate-400">Scaled Dot-Product Attention: Softmax(Q * K^T / sqrt(d_k)) * V</p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <span>Head Dimension d_k:</span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 font-bold text-cyan-400">64</span>
        </div>
      </div>

      {/* Prompt Tokens Interactive Selector */}
      <div className="mt-6 space-y-3 font-mono">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Select Query Token (Q_i):</span>
          <span className="text-xs text-cyan-400 font-bold">Query Token: "{activeToken}" (Index #{selectedTokenIdx})</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
          {SAMPLE_TOKENS.map((token, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedTokenIdx(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedTokenIdx === idx
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 scale-105'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {token}
            </button>
          ))}
        </div>
      </div>

      {/* Attention Weight Distribution Heatmap Bar */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="font-bold text-slate-300">Attention Weights Array for "{activeToken}":</span>
          <span className="text-[11px] text-emerald-400 font-bold">Softmax Normalized (Sum = 1.0)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2 font-mono text-xs">
          {SAMPLE_TOKENS.map((token, idx) => {
            const weight = activeWeights[idx];
            const isHighest = idx === 1 && selectedTokenIdx === 7; // "it" -> "animal"
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex flex-col justify-between items-center gap-2 transition-all ${
                  isHighest
                    ? 'bg-cyan-950/80 border-cyan-400 shadow-lg shadow-cyan-500/20 scale-105'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <span className={`text-[11px] font-bold ${isHighest ? 'text-cyan-300' : 'text-slate-300'}`}>{token}</span>
                
                {/* Visual Bar */}
                <div className="w-full bg-slate-900 rounded-full h-12 flex flex-col justify-end p-0.5 overflow-hidden border border-slate-800">
                  <div
                    className={`w-full rounded-full transition-all duration-300 ${
                      isHighest ? 'bg-cyan-400' : 'bg-blue-600'
                    }`}
                    style={{ height: `${Math.max(8, weight * 100)}%` }}
                  />
                </div>

                <span className={`text-[10px] font-mono font-bold ${isHighest ? 'text-cyan-300' : 'text-slate-400'}`}>
                  {(weight * 100).toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mathematical Breakdown Callout Box */}
      <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs space-y-2 text-slate-300">
        <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase text-[11px] tracking-wider">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Self-Attention Insight:</span>
        </div>
        <p className="text-xs leading-relaxed text-slate-300">
          When processing the pronoun <strong className="text-cyan-300">"{activeToken}"</strong>, the Query vector Q computes dot-products against all Key vectors K.
          {selectedTokenIdx === 7 && (
            <span className="text-emerald-300 block mt-1 font-bold">
              ★ Notice how "it" assigns a massive 58% attention weight to "animal", enabling the model to resolve coreference context!
            </span>
          )}
        </p>
      </div>

    </div>
  );
};
