import React, { useState } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Code2, Sparkles } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';
import { CodeBlock } from '../ui/CodeBlock';

export type SupportedLanguage = 'cpp' | 'python' | 'java' | 'go' | 'rust' | 'ts';

interface Item {
  id: number;
  name: string;
  weight: number;
  value: number;
}

const LANG_CONFIG: Record<SupportedLanguage, { label: string; fileExt: string }> = {
  cpp: { label: 'C++', fileExt: 'cpp' },
  python: { label: 'Python', fileExt: 'py' },
  java: { label: 'Java', fileExt: 'java' },
  go: { label: 'Go', fileExt: 'go' },
  rust: { label: 'Rust', fileExt: 'rs' },
  ts: { label: 'TypeScript', fileExt: 'ts' },
};

const CODE_EXAMPLES: Record<SupportedLanguage, string> = {
  cpp: `// 0/1 Knapsack Problem in C++ (Dynamic Programming)
#include <vector>
#include <algorithm>

int knapsack(int W, const std::vector<int>& wt, const std::vector<int>& val) {
    int n = val.size();
    std::vector<std::vector<int>> dp(n + 1, std::vector<int>(W + 1, 0));

    for (int i = 1; i <= n; ++i) {
        for (int w = 0; w <= W; ++w) {
            if (wt[i - 1] <= w) {
                dp[i][w] = std::max(dp[i - 1][w], val[i - 1] + dp[i - 1][w - wt[i - 1]]);
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }
    return dp[n][W];
}`,
  python: `# 0/1 Knapsack Dynamic Programming in Python

def knapsack(W, weights, values):
    n = len(values)
    dp = [[0] * (W + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        for w in range(W + 1):
            if weights[i - 1] <= w:
                dp[i][w] = max(dp[i - 1][w], values[i - 1] + dp[i - 1][w - weights[i - 1]])
            else:
                dp[i][w] = dp[i - 1][w]

    return dp[n][W]`,
  java: `public class KnapsackDP {
    public static int knapsack(int W, int[] wt, int[] val) {
        int n = val.length;
        int[][] dp = new int[n + 1][W + 1];

        for (int i = 1; i <= n; i++) {
            for (int w = 0; w <= W; w++) {
                if (wt[i - 1] <= w) {
                    dp[i][w] = Math.max(dp[i - 1][w], values[i - 1] + dp[i - 1][w - wt[i - 1]]);
                } else {
                    dp[i][w] = dp[i - 1][w];
                }
            }
        }
        return dp[n][W];
    }
}`,
  go: `package main

import "math"

func knapsack(W int, wt, val []int) int {
	n := len(val)
	dp := make([][]int, n+1)
	for i := range dp { dp[i] = make([]int, W+1) }

	for i := 1; i <= n; i++ {
		for w := 0; w <= W; w++ {
			if wt[i-1] <= w {
				dp[i][w] = int(math.Max(float64(dp[i-1][w]), float64(val[i-1]+dp[i-1][w-wt[i-1]])))
			} else {
				dp[i][w] = dp[i-1][w]
			}
		}
	}
	return dp[n][W]
}`,
  rust: `fn knapsack(capacity: usize, weights: &[usize], values: &[usize]) -> usize {
    let n = values.len();
    let mut dp = vec![vec![0; capacity + 1]; n + 1];

    for i in 1..=n {
        for w in 0..=capacity {
            if weights[i - 1] <= w {
                dp[i][w] = dp[i - 1][w].max(values[i - 1] + dp[i - 1][w - weights[i - 1]]);
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }
    dp[n][capacity]
}`,
  ts: `function knapsack(W: number, weights: number[], values: number[]): number {
  const n = values.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= W; w++) {
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(dp[i - 1][w], values[i - 1] + dp[i - 1][w - weights[i - 1]]);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }
  return dp[n][W];
}`
};

export const KnapsackVisualizer: React.FC = () => {
  const MAX_CAPACITY = 7;
  const items: Item[] = [
    { id: 1, name: 'Gemstone', weight: 2, value: 3 },
    { id: 2, name: 'Gold Bar', weight: 3, value: 4 },
    { id: 3, name: 'Artifact', weight: 4, value: 5 },
    { id: 4, name: 'Crown', weight: 5, value: 8 },
  ];

  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('python');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<{ i: number; w: number }>({ i: 1, w: 0 });
  const [dpTable, setDpTable] = useState<number[][]>(() =>
    Array.from({ length: items.length + 1 }, () => Array(MAX_CAPACITY + 1).fill(0))
  );

  const stepDP = () => {
    let { i, w } = currentStep;

    if (i > items.length) return; // Completed

    const item = items[i - 1];
    let computedVal = 0;
    setDpTable(prev => {
      const next = prev.map(row => [...row]);
      if (item.weight <= w) {
        computedVal = Math.max(next[i - 1][w], item.value + next[i - 1][w - item.weight]);
      } else {
        computedVal = next[i - 1][w];
      }
      next[i][w] = computedVal;
      return next;
    });

    audioEngine.playValueTone(300 + computedVal * 40, 10, 100, 0.08);

    // Advance to next cell
    let nextW = w + 1;
    let nextI = i;
    if (nextW > MAX_CAPACITY) {
      nextW = 0;
      nextI = i + 1;
    }
    setCurrentStep({ i: nextI, w: nextW });
  };

  const resetDP = () => {
    setCurrentStep({ i: 1, w: 0 });
    setDpTable(Array.from({ length: items.length + 1 }, () => Array(MAX_CAPACITY + 1).fill(0)));
  };

  const activeLangConfig = LANG_CONFIG[selectedLang];
  const currItem = currentStep.i <= items.length ? items[currentStep.i - 1] : null;

  return (
    <div className="my-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
      <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>0/1 Knapsack Dynamic Programming</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Memoization Matrix
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Fill the 2D DP matrix <code className="text-cyan-300">DP[i][w] = max(DP[i-1][w], val[i] + DP[i-1][w-wt[i]])</code> cell-by-cell!
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500">Max Value: </span>
            <span className="text-emerald-400 font-bold">${dpTable[items.length][MAX_CAPACITY]}</span>
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-950/90 border-b border-slate-800 flex flex-col items-center font-mono text-xs">
        
        {/* Recurrence Explanation Banner */}
        <div className="w-full max-w-2xl mb-6 p-4 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-between">
          {currItem ? (
            <div>
              <span className="text-cyan-400 font-bold block mb-1">
                Evaluating {currItem.name} (Weight: {currItem.weight}, Value: ${currItem.value}) at Capacity W={currentStep.w}
              </span>
              <span className="text-[11px] text-slate-400">
                {currItem.weight <= currentStep.w
                  ? `wt <= W (${currItem.weight} <= ${currentStep.w}): DP[${currentStep.i}][${currentStep.w}] = max(Exclude: $${dpTable[currentStep.i-1][currentStep.w]}, Include: $${currItem.value} + $${dpTable[currentStep.i-1][currentStep.w - currItem.weight]})`
                  : `wt > W (${currItem.weight} > ${currentStep.w}): Exclude item -> Copy DP[${currentStep.i-1}][${currentStep.w}] = $${dpTable[currentStep.i-1][currentStep.w]}`}
              </span>
            </div>
          ) : (
            <span className="text-emerald-400 font-bold">✓ DP Matrix Evaluation Complete! Max Profit: ${dpTable[items.length][MAX_CAPACITY]}</span>
          )}
        </div>

        {/* Item Catalog */}
        <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {items.map(item => {
            const isSelected = currItem?.id === item.id;
            return (
              <div key={item.id} className={`p-3 rounded-xl border transition-all ${
                isSelected ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-lg scale-102' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                <span className="font-bold block">{item.name}</span>
                <div className="flex justify-between text-[11px] mt-2">
                  <span>Wt: {item.weight}</span>
                  <span className="text-emerald-400 font-bold">${item.value}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2D DP Memoization Table */}
        <div className="overflow-x-auto w-full max-w-2xl mb-6">
          <table className="w-full text-center border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            <thead>
              <tr className="bg-slate-900 text-slate-400">
                <th className="p-2 border-b border-slate-800">Item \ Wt</th>
                {Array.from({ length: MAX_CAPACITY + 1 }).map((_, w) => (
                  <th key={w} className={`p-2 border-b border-slate-800 ${currentStep.w === w ? 'text-cyan-400 font-bold bg-slate-800' : 'text-slate-400'}`}>
                    W={w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dpTable.map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-slate-900">
                  <td className={`p-2 font-bold ${currentStep.i === rIdx ? 'text-cyan-400 bg-slate-800' : 'text-slate-400 bg-slate-900/60'}`}>
                    {rIdx === 0 ? 'No Items' : items[rIdx - 1].name}
                  </td>
                  {row.map((val, cIdx) => {
                    const isCurrentCell = currentStep.i === rIdx && currentStep.w === cIdx;
                    const isEvaluatedNonZero = val > 0;

                    return (
                      <td
                        key={cIdx}
                        className={`p-2.5 transition-all font-mono font-bold ${
                          isCurrentCell
                            ? 'bg-cyan-400 text-slate-950 ring-4 ring-cyan-300/80 scale-110 shadow-2xl z-10'
                            : isEvaluatedNonZero
                            ? 'text-emerald-300 bg-emerald-950/70 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                            : 'text-slate-600'
                        }`}
                      >
                        {val > 0 ? `$${val}` : '0'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={stepDP}
            disabled={currentStep.i > items.length}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-lg transition-all disabled:opacity-40"
          >
            <Sparkles className="w-4 h-4" />
            <span>Step 1 DP Cell</span>
          </button>

          <button
            onClick={resetDP}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            title="Reset DP Matrix"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const nextState = !isAudioMuted;
              setIsAudioMuted(nextState);
              audioEngine.setMuted(nextState);
            }}
            className={`p-2.5 rounded-xl transition-all ${
              isAudioMuted ? 'bg-slate-800 text-rose-400' : 'bg-indigo-950/60 text-cyan-400 border border-cyan-500/30'
            }`}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="p-6 bg-slate-950/95">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>Knapsack Dynamic Programming Code</span>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono">
            {(Object.keys(LANG_CONFIG) as SupportedLanguage[]).map(langKey => (
              <button
                key={langKey}
                onClick={() => setSelectedLang(langKey)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  selectedLang === langKey
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {LANG_CONFIG[langKey].label}
              </button>
            ))}
          </div>
        </div>

        <CodeBlock
          code={CODE_EXAMPLES[selectedLang]}
          language={selectedLang}
          filename={`knapsack_dp.${activeLangConfig.fileExt}`}
          langLabel={activeLangConfig.label}
        />
      </div>
    </div>
  );
};
