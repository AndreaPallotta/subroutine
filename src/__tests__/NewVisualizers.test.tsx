import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { BTreeLsmVisualizer } from '../components/visualizers/BTreeLsmVisualizer';
import { TransformerAttentionVisualizer } from '../components/visualizers/TransformerAttentionVisualizer';
import { EccVisualizer } from '../components/visualizers/EccVisualizer';
import { RaftConsensusVisualizer } from '../components/visualizers/RaftConsensusVisualizer';
import { ReactFiberVisualizer } from '../components/visualizers/ReactFiberVisualizer';
import { SkipListVisualizer } from '../components/visualizers/SkipListVisualizer';
import { WasmSimdVisualizer } from '../components/visualizers/WasmSimdVisualizer';
import { ZkProofVisualizer } from '../components/visualizers/ZkProofVisualizer';
import { ZgcVisualizer } from '../components/visualizers/ZgcVisualizer';

describe('New Interactive Visualizers Unit Tests', () => {
  it('renders and switches tabs in BTreeLsmVisualizer', () => {
    render(<BTreeLsmVisualizer />);
    expect(screen.getByText('B+ Tree (In-Place)')).toBeInTheDocument();
    
    const lsmTab = screen.getByRole('button', { name: 'LSM-Tree (Append-Only)' });
    fireEvent.click(lsmTab);
    expect(screen.getByText('1. Disk WAL (Append-Only)')).toBeInTheDocument();
  });

  it('renders TransformerAttentionVisualizer and changes query token', () => {
    render(<TransformerAttentionVisualizer />);
    expect(screen.getByText('Transformer Self-Attention Matrix Mechanics')).toBeInTheDocument();
    
    const tokenBtn = screen.getByRole('button', { name: 'animal' });
    fireEvent.click(tokenBtn);
    expect(screen.getByText('Query Token: "animal" (Index #1)')).toBeInTheDocument();
  });

  it('renders EccVisualizer and computes key exchange', () => {
    render(<EccVisualizer />);
    expect(screen.getByText('Elliptic Curve Diffie-Hellman (ECDH) Key Exchange')).toBeInTheDocument();
    expect(screen.getByText('Identical Shared AES Key Agreed!')).toBeInTheDocument();
  });

  it('renders RaftConsensusVisualizer and triggers election', () => {
    render(<RaftConsensusVisualizer />);
    expect(screen.getByText('Raft Distributed Consensus & Leader Election')).toBeInTheDocument();
    
    const killBtn = screen.getByRole('button', { name: 'Kill Active Leader Node' });
    fireEvent.click(killBtn);
    expect(screen.getByText(/LEADER FAILURE/i)).toBeInTheDocument();
  });

  it('renders ReactFiberVisualizer and triggers setState mutation', () => {
    render(<ReactFiberVisualizer />);
    expect(screen.getByText('React Fiber Architecture & Reconciliation')).toBeInTheDocument();
    
    const stateBtn = screen.getByRole('button', { name: /Trigger setState/i });
    fireEvent.click(stateBtn);
    expect(screen.getByText(/STATE MUTATION/i)).toBeInTheDocument();
  });

  it('renders SkipListVisualizer and inserts node', () => {
    render(<SkipListVisualizer />);
    expect(screen.getByText('SkipList Probabilistic Multi-Level Search')).toBeInTheDocument();
    
    const insertBtn = screen.getByRole('button', { name: 'Coin Flip & Insert' });
    fireEvent.click(insertBtn);
    expect(screen.getByText(/Inserted node/i)).toBeInTheDocument();
  });

  it('renders WasmSimdVisualizer and executes SIMD multiplication', () => {
    render(<WasmSimdVisualizer />);
    expect(screen.getByText('WebAssembly (Wasm) 128-bit SIMD Vector Execution')).toBeInTheDocument();
    
    const execBtn = screen.getByRole('button', { name: 'Execute Vector Instruction (v128.mul)' });
    fireEvent.click(execBtn);
    expect(screen.getByText(/Wasm SIMD 128-bit Instruction/i)).toBeInTheDocument();
  });

  it('renders ZkProofVisualizer and evaluates proof', () => {
    render(<ZkProofVisualizer />);
    expect(screen.getByText('Zero-Knowledge Proofs (zk-SNARKs) & KZG Commitments')).toBeInTheDocument();
    
    const proofBtn = screen.getByRole('button', { name: 'Generate & Verify Proof' });
    fireEvent.click(proofBtn);
    expect(screen.getByText(/PROOF VERIFIED/i)).toBeInTheDocument();
  });

  it('renders ZgcVisualizer and advances GC phase', () => {
    render(<ZgcVisualizer />);
    expect(screen.getByText('ZGC & Shenandoah Pauseless Garbage Collection')).toBeInTheDocument();
    
    const gcBtn = screen.getByRole('button', { name: /Advance Concurrent GC Phase/i });
    fireEvent.click(gcBtn);
    expect(screen.getByText(/ZGC PHASE 1/i)).toBeInTheDocument();
  });
});
