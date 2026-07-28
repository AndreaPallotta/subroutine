# Subroutine

Subroutine is an interactive educational web platform for computer science topics, low-level systems engineering, algorithms, and applied mathematics.

## Features

- **Interactive Visualizers**: Audio-visual simulations built with HTML5 Canvas, Web Audio API, and React.
- **Multilingual Code Examples**: Code implementations available across C++, Python, Java, Go, Rust, and TypeScript.
- **Topics Covered**:
 - Algorithms (Sorting, Dijkstra & A* Search, 0/1 Knapsack DP)
 - Systems & Hardware (C++ Cache Line Locality, Kernel Bypass Zero-Copy, Virtual Memory & Page Tables)
 - AI & Machine Learning (Perceptron Decision Boundaries, K-Means Clustering, CNN 2D Convolution Filters)
 - Programming Language Internals (Garbage Collection Mark-and-Sweep, GIL-Free Python Concurrency, VM Bytecode Engines)
 - Physics & Mathematics (Qubits & Bloch Sphere, Verlet vs Euler Numerical Integration, Fast Fourier Transform)

## Tech Stack

- **Framework**: Astro 4 + React 18
- **Styling**: Tailwind CSS
- **Content**: MDX
- **Math Rendering**: KaTeX

## Getting Started

### Installation

```bash
npm install
```

### Local Development

```bash
npm run dev
```

The development server will start at `http://localhost:4321`.

### Production Build

```bash
npm run build
```

The compiled static site output will be generated in the `dist/` directory.

## Deployment

Automated deployment is configured for GitHub Pages via `.github/workflows/deploy.yml` upon push to the `main` branch.

## License

MIT
