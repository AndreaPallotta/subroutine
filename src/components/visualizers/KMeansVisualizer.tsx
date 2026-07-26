import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Code2 } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';
import { CodeBlock } from '../ui/CodeBlock';

export type SupportedLanguage = 'python' | 'cpp' | 'java' | 'go' | 'rust' | 'ts';

interface Point {
  x: number;
  y: number;
  cluster: number;
}

interface Centroid {
  x: number;
  y: number;
  color: string;
}

const CLUSTER_COLORS = ['#ec4899', '#38bdf8', '#a855f7'];

const LANG_CONFIG: Record<SupportedLanguage, { label: string; fileExt: string }> = {
  python: { label: 'Python (NumPy)', fileExt: 'py' },
  cpp: { label: 'C++', fileExt: 'cpp' },
  java: { label: 'Java', fileExt: 'java' },
  go: { label: 'Go', fileExt: 'go' },
  rust: { label: 'Rust', fileExt: 'rs' },
  ts: { label: 'TypeScript', fileExt: 'ts' },
};

const CODE_EXAMPLES: Record<SupportedLanguage, string> = {
  python: `# K-Means Clustering in Python using NumPy
import numpy as np

def k_means(X, k, max_iters=100):
    # 1. Randomly initialize k centroids
    centroids = X[np.random.choice(X.shape[0], k, replace=False)]
    
    for _ in range(max_iters):
        # Step 1: Assign points to nearest centroid (E-Step)
        distances = np.linalg.norm(X[:, np.newaxis] - centroids, axis=2)
        labels = np.argmin(distances, axis=1)
        
        # Step 2: Update centroids to mean of assigned points (M-Step)
        new_centroids = np.array([X[labels == i].mean(axis=0) for i in range(k)])
        
        if np.all(centroids == new_centroids):
            break
        centroids = new_centroids
        
    return centroids, labels`,
  cpp: `// K-Means Clustering in C++
#include <vector>
#include <cmath>

struct Point { double x, y; int cluster = -1; };

double distance(Point a, Point b) {
    return std::hypot(a.x - b.x, a.y - b.y);
}

void kMeans(std::vector<Point>& points, int k, int maxIters = 100) {
    std::vector<Point> centroids(k);
    
    for (int iter = 0; iter < maxIters; ++iter) {
        // Step 1: Assign points to nearest centroid (E-step)
        for (auto& p : points) {
            double minDist = 1e9;
            for (int i = 0; i < k; ++i) {
                double d = distance(p, centroids[i]);
                if (d < minDist) { minDist = d; p.cluster = i; }
            }
        }
        
        // Step 2: Update centroids to mean of assigned cluster (M-step)
        std::vector<double> sumX(k, 0), sumY(k, 0), count(k, 0);
        for (const auto& p : points) {
            if (p.cluster != -1) {
                sumX[p.cluster] += p.x;
                sumY[p.cluster] += p.y;
                count[p.cluster]++;
            }
        }
        for (int i = 0; i < k; ++i) {
            if (count[i] > 0) {
                centroids[i].x = sumX[i] / count[i];
                centroids[i].y = sumY[i] / count[i];
            }
        }
    }
}`,
  java: `// K-Means Clustering in Java
import java.util.*;

public class KMeansClustering {
    public static class Point {
        public double x, y;
        public int cluster = -1;
        public Point(double x, double y) { this.x = x; this.y = y; }
    }

    public static void fit(List<Point> points, int k) {
        List<Point> centroids = new ArrayList<>();
        for (int i = 0; i < k; i++) centroids.add(points.get(i));

        for (int iter = 0; iter < 100; iter++) {
            // E-Step: Assign nearest centroid
            for (Point p : points) {
                double minDist = Double.MAX_VALUE;
                for (int i = 0; i < k; i++) {
                    double d = Math.hypot(p.x - centroids.get(i).x, p.y - centroids.get(i).y);
                    if (d < minDist) { minDist = d; p.cluster = i; }
                }
            }

            // M-Step: Recompute centroids
            double[] sumX = new double[k], sumY = new double[k], count = new double[k];
            for (Point p : points) {
                sumX[p.cluster] += p.x; sumY[p.cluster] += p.y; count[p.cluster]++;
            }
            for (int i = 0; i < k; i++) {
                if (count[i] > 0) centroids.set(i, new Point(sumX[i] / count[i], sumY[i] / count[i]));
            }
        }
    }
}`,
  go: `// K-Means Clustering in Go
package main

import "math"

type Point struct {
	X, Y    float64
	Cluster int
}

func distance(a, b Point) float64 {
	return math.Hypot(a.X-b.X, a.Y-b.Y)
}

func KMeans(points []Point, k int) []Point {
	centroids := make([]Point, k)
	copy(centroids, points[:k])

	for iter := 0; iter < 100; iter++ {
		// Step 1: E-step assignment
		for i := range points {
			minDist := math.MaxFloat64
			for cIdx, c := range centroids {
				d := distance(points[i], c)
				if d < minDist {
					minDist = d
					points[i].Cluster = cIdx
				}
			}
		}

		// Step 2: M-step centroid update
		sumX, sumY, count := make([]float64, k), make([]float64, k), make([]float64, k)
		for _, p := range points {
			sumX[p.Cluster] += p.X
			sumY[p.Cluster] += p.Y
			count[p.Cluster]++
		}
		for i := 0; i < k; i++ {
			if count[i] > 0 {
				centroids[i] = Point{X: sumX[i] / count[i], Y: sumY[i] / count[i]}
			}
		}
	}
	return centroids
}`,
  rust: `// K-Means Clustering in Rust
#[derive(Clone, Copy)]
pub struct Point {
    pub x: f64, pub y: f64,
    pub cluster: usize,
}

pub fn k_means(points: &mut [Point], k: usize) {
    let mut centroids = points[..k].to_vec();

    for _ in 0..100 {
        // E-Step: Assign points
        for p in points.iter_mut() {
            let mut min_dist = f64::MAX;
            for (c_idx, c) in centroids.iter().enumerate() {
                let d = (p.x - c.x).hypot(p.y - c.y);
                if d < min_dist { min_dist = d; p.cluster = c_idx; }
            }
        }

        // M-Step: Update centroids
        let mut sums = vec![(0.0, 0.0, 0.0); k];
        for p in points.iter() {
            sums[p.cluster].0 += p.x;
            sums[p.cluster].1 += p.y;
            sums[p.cluster].2 += 1.0;
        }
        for i in 0..k {
            if sums[i].2 > 0.0 {
                centroids[i] = Point { x: sums[i].0 / sums[i].2, y: sums[i].1 / sums[i].2, cluster: i };
            }
        }
    }
}`,
  ts: `// K-Means Clustering in TypeScript
export interface Point {
  x: number; y: number;
  cluster: number;
}

export function kMeans(points: Point[], k: number): Point[] {
  const centroids: Point[] = points.slice(0, k).map(p => ({ ...p }));

  for (let iter = 0; iter < 100; iter++) {
    // E-Step: Assign points to nearest centroid
    for (const p of points) {
      let minDist = Infinity;
      for (let i = 0; i < k; i++) {
        const d = Math.hypot(p.x - centroids[i].x, p.y - centroids[i].y);
        if (d < minDist) { minDist = d; p.cluster = i; }
      }
    }

    // M-Step: Compute mean of assigned points
    const sumX = new Array(k).fill(0), sumY = new Array(k).fill(0), count = new Array(k).fill(0);
    for (const p of points) {
      sumX[p.cluster] += p.x; sumY[p.cluster] += p.y; count[p.cluster]++;
    }
    for (let i = 0; i < k; i++) {
      if (count[i] > 0) {
        centroids[i] = { x: sumX[i] / count[i], y: sumY[i] / count[i], cluster: i };
      }
    }
  }

  return centroids;
}`
};

export const KMeansVisualizer: React.FC = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const [centroids, setCentroids] = useState<Centroid[]>([]);
  const [stepPhase, setStepPhase] = useState<'assign' | 'update'>('assign');
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('python');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const initData = () => {
    // Generate 3 clusters of random points
    const newPoints: Point[] = [];
    const centers = [{ x: 100, y: 100 }, { x: 280, y: 120 }, { x: 180, y: 240 }];

    centers.forEach(c => {
      for (let i = 0; i < 15; i++) {
        newPoints.push({
          x: c.x + (Math.random() - 0.5) * 80,
          y: c.y + (Math.random() - 0.5) * 80,
          cluster: -1
        });
      }
    });

    const newCentroids: Centroid[] = [
      { x: 50, y: 50, color: CLUSTER_COLORS[0] },
      { x: 330, y: 50, color: CLUSTER_COLORS[1] },
      { x: 180, y: 300, color: CLUSTER_COLORS[2] }
    ];

    setPoints(newPoints);
    setCentroids(newCentroids);
    setStepPhase('assign');
  };

  useEffect(() => {
    initData();
  }, []);

  // Step 1: Assign points to nearest centroid (E-Step)
  const assignPoints = () => {
    const updated = points.map(p => {
      let minDist = Infinity;
      let closestCluster = -1;
      centroids.forEach((c, idx) => {
        const d = Math.hypot(p.x - c.x, p.y - c.y);
        if (d < minDist) {
          minDist = d;
          closestCluster = idx;
        }
      });
      return { ...p, cluster: closestCluster };
    });

    setPoints(updated);
    setStepPhase('update');
    audioEngine.playValueTone(450, 10, 80, 0.06);
  };

  // Step 2: Recompute centroids (M-Step)
  const updateCentroids = () => {
    const updatedCentroids = centroids.map((c, idx) => {
      const assigned = points.filter(p => p.cluster === idx);
      if (assigned.length === 0) return c;
      const meanX = assigned.reduce((acc, p) => acc + p.x, 0) / assigned.length;
      const meanY = assigned.reduce((acc, p) => acc + p.y, 0) / assigned.length;
      return { ...c, x: meanX, y: meanY };
    });

    setCentroids(updatedCentroids);
    setStepPhase('assign');
    audioEngine.playValueTone(700, 10, 80, 0.06);
  };

  // Render 2D Voronoi & Centroids Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#080c16';
    ctx.fillRect(0, 0, width, height);

    // Draw Data Points
    points.forEach(p => {
      ctx.fillStyle = p.cluster !== -1 ? CLUSTER_COLORS[p.cluster] : '#94a3b8';
      ctx.shadowColor = p.cluster !== -1 ? CLUSTER_COLORS[p.cluster] : '#94a3b8';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw Centroids
    centroids.forEach(c => {
      ctx.fillStyle = c.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = c.color;
      ctx.shadowBlur = 15;

      ctx.beginPath();
      ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
  }, [points, centroids]);

  const activeLangConfig = LANG_CONFIG[selectedLang];

  return (
    <div className="my-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
      <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>K-Means Clustering & Voronoi Partitions</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Unsupervised ML
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Alternate between <code className="text-cyan-300">Assigning Points</code> (Expectation) and <code className="text-pink-300">Updating Centroids</code> (Maximization).
          </p>
        </div>
      </div>

      <div className="p-6 bg-slate-950/90 flex flex-col md:flex-row items-center justify-center gap-8 border-b border-slate-800">
        <canvas ref={canvasRef} width={380} height={280} className="rounded-xl bg-slate-950 border border-slate-800 shadow-inner" />

        <div className="flex-1 max-w-md space-y-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between text-slate-300 font-bold">
              <span>Next Algorithm Step:</span>
              <span className={stepPhase === 'assign' ? 'text-cyan-400 font-extrabold' : 'text-pink-400 font-extrabold'}>
                {stepPhase === 'assign' ? 'Step 1: Assign Points to Centroids' : 'Step 2: Recompute Centroid Means'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={stepPhase === 'assign' ? assignPoints : updateCentroids}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs font-extrabold shadow-xl transition-all ${
                stepPhase === 'assign'
                  ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-cyan-400/20 border border-cyan-200'
                  : 'bg-pink-600 text-white hover:bg-pink-500 shadow-pink-600/20 border border-pink-400'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{stepPhase === 'assign' ? 'Step 1: Assign Points' : 'Step 2: Update Centroids'}</span>
            </button>

            <button
              onClick={initData}
              className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
              title="Reset Points & Centroids"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const nextState = !isAudioMuted;
                setIsAudioMuted(nextState);
                audioEngine.setMuted(nextState);
              }}
              className={`p-3.5 rounded-xl transition-all border ${
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
            <span>K-Means Clustering Implementation Code</span>
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
          filename={`kmeans_clustering.${activeLangConfig.fileExt}`}
          langLabel={activeLangConfig.label}
        />
      </div>
    </div>
  );
};
