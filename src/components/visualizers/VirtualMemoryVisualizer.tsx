import React, { useState, useRef, useEffect } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Code2, AlertTriangle, Cpu } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';
import { CodeBlock } from '../ui/CodeBlock';

export type SupportedLanguage = 'cpp' | 'rust' | 'java' | 'ts';
export type TranslationOutcome = 'hit' | 'miss' | 'fault' | 'segfault';

const LANG_CONFIG: Record<SupportedLanguage, { label: string; fileExt: string }> = {
  cpp: { label: 'C++ (MMU Page Walk)', fileExt: 'cpp' },
  rust: { label: 'Rust (x86_64 Page Table)', fileExt: 'rs' },
  java: { label: 'Java (Unsafe Address Simulation)', fileExt: 'java' },
  ts: { label: 'TypeScript (Virtual Memory MMU)', fileExt: 'ts' },
};

const CODE_EXAMPLES: Record<SupportedLanguage, string> = {
  cpp: `// Hardware MMU Page Table Translation in C++
#include <iostream>
#include <cstdint>

struct PageTableEntry {
    uint64_t physicalFrameNumber : 40;
    uint64_t present : 1;
    uint64_t readWrite : 1;
    uint64_t userSupervisor : 1;
};

uint64_t translateAddress(uint64_t virtualAddr, PageTableEntry* pageTable) {
    uint64_t vpn = (virtualAddr >> 12) & 0xFFFFF; // Extract 20-bit Virtual Page Number
    uint64_t offset = virtualAddr & 0xFFF;         // Extract 12-bit Page Offset (4KB)

    PageTableEntry pte = pageTable[vpn];
    if (!pte.present) {
        throw std::runtime_error("SIGSEGV: Segmentation Fault - Invalid Memory Access!");
    }

    // Physical Address = (PFN << 12) | Offset
    return (pte.physicalFrameNumber << 12) | offset;
}`,
  rust: `// x86_64 4-Level Page Table Translation in Rust
pub struct PageTableEntry {
    pub pfn: u64,
    pub present: bool,
}

pub fn translate_virtual_address(virt_addr: u64, pte: &PageTableEntry) -> Result<u64, &'static str> {
    let offset = virt_addr & 0xFFF; // 12-bit 4KB offset
    if !pte.present {
        return Err("SIGSEGV: Segmentation Fault (Core Dumped)");
    }
    Ok((pte.pfn << 12) | offset)
}`,
  java: `// Virtual Memory Page Table Lookup in Java
public class MemoryManagementUnit {
    public static class PageTableEntry {
        public long pfn;
        public boolean present;
        public PageTableEntry(long pfn, boolean present) {
            this.pfn = pfn; this.present = present;
        }
    }

    public static long translate(long virtualAddr, PageTableEntry pte) {
        long offset = virtualAddr & 0xFFFL; // 12-bit 4KB offset
        if (!pte.present) {
            throw new NullPointerException("SIGSEGV: Segmentation Fault - Address Unmapped!");
        }
        return (pte.pfn << 12) | offset;
    }
}`,
  ts: `// Virtual Memory MMU Bitwise Address Translation in TypeScript
export interface PageTableEntry {
  pfn: number; // Physical Frame Number
  present: boolean;
}

export function translateAddress(virtualHex: string, pte: PageTableEntry): string {
  const virtAddr = parseInt(virtualHex, 16);
  const offset = virtAddr & 0xfff; // Lower 12 bits (4KB page offset)

  if (!pte.present) {
    throw new Error('SIGSEGV: Segmentation Fault (core dumped) - Unmapped Address!');
  }

  const physAddr = (pte.pfn << 12) | offset;
  return '0x' + physAddr.toString(16).toUpperCase();
}`
};

export const VirtualMemoryVisualizer: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('cpp');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [virtualAddrInput, setVirtualAddrInput] = useState<string>('0x7FFF004');
  const [outcome, setOutcome] = useState<TranslationOutcome>('hit');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [physicalAddr, setPhysicalAddr] = useState<string>('0x4A2004');
  const [segfaultMessage, setSegfaultMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Parse Virtual Page Number (VPN) and Offset
  const vpn = virtualAddrInput.length > 3 ? virtualAddrInput.substring(0, virtualAddrInput.length - 3) : '0x7FFF';
  const offset = virtualAddrInput.length > 3 ? virtualAddrInput.substring(virtualAddrInput.length - 3) : '004';

  const triggerTranslation = (mode: TranslationOutcome) => {
    if (isRunning) return;
    setOutcome(mode);
    setIsRunning(true);
    setActiveStep(0);
    setSegfaultMessage(null);

    const stepTarget = mode === 'hit' ? 3 : mode === 'miss' ? 4 : mode === 'fault' ? 5 : 3;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep += 1;
      setActiveStep(currentStep);

      if (mode === 'hit') audioEngine.playValueTone(800, 10, 80, 0.05);
      else if (mode === 'miss') audioEngine.playValueTone(500, 10, 80, 0.05);
      else if (mode === 'fault') audioEngine.playValueTone(300, 10, 80, 0.05);
      else audioEngine.playValueTone(150, 10, 150, 0.1);

      if (currentStep >= stepTarget) {
        clearInterval(interval);
        setIsRunning(false);

        if (mode === 'segfault') {
          setPhysicalAddr('UNMAPPED ADDRESS (No Physical RAM Frame)');
          setSegfaultMessage('⚠️ SIGSEGV: Segmentation Fault (core dumped) - Invalid Pointer Access!');
        } else {
          setPhysicalAddr(`0x4A2${offset}`);
        }
        audioEngine.playCompletionTone();
      }
    }, 450);
  };

  // Render 2D MMU Architecture Diagram Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#080c16';
    ctx.fillRect(0, 0, w, h);

    // Blocks: Virtual Address -> TLB Cache -> Page Table -> Physical RAM
    const blocks = [
      { name: 'Virtual Address', x: 60, y: 110, color: '#38bdf8' },
      { name: 'MMU / TLB Cache', x: 190, y: 110, color: outcome === 'hit' ? '#10b981' : '#f59e0b' },
      { name: 'Page Table (RAM)', x: 320, y: 110, color: outcome === 'segfault' ? '#f43f5e' : '#a855f7' },
      { name: 'Physical RAM Frame', x: 450, y: 110, color: outcome === 'segfault' ? '#475569' : '#10b981' }
    ];

    // Connections
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(blocks[0].x, blocks[0].y); ctx.lineTo(blocks[1].x, blocks[1].y);
    ctx.lineTo(blocks[2].x, blocks[2].y); ctx.lineTo(blocks[3].x, blocks[3].y);
    ctx.stroke();

    // Render Blocks
    blocks.forEach((b, idx) => {
      const isStepActive = isRunning && activeStep === idx + 1;
      ctx.fillStyle = isStepActive ? b.color : '#1e293b';
      ctx.shadowColor = isStepActive ? b.color : 'transparent';
      ctx.shadowBlur = isStepActive ? 18 : 0;

      ctx.beginPath();
      ctx.arc(b.x, b.y, isStepActive ? 14 : 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = isStepActive ? '#ffffff' : '#94a3b8';
      ctx.font = isStepActive ? 'bold 9px Fira Code' : '8px Fira Code';
      ctx.fillText(b.name, b.x - 30, b.y + 24);
    });
  }, [activeStep, isRunning, outcome]);

  const activeLangConfig = LANG_CONFIG[selectedLang];

  return (
    <div className="my-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
      <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Virtual Memory MMU Page Translation</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
              Hardware Address Mapping
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Translate virtual hex addresses into physical RAM offsets via the <code className="text-cyan-300">TLB Cache</code> and <code className="text-purple-300">Multi-Level Page Table</code>.
          </p>
        </div>
      </div>

      <div className="p-6 bg-slate-950/90 border-b border-slate-800 flex flex-col items-center gap-6 font-mono text-xs">
        {/* Address Bit Splitting */}
        <div className="w-full max-w-2xl p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 font-bold">Virtual Hex Address:</span>
            <input
              type="text" value={virtualAddrInput}
              onChange={e => setVirtualAddrInput(e.target.value)}
              className="w-28 px-2 py-1 bg-slate-950 rounded border border-slate-700 text-center font-bold text-cyan-300 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <div className="px-3 py-1 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
              VPN (Page Index): <span className="font-bold">{vpn}</span>
            </div>
            <div className="px-3 py-1 rounded bg-purple-950 border border-purple-500/40 text-purple-300">
              Offset (4KB): <span className="font-bold">{offset}</span>
            </div>
          </div>
        </div>

        {/* 2D MMU Architecture Canvas */}
        <canvas ref={canvasRef} width={520} height={160} className="rounded-xl bg-slate-950 border border-slate-800 shadow-inner" />

        {/* Segfault Warning Alert */}
        {segfaultMessage && (
          <div className="w-full max-w-2xl p-3.5 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 flex items-center gap-3 animate-pulse shadow-lg">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="font-bold text-xs">{segfaultMessage}</span>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-2xl">
          <button
            onClick={() => triggerTranslation('hit')}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg border border-emerald-400 transition-all disabled:opacity-40"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>TLB Hit (Fast 1-Cycle)</span>
          </button>

          <button
            onClick={() => triggerTranslation('miss')}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white shadow-lg border border-amber-400 transition-all disabled:opacity-40"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Page Table Walk</span>
          </button>

          <button
            onClick={() => triggerTranslation('segfault')}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-lg border border-rose-400 shadow-rose-600/30 transition-all disabled:opacity-40"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-white" />
            <span>Simulate Segfault (0xDEADBEEF)</span>
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

      <div className="p-6 bg-slate-950/95">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>Hardware MMU Implementation Code</span>
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
          filename={`mmu_translation.${activeLangConfig.fileExt}`}
          langLabel={activeLangConfig.label}
        />
      </div>
    </div>
  );
};
