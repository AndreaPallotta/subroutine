import React, { useState } from 'react';
import { RotateCcw, Volume2, VolumeX, Code2, Navigation, Target, MapPin, Square } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';
import { CodeBlock } from '../ui/CodeBlock';

export type PathAlgorithm = 'dijkstra' | 'astar';
export type ToolMode = 'start' | 'target' | 'wall';
export type SupportedLanguage = 'cpp' | 'python' | 'java' | 'go' | 'rust' | 'ts';

interface GridCell {
  r: number;
  c: number;
  isWall: boolean;
  isVisited: boolean;
  isPath: boolean;
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
  cpp: `// A* Pathfinding Algorithm in C++
#include <vector>
#include <queue>
#include <cmath>

struct Node {
    int r, c;
    double g, h;
    double f() const { return g + h; }
    bool operator>(const Node& other) const { return f() > other.f(); }
};

double heuristic(int r1, int c1, int r2, int c2) {
    return std::abs(r1 - r2) + std::abs(c1 - c2); // Manhattan distance
}

void aStarSearch(int startR, int startC, int targetR, int targetC) {
    std::priority_queue<Node, std::vector<Node>, std::greater<Node>> openSet;
    openSet.push({startR, startC, 0.0, heuristic(startR, startC, targetR, targetC)});
    // Traversal loop...
}`,
  python: `# Dijkstra & A* Search Pathfinding in Python
import heapq

def heuristic(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1])  # Manhattan distance

def a_star_search(start, goal, grid):
    open_set = []
    heapq.heappush(open_set, (0, start))
    came_from = {}
    g_score = {start: 0}
    
    while open_set:
        current = heapq.heappop(open_set)[1]
        if current == goal:
            return reconstruct_path(came_from, current)
        
        for neighbor in get_neighbors(current, grid):
            tentative_g = g_score[current] + 1
            if tentative_g < g_score.get(neighbor, float('inf')):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                f_score = tentative_g + heuristic(neighbor, goal)
                heapq.heappush(open_set, (f_score, neighbor))`,
  java: `// A* Pathfinding in Java
import java.util.*;

public class AStarPathfinding {
    static class Node implements Comparable<Node> {
        int r, c;
        double g, h;
        double f() { return g + h; }
        public int compareTo(Node o) { return Double.compare(this.f(), o.f()); }
    }

    public static double heuristic(int r1, int c1, int r2, int c2) {
        return Math.abs(r1 - r2) + Math.abs(c1 - c2);
    }
}`,
  go: `// A* Pathfinding in Go
package main

import (
	"container/heap"
	"math"
)

type Node struct {
	r, c int
	g, h float64
}

func heuristic(r1, c1, r2, c2 int) float64 {
	return math.Abs(float64(r1-r2)) + math.Abs(float64(c1-c2))
}`,
  rust: `// A* Pathfinding in Rust
use std::cmp::Ordering;
use std::collections::BinaryHeap;

#[derive(Copy, Clone, Eq, PartialEq)]
struct State {
    cost: usize,
    position: (usize, usize),
}

impl Ord for State {
    fn cmp(&self, other: &Self) -> Ordering {
        other.cost.cmp(&self.cost) // Min-heap
    }
}

impl PartialOrd for State {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}`,
  ts: `// Dijkstra & A* Pathfinding in TypeScript
export interface GridPoint {
  r: number; c: number;
}

export function heuristic(p1: GridPoint, p2: GridPoint): number {
  return Math.abs(p1.r - p2.r) + Math.abs(p1.c - p2.c); // Manhattan Distance
}

export function aStarSearch(
  grid: number[][],
  start: GridPoint,
  goal: GridPoint
): GridPoint[] | null {
  const openSet: Array<{ point: GridPoint; f: number; g: number }> = [
    { point: start, g: 0, f: heuristic(start, goal) }
  ];
  const gScore = new Map<string, number>();
  gScore.set(\`\${start.r},\${start.c}\`, 0);

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f); // Sort min-heap
    const current = openSet.shift()!;

    if (current.point.r === goal.r && current.point.c === goal.c) {
      return []; // Reconstruct path
    }
  }

  return null;
}`
};

export const PathfindingVisualizer: React.FC = () => {
  const ROWS = 12;
  const COLS = 20;

  const [algorithm, setAlgorithm] = useState<PathAlgorithm>('astar');
  const [toolMode, setToolMode] = useState<ToolMode>('wall');
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('python');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [visitedCount, setVisitedCount] = useState<number>(0);
  const [pathLength, setPathLength] = useState<number>(0);

  const [startPos, setStartPos] = useState<{ r: number; c: number }>({ r: 2, c: 2 });
  const [targetPos, setTargetPos] = useState<{ r: number; c: number }>({ r: 9, c: 17 });

  // Create Grid
  const createInitialGrid = (): GridCell[][] => {
    const grid: GridCell[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: GridCell[] = [];
      for (let c = 0; c < COLS; c++) {
        const isDefaultWall = (c === 8 && r >= 2 && r <= 9) || (c === 14 && r >= 1 && r <= 8);
        row.push({ r, c, isWall: isDefaultWall, isVisited: false, isPath: false });
      }
      grid.push(row);
    }
    return grid;
  };

  const [grid, setGrid] = useState<GridCell[][]>(createInitialGrid);

  const handleCellClick = (r: number, c: number) => {
    if (isRunning) return;

    if (toolMode === 'start') {
      if (r === targetPos.r && c === targetPos.c) return;
      setStartPos({ r, c });
      setGrid(prev => prev.map((row, ri) => row.map((cell, ci) => ri === r && ci === c ? { ...cell, isWall: false } : cell)));
    } else if (toolMode === 'target') {
      if (r === startPos.r && c === startPos.c) return;
      setTargetPos({ r, c });
      setGrid(prev => prev.map((row, ri) => row.map((cell, ci) => ri === r && ci === c ? { ...cell, isWall: false } : cell)));
    } else {
      if ((r === startPos.r && c === startPos.c) || (r === targetPos.r && c === targetPos.c)) return;
      setGrid(prev => prev.map((row, ri) => row.map((cell, ci) => ri === r && ci === c ? { ...cell, isWall: !cell.isWall } : cell)));
    }
  };

  const runPathfinding = () => {
    if (isRunning) return;
    setIsRunning(true);
    setVisitedCount(0);
    setPathLength(0);

    const newGrid = grid.map(row => row.map(cell => ({ ...cell, isVisited: false, isPath: false })));
    setGrid(newGrid);

    const visitedOrder: { r: number; c: number }[] = [];
    const parentMap = new Map<string, { r: number; c: number }>();
    const distMap = new Map<string, number>();

    const startKey = `${startPos.r},${startPos.c}`;
    distMap.set(startKey, 0);

    const openSet: { r: number; c: number; f: number }[] = [{ r: startPos.r, c: startPos.c, f: 0 }];

    let foundTarget = false;

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const curr = openSet.shift()!;
      const currKey = `${curr.r},${curr.c}`;

      if (curr.r === targetPos.r && curr.c === targetPos.c) {
        foundTarget = true;
        break;
      }

      visitedOrder.push({ r: curr.r, c: curr.c });

      const neighbors = [
        { r: curr.r - 1, c: curr.c },
        { r: curr.r + 1, c: curr.c },
        { r: curr.r, c: curr.c - 1 },
        { r: curr.r, c: curr.c + 1 },
      ].filter(n => n.r >= 0 && n.r < ROWS && n.c >= 0 && n.c < COLS && !newGrid[n.r][n.c].isWall);

      for (const n of neighbors) {
        const nKey = `${n.r},${n.c}`;
        const tentativeG = (distMap.get(currKey) || 0) + 1;

        if (tentativeG < (distMap.get(nKey) ?? Infinity)) {
          distMap.set(nKey, tentativeG);
          parentMap.set(nKey, { r: curr.r, c: curr.c });
          const h = algorithm === 'astar' ? Math.abs(n.r - targetPos.r) + Math.abs(n.c - targetPos.c) : 0;
          openSet.push({ r: n.r, c: n.c, f: tentativeG + h });
        }
      }
    }

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < visitedOrder.length) {
        const cell = visitedOrder[stepIdx];
        setGrid(prev => prev.map((row, r) => row.map((cCell, c) => {
          if (r === cell.r && c === cell.c) return { ...cCell, isVisited: true };
          return cCell;
        })));
        setVisitedCount(stepIdx + 1);
        audioEngine.playValueTone(200 + stepIdx * 4, 10, 100, 0.04);
        stepIdx++;
      } else {
        clearInterval(interval);
        if (foundTarget) {
          let curr = { r: targetPos.r, c: targetPos.c };
          const pathCells: { r: number; c: number }[] = [];
          while (parentMap.has(`${curr.r},${curr.c}`)) {
            pathCells.push(curr);
            curr = parentMap.get(`${curr.r},${curr.c}`)!;
          }

          let pathIdx = 0;
          const pathInterval = setInterval(() => {
            if (pathIdx < pathCells.length) {
              const pCell = pathCells[pathIdx];
              setGrid(prev => prev.map((row, r) => row.map((cCell, c) => {
                if (r === pCell.r && c === pCell.c) return { ...cCell, isPath: true };
                return cCell;
              })));
              pathIdx++;
            } else {
              clearInterval(pathInterval);
              setPathLength(pathCells.length);
              setIsRunning(false);
              audioEngine.playCompletionTone();
            }
          }, 30);
        } else {
          setIsRunning(false);
        }
      }
    }, 15);
  };

  const resetGrid = () => {
    setIsRunning(false);
    setVisitedCount(0);
    setPathLength(0);
    setGrid(createInitialGrid());
  };

  const activeLangConfig = LANG_CONFIG[selectedLang];

  return (
    <div className="my-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Dijkstra's Algorithm & A* Search</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
              Graph Pathfinding
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Compare greedy uniform-cost traversal (<code className="text-indigo-300">Dijkstra</code>) against heuristic-guided search (<code className="text-cyan-300">A* Manhattan</code>).
          </p>
        </div>

        {/* Algorithm Switcher */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setAlgorithm('dijkstra')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              algorithm === 'dijkstra'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dijkstra
          </button>
          <button
            onClick={() => setAlgorithm('astar')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              algorithm === 'astar'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            A* Search (Heuristic)
          </button>
        </div>
      </div>

      {/* Main Interactive Grid Section */}
      <div className="p-6 bg-slate-950/90 border-b border-slate-800 flex flex-col items-center">
        {/* Tool Mode Selectors */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4 p-1.5 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setToolMode('start')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              toolMode === 'start' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Start Node</span>
          </button>

          <button
            onClick={() => setToolMode('target')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              toolMode === 'target' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Target Node</span>
          </button>

          <button
            onClick={() => setToolMode('wall')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              toolMode === 'wall' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Draw Walls</span>
          </button>
        </div>

        {/* 2D Grid Canvas Matrix */}
        <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-2xl overflow-x-auto max-w-full">
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
            {grid.map((row, r) =>
              row.map((cell, c) => {
                const isStart = r === startPos.r && c === startPos.c;
                const isTarget = r === targetPos.r && c === targetPos.c;

                let bgClass = 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700';
                if (isStart) bgClass = 'bg-emerald-500/90 border-emerald-400 shadow-lg shadow-emerald-500/20';
                else if (isTarget) bgClass = 'bg-rose-500/90 border-rose-400 shadow-lg shadow-rose-500/20';
                else if (cell.isPath) bgClass = 'bg-amber-400 border-amber-300 shadow-md shadow-amber-400/30 scale-105';
                else if (cell.isVisited) bgClass = 'bg-indigo-950/80 border-indigo-500/30 text-indigo-400';
                else if (cell.isWall) bgClass = 'bg-slate-800 border-slate-700';

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className={`w-7 h-7 md:w-8 md:h-8 rounded-lg border transition-all flex items-center justify-center ${bgClass}`}
                  >
                    {isStart && <MapPin className="w-4 h-4 text-white" />}
                    {isTarget && <Target className="w-4 h-4 text-white" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Real-time Telemetry Stats */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-4 font-mono text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span>
            <span>Nodes Visited: <strong className="text-white">{visitedCount}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
            <span>Path Length: <strong className="text-white">{pathLength}</strong></span>
          </div>
        </div>

        {/* Primary Controls */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={runPathfinding}
            disabled={isRunning}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-40"
          >
            <Navigation className="w-4 h-4" />
            <span>Run {algorithm === 'dijkstra' ? 'Dijkstra' : 'A* Search'}</span>
          </button>

          <button
            onClick={resetGrid}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
            title="Reset Grid"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const nextState = !isAudioMuted;
              setIsAudioMuted(nextState);
              audioEngine.setMuted(nextState);
            }}
            className={`p-2.5 rounded-xl transition-all border ${
              isAudioMuted ? 'bg-slate-800 text-rose-400 border-rose-500/30' : 'bg-indigo-950/60 text-cyan-400 border-cyan-500/30'
            }`}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Code Inspector */}
      <div className="p-6 bg-slate-950/95">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>Pathfinding Implementation Code</span>
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
          filename={`pathfinding.${activeLangConfig.fileExt}`}
          langLabel={activeLangConfig.label}
        />
      </div>
    </div>
  );
};
