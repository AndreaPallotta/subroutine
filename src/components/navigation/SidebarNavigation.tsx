import React, { useState } from 'react';
import { Menu, X, Search, BookOpen, Layers, Cpu, Brain, Sparkles, ExternalLink, Atom } from 'lucide-react';

export interface ArticleNavItem {
  slug: string;
  title: string;
  category: 'Algorithms' | 'Systems' | 'AI & ML' | 'Languages' | 'Physics & Math';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
}

interface SidebarNavigationProps {
  articles: ArticleNavItem[];
  currentSlug?: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Algorithms': <BookOpen className="w-4 h-4 text-cyan-400" />,
  'Systems': <Cpu className="w-4 h-4 text-amber-400" />,
  'AI & ML': <Brain className="w-4 h-4 text-pink-400" />,
  'Languages': <Layers className="w-4 h-4 text-emerald-400" />,
  'Physics & Math': <Atom className="w-4 h-4 text-purple-400" />,
};

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ articles, currentSlug = '' }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['Algorithms', 'Systems', 'AI & ML', 'Languages', 'Physics & Math'] as const;

  const filteredArticles = articles.filter(art => 
    art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    art.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950/95 border-r border-slate-800/80 text-slate-300">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800/80 p-1.5 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 group-hover:border-cyan-500/50 transition-all">
            <img src="/favicon.svg" alt="Subroutine Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors block leading-none">
              Subroutine
            </span>
          </div>
        </a>

        {/* Mobile Close Button */}
        <button 
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Search */}
      <div className="p-4 border-b border-slate-800/50">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
          />
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2 px-2">Navigation</div>
          <a
            href="/"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentSlug === '' 
                ? 'bg-gradient-to-r from-indigo-600/30 to-cyan-600/20 text-cyan-300 border border-cyan-500/30 font-bold'
                : 'hover:bg-slate-900 text-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Interactive Playground</span>
          </a>
        </div>

        {/* Categories & Articles */}
        {categories.map((category) => {
          const categoryArts = filteredArticles.filter(art => art.category === category);
          if (categoryArts.length === 0 && searchQuery !== '') return null;

          return (
            <div key={category} className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-slate-400 px-2 py-1 font-bold">
                {CATEGORY_ICONS[category]}
                <span>{category}</span>
                <span className="text-[10px] text-slate-600 ml-auto">({categoryArts.length})</span>
              </div>

              <div className="space-y-1 pl-2">
                {categoryArts.length === 0 ? (
                  <p className="text-[11px] text-slate-600 italic px-2 py-1">No topics yet</p>
                ) : (
                  categoryArts.map((art) => {
                    const isActive = currentSlug === art.slug;
                    const badgeColor = 
                      art.level === 'Beginner' ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40' :
                      art.level === 'Intermediate' ? 'text-amber-400 bg-amber-950/60 border-amber-800/40' :
                      'text-pink-400 bg-pink-950/60 border-pink-800/40';

                    return (
                      <a
                        key={art.slug}
                        href={`/articles/${art.slug}`}
                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs transition-all ${
                          isActive
                            ? 'bg-indigo-900/40 text-cyan-300 border border-indigo-500/40 font-semibold shadow-inner'
                            : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                        }`}
                      >
                        <span className="truncate">{art.title}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${badgeColor}`}>
                          {art.level[0]}
                        </span>
                      </a>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500">
        <a 
          href="https://github.com/AndreaPallotta/subroutine" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-between text-slate-400 hover:text-cyan-400 transition-colors font-mono"
        >
          <span>GitHub Repository</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 font-bold text-white text-sm">
          <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 p-1 flex items-center justify-center">
            <img src="/favicon.svg" alt="Subroutine Logo" className="w-full h-full object-contain" />
          </div>
          <span>Subroutine</span>
        </a>

        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Desktop Sidebar (Fixed Left Column) */}
      <aside className="hidden md:block fixed top-0 left-0 bottom-0 w-72 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
