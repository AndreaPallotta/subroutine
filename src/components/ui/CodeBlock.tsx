import React, { useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-typescript';

interface CodeBlockProps {
  code: string;
  language: string;
  filename?: string;
  langLabel?: string;
}

const PRISM_LANG_MAP: Record<string, string> = {
  cpp: 'cpp',
  python: 'python',
  java: 'java',
  go: 'go',
  rust: 'rust',
  ts: 'typescript',
};

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, filename, langLabel }) => {
  const prismLangKey = PRISM_LANG_MAP[language] || 'clike';

  useEffect(() => {
    Prism.highlightAll();
  }, [code, language]);

  const highlightedCode = Prism.languages[prismLangKey]
    ? Prism.highlight(code, Prism.languages[prismLangKey], prismLangKey)
    : code;

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#0b0f19] shadow-2xl my-4">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
          <span className="text-slate-300 ml-2 font-bold">{filename || `example.${language}`}</span>
        </div>
        <span className="text-cyan-400 font-bold uppercase tracking-wider">{langLabel || language}</span>
      </div>

      {/* Code Body */}
      <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed !bg-transparent !m-0">
        <code
          className={`language-${prismLangKey}`}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </pre>
    </div>
  );
};
