import React, { useState } from 'react';
import { Code2 } from 'lucide-react';
import { CodeBlock } from './CodeBlock';

export interface CodeSnippets {
  [key: string]: {
    label: string;
    ext: string;
    lang: string;
    code: string;
    filename?: string;
  };
}

interface TabbedCodeBlockProps {
  title?: string;
  snippets: CodeSnippets;
  defaultLang?: string;
  defaultFilenamePrefix?: string;
}

export const TabbedCodeBlock: React.FC<TabbedCodeBlockProps> = ({
  title = 'Implementation Code',
  snippets,
  defaultLang,
  defaultFilenamePrefix = 'code_example',
}) => {
  const keys = Object.keys(snippets);
  const [selectedKey, setSelectedKey] = useState(defaultLang && snippets[defaultLang] ? defaultLang : keys[0]);

  const activeSnippet = snippets[selectedKey];
  const displayFilename = activeSnippet.filename || `${defaultFilenamePrefix}.${activeSnippet.ext}`;

  return (
    <div className="my-6 rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl font-sans">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
          <Code2 className="w-4 h-4 text-cyan-400" />
          <span>{title}</span>
        </div>

        {/* Language Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono">
          {keys.map((k) => (
            <button
              key={k}
              onClick={() => setSelectedKey(k)}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedKey === k
                  ? 'bg-indigo-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {snippets[k].label}
            </button>
          ))}
        </div>
      </div>

      <CodeBlock
        code={activeSnippet.code}
        language={activeSnippet.lang}
        filename={displayFilename}
        langLabel={activeSnippet.label}
      />
    </div>
  );
};
