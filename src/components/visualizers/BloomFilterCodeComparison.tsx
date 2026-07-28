import React from 'react';
import { TabbedCodeBlock } from '../ui/TabbedCodeBlock';

export const BloomFilterCodeComparison: React.FC = () => {
  const snippets = {
    cpp: {
      label: 'C++',
      ext: 'cpp',
      lang: 'cpp',
      code: `#include <iostream>
#include <vector>
#include <string>
#include <functional>

class BloomFilter {
private:
    std::vector<bool> bitArray;
    size_t size;

    size_t hash1(const std::string& key) const {
        return std::hash<std::string>{}(key) % size;
    }

    size_t hash2(const std::string& key) const {
        size_t hash = 5381;
        for (char c : key) hash = ((hash << 5) + hash) + c;
        return hash % size;
    }

public:
    BloomFilter(size_t bits) : size(bits), bitArray(bits, false) {}

    void insert(const std::string& key) {
        bitArray[hash1(key)] = true;
        bitArray[hash2(key)] = true;
    }

    bool contains(const std::string& key) const {
        // Guaranteed 100% false negative free!
        return bitArray[hash1(key)] && bitArray[hash2(key)];
    }
};`
    },
    python: {
      label: 'Python',
      ext: 'py',
      lang: 'python',
      code: `import hashlib

class BloomFilter:
    def __init__(self, size_in_bits=1024):
        self.size = size_in_bits
        self.bit_array = [False] * size_in_bits

    def _hashes(self, key: str):
        # Generate 2 independent hash indices via FNV-1a & MD5
        h1 = int(hashlib.md5(key.encode()).hexdigest(), 16) % self.size
        h2 = hash(key) % self.size
        return h1, h2

    def insert(self, key: str):
        h1, h2 = self._hashes(key)
        self.bit_array[h1] = True
        self.bit_array[h2] = True

    def contains(self, key: str) -> bool:
        # Returns False -> 100% Definitely Not in Set (Bypass Disk/DB)
        h1, h2 = self._hashes(key)
        return self.bit_array[h1] and self.bit_array[h2]`
    },
    java: {
      label: 'Java',
      ext: 'java',
      lang: 'java',
      code: `import java.util.BitSet;

public class BloomFilter {
    private final BitSet bitSet;
    private final int size;

    public BloomFilter(int size) {
        this.size = size;
        this.bitSet = new BitSet(size);
    }

    private int hash1(String key) {
        return Math.abs(key.hashCode() % size);
    }

    private int hash2(String key) {
        int hash = 7;
        for (int i = 0; i < key.length(); i++) {
            hash = hash * 31 + key.charAt(i);
        }
        return Math.abs(hash % size);
    }

    public void insert(String key) {
        bitSet.set(hash1(key));
        bitSet.set(hash2(key));
    }

    public boolean contains(String key) {
        return bitSet.get(hash1(key)) && bitSet.get(hash2(key));
    }
}`
    },
    go: {
      label: 'Go',
      ext: 'go',
      lang: 'go',
      code: `package main

import (
	"hash/fnv"
)

type BloomFilter struct {
	bits []bool
	size uint32
}

func NewBloomFilter(size uint32) *BloomFilter {
	return &BloomFilter{
		bits: make([]bool, size),
		size: size,
	}
}

func (bf *BloomFilter) hash1(key string) uint32 {
	h := fnv.New32a()
	h.Write([]byte(key))
	return h.Sum32() % bf.size
}

func (bf *BloomFilter) Insert(key string) {
	bf.bits[bf.hash1(key)] = true
}

func (bf *BloomFilter) Contains(key string) bool {
	return bf.bits[bf.hash1(key)]
}`
    },
    rust: {
      label: 'Rust',
      ext: 'rs',
      lang: 'rust',
      code: `use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

pub struct BloomFilter {
    bits: Vec<bool>,
    size: usize,
}

impl BloomFilter {
    pub fn new(size: usize) -> Self {
        BloomFilter {
            bits: vec![false; size],
            size,
        }
    }

    fn hash<T: Hash>(&self, item: &T) -> usize {
        let mut hasher = DefaultHasher::new();
        item.hash(&mut hasher);
        (hasher.finish() as usize) % self.size
    }

    pub fn insert<T: Hash>(&mut self, item: &T) {
        let idx = self.hash(item);
        self.bits[idx] = true;
    }

    pub fn contains<T: Hash>(&self, item: &T) -> bool {
        let idx = self.hash(item);
        self.bits[idx]
    }
}`
    },
    typescript: {
      label: 'TypeScript',
      ext: 'ts',
      lang: 'ts',
      code: `export class BloomFilter {
  private bits: Uint8Array;
  private size: number;

  constructor(sizeInBits: number = 1024) {
    this.size = sizeInBits;
    this.bits = new Uint8Array(Math.ceil(sizeInBits / 8));
  }

  private hash1(key: string): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) % this.size;
    }
    return Math.abs(hash);
  }

  public insert(key: string): void {
    const idx = this.hash1(key);
    const byteIdx = Math.floor(idx / 8);
    const bitIdx = idx % 8;
    this.bits[byteIdx] |= (1 << bitIdx);
  }

  public contains(key: string): boolean {
    const idx = this.hash1(key);
    const byteIdx = Math.floor(idx / 8);
    const bitIdx = idx % 8;
    return (this.bits[byteIdx] & (1 << bitIdx)) !== 0;
  }
}`
    }
  };

  return <TabbedCodeBlock title="Bloom Filter Implementation in 6 Languages" snippets={snippets} defaultLang="cpp" />;
};
