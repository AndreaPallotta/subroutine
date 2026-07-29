import React, { useState, useMemo, useEffect } from 'react';
import { Search, Clock, ArrowRight, X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface ArticleCardData {
  slug: string;
  title: string;
  summary: string;
  category: string;
  level: string;
  date: string;
  readingTime: string;
  tags: string[];
}

interface ArticleSearchFeedProps {
  articles: ArticleCardData[];
  itemsPerPage?: number;
}

const CATEGORIES = ['All', 'Algorithms', 'Systems', 'AI & ML', 'Languages', 'Physics & Math', 'Networking', 'Security'];

export const ArticleSearchFeed: React.FC<ArticleSearchFeedProps> = ({ articles, itemsPerPage = 8 }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to Page 1 whenever search term or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const matchesCategory = selectedCategory === 'All' || art.category === selectedCategory;
      const term = searchTerm.toLowerCase().trim();
      if (!term) return matchesCategory;

      const matchesTitle = art.title.toLowerCase().includes(term);
      const matchesSummary = art.summary.toLowerCase().includes(term);
      const matchesCategoryName = art.category.toLowerCase().includes(term);
      const matchesTags = art.tags.some((t) => t.toLowerCase().includes(term));

      return matchesCategory && (matchesTitle || matchesSummary || matchesCategoryName || matchesTags);
    });
  }, [articles, searchTerm, selectedCategory]);

  // Pagination Math
  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / itemsPerPage));
  const paginatedArticles = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredArticles.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredArticles, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Search Bar & Category Filter Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Educational Articles</h2>
            <p className="text-xs text-slate-400">Written in MDX with embedded audio-visual simulators</p>
          </div>

          <div className="text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            Showing <span className="text-cyan-400 font-bold">{filteredArticles.length}</span> of {articles.length} Article(s)
          </div>
        </div>

        {/* Real-time Search Input Box */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search articles by title, C++, memory, locks, networking, or algorithm keyword..."
            className="w-full pl-11 pr-10 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/60 transition-all font-mono"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pill Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/25'
                  : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Article Cards Grid */}
      {paginatedArticles.length === 0 ? (
        <div className="p-12 text-center bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2">
          <p className="text-slate-300 font-bold text-sm">No matching articles found</p>
          <p className="text-xs text-slate-500 font-mono">Try searching another keyword like "C++", "epoll", "sorting", or reset the category filter.</p>
          <button
            onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
            className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-mono font-bold hover:bg-indigo-500 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paginatedArticles.map((article) => {
            const badgeClass =
              article.level === 'Beginner' ? 'badge-beginner' :
              article.level === 'Intermediate' ? 'badge-intermediate' : 'badge-advanced';

            return (
              <a
                key={article.slug}
                href={`/articles/${article.slug}`}
                className="group glass-panel p-6 block flex flex-col justify-between hover:border-indigo-500/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">{article.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {article.readingTime}
                      </span>
                      <span className={`badge ${badgeClass}`}>{article.level}</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors mb-2">
                    {article.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {article.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800/60 font-mono">
                  <span>{article.date}</span>
                  <span className="text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold">
                    Read Article <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-800/80 font-mono text-xs text-slate-400">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <span className="text-slate-300">
            Page <span className="text-cyan-400 font-bold">{currentPage}</span> of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition-all"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
};
