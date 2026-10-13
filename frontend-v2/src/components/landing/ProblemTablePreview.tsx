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
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Problems
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
              Curated algorithmic challenges categorized by concept and difficulty.
            </p>
          </div>

          <Link
            href="/problems"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:underline"
          >
            <span>View all problems</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-md bg-card border border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-background border border-border focus:outline-none focus:border-foreground transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {["All", "Easy", "Medium", "Hard"].map((diff) => (
              <button
                key={diff}
                onClick={() => setFilterDifficulty(diff)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  filterDifficulty === diff
                    ? "bg-black text-white dark:bg-white dark:text-black font-semibold"
                    : "bg-background text-neutral-600 dark:text-neutral-400 hover:text-foreground border border-border"
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* LeetCode-style Problem Table */}
        <div className="rounded-md border border-border bg-card overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-neutral-50 dark:bg-neutral-900/50 text-neutral-500 font-medium">
                <th className="py-2.5 px-4 w-10 text-center">Status</th>
                <th className="py-2.5 px-4">Title</th>
                <th className="py-2.5 px-4 w-32">Difficulty</th>
                <th className="py-2.5 px-4 w-28">Acceptance</th>
                <th className="py-2.5 px-4 w-24 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProblems.map((prob) => (
                <tr
                  key={prob.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors"
                >
                  <td className="py-3 px-4 text-center">
                    {prob.solved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline-block" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-700 inline-block" />
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-foreground">
                    <Link href={`/problems/${prob.id}`} className="hover:underline">
                      {prob.title}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                        prob.difficulty === "Easy"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : prob.difficulty === "Medium"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                      }`}
                    >
                      {prob.difficulty}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-neutral-600 dark:text-neutral-400">
                    {prob.acceptance}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/problems/${prob.id}`}
                      className="px-2.5 py-1 rounded border border-border bg-background hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-medium text-foreground transition-colors inline-block"
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
