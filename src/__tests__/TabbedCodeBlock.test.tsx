import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TabbedCodeBlock } from '../components/ui/TabbedCodeBlock';

describe('TabbedCodeBlock UI Component Tests', () => {
  const sampleSnippets = {
    go: {
      label: 'Go (etcd / Raft RPC)',
      ext: 'go',
      lang: 'go',
      filename: 'raft_node.go',
      code: 'package main\n\ntype RaftNode struct {}',
    },
    rust: {
      label: 'Rust (tokio-raft)',
      ext: 'rs',
      lang: 'rust',
      filename: 'raft_node.rs',
      code: 'pub struct RaftState {}',
    },
  };

  it('renders default language tab content initially', () => {
    render(<TabbedCodeBlock title="Raft RPC Implementation" snippets={sampleSnippets} />);
    
    // Default selected tab label and filename should be present
    expect(screen.getAllByText('Go (etcd / Raft RPC)')[0]).toBeInTheDocument();
    expect(screen.getByText('raft_node.go')).toBeInTheDocument();
  });

  it('switches content active state when clicking another tab (e.g. Rust)', () => {
    render(<TabbedCodeBlock title="Raft RPC Implementation" snippets={sampleSnippets} />);
    
    const rustBtn = screen.getByRole('button', { name: 'Rust (tokio-raft)' });
    fireEvent.click(rustBtn);

    // After clicking Rust, filename and content should update to Rust
    expect(screen.getByText('raft_node.rs')).toBeInTheDocument();
  });
});
