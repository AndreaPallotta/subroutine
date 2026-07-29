import React from 'react';
import { TabbedCodeBlock } from '../ui/TabbedCodeBlock';

export const CacheLineCodeComparison: React.FC = () => {
  const snippets = {
    cpp: {
      label: 'C++ (Cache Alignment & Stride)',
      ext: 'cpp',
      lang: 'cpp',
      code: `// C++ Memory Locality & CPU Cache Line Alignment
#include <iostream>
#include <vector>
#include <cstdint>

// 1. Row-Major Access (Sequential / Cache-Friendly)
void traverseRowMajor(int** matrix, int N) {
    long long sum = 0;
    // Contiguous memory reads -> Maximum L1 Cache Hit Rate
    for (int i = 0; i < N; ++i) {
        for (int j = 0; j < N; ++j) {
            sum += matrix[i][j]; 
        }
    }
}

// 2. Column-Major Access (Strided / Cache Thrashing)
void traverseColumnMajor(int** matrix, int N) {
    long long sum = 0;
    // Non-contiguous memory reads -> Constant L1 Cache Misses
    for (int j = 0; j < N; ++j) {
        for (int i = 0; i < N; ++i) {
            sum += matrix[i][j];
        }
    }
}

// 3. False Sharing & alignas(64) Struct Alignment
struct alignas(64) WorkerThreadMetrics {
    uint64_t processed_items;
    uint64_t error_count;
    // Guaranteed to occupy its own isolated 64-byte cache line
};`
    },
    rust: {
      label: 'Rust (repr(align(64)))',
      ext: 'rs',
      lang: 'rust',
      code: `// Rust Cache Alignment & Stride Optimization

// 1. Row-Major Contiguous Slice Iteration
fn sum_row_major(matrix: &[Vec<i32>]) -> i64 {
    let mut sum: i64 = 0;
    for row in matrix.iter() {
        for &val in row.iter() {
            sum += val as i64; // Sequential memory prefetching
        }
    }
    sum
}

// 2. Column-Major Strided Access (Cache Thrashing)
fn sum_column_major(matrix: &[Vec<i32>], rows: usize, cols: usize) -> i64 {
    let mut sum: i64 = 0;
    for j in 0..cols {
        for i in 0..rows {
            sum += matrix[i][j] as i64; // Non-contiguous memory reads
        }
    }
    sum
}

// 3. Prevent false sharing across CPU cores with repr(align(64))
#[repr(align(64))]
struct WorkerThreadMetrics {
    processed_items: u64,
    error_count: u64,
}`
    },
    java: {
      label: 'Java (@Contended & Arrays)',
      ext: 'java',
      lang: 'java',
      code: `// Java Memory Locality & Cache Line Padding
package cc.subroutine.cache;

import jdk.internal.vm.annotation.Contended;

public class CacheLineOptimization {

    // 1. Row-Major Array Traversal (Cache Friendly)
    public static long sumRowMajor(int[][] matrix, int N) {
        long sum = 0;
        for (int i = 0; i < N; i++) {
            for (int j = 0; j < N; j++) {
                sum += matrix[i][j];
            }
        }
        return sum;
    }

    // 2. Column-Major Array Traversal (Cache Misses)
    public static long sumColumnMajor(int[][] matrix, int N) {
        long sum = 0;
        for (int j = 0; j < N; j++) {
            for (int i = 0; i < N; i++) {
                sum += matrix[i][j];
            }
        }
        return sum;
    }

    // 3. @Contended automatically pads fields to 128-byte cache line boundaries
    @Contended
    public static class ThreadCounter {
        public volatile long count = 0L;
    }
}`
    },
    go: {
      label: 'Go (Cache Line Padding)',
      ext: 'go',
      lang: 'go',
      code: `package main

// 1. Row-Major Slices Traversal
func SumRowMajor(matrix [][]int32) int64 {
	var sum int64 = 0
	for i := 0; i < len(matrix); i++ {
		for j := 0; j < len(matrix[i]); j++ {
			sum += int64(matrix[i][j])
		}
	}
	return sum
}

// 2. Column-Major Slices Traversal
func SumColumnMajor(matrix [][]int32, n int) int64 {
	var sum int64 = 0
	for j := 0; j < n; j++ {
		for i := 0; i < n; i++ {
			sum += int64(matrix[i][j])
		}
	}
	return sum
}

// 3. Manual 64-byte struct padding to isolate atomic counters across CPU cores
type PaddedCounter struct {
	Value uint64
	_     [56]byte // Padding to reach 64-byte L1 cache line size
}`
    },
    python: {
      label: 'Python (NumPy C-Contiguous)',
      ext: 'py',
      lang: 'python',
      code: `# Python Memory Locality via NumPy C-Contiguous Arrays
import numpy as np

# 1. Create 4096x4096 C-contiguous array in RAM
matrix = np.ones((4096, 4096), dtype=np.int32, order='C')

# Row-major sum utilizes vector SIMD instructions & CPU cache prefetching
fast_sum = np.sum(matrix, axis=1)

# 2. Fortran-contiguous array (Column-major memory stride)
fortran_matrix = np.asfortranarray(matrix)
# Triggers cache line thrashing if accessed along wrong axis
slow_sum = np.sum(fortran_matrix, axis=0)`
    }
  };

  return (
    <TabbedCodeBlock
      title="Cache Line Alignment & Memory Locality Implementation Code"
      snippets={snippets}
      defaultLang="cpp"
      defaultFilenamePrefix="cache_locality"
    />
  );
};
