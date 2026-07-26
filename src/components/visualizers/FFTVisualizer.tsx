import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RotateCcw, Volume2, VolumeX, Code2 } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';
import { CodeBlock } from '../ui/CodeBlock';

export type SupportedLanguage = 'python' | 'cpp' | 'java' | 'go' | 'rust' | 'ts';

const LANG_CONFIG: Record<SupportedLanguage, { label: string; fileExt: string }> = {
  python: { label: 'Python (SciPy / NumPy)', fileExt: 'py' },
  cpp: { label: 'C++ (Cooley-Tukey)', fileExt: 'cpp' },
  java: { label: 'Java (Radix-2 FFT)', fileExt: 'java' },
  go: { label: 'Go (Cooley-Tukey)', fileExt: 'go' },
  rust: { label: 'Rust (rustfft)', fileExt: 'rs' },
  ts: { label: 'TypeScript (Cooley-Tukey)', fileExt: 'ts' },
};

const CODE_EXAMPLES: Record<SupportedLanguage, string> = {
  python: `# Fast Fourier Transform (FFT) in Python using NumPy & SciPy
import numpy as np
from scipy.fft import fft, fftfreq

# 1. Generate Composite Signal (440 Hz + 880 Hz Sine Waves)
sampling_rate = 8000 # 8 kHz
t = np.linspace(0, 1.0, sampling_rate, endpoint=False)
signal = np.sin(2 * np.pi * 440 * t) + 0.5 * np.sin(2 * np.pi * 880 * t)

# 2. Compute Fast Fourier Transform (Cooley-Tukey O(N log N))
fft_spectrum = fft(signal)
frequencies = fftfreq(len(signal), 1.0 / sampling_rate)

# 3. Extract Magnitude Spectrum Peaks
magnitudes = np.abs(fft_spectrum)[:len(signal)//2]`,
  cpp: `// 1D Cooley-Tukey Fast Fourier Transform (FFT) in C++
#include <complex>
#include <vector>
#include <cmath>
#include <iostream>

using Complex = std::complex<double>;
const double PI = std::acos(-1.0);

void fft(std::vector<Complex>& a) {
    int n = a.size();
    if (n <= 1) return;

    // Divide into even and odd index sub-vectors
    std::vector<Complex> even(n / 2), odd(n / 2);
    for (int i = 0; i < n / 2; ++i) {
        even[i] = a[2 * i];
        odd[i] = a[2 * i + 1];
    }

    // Conquer: Recursive FFT calls
    fft(even);
    fft(odd);

    // Combine: Twiddle Factor Multiplication
    for (int i = 0; i < n / 2; ++i) {
        Complex twiddle = std::polar(1.0, -2 * PI * i / n) * odd[i];
        a[i] = even[i] + twiddle;
        a[i + n / 2] = even[i] - twiddle;
    }
}`,
  java: `// 1D Cooley-Tukey Fast Fourier Transform (FFT) in Java
public class FastFourierTransform {
    public static class Complex {
        public final double re, im;
        public Complex(double re, double im) { this.re = re; this.im = im; }
        public Complex add(Complex b) { return new Complex(this.re + b.re, this.im + b.im); }
        public Complex sub(Complex b) { return new Complex(this.re - b.re, this.im - b.im); }
        public Complex mul(Complex b) {
            return new Complex(this.re * b.re - this.im * b.im, this.re * b.im + this.im * b.re);
        }
    }

    public static Complex[] fft(Complex[] x) {
        int n = x.length;
        if (n <= 1) return x;

        Complex[] even = new Complex[n / 2];
        Complex[] odd = new Complex[n / 2];
        for (int k = 0; k < n / 2; k++) {
            even[k] = x[2 * k];
            odd[k] = x[2 * k + 1];
        }

        Complex[] q = fft(even);
        Complex[] r = fft(odd);

        Complex[] y = new Complex[n];
        for (int k = 0; k < n / 2; k++) {
            double kth = -2 * k * Math.PI / n;
            Complex wk = new Complex(Math.cos(kth), Math.sin(kth));
            y[k] = q[k].add(wk.mul(r[k]));
            y[k + n / 2] = q[k].sub(wk.mul(r[k]));
        }
        return y;
    }
}`,
  go: `// Cooley-Tukey Radix-2 Fast Fourier Transform in Go
package main

import (
	"fmt"
	"math"
	"math/cmplx"
)

func FFT(a []complex128) []complex128 {
	n := len(a)
	if n <= 1 {
		return a
	}

	even := make([]complex128, n/2)
	odd := make([]complex128, n/2)
	for i := 0; i < n/2; i++ {
		even[i] = a[2*i]
		odd[i] = a[2*i+1]
	}

	resEven := FFT(even)
	resOdd := FFT(odd)

	y := make([]complex128, n)
	for k := 0; k < n/2; k++ {
		angle := -2 * math.Pi * float64(k) / float64(n)
		twiddle := cmplx.Rect(1, angle) * resOdd[k]
		y[k] = resEven[k] + twiddle
		y[k+n/2] = resEven[k] - twiddle
	}
	return y
}`,
  rust: `// Fast Fourier Transform using rustfft crate
use rustfft::{FftPlanner, num_complex::Complex};

fn compute_fft(signal: &mut [Complex<f32>]) {
    // Initialize FFT planner (O(N log N) strategy selector)
    let mut planner = FftPlanner::new();
    let fft = planner.plan_fft_forward(signal.len());

    // Process forward 1D FFT transform in-place
    fft.process(signal);
}`,
  ts: `// 1D Cooley-Tukey Radix-2 Fast Fourier Transform in TypeScript
export interface ComplexNumber {
  re: number;
  im: number;
}

export function fft(signal: ComplexNumber[]): ComplexNumber[] {
  const n = signal.length;
  if (n <= 1) return signal;

  const even: ComplexNumber[] = [];
  const odd: ComplexNumber[] = [];
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) even.push(signal[i]);
    else odd.push(signal[i]);
  }

  const resEven = fft(even);
  const resOdd = fft(odd);

  const result: ComplexNumber[] = new Array(n);
  for (let k = 0; k < n / 2; k++) {
    const angle = (-2 * Math.PI * k) / n;
    const twiddleRe = Math.cos(angle);
    const twiddleIm = Math.sin(angle);

    const oddRe = resOdd[k].re * twiddleRe - resOdd[k].im * twiddleIm;
    const oddIm = resOdd[k].re * twiddleIm + resOdd[k].im * twiddleRe;

    result[k] = { re: resEven[k].re + oddRe, im: resEven[k].im + oddIm };
    result[k + n / 2] = { re: resEven[k].re - oddRe, im: resEven[k].im - oddIm };
  }

  return result;
}`
};

export const FFTVisualizer: React.FC = () => {
  const [freq1, setFreq1] = useState<number>(440); // 440 Hz A4
  const [freq2, setFreq2] = useState<number>(880); // 880 Hz A5
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('python');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timePhaseRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Play/Stop Dual Frequency Web Audio Synthesizer (SUPER SOFT & GENTLE VOLUME!)
  const toggleAudioSynth = () => {
    if (isPlaying) {
      stopSynth();
    } else {
      startSynth();
    }
  };

  const startSynth = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const gain = ctx.createGain();
      // SUPER SOFT VOLUME: 0.015
      gain.gain.setValueAtTime(isAudioMuted ? 0 : 0.015, ctx.currentTime);
      gain.connect(ctx.destination);
      gainRef.current = gain;

      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq1, ctx.currentTime);
      osc1.connect(gain);
      osc1.start();
      osc1Ref.current = osc1;

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq2, ctx.currentTime);
      osc2.connect(gain);
      osc2.start();
      osc2Ref.current = osc2;

      setIsPlaying(true);
    } catch {
      // Fallback
    }
  };

  const stopSynth = () => {
    if (osc1Ref.current) { osc1Ref.current.stop(); osc1Ref.current.disconnect(); osc1Ref.current = null; }
    if (osc2Ref.current) { osc2Ref.current.stop(); osc2Ref.current.disconnect(); osc2Ref.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
    setIsPlaying(false);
  };

  // Update frequencies dynamically while synth is playing
  useEffect(() => {
    if (osc1Ref.current && audioCtxRef.current) {
      osc1Ref.current.frequency.setValueAtTime(freq1, audioCtxRef.current.currentTime);
    }
    if (osc2Ref.current && audioCtxRef.current) {
      osc2Ref.current.frequency.setValueAtTime(freq2, audioCtxRef.current.currentTime);
    }
  }, [freq1, freq2]);

  // Handle Mute Toggle
  const toggleMute = () => {
    const nextState = !isAudioMuted;
    setIsAudioMuted(nextState);
    if (gainRef.current && audioCtxRef.current) {
      gainRef.current.gain.setValueAtTime(nextState ? 0 : 0.015, audioCtxRef.current.currentTime);
    }
  };

  // Clean up audio context on unmount
  useEffect(() => {
    return () => { stopSynth(); };
  }, []);

  // Continuous traveling wave animation loop (requestAnimationFrame)
  useEffect(() => {
    let animId: number;

    const render = () => {
      timePhaseRef.current += isPlaying ? 0.08 : 0.02;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;

          ctx.fillStyle = '#080c16';
          ctx.fillRect(0, 0, width, height);

          // 1. Time-Domain Signal (Traveling Wave)
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
          ctx.shadowBlur = 8;

          ctx.beginPath();
          for (let x = 0; x < width; x++) {
            const t = (x / width) * 4 + timePhaseRef.current;
            const y = Math.sin(2 * Math.PI * (freq1 / 200) * t) + 0.5 * Math.sin(2 * Math.PI * (freq2 / 200) * t);
            const py = height / 4 - y * 30;
            if (x === 0) ctx.moveTo(x, py);
            else ctx.lineTo(x, py);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Section Divider & Label
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.beginPath(); ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2); ctx.stroke();

          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 9px Fira Code';
          ctx.fillText('TIME-DOMAIN SIGNAL (Fluctuating Traveling Composite Wave)', 12, 20);
          ctx.fillText('FREQUENCY-DOMAIN FFT SPECTRUM (Isolated Stable Frequency Peaks)', 12, height / 2 + 20);

          // 2. Frequency-Domain FFT Spectrum Peaks
          const peak1X = (freq1 / 1200) * width;
          const peak2X = (freq2 / 1200) * width;

          // Peak 1 (Freq 1)
          ctx.fillStyle = '#ec4899';
          ctx.shadowColor = '#ec4899';
          ctx.shadowBlur = 10;
          ctx.fillRect(peak1X - 6, height - 20 - 90, 12, 90);

          // Peak 2 (Freq 2)
          ctx.fillStyle = '#c084fc';
          ctx.shadowColor = '#c084fc';
          ctx.fillRect(peak2X - 6, height - 20 - 55, 12, 55);
          ctx.shadowBlur = 0;

          // Frequency Labels
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px Fira Code';
          ctx.fillText(`${freq1} Hz`, peak1X - 16, height - 118);
          ctx.fillText(`${freq2} Hz`, peak2X - 16, height - 83);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [freq1, freq2, isPlaying]);

  const activeLangConfig = LANG_CONFIG[selectedLang];

  return (
    <div className="my-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
      <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Fast Fourier Transform (FFT) Spectrum</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-purple-950 text-purple-300 border border-purple-500/30">
              Signal Processing
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Decompose composite time-domain wave signals into their exact frequency spectrum components!
          </p>
        </div>

        {/* Preset Harmonics */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => { setFreq1(440); setFreq2(880); }}
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all"
          >
            A4 Harmonic (440Hz + 880Hz)
          </button>
          <button
            onClick={() => { setFreq1(523); setFreq2(659); }}
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all"
          >
            C5 Major Chord (523Hz + 659Hz)
          </button>
        </div>
      </div>

      <div className="p-6 bg-slate-950/90 flex flex-col md:flex-row items-center justify-center gap-8 border-b border-slate-800">
        <canvas ref={canvasRef} width={420} height={280} className="rounded-xl bg-slate-950 border border-slate-800 shadow-inner" />

        <div className="flex-1 max-w-md space-y-4 font-mono text-xs">
          {/* Sliders */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div>
              <div className="flex justify-between text-slate-300 font-bold mb-1">
                <span>Sine Wave 1 Frequency:</span>
                <span className="text-cyan-400 font-bold text-sm">{freq1} Hz</span>
              </div>
              <input
                type="range" min="200" max="600" step="5"
                value={freq1} onChange={e => setFreq1(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-bold mb-1">
                <span>Sine Wave 2 Frequency:</span>
                <span className="text-pink-400 font-bold text-sm">{freq2} Hz</span>
              </div>
              <input
                type="range" min="600" max="1100" step="5"
                value={freq2} onChange={e => setFreq2(Number(e.target.value))}
                className="w-full accent-pink-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={toggleAudioSynth}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-extrabold text-xs shadow-lg border transition-all ${
                isPlaying
                  ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-rose-500/30'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-purple-400 shadow-purple-500/30'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-4 h-4 text-white fill-current" />
                  <span>Stop Audio & Wave Animation</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-white fill-current" />
                  <span>Play Audio & Wave Animation</span>
                </>
              )}
            </button>

            <button
              onClick={() => { setFreq1(440); setFreq2(880); }}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
              title="Reset Frequencies"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={toggleMute}
              className={`p-3 rounded-xl transition-all border ${
                isAudioMuted ? 'bg-slate-800 text-rose-400 border-rose-500/30' : 'bg-indigo-950/60 text-cyan-400 border-cyan-500/30'
              }`}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-950/95">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>Fast Fourier Transform Implementation Code</span>
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
          filename={`fft_analysis.${activeLangConfig.fileExt}`}
          langLabel={activeLangConfig.label}
        />
      </div>
    </div>
  );
};
