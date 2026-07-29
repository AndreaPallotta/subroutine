import React from 'react';
import { TabbedCodeBlock } from '../ui/TabbedCodeBlock';

export const CacheLineCodeComparison: React.FC = () => {
  const snippets = {
    cpp: {
      label: 'C++ (alignas & Pointers)',
      ext: 'cpp',
      lang: 'cpp',
      code: `// C++ Cache Line Alignment & Memory Locality
#include <iostream>
#include <vector>
#include <cstdint>

// 1. Align struct to 64-byte L1 cache line boundary to eliminate False Sharing
struct alignas(64) WorkerMetrics {
    uint64_t processed_items;
    uint64_t error_count;
};

// 2. Sequential Row-Major Traversal (High L1 Cache Hit Rate)
void traverseRowMajor(std::vector<std::vector<int>>& matrix, int N) {
    long long sum = 0;
    for (int i = 0; i < N; ++i) {
        for (int j = 0; j < N; ++j) {
            sum += matrix[i][j]; // Sequential memory access
        }
    }
}`
    },
    rust: {
      label: 'Rust (repr(align(64)))',
      ext: 'rs',
      lang: 'rust',
      code: `// Rust Cache Alignment & Stride Optimization

// 1. Prevent false sharing across CPU cores with repr(align(64))
#[repr(align(64))]
struct WorkerThreadMetrics {
    processed_items: u64,
    error_count: u64,
}

// 2. Contiguous Slice Iteration
fn sum_row_major(matrix: &[Vec<i32>]) -> i64 {
    let mut sum: i64 = 0;
    for row in matrix.iter() {
        for &val in row.iter() {
            sum += val as i64; // Direct cache-line prefetching
        }
    }
    sum
}`
    },
    java: {
      label: 'Java (@Contended & Arrays)',
      ext: 'java',
      lang: 'java',
      code: `// Java False Sharing Padding & Matrix Traversal
package cc.subroutine.cache;

import jdk.internal.vm.annotation.Contended;

public class CacheLineOptimization {

    // 1. @Contended automatically pads fields to 128-byte cache line boundaries
    @Contended
    public static class ThreadCounter {
        public volatile long count = 0L;
    }

    // 2. Row-Major Array Traversal
    public static long sumRowMajor(int[][] matrix, int N) {
        long sum = 0;
        for (int i = 0; i < N; i++) {
            for (int j = 0; j < N; j++) {
                sum += matrix[i][j]; // Sequential memory fetch
            }
        }
        return sum;
    }
}`
    },
    go: {
      label: 'Go (Cache Line Padding)',
      ext: 'go',
      lang: 'go',
      code: `package main

import "sync/atomic"

// 1. Manual 64-byte struct padding to isolate atomic counters across CPU cores
type PaddedCounter struct {
	Value uint64
	_     [56]byte // Padding to reach 64-byte L1 cache line size
}

// 2. Row-Major Slices Traversal
func SumRowMajor(matrix [][]int32) int64 {
	var sum int64 = 0
	for i := 0; i < len(matrix); i++ {
		for j := 0; j < len(matrix[i]); j++ {
			sum += int64(matrix[i][j])
		}
	}
	return sum
}`
    },
    python: {
      label: 'Python (NumPy C-Contiguous)',
      ext: 'py',
      lang: 'python',
      code: `# Python Memory Locality via NumPy C-Contiguous Arrays
import numpy as np

# Create 4096x4096 C-contiguous array in RAM
matrix = np.ones((4096, 4096), dtype=np.int32, order='C')

# Row-major sum utilizes vector SIMD instructions & CPU cache prefetching
fast_sum = np.sum(matrix, axis=1)

# Fortran-contiguous array (Column-major memory stride)
fortran_matrix = np.asfortranarray(matrix)
# Triggers cache line thrashing if accessed along wrong axis
slow_sum = np.sum(fortran_matrix, axis=0)`
    }
  };

  return (
    <TabbedCodeBlock
      title="Cache Line Alignment & Memory Locality Code"
      snippets={snippets}
      defaultLang="cpp"
      defaultFilenamePrefix="cache_locality"
    />
  );
};
