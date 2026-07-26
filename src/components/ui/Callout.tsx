import React from 'react';
import { Lightbulb, AlertTriangle, Info, ShieldAlert } from 'lucide-react';

interface CalloutProps {
  type?: 'tip' | 'warning' | 'info' | 'caution';
  title?: string;
  children: React.ReactNode;
}

export const Callout: React.FC<CalloutProps> = ({ type = 'tip', title, children }) => {
  const configs = {
    tip: {
      icon: <Lightbulb className="w-5 h-5 text-emerald-400 shrink-0" />,
      bg: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200',
      defaultTitle: 'Pro Tip',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
      bg: 'bg-amber-950/40 border-amber-500/30 text-amber-200',
      defaultTitle: 'Warning',
    },
    info: {
      icon: <Info className="w-5 h-5 text-cyan-400 shrink-0" />,
      bg: 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200',
      defaultTitle: 'Note',
    },
    caution: {
      icon: <ShieldAlert className="w-5 h-5 text-pink-400 shrink-0" />,
      bg: 'bg-pink-950/40 border-pink-500/30 text-pink-200',
      defaultTitle: 'Caution',
    },
  };

  const config = configs[type];

  return (
    <div className={`my-6 p-4 rounded-xl border backdrop-blur-md flex items-start gap-3.5 ${config.bg}`}>
      {config.icon}
      <div className="flex-1 text-sm leading-relaxed">
        <div className="font-bold font-mono text-xs uppercase tracking-wider mb-1 opacity-90">
          {title || config.defaultTitle}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
