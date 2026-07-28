import React, { useState, useEffect, useRef } from 'react';
import { Play, Volume2, VolumeX, Code2, RefreshCw } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';
import { CodeBlock } from '../ui/CodeBlock';

export type SupportedLanguage = 'cpp' | 'python' | 'java' | 'go' | 'rust' | 'ts';

interface Point {
  x: number; // Normalized -1 to 1
  y: number; // Normalized -1 to 1
  label: 1 | -1; // 1: Class A (Cyan), -1: Class B (Pink)
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
  cpp: `// Single-Layer Perceptron in C++
#include <vector>

class Perceptron {
private:
    std::vector<double> weights;
    double bias;
    double lr;

public:
    Perceptron(int num_inputs, double learning_rate = 0.1) 
        : weights(num_inputs, 0.0), bias(0.0), lr(learning_rate) {}

    int predict(const std::vector<double>& inputs) const {
        double sum = bias;
        for (size_t i = 0; i < inputs.size(); ++i) {
            sum += inputs[i] * weights[i];
        }
        return (sum >= 0.0) ? 1 : -1;
    }

    void train(const std::vector<double>& inputs, int target) {
        int prediction = predict(inputs);
        int error = target - prediction;
        if (error != 0) {
            for (size_t i = 0; i < weights.size(); ++i) {
                weights[i] += lr * error * inputs[i];
            }
            bias += lr * error;
        }
    }
};`,
  python: `import numpy as np

class Perceptron:
    def __init__(self, num_inputs, learning_rate=0.1):
        self.weights = np.zeros(num_inputs)
        self.bias = 0.0
        self.lr = learning_rate

    def predict(self, inputs):
        summation = np.dot(inputs, self.weights) + self.bias
        return 1 if summation >= 0 else -1

    def train(self, inputs, target):
        prediction = self.predict(inputs)
        error = target - prediction
        if error != 0:
            self.weights += self.lr * error * inputs
            self.bias += self.lr * error`,
  java: `public class Perceptron {
    private double[] weights;
    private double bias;
    private double lr;

    public Perceptron(int numInputs, double learningRate) {
        this.weights = new double[numInputs];
        this.bias = 0.0;
        this.lr = learningRate;
    }

    public int predict(double[] inputs) {
        double sum = bias;
        for (int i = 0; i < inputs.length; i++) {
            sum += inputs[i] * weights[i];
        }
        return (sum >= 0.0) ? 1 : -1;
    }

    public void train(double[] inputs, int target) {
        int prediction = predict(inputs);
        int error = target - prediction;
        if (error != 0) {
            for (int i = 0; i < weights.length; i++) {
                weights[i] += lr * error * inputs[i];
            }
            bias += lr * error;
        }
    }
}`,
  go: `package main

type Perceptron struct {
	weights []float64
	bias    float64
	lr      float64
}

func NewPerceptron(numInputs int, lr float64) *Perceptron {
	return &Perceptron{
		weights: make([]float64, numInputs),
		bias:    0.0,
		lr:      lr,
	}
}

func (p *Perceptron) Predict(inputs []float64) int {
	sum := p.bias
	for i, val := range inputs {
		sum += val * p.weights[i]
	}
	if sum >= 0 { return 1 }
	return -1
}

func (p *Perceptron) Train(inputs []float64, target int) {
	prediction := p.Predict(inputs)
	err := target - prediction
	if err != 0 {
		for i := range p.weights {
			p.weights[i] += p.lr * float64(err) * inputs[i]
		}
		p.bias += p.lr * float64(err)
	}
}`,
  rust: `struct Perceptron {
    weights: Vec<f64>,
    bias: f64,
    lr: f64,
}

impl Perceptron {
    fn new(num_inputs: usize, lr: f64) -> Self {
        Self { weights: vec![0.0; num_inputs], bias: 0.0, lr }
    }

    fn predict(&self, inputs: &[f64]) -> i32 {
        let sum: f64 = self.bias + inputs.iter().zip(&self.weights).map(|(x, w)| x * w).sum::<f64>();
        if sum >= 0.0 { 1 } else { -1 }
    }

    fn train(&mut self, inputs: &[f64], target: i32) {
        let prediction = self.predict(inputs);
        let error = target - prediction;
        if error != 0 {
            for (w, &x) in self.weights.iter_mut().zip(inputs) {
                *w += self.lr * (error as f64) * x;
            }
            self.bias += self.lr * (error as f64);
        }
    }
}`,
  ts: `class Perceptron {
  private weights: number[];
  private bias: number = 0;
  private lr: number;

  constructor(numInputs: number, learningRate = 0.1) {
    this.weights = new Array(numInputs).fill(0);
    this.lr = learningRate;
  }

  predict(inputs: number[]): number {
    const sum = this.bias + inputs.reduce((acc, x, i) => acc + x * this.weights[i], 0);
    return sum >= 0 ? 1 : -1;
  }

  train(inputs: number[], target: number): void {
    const prediction = this.predict(inputs);
    const error = target - prediction;
    if (error !== 0) {
      this.weights = this.weights.map((w, i) => w + this.lr * error * inputs[i]);
      this.bias += this.lr * error;
    }
  }
}`
};

export const PerceptronVisualizer: React.FC = () => {
  const [w1, setW1] = useState<number>(0.6);
  const [w2, setW2] = useState<number>(-0.8);
  const [bias, setBias] = useState<number>(0.1);
  const [learningRate, setLearningRate] = useState<number>(0.05);
  const [epoch, setEpoch] = useState<number>(0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('python');
  const [activeLabel, setActiveLabel] = useState<1 | -1>(1);

  // Initial training points
  const [points, setPoints] = useState<Point[]>([
    { x: -0.6, y: -0.5, label: 1 },
    { x: -0.4, y: -0.2, label: 1 },
    { x: -0.7, y: -0.1, label: 1 },
    { x: -0.2, y: -0.6, label: 1 },
    { x: 0.5, y: 0.6, label: -1 },
    { x: 0.7, y: 0.3, label: -1 },
    { x: 0.3, y: 0.8, label: -1 },
    { x: 0.6, y: 0.2, label: -1 },
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calculate prediction for point (x, y)
  const predict = (x: number, y: number, currentW1 = w1, currentW2 = w2, currentBias = bias): 1 | -1 => {
    return (currentW1 * x + currentW2 * y + currentBias >= 0) ? 1 : -1;
  };

  // Train 1 Epoch
  const trainEpoch = () => {
    let curW1 = w1;
    let curW2 = w2;
    let curBias = bias;
    let errors = 0;

    points.forEach(pt => {
      const pred = (curW1 * pt.x + curW2 * pt.y + curBias >= 0) ? 1 : -1;
      const err = pt.label - pred;
      if (err !== 0) {
        errors++;
        curW1 += learningRate * err * pt.x;
        curW2 += learningRate * err * pt.y;
        curBias += learningRate * err;
      }
    });

    setW1(curW1);
    setW2(curW2);
    setBias(curBias);
    setEpoch(prev => prev + 1);

    if (errors === 0) {
      audioEngine.playCompletionTone();
    } else {
      audioEngine.playValueTone(60 + (10 - errors) * 5, 20, 100, 0.08);
    }
  };

  // Calculate accuracy
  const correctCount = points.filter(pt => predict(pt.x, pt.y) === pt.label).length;
  const accuracy = points.length > 0 ? Math.round((correctCount / points.length) * 100) : 100;

  // Draw 2D Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const scale = width / 2.2;

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(width, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, height); ctx.stroke();

    // Draw Decision Regions (Shading)
    const imgData = ctx.createImageData(width, height);
    for (let py = 0; py < height; py += 4) {
      const yVal = -(py - cy) / scale;
      for (let px = 0; px < width; px += 4) {
        const xVal = (px - cx) / scale;
        const pred = (w1 * xVal + w2 * yVal + bias >= 0) ? 1 : -1;
        const color = pred === 1 ? [6, 182, 212, 25] : [236, 72, 153, 25]; // Cyan vs Pink
        for (let dy = 0; dy < 4; dy++) {
          for (let dx = 0; dx < 4; dx++) {
            const idx = ((py + dy) * width + (px + dx)) * 4;
            imgData.data[idx] = color[0];
            imgData.data[idx + 1] = color[1];
            imgData.data[idx + 2] = color[2];
            imgData.data[idx + 3] = color[3];
          }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Draw Decision Line: w1*x + w2*y + b = 0  => y = (-w1*x - b) / w2
    if (Math.abs(w2) > 0.001) {
      const xLeft = -1.2;
      const yLeft = (-w1 * xLeft - bias) / w2;
      const xRight = 1.2;
      const yRight = (-w1 * xRight - bias) / w2;

      const px1 = cx + xLeft * scale;
      const py1 = cy - yLeft * scale;
      const px2 = cx + xRight * scale;
      const py2 = cy - yRight * scale;

      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(px1, py1);
      ctx.lineTo(px2, py2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw Data Points
    points.forEach(pt => {
      const px = cx + pt.x * scale;
      const py = cy - pt.y * scale;
      const isCorrect = predict(pt.x, pt.y) === pt.label;

      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fillStyle = pt.label === 1 ? '#06b6d4' : '#ec4899';
      ctx.fill();

      ctx.lineWidth = 2;
      ctx.strokeStyle = isCorrect ? '#ffffff' : '#f43f5e';
      ctx.stroke();
    });
  }, [w1, w2, bias, points]);

  // Canvas click to add new data point
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const width = canvas.width;
    const cx = width / 2;
    const cy = canvas.height / 2;
    const scale = width / 2.2;

    const xVal = (px - cx) / scale;
    const yVal = -(py - cy) / scale;

    setPoints(prev => [...prev, { x: xVal, y: yVal, label: activeLabel }]);
  };

  const activeLangConfig = LANG_CONFIG[selectedLang];

  return (
    <div className="my-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Top Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Single-Layer Perceptron</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Binary Classification
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Click on the 2D plane to add training points. Train the decision boundary <code className="text-indigo-300">w₁x₁ + w₂x₂ + b = 0</code> in real-time.
          </p>
        </div>

        {/* Real-Time Metrics */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500">Epoch: </span>
            <span className="text-indigo-400 font-bold">{epoch}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500">Accuracy: </span>
            <span className={accuracy === 100 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {accuracy}%
            </span>
          </div>
        </div>
      </div>

      {/* Main 2D Canvas Interactive Plane */}
      <div className="relative p-6 bg-slate-950/90 flex flex-col md:flex-row items-center justify-center gap-6 border-b border-slate-800">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={380}
            height={320}
            onClick={handleCanvasClick}
            className="rounded-xl border border-slate-800 cursor-crosshair shadow-inner bg-slate-950"
          />
          <div className="absolute bottom-3 left-3 text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
            Click plane to add point ({activeLabel === 1 ? 'Cyan Class' : 'Pink Class'})
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex-1 max-w-md w-full space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <span className="text-slate-400 font-mono">Add Point Type:</span>
            <button
              onClick={() => setActiveLabel(1)}
              className={`px-3 py-1 rounded-lg font-mono font-bold transition-all ${
                activeLabel === 1 ? 'bg-cyan-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-400'
              }`}
            >
              + Class A (Cyan)
            </button>
            <button
              onClick={() => setActiveLabel(-1)}
              className={`px-3 py-1 rounded-lg font-mono font-bold transition-all ${
                activeLabel === -1 ? 'bg-pink-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-400'
              }`}
            >
             - Class B (Pink)
            </button>
          </div>

          {/* Sliders */}
          <div className="space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Weight w₁:</span>
              <input
                type="range"
                min={-2} max={2} step={0.05}
                value={w1}
                onChange={(e) => setW1(Number(e.target.value))}
                className="w-36 accent-indigo-500 cursor-pointer"
              />
              <span className="text-indigo-400 w-12 text-right">{w1.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Weight w₂:</span>
              <input
                type="range"
                min={-2} max={2} step={0.05}
                value={w2}
                onChange={(e) => setW2(Number(e.target.value))}
                className="w-36 accent-cyan-500 cursor-pointer"
              />
              <span className="text-cyan-400 w-12 text-right">{w2.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Bias b:</span>
              <input
                type="range"
                min={-2} max={2} step={0.05}
                value={bias}
                onChange={(e) => setBias(Number(e.target.value))}
                className="w-36 accent-amber-500 cursor-pointer"
              />
              <span className="text-amber-400 w-12 text-right">{bias.toFixed(2)}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={trainEpoch}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-lg shadow-indigo-500/25 transition-all"
            >
              <Play className="w-4 h-4" />
              <span>Train 1 Epoch</span>
            </button>

            <button
              onClick={() => {
                setW1(0.6); setW2(-0.8); setBias(0.1); setEpoch(0);
                setPoints([
                  { x: -0.6, y: -0.5, label: 1 }, { x: -0.4, y: -0.2, label: 1 },
                  { x: 0.5, y: 0.6, label: -1 }, { x: 0.7, y: 0.3, label: -1 }
                ]);
              }}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              title="Reset Points"
            >
              <RefreshCw className="w-4 h-4" />
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
      </div>

      {/* Code Inspector */}
      <div className="p-6 bg-slate-950/95">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>Perceptron Implementation Code</span>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono">
            {(Object.keys(LANG_CONFIG) as SupportedLanguage[]).map((langKey) => (
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
          filename={`perceptron.${activeLangConfig.fileExt}`}
          langLabel={activeLangConfig.label}
        />
      </div>
    </div>
  );
};
