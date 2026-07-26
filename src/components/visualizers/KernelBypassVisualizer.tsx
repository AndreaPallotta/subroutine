import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Code2, Zap } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';
import { CodeBlock } from '../ui/CodeBlock';

export type SupportedLanguage = 'cpp' | 'rust' | 'java' | 'ts';

const LANG_CONFIG: Record<SupportedLanguage, { label: string; fileExt: string }> = {
  cpp: { label: 'C++ (io_uring / DPDK)', fileExt: 'cpp' },
  rust: { label: 'Rust (io-uring crate)', fileExt: 'rs' },
  java: { label: 'Java (Netty DirectBuffer / io_uring)', fileExt: 'java' },
  ts: { label: 'TypeScript (Node.js Direct Memory Buffer)', fileExt: 'ts' },
};

const CODE_EXAMPLES: Record<SupportedLanguage, string> = {
  cpp: `// High-Performance Network IO Comparison in C++
#include <sys/socket.h>
#include <liburing.h>
#include <iostream>

// 1. Traditional POSIX Syscall Socket (High Context-Switch Overhead)
void receivePosix(int sockfd, char* buffer, size_t size) {
    // Triggers OS context switch: User Mode -> Kernel Mode -> User Mode
    ssize_t bytes_received = recv(sockfd, buffer, size, 0);
}

// 2. Modern Linux io_uring Kernel Bypass (Zero Context Switch Copy)
void receiveIoUring(struct io_uring* ring, int sockfd, char* buffer, size_t size) {
    struct io_uring_sqe* sqe = io_uring_get_sqe(ring);
    io_uring_prep_recv(sqe, sockfd, buffer, size, 0);
    io_uring_submit(ring); // Ring buffer shared between User & Kernel memory!
}`,
  rust: `// Linux io_uring Zero-Copy Networking in Rust
use io_uring::{opcode, IoUring};
use std::os::unix::io::AsRawFd;

fn main_uring_loop(fd: i32, buf: &mut [u8]) {
    let mut ring = IoUring::new(256).unwrap();
    let recv_e = opcode::Recv::new(io_uring::types::Fd(fd), buf.as_mut_ptr(), buf.len() as _)
        .build();

    unsafe { ring.submission().push(&recv_e).unwrap(); }
    ring.submit().unwrap();
}`,
  java: `// Java Netty DirectBuffer Off-Heap Zero-Copy Receive
import io.netty.buffer.Unpooled;
import io.netty.buffer.ByteBuf;
import java.nio.ByteBuffer;

public class ZeroCopyNetwork {
    public static void receiveDirectBuffer() {
        // Off-heap native memory allocation bypasses JVM Heap GC copying
        ByteBuf directBuf = Unpooled.directBuffer(4096);
        ByteBuffer nativeBuffer = ByteBuffer.allocateDirect(4096);
        
        // Data written by NIC ring buffer directly into native memory
        System.out.println("Capacity: " + nativeBuffer.capacity());
    }
}`,
  ts: `// Node.js Direct Memory Buffer Off-Heap Network I/O
import fs from 'fs';
import { Buffer } from 'buffer';

export function receiveZeroCopyBuffer(): void {
  // Allocate 4KB off-heap C++ unmanaged memory buffer
  const directBuffer = Buffer.allocUnsafe(4096);

  // Direct kernel read into shared libuv memory buffer
  const fd = 0; // Standard input / socket descriptor
  fs.readSync(fd, directBuffer, 0, 4096, null);
}`
};

export const KernelBypassVisualizer: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('cpp');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [packetCountInput, setPacketCountInput] = useState<number>(1); // Default 1 packet!
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0); // Default 1x speed!

  const [posixCompletedPackets, setPosixCompletedPackets] = useState<number>(0);
  const [bypassCompletedPackets, setBypassCompletedPackets] = useState<number>(0);
  const [posixContextSwitches, setPosixContextSwitches] = useState<number>(0);

  const [posixHop, setPosixHop] = useState<number>(0);
  const [bypassHop, setBypassHop] = useState<number>(0);
  const [posixFinished, setPosixFinished] = useState<boolean>(false);
  const [bypassFinished, setBypassFinished] = useState<boolean>(false);

  const canvasPosixRef = useRef<HTMLCanvasElement | null>(null);
  const canvasBypassRef = useRef<HTMLCanvasElement | null>(null);

  const startBenchmark = () => {
    if (isRunning) return;
    setIsRunning(true);
    setPosixCompletedPackets(0);
    setBypassCompletedPackets(0);
    setPosixContextSwitches(0);
    setPosixHop(0);
    setBypassHop(0);
    setPosixFinished(false);
    setBypassFinished(false);

    const baseDelay = 400 / speedMultiplier;
    const targetPackets = packetCountInput;

    // 1. Kernel Bypass Timer (FASTER: 250ms base per hop!)
    let bypassHopsCount = 0;
    const bypassInterval = setInterval(() => {
      bypassHopsCount += 1;
      setBypassHop(bypassHopsCount % 5);

      if (bypassHopsCount % 5 === 0) {
        setBypassCompletedPackets(prev => Math.min(prev + 1, targetPackets));
      }

      audioEngine.playValueTone(600 + (bypassHopsCount % 5) * 50, 10, 80, 0.04);

      if (bypassHopsCount >= targetPackets * 5) {
        clearInterval(bypassInterval);
        setBypassFinished(true);
      }
    }, baseDelay);

    // 2. POSIX Syscalls Timer (SLOWER: 500ms base per hop due to OS context switch overhead!)
    let posixHopsCount = 0;
    const posixInterval = setInterval(() => {
      posixHopsCount += 1;
      setPosixHop(posixHopsCount % 7);

      if (posixHopsCount % 7 === 0) {
        setPosixCompletedPackets(prev => Math.min(prev + 1, targetPackets));
        setPosixContextSwitches(prev => prev + 2);
      }

      audioEngine.playValueTone(300 + (posixHopsCount % 7) * 30, 10, 80, 0.04);

      if (posixHopsCount >= targetPackets * 7) {
        clearInterval(posixInterval);
        setPosixFinished(true);
        setIsRunning(false);
      }
    }, baseDelay * 1.8);
  };

  const resetBenchmark = () => {
    setIsRunning(false);
    setPosixCompletedPackets(0);
    setBypassCompletedPackets(0);
    setPosixContextSwitches(0);
    setPosixHop(0);
    setBypassHop(0);
    setPosixFinished(false);
    setBypassFinished(false);
  };

  // Render 2D Network Topologies Side-by-Side
  useEffect(() => {
    // POSIX Topology (Network Switch -> NIC Card -> Kernel Sockets -> User App -> Kernel Sockets -> NIC Card -> Network Switch)
    const posixCanvas = canvasPosixRef.current;
    if (posixCanvas) {
      const ctx = posixCanvas.getContext('2d');
      if (ctx) {
        const w = posixCanvas.width;
        const h = posixCanvas.height;
        ctx.fillStyle = '#080c16';
        ctx.fillRect(0, 0, w, h);

        const nodes = [
          { name: 'Network Switch', x: 60, y: 110, color: '#38bdf8' },
          { name: 'NIC Card', x: 160, y: 110, color: '#a855f7' },
          { name: 'Kernel Sockets', x: 260, y: 110, color: '#f43f5e' },
          { name: 'User App', x: 360, y: 110, color: '#10b981' }
        ];

        // Draw connections
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < nodes.length - 1; i++) {
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[i + 1].x, nodes[i + 1].y);
        }
        ctx.stroke();

        // Draw Nodes with Node-by-Node Hit Highlighting
        nodes.forEach((n, idx) => {
          const isHit = isRunning && (
            (posixHop === 0 && idx === 0) ||
            (posixHop === 1 && idx === 1) ||
            (posixHop === 2 && idx === 2) ||
            (posixHop === 3 && idx === 3) ||
            (posixHop === 4 && idx === 2) ||
            (posixHop === 5 && idx === 1) ||
            (posixHop === 6 && idx === 0)
          );

          ctx.fillStyle = isHit ? n.color : '#1e293b';
          ctx.shadowColor = isHit ? n.color : 'transparent';
          ctx.shadowBlur = isHit ? 16 : 0;
          ctx.beginPath();
          ctx.arc(n.x, n.y, isHit ? 14 : 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.fillStyle = isHit ? '#ffffff' : '#94a3b8';
          ctx.font = isHit ? 'bold 9px Fira Code' : '8px Fira Code';
          ctx.fillText(n.name, n.x - 28, n.y + 24);
        });
      }
    }

    // Kernel Bypass Topology (Network Switch -> NIC Card -> User App [Kernel Bypassed!] -> NIC Card -> Network Switch)
    const bypassCanvas = canvasBypassRef.current;
    if (bypassCanvas) {
      const ctx = bypassCanvas.getContext('2d');
      if (ctx) {
        const w = bypassCanvas.width;
        const h = bypassCanvas.height;
        ctx.fillStyle = '#080c16';
        ctx.fillRect(0, 0, w, h);

        const nodes = [
          { name: 'Network Switch', x: 60, y: 110, color: '#38bdf8' },
          { name: 'NIC Card', x: 160, y: 110, color: '#a855f7' },
          { name: 'Kernel (Bypassed)', x: 260, y: 180, color: '#475569' }, // Dim bypassed node
          { name: 'User App', x: 360, y: 110, color: '#10b981' }
        ];

        // Direct Bypass connection (NIC Card <-> User App)
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(nodes[0].x, nodes[0].y);
        ctx.lineTo(nodes[1].x, nodes[1].y);
        ctx.lineTo(nodes[3].x, nodes[3].y);
        ctx.stroke();

        // Draw Nodes
        nodes.forEach((n, idx) => {
          const isHit = isRunning && (
            (bypassHop === 0 && idx === 0) ||
            (bypassHop === 1 && idx === 1) ||
            (bypassHop === 2 && idx === 3) ||
            (bypassHop === 3 && idx === 1) ||
            (bypassHop === 4 && idx === 0)
          );

          ctx.fillStyle = isHit ? n.color : (idx === 2 ? '#0f172a' : '#1e293b');
          ctx.shadowColor = isHit ? n.color : 'transparent';
          ctx.shadowBlur = isHit ? 16 : 0;
          ctx.beginPath();
          ctx.arc(n.x, n.y, isHit ? 14 : 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.fillStyle = isHit ? '#ffffff' : (idx === 2 ? '#64748b' : '#94a3b8');
          ctx.font = isHit ? 'bold 9px Fira Code' : '8px Fira Code';
          ctx.fillText(n.name, n.x - 28, n.y + 24);
        });
      }
    }
  }, [posixHop, bypassHop, isRunning]);

  const activeLangConfig = LANG_CONFIG[selectedLang];

  return (
    <div className="my-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
      <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Kernel Bypass Network Topology (io_uring / DPDK)</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              ⚡ Zero Context Switches
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Side-by-side real-time packet flow comparison: <code className="text-rose-400">POSIX Syscall Sockets</code> vs <code className="text-emerald-400">io_uring Kernel Bypass</code>.
          </p>
        </div>
      </div>

      {/* Dual Side-by-Side Network Topology Canvases */}
      <div className="p-6 bg-slate-950/90 border-b border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
        {/* POSIX Graph */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-2">
            <span className="font-bold text-rose-400 text-sm">1. POSIX Syscall Sockets</span>
            <span className="text-[10px] text-slate-400">Context Switches: {posixContextSwitches}</span>
          </div>
          <canvas ref={canvasPosixRef} width={420} height={160} className="rounded-lg bg-slate-950 border border-slate-800/80 mb-3" />
          <div className="w-full text-slate-400 text-[11px] flex justify-between">
            <span>Completed Packets:</span>
            <span className="font-bold text-rose-400">{posixCompletedPackets} / {packetCountInput}</span>
          </div>
        </div>

        {/* Kernel Bypass Graph */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-2">
            <span className="font-bold text-emerald-400 text-sm flex items-center gap-2">
              <span>2. io_uring Kernel Bypass</span>
              {bypassFinished && <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">⚡ FINISHED FIRST!</span>}
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">Kernel Bypassed!</span>
          </div>
          <canvas ref={canvasBypassRef} width={420} height={160} className="rounded-lg bg-slate-950 border border-slate-800/80 mb-3" />
          <div className="w-full text-slate-400 text-[11px] flex justify-between">
            <span>Completed Packets:</span>
            <span className="font-bold text-emerald-400">{bypassCompletedPackets} / {packetCountInput}</span>
          </div>
        </div>
      </div>

      {/* Grouped Action Toolbar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap justify-center items-center gap-4 font-mono text-xs">
        {/* Packets Input */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-slate-300 font-bold">Packets to Send:</span>
          <input
            type="number" min="1" max="50" value={packetCountInput}
            onChange={e => setPacketCountInput(Math.min(50, Math.max(1, Number(e.target.value))))}
            className="w-14 px-2 py-1 bg-slate-950 rounded border border-slate-700 text-center font-bold text-cyan-300 focus:outline-none"
          />
        </div>

        {/* Send Button */}
        <button
          onClick={startBenchmark}
          disabled={isRunning}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-extrabold text-xs bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 hover:from-emerald-400 hover:to-indigo-400 text-white shadow-lg shadow-emerald-500/20 border border-emerald-300/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
        >
          <Zap className="w-4 h-4 fill-white text-white" />
          <span>Send {packetCountInput} Packets</span>
        </button>

        {/* Speed Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 px-2 font-bold">Speed:</span>
          {[0.2, 0.5, 1.0, 2.0].map(s => (
            <button
              key={s}
              onClick={() => setSpeedMultiplier(s)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                speedMultiplier === s ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <button
          onClick={resetBenchmark}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
          title="Reset Network Simulation"
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

      <div className="p-6 bg-slate-950/95">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>Kernel Bypass Network Implementation Code</span>
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
          filename={`kernel_bypass.${activeLangConfig.fileExt}`}
          label={activeLangConfig.label}
        />
      </div>
    </div>
  );
};
