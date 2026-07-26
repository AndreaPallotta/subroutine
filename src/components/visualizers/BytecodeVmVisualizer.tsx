import React, { useState } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Code2, ArrowRight } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';
import { CodeBlock } from '../ui/CodeBlock';

export type SupportedLanguage = 'cpp' | 'python' | 'java' | 'go' | 'rust' | 'ts';

interface Instruction {
  op: string;
  arg?: number | string;
}

const PROGRAM_PRESETS: Record<string, { label: string; code: Instruction[] }> = {
  complexMath: {
    label: 'Complex Formula: (10 + 20 * 3) - (8 / 2)',
    code: [
      { op: 'PUSH', arg: 10 },
      { op: 'PUSH', arg: 20 },
      { op: 'PUSH', arg: 3 },
      { op: 'MUL' },       // 20 * 3 = 60
      { op: 'ADD' },       // 10 + 60 = 70
      { op: 'PUSH', arg: 8 },
      { op: 'PUSH', arg: 2 },
      { op: 'DIV' },       // 8 / 2 = 4
      { op: 'SUB' },       // 70 - 4 = 66
      { op: 'STORE', arg: 'result' },
    ]
  },
  quadratic: {
    label: 'Quadratic Polynomial: 3 * x^2 + 5 * x + 2 (x=4)',
    code: [
      { op: 'PUSH', arg: 4 },  // x
      { op: 'PUSH', arg: 4 },  // x
      { op: 'MUL' },          // x^2 = 16
      { op: 'PUSH', arg: 3 },  // a=3
      { op: 'MUL' },          // 3 * 16 = 48
      { op: 'PUSH', arg: 5 },  // b=5
      { op: 'PUSH', arg: 4 },  // x=4
      { op: 'MUL' },          // 5 * 4 = 20
      { op: 'ADD' },          // 48 + 20 = 68
      { op: 'PUSH', arg: 2 },  // c=2
      { op: 'ADD' },          // 68 + 2 = 70
      { op: 'STORE', arg: 'poly' },
    ]
  }
};

const LANG_CONFIG: Record<SupportedLanguage, { label: string; fileExt: string }> = {
  cpp: { label: 'C++', fileExt: 'cpp' },
  python: { label: 'Python (dis module)', fileExt: 'py' },
  java: { label: 'Java (JVM Bytecode)', fileExt: 'java' },
  go: { label: 'Go', fileExt: 'go' },
  rust: { label: 'Rust', fileExt: 'rs' },
  ts: { label: 'TypeScript', fileExt: 'ts' },
};

const CODE_EXAMPLES: Record<SupportedLanguage, string> = {
  python: `# Disassembling Complex Python Bytecode
import dis

def compute_formula():
    x = 4
    # (10 + 20 * 3) - (8 / 2)
    result = (10 + 20 * 3) - (8 // 2)
    return result

# Disassemble into CPython opcode stack operations
dis.dis(compute_formula)`,
  cpp: `// Virtual Machine Bytecode Evaluation Loop in C++
#include <vector>
#include <iostream>

enum OpCode { OP_PUSH, OP_ADD, OP_SUB, OP_MUL, OP_DIV, OP_STORE };

struct Instruction { OpCode op; int arg; };

void executeBytecode(const std::vector<Instruction>& code) {
    std::vector<int> stack;
    int ip = 0; // Instruction Pointer

    while (ip < code.size()) {
        Instruction inst = code[ip++];
        switch (inst.op) {
            case OP_PUSH: stack.push_back(inst.arg); break;
            case OP_ADD: {
                int b = stack.back(); stack.pop_back();
                int a = stack.back(); stack.pop_back();
                stack.push_back(a + b);
                break;
            }
            case OP_SUB: {
                int b = stack.back(); stack.pop_back();
                int a = stack.back(); stack.pop_back();
                stack.push_back(a - b);
                break;
            }
            case OP_MUL: {
                int b = stack.back(); stack.pop_back();
                int a = stack.back(); stack.pop_back();
                stack.push_back(a * b);
                break;
            }
            case OP_DIV: {
                int b = stack.back(); stack.pop_back();
                int a = stack.back(); stack.pop_back();
                stack.push_back(a / b);
                break;
            }
        }
    }
}`,
  java: `// JVM Stack Machine Interpreter in Java
import java.util.*;

public class BytecodeEngine {
    public static void execute(String[] opcodes, int[] args) {
        Stack<Integer> stack = new Stack<>();
        int ip = 0;

        while (ip < opcodes.length) {
            String op = opcodes[ip];
            int arg = args[ip];
            ip++;

            switch (op) {
                case "PUSH" -> stack.push(arg);
                case "ADD"  -> stack.push(stack.pop() + stack.pop());
                case "SUB"  -> { int b = stack.pop(), a = stack.pop(); stack.push(a - b); }
                case "MUL"  -> stack.push(stack.pop() * stack.pop());
                case "DIV"  -> { int b = stack.pop(), a = stack.pop(); stack.push(a / b); }
            }
        }
    }
}`,
  go: `// Stack VM Interpreter Dispatch Loop in Go
package main

import "fmt"

type Instruction struct {
	Op  string
	Arg int
}

func EvalBytecode(code []Instruction) int {
	stack := make([]int, 0)
	ip := 0

	for ip < len(code) {
		inst := code[ip]
		ip++

		switch inst.Op {
		case "PUSH":
			stack = append(stack, inst.Arg)
		case "ADD":
			b, a := stack[len(stack)-1], stack[len(stack)-2]
			stack = stack[:len(stack)-2]
			stack = append(stack, a+b)
		case "SUB":
			b, a := stack[len(stack)-1], stack[len(stack)-2]
			stack = stack[:len(stack)-2]
			stack = append(stack, a-b)
		case "MUL":
			b, a := stack[len(stack)-1], stack[len(stack)-2]
			stack = stack[:len(stack)-2]
			stack = append(stack, a*b)
		}
	}
	return stack[len(stack)-1]
}`,
  rust: `// Stack VM Evaluation Loop in Rust
enum Op { Push(i32), Add, Sub, Mul, Div }

fn eval_bytecode(code: &[Op]) -> i32 {
    let mut stack: Vec<i32> = Vec::new();
    let mut ip = 0;

    while ip < code.len() {
        match code[ip] {
            Op::Push(val) => stack.push(val),
            Op::Add => { let (b, a) = (stack.pop().unwrap(), stack.pop().unwrap()); stack.push(a + b); }
            Op::Sub => { let (b, a) = (stack.pop().unwrap(), stack.pop().unwrap()); stack.push(a - b); }
            Op::Mul => { let (b, a) = (stack.pop().unwrap(), stack.pop().unwrap()); stack.push(a * b); }
            Op::Div => { let (b, a) = (stack.pop().unwrap(), stack.pop().unwrap()); stack.push(a / b); }
        }
        ip += 1;
    }
    stack.pop().unwrap()
}`,
  ts: `// Stack Machine Evaluation Loop in TypeScript
interface Instruction {
  op: 'PUSH' | 'ADD' | 'SUB' | 'MUL' | 'DIV';
  arg?: number;
}

export function evalBytecode(code: Instruction[]): number {
  const stack: number[] = [];
  let ip = 0;

  while (ip < code.length) {
    const inst = code[ip++];
    if (inst.op === 'PUSH') {
      stack.push(inst.arg!);
    } else if (inst.op === 'ADD') {
      const b = stack.pop()!, a = stack.pop()!;
      stack.push(a + b);
    } else if (inst.op === 'SUB') {
      const b = stack.pop()!, a = stack.pop()!;
      stack.push(a - b);
    } else if (inst.op === 'MUL') {
      const b = stack.pop()!, a = stack.pop()!;
      stack.push(a * b);
    }
  }

  return stack[stack.length - 1];
}`
};

export const BytecodeVmVisualizer: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<string>('complexMath');
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('python');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  const instructions = PROGRAM_PRESETS[selectedPreset].code;

  const [ip, setIp] = useState<number>(0);
  const [stack, setStack] = useState<number[]>([]);
  const [variables, setVariables] = useState<Record<string, number>>({});

  const stepInstruction = () => {
    if (ip >= instructions.length) return;

    const inst = instructions[ip];
    const newStack = [...stack];
    const newVars = { ...variables };

    if (inst.op === 'PUSH') {
      newStack.push(inst.arg as number);
      audioEngine.playValueTone(350 + (inst.arg as number) * 15, 10, 80, 0.06);
    } else if (inst.op === 'ADD') {
      const b = newStack.pop() || 0;
      const a = newStack.pop() || 0;
      newStack.push(a + b);
      audioEngine.playValueTone(600, 10, 80, 0.06);
    } else if (inst.op === 'SUB') {
      const b = newStack.pop() || 0;
      const a = newStack.pop() || 0;
      newStack.push(a - b);
      audioEngine.playValueTone(550, 10, 80, 0.06);
    } else if (inst.op === 'MUL') {
      const b = newStack.pop() || 0;
      const a = newStack.pop() || 0;
      newStack.push(a * b);
      audioEngine.playValueTone(750, 10, 80, 0.06);
    } else if (inst.op === 'DIV') {
      const b = newStack.pop() || 1;
      const a = newStack.pop() || 0;
      newStack.push(Math.floor(a / b));
      audioEngine.playValueTone(500, 10, 80, 0.06);
    } else if (inst.op === 'STORE') {
      const val = newStack.pop() || 0;
      newVars[inst.arg as string] = val;
      audioEngine.playCompletionTone();
    }

    setStack(newStack);
    setVariables(newVars);
    setIp(prev => prev + 1);
  };

  const resetVM = (presetKey?: string) => {
    if (presetKey) setSelectedPreset(presetKey);
    setIp(0);
    setStack([]);
    setVariables({});
  };

  const activeLangConfig = LANG_CONFIG[selectedLang];

  return (
    <div className="my-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
      <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Virtual Machine Bytecode Execution Engine</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              Stack Height: {stack.length}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Step through CPython / JVM bytecode instructions. Watch the <code className="text-cyan-300">LIFO Operand Stack</code> grow and shrink!
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
          {Object.keys(PROGRAM_PRESETS).map(key => (
            <button
              key={key}
              onClick={() => resetVM(key)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedPreset === key ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {key === 'complexMath' ? 'Formula (10+20*3)-(8/2)' : 'Polynomial 3x^2+5x+2'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 bg-slate-950/90 border-b border-slate-800 font-mono text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          
          {/* Bytecode Stream */}
          <div>
            <div className="text-[11px] font-bold text-slate-300 mb-2">Bytecode Instruction Stream</div>
            <div className="space-y-1 bg-slate-900 p-3 rounded-xl border border-slate-800 max-h-72 overflow-y-auto">
              {instructions.map((inst, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded flex items-center justify-between transition-all ${
                    ip === idx
                      ? 'bg-cyan-400 text-slate-950 font-bold scale-102 shadow-lg'
                      : ip > idx
                      ? 'text-slate-500 line-through bg-slate-950/40'
                      : 'text-slate-300'
                  }`}
                >
                  <span>{idx}: {inst.op} {inst.arg ?? ''}</span>
                  {ip === idx && <ArrowRight className="w-4 h-4 text-slate-950" />}
                </div>
              ))}
            </div>
          </div>

          {/* Operand Stack (Grows upwards!) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-bold text-cyan-400">LIFO Operand Stack</span>
              <span className="text-[10px] text-slate-500 font-bold">Max Height: {Math.max(stack.length, 3)}</span>
            </div>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 min-h-[220px] flex flex-col-reverse justify-start gap-1">
              {stack.length === 0 ? (
                <span className="text-slate-600 italic text-center py-10">[ Empty Stack ]</span>
              ) : (
                stack.map((val, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded text-center font-extrabold text-sm border shadow-lg transition-all ${
                      idx === stack.length - 1
                        ? 'bg-cyan-400 text-slate-950 border-cyan-300 scale-102 ring-2 ring-cyan-300/50'
                        : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
                    }`}
                  >
                    [{idx}] = {val}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Variables Table */}
          <div>
            <div className="text-[11px] font-bold text-indigo-400 mb-2">Local Frame Variables</div>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 min-h-[220px]">
              {Object.keys(variables).length === 0 ? (
                <span className="text-slate-600 italic block text-center py-10">[ No Variables Stored ]</span>
              ) : (
                Object.entries(variables).map(([k, v]) => (
                  <div key={k} className="p-3 rounded bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 flex justify-between font-bold text-sm shadow">
                    <span>{k}:</span>
                    <span className="text-emerald-400">{v}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-3">
          <button
            onClick={stepInstruction}
            disabled={ip >= instructions.length}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-xs bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 hover:from-emerald-400 hover:to-indigo-400 text-white shadow-lg shadow-cyan-500/20 border border-cyan-300/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Step 1 Bytecode Instruction</span>
          </button>

          <button
            onClick={() => resetVM()}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
            title="Reset VM"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const nextState = !isAudioMuted;
              setIsAudioMuted(nextState);
              audioEngine.setMuted(nextState);
            }}
            className={`p-3 rounded-xl transition-all border ${
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
            <span>Virtual Machine Code</span>
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
          filename={`bytecode_vm.${activeLangConfig.fileExt}`}
          langLabel={activeLangConfig.label}
        />
      </div>
    </div>
  );
};
