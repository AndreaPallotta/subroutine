import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Shuffle, ChevronRight, Code2 } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';
import { CodeBlock } from '../ui/CodeBlock';

export type AlgorithmType = 'bubble' | 'selection' | 'insertion' | 'quick' | 'merge' | 'heap';
export type SupportedLanguage = 'cpp' | 'python' | 'java' | 'go' | 'rust' | 'ts';

interface Step {
  array: number[];
  comparingIndices: number[];
  swappingIndices: number[];
  sortedIndices: number[];
  pivotIndex?: number;
}

interface SortingVisualizerProps {
  initialAlgorithm?: AlgorithmType;
  initialSize?: number;
  initialSpeedMs?: number;
}

const LANG_CONFIG: Record<SupportedLanguage, { label: string; fileExt: string }> = {
  cpp: { label: 'C++', fileExt: 'cpp' },
  python: { label: 'Python', fileExt: 'py' },
  java: { label: 'Java', fileExt: 'java' },
  go: { label: 'Go', fileExt: 'go' },
  rust: { label: 'Rust', fileExt: 'rs' },
  ts: { label: 'TypeScript', fileExt: 'ts' },
};

const ALGORITHM_DETAILS: Record<AlgorithmType, {
  name: string;
  timeComplexity: string;
  spaceComplexity: string;
  bestTime: string;
  worstTime: string;
  stable: boolean;
  description: string;
  code: Record<SupportedLanguage, string>;
}> = {
  quick: {
    name: 'Quick Sort',
    timeComplexity: 'O(N log N)',
    spaceComplexity: 'O(log N)',
    bestTime: 'O(N log N)',
    worstTime: 'O(N²)',
    stable: false,
    description: 'Picks a pivot element and partitions the surrounding array into elements smaller and larger than the pivot recursively.',
    code: {
      cpp: `template <typename T>
int partition(std::vector<T>& arr, int low, int high) {
    T pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            std::swap(arr[i], arr[j]);
        }
    }
    std::swap(arr[i + 1], arr[high]);
    return i + 1;
}

template <typename T>
void quickSort(std::vector<T>& arr, int low, int high) {
    if (low < high) {
        int p = partition(arr, low, high);
        quickSort(arr, low, p - 1);
        quickSort(arr, p + 1, high);
    }
}`,
      python: `def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)`,
      java: `public class QuickSort {
    public static void sort(int[] arr, int low, int high) {
        if (low < high) {
            int p = partition(arr, low, high);
            sort(arr, low, p - 1);
            sort(arr, p + 1, high);
        }
    }

    private static int partition(int[] arr, int low, int high) {
        int pivot = arr[high], i = low - 1;
        for (int j = low; j < high; j++) {
            if (arr[j] < pivot) {
                i++;
                int temp = arr[i]; arr[i] = arr[j]; arr[j] = temp;
            }
        }
        int temp = arr[i + 1]; arr[i + 1] = arr[high]; arr[high] = temp;
        return i + 1;
    }
}`,
      go: `package main

func quickSort(arr []int, low, high int) {
	if low < high {
		p := partition(arr, low, high)
		quickSort(arr, low, p-1)
		quickSort(arr, p+1, high)
	}
}

func partition(arr []int, low, high int) int {
	pivot := arr[high]
	i := low - 1
	for j := low; j < high; j++ {
		if arr[j] < pivot {
			i++
			arr[i], arr[j] = arr[j], arr[i]
		}
	}
	arr[i+1], arr[high] = arr[high], arr[i+1]
	return i + 1
}`,
      rust: `fn quick_sort<T: Ord>(slice: &mut [T]) {
    if slice.len() <= 1 { return; }
    let pivot_index = partition(slice);
    quick_sort(&mut slice[0..pivot_index]);
    quick_sort(&mut slice[pivot_index + 1..]);
}

fn partition<T: Ord>(slice: &mut [T]) -> usize {
    let len = slice.len();
    let mut i = 0;
    for j in 0..len - 1 {
        if slice[j] <= slice[len - 1] {
            slice.swap(i, j);
            i += 1;
        }
    }
    slice.swap(i, len - 1);
    i
}`,
      ts: `function quickSort(arr: number[], low = 0, high = arr.length - 1): number[] {
  if (low < high) {
    const p = partition(arr, low, high);
    quickSort(arr, low, p - 1);
    quickSort(arr, p + 1, high);
  }
  return arr;
}

function partition(arr: number[], low: number, high: number): number {
  const pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}`
    }
  },
  merge: {
    name: 'Merge Sort',
    timeComplexity: 'O(N log N)',
    spaceComplexity: 'O(N)',
    bestTime: 'O(N log N)',
    worstTime: 'O(N log N)',
    stable: true,
    description: 'Divides the array into two halves, sorts them recursively, and merges the two sorted halves back together.',
    code: {
      cpp: `void merge(std::vector<int>& arr, int l, int m, int r) {
    std::vector<int> left(arr.begin() + l, arr.begin() + m + 1);
    std::vector<int> right(arr.begin() + m + 1, arr.begin() + r + 1);
    int i = 0, j = 0, k = l;
    while (i < left.size() && j < right.size()) {
        arr[k++] = (left[i] <= right[j]) ? left[i++] : right[j++];
    }
    while (i < left.size()) arr[k++] = left[i++];
    while (j < right.size()) arr[k++] = right[j++];
}

void mergeSort(std::vector<int>& arr, int l, int r) {
    if (l >= r) return;
    int m = l + (r - l) / 2;
    mergeSort(arr, l, m);
    mergeSort(arr, m + 1, r);
    merge(arr, l, m, r);
}`,
      python: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i]); i += 1
        else:
            result.append(right[j]); j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result`,
      java: `public class MergeSort {
    public static void sort(int[] arr, int l, int r) {
        if (l >= r) return;
        int m = l + (r - l) / 2;
        sort(arr, l, m);
        sort(arr, m + 1, r);
        merge(arr, l, m, r);
    }

    private static void merge(int[] arr, int l, int m, int r) {
        int[] left = java.util.Arrays.copyOfRange(arr, l, m + 1);
        int[] right = java.util.Arrays.copyOfRange(arr, m + 1, r + 1);
        int i = 0, j = 0, k = l;
        while (i < left.length && j < right.length) {
            arr[k++] = (left[i] <= right[j]) ? left[i++] : right[j++];
        }
        while (i < left.length) arr[k++] = left[i++];
        while (j < right.length) arr[k++] = right[j++];
    }
}`,
      go: `package main

func mergeSort(arr []int) []int {
	if len(arr) <= 1 {
		return arr
	}
	mid := len(arr) / 2
	left := mergeSort(arr[:mid])
	right := mergeSort(arr[mid:])
	return merge(left, right)
}

func merge(left, right []int) []int {
	result := make([]int, 0, len(left)+len(right))
	i, j := 0, 0
	for i < len(left) && j < len(right) {
		if left[i] <= right[j] {
			result = append(result, left[i]); i++
		} else {
			result = append(result, right[j]); j++
		}
	}
	result = append(result, left[i:]...)
	return append(result, right[j:]...)
}`,
      rust: `fn merge_sort<T: Ord + Clone>(arr: &[T]) -> Vec<T> {
    if arr.len() <= 1 { return arr.to_vec(); }
    let mid = arr.len() / 2;
    let left = merge_sort(&arr[..mid]);
    let right = merge_sort(&arr[mid..]);
    merge(&left, &right)
}

fn merge<T: Ord + Clone>(left: &[T], right: &[T]) -> Vec<T> {
    let mut result = Vec::with_capacity(left.len() + right.len());
    let (mut i, mut j) = (0, 0);
    while i < left.len() && j < right.len() {
        if left[i] <= right[j] { result.push(left[i].clone()); i += 1; }
        else { result.push(right[j].clone()); j += 1; }
    }
    result.extend_from_slice(&left[i..]);
    result.extend_from_slice(&right[j..]);
    result
}`,
      ts: `function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  
  const result: number[] = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }
  return result.concat(left.slice(i)).concat(right.slice(j));
}`
    }
  },
  heap: {
    name: 'Heap Sort',
    timeComplexity: 'O(N log N)',
    spaceComplexity: 'O(1)',
    bestTime: 'O(N log N)',
    worstTime: 'O(N log N)',
    stable: false,
    description: 'Builds a Binary Max-Heap tree from array elements, then repeatedly extracts the max element to the end.',
    code: {
      cpp: `void heapify(std::vector<int>& arr, int n, int i) {
    int largest = i, left = 2 * i + 1, right = 2 * i + 2;
    if (left < n && arr[left] > arr[largest]) largest = left;
    if (right < n && arr[right] > arr[largest]) largest = right;
    if (largest != i) {
        std::swap(arr[i], arr[largest]);
        heapify(arr, n, largest);
    }
}

void heapSort(std::vector<int>& arr) {
    int n = arr.size();
    for (int i = n / 2 - 1; i >= 0; i--) heapify(arr, n, i);
    for (int i = n - 1; i > 0; i--) {
        std::swap(arr[0], arr[i]);
        heapify(arr, i, 0);
    }
}`,
      python: `import heapq

def heap_sort(arr):
    heap = arr.copy()
    heapq.heapify(heap)
    return [heapq.heappop(heap) for _ in range(len(heap))]`,
      java: `public class HeapSort {
    public static void sort(int[] arr) {
        int n = arr.length;
        for (int i = n / 2 - 1; i >= 0; i--) heapify(arr, n, i);
        for (int i = n - 1; i > 0; i--) {
            int temp = arr[0]; arr[0] = arr[i]; arr[i] = temp;
            heapify(arr, i, 0);
        }
    }

    private static void heapify(int[] arr, int n, int i) {
        int largest = i, l = 2 * i + 1, r = 2 * i + 2;
        if (l < n && arr[l] > arr[largest]) largest = l;
        if (r < n && arr[r] > arr[largest]) largest = r;
        if (largest != i) {
            int swap = arr[i]; arr[i] = arr[largest]; arr[largest] = swap;
            heapify(arr, n, largest);
        }
    }
}`,
      go: `package main

func heapSort(arr []int) {
	n := len(arr)
	for i := n/2 - 1; i >= 0; i-- { heapify(arr, n, i) }
	for i := n - 1; i > 0; i-- {
		arr[0], arr[i] = arr[i], arr[0]
		heapify(arr, i, 0)
	}
}

func heapify(arr []int, n, i int) {
	largest := i
	l, r := 2*i+1, 2*i+2
	if l < n && arr[l] > arr[largest] { largest = l }
	if r < n && arr[r] > arr[largest] { largest = r }
	if largest != i {
		arr[i], arr[largest] = arr[largest], arr[i]
		heapify(arr, n, largest)
	}
}`,
      rust: `fn heap_sort<T: Ord>(arr: &mut [T]) {
    let n = arr.len();
    for i in (0..n / 2).rev() { heapify(arr, n, i); }
    for i in (1..n).rev() {
        arr.swap(0, i);
        heapify(arr, i, 0);
    }
}

fn heapify<T: Ord>(arr: &mut [T], n: usize, i: usize) {
    let mut largest = i;
    let (l, r) = (2 * i + 1, 2 * i + 2);
    if l < n && arr[l] > arr[largest] { largest = l; }
    if r < n && arr[r] > arr[largest] { largest = r; }
    if largest != i {
        arr.swap(i, largest);
        heapify(arr, n, largest);
    }
}`,
      ts: `function heapSort(arr: number[]): number[] {
  const n = arr.length;
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(arr, n, i);
  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]];
    heapify(arr, i, 0);
  }
  return arr;
}

function heapify(arr: number[], n: number, i: number): void {
  let largest = i;
  const l = 2 * i + 1, r = 2 * i + 2;
  if (l < n && arr[l] > arr[largest]) largest = l;
  if (r < n && arr[r] > arr[largest]) largest = r;
  if (largest !== i) {
    [arr[i], arr[largest]] = [arr[largest], arr[i]];
    heapify(arr, n, largest);
  }
}`
    }
  },
  bubble: {
    name: 'Bubble Sort',
    timeComplexity: 'O(N²)',
    spaceComplexity: 'O(1)',
    bestTime: 'O(N)',
    worstTime: 'O(N²)',
    stable: true,
    description: 'Compares adjacent array elements repeatedly, swapping out-of-order pairs until no swaps are needed.',
    code: {
      cpp: `void bubbleSort(std::vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        bool swapped = false;
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                std::swap(arr[j], arr[j + 1]);
                swapped = true;
            }
        }
        if (!swapped) break;
    }
}`,
      python: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr`,
      java: `public class BubbleSort {
    public static void sort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            boolean swapped = false;
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = temp;
                    swapped = true;
                }
            }
            if (!swapped) break;
        }
    }
}`,
      go: `package main

func bubbleSort(arr []int) {
	n := len(arr)
	for i := 0; i < n-1; i++ {
		swapped := false
		for j := 0; j < n-i-1; j++ {
			if arr[j] > arr[j+1] {
				arr[j], arr[j+1] = arr[j+1], arr[j]
				swapped = true
			}
		}
		if !swapped { break }
	}
}`,
      rust: `fn bubble_sort<T: Ord>(arr: &mut [T]) {
    let n = arr.len();
    for i in 0..n {
        let mut swapped = false;
        for j in 0..n - 1 - i {
            if arr[j] > arr[j + 1] {
                arr.swap(j, j + 1);
                swapped = true;
            }
        }
        if !swapped { break; }
    }
}`,
      ts: `function bubbleSort(arr: number[]): number[] {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return arr;
}`
    }
  },
  selection: {
    name: 'Selection Sort',
    timeComplexity: 'O(N²)',
    spaceComplexity: 'O(1)',
    bestTime: 'O(N²)',
    worstTime: 'O(N²)',
    stable: false,
    description: 'Scans the unsorted sub-array for the minimum element and moves it to the front of the unsorted section.',
    code: {
      cpp: `void selectionSort(std::vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) minIdx = j;
        }
        if (minIdx != i) std::swap(arr[i], arr[minIdx]);
    }
}`,
      python: `def selection_sort(arr):
    for i in range(len(arr)):
        min_idx = i
        for j in range(i + 1, len(arr)):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr`,
      java: `public class SelectionSort {
    public static void sort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            int minIdx = i;
            for (int j = i + 1; j < n; j++) {
                if (arr[j] < arr[minIdx]) minIdx = j;
            }
            if (minIdx != i) {
                int temp = arr[i]; arr[i] = arr[minIdx]; arr[minIdx] = temp;
            }
        }
    }
}`,
      go: `package main

func selectionSort(arr []int) {
	n := len(arr)
	for i := 0; i < n-1; i++ {
		minIdx := i
		for j := i + 1; j < n; j++ {
			if arr[j] < arr[minIdx] { minIdx = j }
		}
		if minIdx != i { arr[i], arr[minIdx] = arr[minIdx], arr[i] }
	}
}`,
      rust: `fn selection_sort<T: Ord>(arr: &mut [T]) {
    let len = arr.len();
    for i in 0..len {
        let mut min_idx = i;
        for j in (i + 1)..len {
            if arr[j] < arr[min_idx] { min_idx = j; }
        }
        if min_idx != i { arr.swap(i, min_idx); }
    }
}`,
      ts: `function selectionSort(arr: number[]): number[] {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    if (minIdx !== i) [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
  }
  return arr;
}`
    }
  },
  insertion: {
    name: 'Insertion Sort',
    timeComplexity: 'O(N²)',
    spaceComplexity: 'O(1)',
    bestTime: 'O(N)',
    worstTime: 'O(N²)',
    stable: true,
    description: 'Builds a sorted array one element at a time by shifting elements larger than the current item to the right.',
    code: {
      cpp: `void insertionSort(std::vector<int>& arr) {
    int n = arr.size();
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}`,
      python: `def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr`,
      java: `public class InsertionSort {
    public static void sort(int[] arr) {
        int n = arr.length;
        for (int i = 1; i < n; i++) {
            int key = arr[i], j = i - 1;
            while (j >= 0 && arr[j] > key) {
                arr[j + 1] = arr[j];
                j--;
            }
            arr[j + 1] = key;
        }
    }
}`,
      go: `package main

func insertionSort(arr []int) {
	for i := 1; i < len(arr); i++ {
		key := arr[i]
		j := i - 1
		for j >= 0 && arr[j] > key {
			arr[j+1] = arr[j]
			j--
		}
		arr[j+1] = key
	}
}`,
      rust: `fn insertion_sort<T: Ord + Copy>(arr: &mut [T]) {
    for i in 1..arr.len() {
        let key = arr[i];
        let mut j = i;
        while j > 0 && arr[j - 1] > key {
            arr[j] = arr[j - 1];
            j -= 1;
        }
        arr[j] = key;
    }
}`,
      ts: `function insertionSort(arr: number[]): number[] {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
  return arr;
}`
    }
  }
};

export const SortingVisualizer: React.FC<SortingVisualizerProps> = ({
  initialAlgorithm = 'quick',
  initialSize = 32,
  initialSpeedMs = 40,
}) => {
  const [algorithm, setAlgorithm] = useState<AlgorithmType>(initialAlgorithm);
  const [arraySize, setArraySize] = useState<number>(initialSize);
  const [speedMs, setSpeedMs] = useState<number>(initialSpeedMs);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [array, setArray] = useState<number[]>([]);
  const [comparing, setComparing] = useState<number[]>([]);
  const [swapping, setSwapping] = useState<number[]>([]);
  const [sorted, setSorted] = useState<number[]>([]);
  const [pivot, setPivot] = useState<number | undefined>(undefined);
  const [comparisons, setComparisons] = useState<number>(0);
  const [swaps, setSwaps] = useState<number>(0);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('cpp');

  const stepsRef = useRef<Step[]>([]);
  const currentStepRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateRandomArray = (size: number) => {
    const newArr = Array.from({ length: size }, () => Math.floor(Math.random() * 85) + 15);
    setArray(newArr);
    setComparing([]);
    setSwapping([]);
    setSorted([]);
    setPivot(undefined);
    setComparisons(0);
    setSwaps(0);
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    stepsRef.current = [];
    currentStepRef.current = 0;
  };

  useEffect(() => {
    generateRandomArray(arraySize);
  }, [arraySize]);

  const toggleMute = () => {
    const nextState = !isAudioMuted;
    setIsAudioMuted(nextState);
    audioEngine.setMuted(nextState);
  };

  const generateSteps = (): Step[] => {
    const steps: Step[] = [];
    const arr = [...array];
    const n = arr.length;
    const sortedAcc: number[] = [];

    if (algorithm === 'bubble') {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i - 1; j++) {
          steps.push({ array: [...arr], comparingIndices: [j, j + 1], swappingIndices: [], sortedIndices: [...sortedAcc] });
          if (arr[j] > arr[j + 1]) {
            [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            steps.push({ array: [...arr], comparingIndices: [], swappingIndices: [j, j + 1], sortedIndices: [...sortedAcc] });
          }
        }
        sortedAcc.push(n - i - 1);
      }
    } else if (algorithm === 'selection') {
      for (let i = 0; i < n - 1; i++) {
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
          steps.push({ array: [...arr], comparingIndices: [j, minIdx], swappingIndices: [], sortedIndices: [...sortedAcc] });
          if (arr[j] < arr[minIdx]) minIdx = j;
        }
        if (minIdx !== i) {
          [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
          steps.push({ array: [...arr], comparingIndices: [], swappingIndices: [i, minIdx], sortedIndices: [...sortedAcc] });
        }
        sortedAcc.push(i);
      }
      sortedAcc.push(n - 1);
    } else if (algorithm === 'insertion') {
      sortedAcc.push(0);
      for (let i = 1; i < n; i++) {
        let j = i;
        while (j > 0) {
          steps.push({ array: [...arr], comparingIndices: [j - 1, j], swappingIndices: [], sortedIndices: [...sortedAcc] });
          if (arr[j - 1] > arr[j]) {
            [arr[j - 1], arr[j]] = [arr[j], arr[j - 1]];
            steps.push({ array: [...arr], comparingIndices: [], swappingIndices: [j - 1, j], sortedIndices: [...sortedAcc] });
            j--;
          } else {
            break;
          }
        }
        sortedAcc.push(i);
      }
    } else if (algorithm === 'quick') {
      const quickSortHelper = (start: number, end: number) => {
        if (start >= end) {
          if (start >= 0 && start < n) sortedAcc.push(start);
          return;
        }
        const pivotVal = arr[end];
        let pIndex = start;
        for (let i = start; i < end; i++) {
          steps.push({ array: [...arr], comparingIndices: [i, end], swappingIndices: [], sortedIndices: [...sortedAcc], pivotIndex: end });
          if (arr[i] < pivotVal) {
            [arr[i], arr[pIndex]] = [arr[pIndex], arr[i]];
            steps.push({ array: [...arr], comparingIndices: [], swappingIndices: [i, pIndex], sortedIndices: [...sortedAcc], pivotIndex: end });
            pIndex++;
          }
        }
        [arr[pIndex], arr[end]] = [arr[end], arr[pIndex]];
        steps.push({ array: [...arr], comparingIndices: [], swappingIndices: [pIndex, end], sortedIndices: [...sortedAcc], pivotIndex: pIndex });
        sortedAcc.push(pIndex);

        quickSortHelper(start, pIndex - 1);
        quickSortHelper(pIndex + 1, end);
      };
      quickSortHelper(0, n - 1);
    } else if (algorithm === 'heap') {
      const heapify = (size: number, i: number) => {
        let largest = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;

        if (left < size) {
          steps.push({ array: [...arr], comparingIndices: [left, largest], swappingIndices: [], sortedIndices: [...sortedAcc] });
          if (arr[left] > arr[largest]) largest = left;
        }
        if (right < size) {
          steps.push({ array: [...arr], comparingIndices: [right, largest], swappingIndices: [], sortedIndices: [...sortedAcc] });
          if (arr[right] > arr[largest]) largest = right;
        }
        if (largest !== i) {
          [arr[i], arr[largest]] = [arr[largest], arr[i]];
          steps.push({ array: [...arr], comparingIndices: [], swappingIndices: [i, largest], sortedIndices: [...sortedAcc] });
          heapify(size, largest);
        }
      };

      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i);
      for (let i = n - 1; i > 0; i--) {
        [arr[0], arr[i]] = [arr[i], arr[0]];
        steps.push({ array: [...arr], comparingIndices: [], swappingIndices: [0, i], sortedIndices: [...sortedAcc] });
        sortedAcc.push(i);
        heapify(i, 0);
      }
      sortedAcc.push(0);
    } else { // Merge sort
      const merge = (l: number, m: number, r: number) => {
        const leftArr = arr.slice(l, m + 1);
        const rightArr = arr.slice(m + 1, r + 1);
        let i = 0, j = 0, k = l;
        while (i < leftArr.length && j < rightArr.length) {
          steps.push({ array: [...arr], comparingIndices: [l + i, m + 1 + j], swappingIndices: [], sortedIndices: [...sortedAcc] });
          if (leftArr[i] <= rightArr[j]) {
            arr[k] = leftArr[i];
            i++;
          } else {
            arr[k] = rightArr[j];
            j++;
          }
          steps.push({ array: [...arr], comparingIndices: [], swappingIndices: [k], sortedIndices: [...sortedAcc] });
          k++;
        }
        while (i < leftArr.length) {
          arr[k] = leftArr[i];
          steps.push({ array: [...arr], comparingIndices: [], swappingIndices: [k], sortedIndices: [...sortedAcc] });
          i++; k++;
        }
        while (j < rightArr.length) {
          arr[k] = rightArr[j];
          steps.push({ array: [...arr], comparingIndices: [], swappingIndices: [k], sortedIndices: [...sortedAcc] });
          j++; k++;
        }
      };
      const mergeSortHelper = (l: number, r: number) => {
        if (l >= r) return;
        const m = Math.floor((l + r) / 2);
        mergeSortHelper(l, m);
        mergeSortHelper(m + 1, r);
        merge(l, m, r);
      };
      mergeSortHelper(0, n - 1);
    }

    steps.push({
      array: [...arr],
      comparingIndices: [],
      swappingIndices: [],
      sortedIndices: Array.from({ length: n }, (_, idx) => idx),
    });

    return steps;
  };

  const startSort = () => {
    if (isRunning) {
      setIsRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (stepsRef.current.length === 0 || currentStepRef.current >= stepsRef.current.length) {
      stepsRef.current = generateSteps();
      currentStepRef.current = 0;
    }

    setIsRunning(true);

    let compCount = comparisons;
    let swapCount = swaps;

    timerRef.current = setInterval(() => {
      if (currentStepRef.current >= stepsRef.current.length) {
        setIsRunning(false);
        if (timerRef.current) clearInterval(timerRef.current);
        setComparing([]);
        setSwapping([]);
        setPivot(undefined);
        setSorted(Array.from({ length: array.length }, (_, idx) => idx));
        audioEngine.playCompletionTone();
        return;
      }

      const step = stepsRef.current[currentStepRef.current];
      setArray(step.array);
      setComparing(step.comparingIndices);
      setSwapping(step.swappingIndices);
      setSorted(step.sortedIndices);
      setPivot(step.pivotIndex);

      if (step.comparingIndices.length > 0) {
        compCount++;
        setComparisons(compCount);
        const activeVal = step.array[step.comparingIndices[0]] || 50;
        audioEngine.playValueTone(activeVal, 10, 100, (speedMs / 1000) * 0.8);
      } else if (step.swappingIndices.length > 0) {
        swapCount++;
        setSwaps(swapCount);
        const activeVal = step.array[step.swappingIndices[0]] || 50;
        audioEngine.playValueTone(activeVal, 10, 100, (speedMs / 1000) * 0.8);
      }

      currentStepRef.current++;
    }, speedMs);
  };

  const stepForward = () => {
    if (stepsRef.current.length === 0) {
      stepsRef.current = generateSteps();
      currentStepRef.current = 0;
    }
    if (currentStepRef.current < stepsRef.current.length) {
      const step = stepsRef.current[currentStepRef.current];
      setArray(step.array);
      setComparing(step.comparingIndices);
      setSwapping(step.swappingIndices);
      setSorted(step.sortedIndices);
      setPivot(step.pivotIndex);
      if (step.comparingIndices.length > 0) setComparisons(prev => prev + 1);
      if (step.swappingIndices.length > 0) setSwaps(prev => prev + 1);
      const val = step.array[step.comparingIndices[0] || step.swappingIndices[0] || 0];
      if (val) audioEngine.playValueTone(val, 10, 100, 0.08);
      currentStepRef.current++;
    }
  };

  const info = ALGORITHM_DETAILS[algorithm];
  const activeLangConfig = LANG_CONFIG[selectedLang];

  return (
    <div className="my-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Top Header & Algorithm Switcher */}
      <div className="p-6 border-b border-slate-800 bg-slate-950/60">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-white tracking-tight">{info.name}</h3>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                Avg: {info.timeComplexity}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Space: {info.spaceComplexity}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 max-w-xl leading-relaxed">{info.description}</p>
          </div>

          {/* Algorithm Selector Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-950 rounded-xl border border-slate-800">
            {(Object.keys(ALGORITHM_DETAILS) as AlgorithmType[]).map((algoKey) => (
              <button
                key={algoKey}
                onClick={() => {
                  setAlgorithm(algoKey);
                  generateRandomArray(arraySize);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  algorithm === algoKey
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {ALGORITHM_DETAILS[algoKey].name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Canvas Display */}
      <div className="relative h-64 p-6 bg-slate-950/90 flex items-end justify-center gap-1.5 border-b border-slate-800 overflow-hidden">
        {array.map((val, idx) => {
          const isComparing = comparing.includes(idx);
          const isSwapping = swapping.includes(idx);
          const isSorted = sorted.includes(idx);
          const isPivot = pivot === idx;

          let barBg = 'bg-indigo-500/80';

          if (isSorted) {
            barBg = 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]';
          } else if (isSwapping) {
            barBg = 'bg-pink-500 shadow-[0_0_16px_rgba(236,72,153,0.9)] scale-y-105';
          } else if (isComparing) {
            barBg = 'bg-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.9)] scale-y-105';
          } else if (isPivot) {
            barBg = 'bg-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.9)]';
          }

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center justify-end h-full transition-all duration-75"
            >
              <div
                className={`w-full rounded-t-md transition-all duration-75 ${barBg}`}
                style={{ height: `${val}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* Controls Bar */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={startSort}
            className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-lg shadow-indigo-500/25 transition-all"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? 'Pause' : 'Start Sort'}</span>
          </button>

          <button
            onClick={stepForward}
            disabled={isRunning}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-all"
            title="Step Forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => generateRandomArray(arraySize)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            title="Randomize Array"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={toggleMute}
            className={`p-2 rounded-xl transition-all ${
              isAudioMuted ? 'bg-slate-800 text-rose-400' : 'bg-indigo-950/60 text-cyan-400 border border-cyan-500/30'
            }`}
            title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Sliders & Stats */}
        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Size:</span>
            <input
              type="range"
              min={12}
              max={64}
              value={arraySize}
              disabled={isRunning}
              onChange={(e) => setArraySize(Number(e.target.value))}
              className="w-20 accent-indigo-500 cursor-pointer"
            />
            <span className="text-indigo-400 w-5">{arraySize}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Speed:</span>
            <input
              type="range"
              min={5}
              max={200}
              step={5}
              value={speedMs}
              onChange={(e) => setSpeedMs(Number(e.target.value))}
              className="w-20 accent-cyan-500 cursor-pointer"
            />
            <span className="text-cyan-400 w-9">{speedMs}ms</span>
          </div>

          <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
            <div>Compares: <span className="text-cyan-400 font-bold">{comparisons}</span></div>
            <div>Swaps: <span className="text-pink-400 font-bold">{swaps}</span></div>
          </div>
        </div>
      </div>

      {/* Dynamic Code Viewer Panel in 6 Languages */}
      <div className="p-6 bg-slate-950/95">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>Implementation Code for {info.name}</span>
          </div>

          {/* 6 Language Tabs */}
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
          code={info.code[selectedLang]}
          language={selectedLang}
          filename={`${algorithm}_sort.${activeLangConfig.fileExt}`}
          langLabel={activeLangConfig.label}
        />
      </div>
    </div>
  );
};
