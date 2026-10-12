"use client";

import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { Search, Filter, CheckCircle2, Circle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { problemsAPI } from "@/config/api";
import { Spinner } from "@/components/ui/spinner";
import { parsePublicProblemList, type PublicProblemList } from "@/lib/public-problems";

const ITEMS_PER_PAGE = 20;

export default function ProblemsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Topics");
  const [currentPage, setCurrentPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [result, setResult] = useState<{ key: string; data: PublicProblemList; error: string | null } | null>(null);
  const requestKey = JSON.stringify([currentPage, debouncedSearch, activeCategory, retry]);
  const loading = result?.key !== requestKey;
  const error = loading ? null : result?.error;
  const problems = result?.data.problems ?? [];
  const totalPages = result?.data.totalPages ?? 1;
  const totalItems = result?.data.total ?? 0;

  useEffect(() => {
    const query = search.trim();
    if (query === debouncedSearch) return;
    const timer = setTimeout(() => {
      setDebouncedSearch(query);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  useEffect(() => {
    const controller = new AbortController();
    problemsAPI.getAll(currentPage, ITEMS_PER_PAGE, debouncedSearch, activeCategory, controller.signal)
      .then(response => {
        if (controller.signal.aborted) return;
        const data = parsePublicProblemList(response.data, ITEMS_PER_PAGE);
        setResult({ key: requestKey, data, error: null });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setResult({ key: requestKey, data: { problems: [], total: 0, totalPages: 1 }, error: "Problems could not be loaded. Please try again." });
      });
    return () => controller.abort();
  }, [currentPage, debouncedSearch, activeCategory, requestKey]);

  const categories = ["All Topics", "Arrays", "Strings", "Dynamic Programming", "Trees", "Graphs", "Math"];

  const filtered = problems;

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5]/30 w-full pt-20 md:pt-24 pb-12 px-4 sm:px-6 flex flex-col font-sans text-[#1F2937]">
      <div className="max-w-[1600px] mx-auto flex-1 flex flex-col w-full h-full">
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full space-y-6 flex-1 flex flex-col">
        
        {/* Header & Search */}
        <motion.div variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#7F1D1D]" />
              <span className="text-xs font-bold text-[#7F1D1D] uppercase tracking-wider">Practice Problem Bank</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1F2937]">
              Coding <span className="text-[#7F1D1D]">Problems</span>
            </h1>
            <p className="text-sm text-[#64748B] mt-1">Master algorithms, data structures, and algorithmic patterns with automated test validation.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <Input 
                placeholder="Search problems..."
                aria-label="Search problems"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-10 bg-white border-[#E5E7EB] text-[#1F2937] rounded-xl focus-visible:ring-1 focus-visible:ring-[#7F1D1D] focus-visible:border-[#7F1D1D] placeholder:text-[#64748B] shadow-xs"
              />
            </div>
            <Button variant="outline" className="h-10 rounded-xl bg-white border-[#E5E7EB] text-[#1F2937] hover:bg-[#FFFBF5] hover:text-[#7F1D1D] shadow-xs font-semibold">
              <Filter className="w-4 h-4 mr-2 text-[#7F1D1D]" />
              Filters
            </Button>
          </div>
        </motion.div>

        {/* Category Chips */}
        <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button 
              key={cat}
              onClick={() => { setActiveCategory(cat); setCurrentPage(1); }}
              aria-pressed={activeCategory === cat}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                activeCategory === cat 
                  ? "bg-[#7F1D1D] text-white border-[#7F1D1D] shadow-xs" 
                  : "bg-white text-[#64748B] border-[#E5E7EB] hover:border-[#7F1D1D]/30 hover:text-[#7F1D1D] shadow-xs"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Table & Pagination Container */}
        <motion.div variants={fadeUp} className="bg-white border border-[#E5E7EB] rounded-2xl shadow-xs flex flex-col flex-1 overflow-hidden min-h-[500px]">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 bg-[#FFFBF5]/90 backdrop-blur z-10 border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-bold text-[#64748B] uppercase tracking-wider w-16 text-center">Status</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-[#64748B] uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-[#64748B] uppercase tracking-wider">Difficulty</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-[#64748B] uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-[#64748B] uppercase tracking-wider text-right">Acceptance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-[#64748B]">
                        <span role="status" aria-label="Loading problems"><Spinner className="w-6 h-6 animate-spin mx-auto text-[#7F1D1D]" /></span>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div role="alert" className="text-red-600 font-semibold mb-3">{error}</div>
                        <Button variant="outline" size="sm" onClick={() => setRetry(value => value + 1)} className="rounded-xl border-[#E5E7EB] hover:bg-[#FFFBF5]">Try again</Button>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-[#64748B]">
                        No problems found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((problem) => (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        key={problem.id}
                        className="group hover:bg-[#FFFBF5]/50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 text-center">
                          {problem.status === "solved" && <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />}
                          {problem.status === "attempted" && <Circle className="w-5 h-5 text-amber-500 mx-auto" />}
                          {(!problem.status || problem.status === "unsolved") && <div className="w-5 h-5 rounded-full border-2 border-[#E5E7EB] mx-auto group-hover:border-[#7F1D1D]/50 transition-colors" />}
                        </td>
                        <td className="px-6 py-4">
                          {problem.slug ? (
                            <Link href={`/problems/${encodeURIComponent(problem.slug)}`} className="font-bold text-[#1F2937] group-hover:text-[#7F1D1D] transition-colors flex items-center gap-2">
                              {problem.title}
                            </Link>
                          ) : <span className="font-bold text-[#1F2937]">{problem.title}</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                            problem.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            problem.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                            problem.difficulty === 'Hard' ? 'bg-red-50 text-destructive border-red-200' : 'bg-gray-50 text-[#64748B] border-gray-200'
                          }`}>
                            {problem.difficulty}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-[#64748B] bg-[#FFFBF5] border border-[#E5E7EB] px-2.5 py-1 rounded-lg">
                            {problem.categories && problem.categories.length > 0 ? problem.categories[0] : 'General'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-[#1F2937]">{problem.stats?.acceptanceRate || 0}%</span>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {/* Sticky Pagination Controls */}
          {!error && totalPages > 1 && (
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-[#E5E7EB] bg-[#FFFBF5]/40 sticky bottom-0 z-10 w-full">
              <div className="text-sm text-[#64748B] whitespace-nowrap text-center lg:text-left w-full lg:w-auto">
                Showing <span className="font-bold text-[#1F2937]">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-[#1F2937]">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span> of <span className="font-bold text-[#1F2937]">{totalItems}</span> questions
              </div>
              
              <div className="flex items-center gap-2 max-w-full overflow-x-auto pb-1 scrollbar-hide">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                  className="shrink-0 bg-white border-[#E5E7EB] text-[#1F2937] hover:bg-[#FFFBF5] rounded-xl font-semibold"
                >
                  Previous
                </Button>
                
                <div className="flex gap-1 items-center">
                  {getPageNumbers().map((pageNum, i) => (
                    pageNum === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-[#64748B]">...</span>
                    ) : (
                      <Button
                        key={`${pageNum}-${i}`}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className={`shrink-0 rounded-xl font-bold ${currentPage === pageNum ? "bg-[#7F1D1D] text-white hover:bg-[#450A0A]" : "bg-white border-[#E5E7EB] text-[#1F2937] hover:bg-[#FFFBF5]"}`}
                        aria-current={currentPage === pageNum ? "page" : undefined}
                        onClick={() => setCurrentPage(pageNum as number)}
                        disabled={loading}
                      >
                        {pageNum}
                      </Button>
                    )
                  ))}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="shrink-0 bg-white border-[#E5E7EB] text-[#1F2937] hover:bg-[#FFFBF5] rounded-xl font-semibold"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </motion.div>

      </motion.div>
      </div>
    </div>
  );
}
