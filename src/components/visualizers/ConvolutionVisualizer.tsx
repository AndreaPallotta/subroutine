import React, { useState } from 'react';
import { RotateCcw, Volume2, VolumeX, Code2, Sparkles } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';
import { CodeBlock } from '../ui/CodeBlock';

export type SupportedLanguage = 'python' | 'cpp' | 'java' | 'go' | 'rust' | 'ts';

const KERNEL_PRESETS: Record<string, number[][]> = {
  edge: [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ],
  sharpen: [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0]
  ],
  blur: [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1]
  ]
};

const LANG_CONFIG: Record<SupportedLanguage, { label: string; fileExt: string }> = {
  python: { label: 'Python (PyTorch)', fileExt: 'py' },
  cpp: { label: 'C++', fileExt: 'cpp' },
  java: { label: 'Java', fileExt: 'java' },
  go: { label: 'Go', fileExt: 'go' },
  rust: { label: 'Rust', fileExt: 'rs' },
  ts: { label: 'TypeScript', fileExt: 'ts' },
};

const CODE_EXAMPLES: Record<SupportedLanguage, string> = {
  python: `# 2D Convolution in Python (PyTorch / NumPy)
import torch
import torch.nn as nn

# Define 2D Convolutional Layer
conv = nn.Conv2d(in_channels=1, out_channels=1, kernel_size=3, padding=0)

# Sobel Edge Filter Weights
sobel_kernel = torch.tensor([
    [[-1., -2., -1.],
      [ 0.,  0.,  0.],
      [ 1.,  2.,  1.]]
]).unsqueeze(0)

conv.weight = nn.Parameter(sobel_kernel)
# Forward pass: Input Image -> Output Feature Map
# output = conv(input_tensor)`,
  cpp: `// 2D Image Convolution in C++
#include <vector>

std::vector<std::vector<double>> convolve2D(
    const std::vector<std::vector<double>>& input,
    const std::vector<std::vector<double>>& kernel
) {
    int h = input.size(), w = input[0].size();
    int kh = kernel.size(), kw = kernel[0].size();
    std::vector<std::vector<double>> output(h - kh + 1, std::vector<double>(w - kw + 1, 0));

    for (int r = 0; r < h - kh + 1; ++r) {
        for (int c = 0; c < w - kw + 1; ++c) {
            double sum = 0;
            for (int kr = 0; kr < kh; ++kr) {
                for (int kc = 0; kc < kw; ++kc) {
                    sum += input[r + kr][c + kc] * kernel[kr][kc];
                }
            }
            output[r][c] = sum;
        }
    }
    return output;
}`,
  java: `// 2D Image Convolution in Java
public class Convolution2D {
    public static double[][] convolve(double[][] input, double[][] kernel) {
        int h = input.length, w = input[0].length;
        int kh = kernel.length, kw = kernel[0].length;
        double[][] output = new double[h - kh + 1][w - kw + 1];

        for (int r = 0; r <= h - kh; r++) {
            for (int c = 0; c <= w - kw; c++) {
                double sum = 0;
                for (int kr = 0; kr < kh; kr++) {
                    for (int kc = 0; kc < kw; kc++) {
                        sum += input[r + kr][c + kc] * kernel[kr][kc];
                    }
                }
                output[r][c] = sum;
            }
        }
        return output;
    }
}`,
  go: `// 2D Image Convolution in Go
package main

func Convolve2D(input, kernel [][]float64) [][]float64 {
	h, w := len(input), len(input[0])
	kh, kw := len(kernel), len(kernel[0])
	outH, outW := h-kh+1, w-kw+1

	output := make([][]float64, outH)
	for i := range output {
		output[i] = make([]float64, outW)
	}

	for r := 0; r < outH; r++ {
		for c := 0; c < outW; c++ {
			var sum float64
			for kr := 0; kr < kh; kr++ {
				for kc := 0; kc < kw; kc++ {
					sum += input[r+kr][c+kc] * kernel[kr][kc]
				}
			}
			output[r][c] = sum
		}
	}
	return output
}`,
  rust: `// 2D Image Convolution in Rust
fn convolve_2d(input: &[Vec<f64>], kernel: &[Vec<f64>]) -> Vec<Vec<f64>> {
    let (h, w) = (input.len(), input[0].len());
    let (kh, kw) = (kernel.len(), kernel[0].len());
    let (out_h, out_w) = (h - kh + 1, w - kw + 1);

    let mut output = vec![vec![0.0; out_w]; out_h];

    for r in 0..out_h {
        for c in 0..out_w {
            let mut sum = 0.0;
            for kr in 0..kh {
                for kc in 0..kw {
                    sum += input[r + kr][c + kc] * kernel[kr][kc];
                }
            }
            output[r][c] = sum;
        }
    }
    output
}`,
  ts: `// 2D Image Convolution in TypeScript
function convolve2D(input: number[][], kernel: number[][]): number[][] {
  const h = input.length, w = input[0].length;
  const kh = kernel.length, kw = kernel[0].length;
  const outH = h - kh + 1, outW = w - kw + 1;

  const output: number[][] = Array.from({ length: outH }, () => Array(outW).fill(0));

  for (let r = 0; r < outH; r++) {
    for (let c = 0; c < outW; c++) {
      let sum = 0;
      for (let kr = 0; kr < kh; kr++) {
        for (let kc = 0; kc < kw; kc++) {
          sum += input[r + kr][c + kc] * kernel[kr][kc];
        }
      }
      output[r][c] = sum;
    }
  }
  return output;
}`
};

export const ConvolutionVisualizer: React.FC = () => {
  const [selectedKernel, setSelectedKernel] = useState<string>('edge');
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('python');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [currStep, setCurrStep] = useState<{ r: number; c: number }>({ r: 0, c: 0 });

  // 6x6 Input Image Pixel Grid
  const inputImage: number[][] = [
    [10, 10, 10, 200, 200, 200],
    [10, 10, 10, 200, 200, 200],
    [10, 10, 10, 200, 200, 200],
    [10, 10, 10, 200, 200, 200],
    [10, 10, 10, 200, 200, 200],
    [10, 10, 10, 200, 200, 200],
  ];

  const kernel = KERNEL_PRESETS[selectedKernel];

  // 4x4 Output Feature Map
  const [featureMap, setFeatureMap] = useState<number[][]>(() =>
    Array.from({ length: 4 }, () => Array(4).fill(0))
  );

  const stepConvolution = () => {
    let { r, c } = currStep;
    c++;
    if (c >= 4) {
      c = 0;
      r++;
    }
    if (r >= 4) return;

    // Elementwise multiplication sum
    let sum = 0;
    for (let kr = 0; kr < 3; kr++) {
      for (let kc = 0; kc < 3; kc++) {
        sum += inputImage[r + kr][c + kc] * kernel[kr][kc];
      }
    }

    setFeatureMap(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = Math.round(sum / (selectedKernel === 'blur' ? 9 : 1));
      return next;
    });

    setCurrStep({ r, c });
    audioEngine.playValueTone(400 + Math.abs(sum) * 0.5, 10, 100, 0.08);
  };

  const resetConvolution = () => {
    setCurrStep({ r: 0, c: 0 });
    setFeatureMap(Array.from({ length: 4 }, () => Array(4).fill(0)));
  };

  const activeLangConfig = LANG_CONFIG[selectedLang];

  return (
    <div className="my-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
      <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>CNN 2D Convolution & Feature Maps</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-pink-950 text-pink-300 border border-pink-500/30">
              Computer Vision Filter
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Slide a <code className="text-pink-300">3x3 Filter Kernel</code> across the input image pixel grid to build the output feature map.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => { setSelectedKernel('edge'); resetConvolution(); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedKernel === 'edge' ? 'bg-pink-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sobel Edge Detect
          </button>
          <button
            onClick={() => { setSelectedKernel('sharpen'); resetConvolution(); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedKernel === 'sharpen' ? 'bg-pink-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sharpen Kernel
          </button>
        </div>
      </div>

      <div className="p-6 bg-slate-950/90 border-b border-slate-800 flex flex-col md:flex-row items-center justify-center gap-8 font-mono text-xs">
        {/* Input 6x6 Grid */}
        <div>
          <div className="text-[11px] font-bold text-slate-300 mb-2">Input Image (6x6 Pixels)</div>
          <div className="grid grid-cols-6 gap-1 p-2 bg-slate-900 rounded-xl border border-slate-800">
            {inputImage.map((row, r) => row.map((val, c) => {
              const inKernelWindow = r >= currStep.r && r < currStep.r + 3 && c >= currStep.c && c < currStep.c + 3;
              return (
                <div
                  key={`${r}-${c}`}
                  className={`w-8 h-8 rounded text-[9px] flex items-center justify-center font-bold border ${
                    inKernelWindow ? 'bg-pink-950/80 border-pink-500 text-pink-300 scale-105' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {val}
                </div>
              );
            }))}
          </div>
        </div>

        {/* Kernel 3x3 Grid */}
        <div>
          <div className="text-[11px] font-bold text-pink-400 mb-2">3x3 Kernel Matrix</div>
          <div className="grid grid-cols-3 gap-1 p-2 bg-pink-950/30 rounded-xl border border-pink-500/30">
            {kernel.map((row, r) => row.map((val, c) => (
              <div key={`${r}-${c}`} className="w-8 h-8 rounded bg-slate-950 border border-slate-800 text-pink-300 flex items-center justify-center font-bold text-[10px]">
                {val}
              </div>
            )))}
          </div>
        </div>

        {/* Output 4x4 Feature Map */}
        <div>
          <div className="text-[11px] font-bold text-cyan-400 mb-2">Feature Map (4x4 Output)</div>
          <div className="grid grid-cols-4 gap-1 p-2 bg-cyan-950/20 rounded-xl border border-cyan-500/30">
            {featureMap.map((row, r) => row.map((val, c) => {
              const isCurrentOutput = currStep.r === r && currStep.c === c;
              return (
                <div
                  key={`${r}-${c}`}
                  className={`w-8 h-8 rounded text-[9px] flex items-center justify-center font-bold border ${
                    isCurrentOutput ? 'bg-cyan-500 text-slate-950 border-cyan-300 scale-105' : 'bg-slate-950 border-slate-800 text-cyan-300'
                  }`}
                >
                  {val}
                </div>
              );
            }))}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-center items-center gap-3">
        <button
          onClick={stepConvolution}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-xs bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-400 hover:to-indigo-400 text-white shadow-lg shadow-pink-500/30 border border-pink-300/40 hover:scale-105 active:scale-95 transition-all"
        >
          <Sparkles className="w-4 h-4 text-pink-200 fill-pink-300/40 animate-pulse" />
          <span>Slide 3x3 Kernel 1 Step</span>
        </button>

        <button
          onClick={resetConvolution}
          className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
          title="Reset Feature Map"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            const nextState = !isAudioMuted;
            setIsAudioMuted(nextState);
            audioEngine.setMuted(nextState);
          }}
          className={`p-3 rounded-xl transition-all border ${
            isAudioMuted ? 'bg-slate-800 text-rose-400 border-rose-500/30' : 'bg-indigo-950/60 text-cyan-400 border-cyan-500/30'
          }`}
        >
          {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      <div className="p-6 bg-slate-950/95">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>Convolution Feature Map Code</span>
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
          filename={`convolution2d.${activeLangConfig.fileExt}`}
          langLabel={activeLangConfig.label}
        />
      </div>
    </div>
  );
};
