"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, CheckCircle2, ArrowRight } from "lucide-react";

interface ProblemRow {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  acceptance: string;
  solved: boolean;
}

const PROBLEMS: ProblemRow[] = [
  { id: "two-sum", title: "Two Sum", difficulty: "Easy", acceptance: "48.2%", solved: true },
  { id: "valid-parentheses", title: "Valid Parentheses", difficulty: "Easy", acceptance: "42.8%", solved: true },
  { id: "merge-intervals", title: "Merge Intervals", difficulty: "Medium", acceptance: "47.1%", solved: false },
  { id: "lru-cache", title: "LRU Cache", difficulty: "Medium", acceptance: "41.2%", solved: false },
  { id: "word-ladder", title: "Word Ladder", difficulty: "Hard", acceptance: "38.7%", solved: false },
];

export function ProblemTablePreview() {
  const [search, setSearch] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("All");

  const filteredProblems = PROBLEMS.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchDiff = filterDifficulty === "All" || p.difficulty === filterDifficulty;
    return matchSearch && matchDiff;
  });

  return (
    <section className="w-full py-16 px-4 sm:px-6 md:px-8 border-b border-border bg-background text-foreground">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#7F1D1D] dark:text-foreground">
              Coding Challenges
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-muted-foreground mt-0.5">
              Curated algorithmic challenges categorized by concept, data structure, and difficulty.
            </p>
          </div>

          <Link
            href="/problems"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7F1D1D] hover:text-[#450A0A] hover:underline transition-colors"
          >
            <span>View all problems</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#FACC15]" />
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-card border border-[#E5E7EB] dark:border-border shadow-xs">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search problems by name or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[#FFFBF5] dark:bg-background border border-[#E5E7EB] dark:border-border text-[#1F2937] focus:outline-none focus:border-[#7F1D1D] transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {["All", "Easy", "Medium", "Hard"].map((diff) => (
              <button
                key={diff}
                onClick={() => setFilterDifficulty(diff)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterDifficulty === diff
                    ? "bg-[#7F1D1D] text-white shadow-xs"
                    : "bg-white text-[#64748B] hover:text-[#1F2937] border border-[#E5E7EB] hover:bg-[#FFFBF5]"
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Problem Table */}
        <div className="rounded-xl border border-[#E5E7EB] dark:border-border bg-white dark:bg-card overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#FFFBF5] dark:bg-neutral-900/50 text-[#64748B] font-semibold">
                <th className="py-3 px-4 w-12 text-center">Status</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4 w-32">Difficulty</th>
                <th className="py-3 px-4 w-28">Acceptance</th>
                <th className="py-3 px-4 w-24 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-border">
              {filteredProblems.map((prob) => (
                <tr
                  key={prob.id}
                  className="hover:bg-[#FFFBF5]/70 dark:hover:bg-neutral-900/40 transition-colors"
                >
                  <td className="py-3.5 px-4 text-center">
                    {prob.solved ? (
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A] inline-block" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-[#E5E7EB] inline-block" />
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#1F2937] dark:text-foreground">
                    <Link href={`/problems/${prob.id}`} className="hover:text-[#7F1D1D] hover:underline transition-colors">
                      {prob.title}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        prob.difficulty === "Easy"
                          ? "bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20"
                          : prob.difficulty === "Medium"
                          ? "bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20"
                          : "bg-[#7F1D1D]/10 text-[#7F1D1D] border border-[#7F1D1D]/20"
                      }`}
                    >
                      {prob.difficulty}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#64748B]">
                    {prob.acceptance}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/problems/${prob.id}`}
                      className="px-3 py-1 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#7F1D1D] hover:text-white hover:border-[#7F1D1D] text-[11px] font-bold text-[#1F2937] transition-all inline-block shadow-xs"
                    >
                      Solve
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </section>
  );
}

export default ProblemTablePreview;
