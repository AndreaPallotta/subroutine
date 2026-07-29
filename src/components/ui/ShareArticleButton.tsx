import React, { useState } from 'react';
import { Link, Check, Share2 } from 'lucide-react';

interface ShareArticleButtonProps {
  title: string;
  url?: string;
}

export const ShareArticleButton: React.FC<ShareArticleButtonProps> = ({ title, url }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const currentUrl = url || window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const shareOnTwitter = () => {
    const currentUrl = url || window.location.href;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      `Check out "${title}" on Subroutine CS:`
    )}&url=${encodeURIComponent(currentUrl)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
  };

  const shareOnLinkedIn = () => {
    const currentUrl = url || window.location.href;
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
    window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex items-center gap-2 font-mono text-xs">
      <button
        onClick={handleCopyLink}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
          copied
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 font-bold'
            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
        }`}
        title="Copy link to article"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link className="w-3.5 h-3.5 text-cyan-400" />}
        <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
      </button>

      <button
        onClick={shareOnTwitter}
        className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-slate-700 transition-all"
        title="Share on X / Twitter"
      >
        <Share2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
