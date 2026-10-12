"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Loader2, ArrowRight, BookOpen, Clock, Activity, Code2 } from "lucide-react";
import Link from "next/link";
import { adminProblemsAPI } from "@/config/api";

export default function AdminProblemsPage() {
  const [problems, setProblems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setIsLoading(true);
      const res = await adminProblemsAPI.getAll();
      if (Array.isArray(res.data?.problems)) {
        setProblems(res.data.problems);
      } else if (res.data?.data) {
        setProblems(res.data.data);
      } else if (Array.isArray(res.data)) {
        setProblems(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch problems", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProblems = problems.filter((p) =>
    p.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Practice Problems</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage public coding challenges and DSA problems shown in the student workspace.
          </p>
        </div>
        <Link
          href="/admin/problems/create"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Problem
        </Link>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search problems by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <div className="text-xs text-muted-foreground font-medium bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
            {filteredProblems.length} Problem{filteredProblems.length !== 1 ? 's' : ''}
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p className="text-sm font-medium">Loading problems...</p>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Code2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">No problems found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              We couldn't find any practice problems. Click the button above to create one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted/40 uppercase text-[10px] font-bold text-muted-foreground tracking-wider">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4 text-center">Difficulty</th>
                  <th className="px-6 py-4">Categories</th>
                  <th className="px-6 py-4 text-center">Visibility</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProblems.map((problem) => {
                  const probId = problem._id || problem.id;
                  return (
                    <tr key={probId} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{problem.title}</div>
                        <div className="text-[11px] text-muted-foreground font-mono mt-0.5">/{problem.slug}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            problem.difficulty?.toLowerCase() === "easy"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : problem.difficulty?.toLowerCase() === "medium"
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                          }`}
                        >
                          {problem.difficulty || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap max-w-[200px]">
                          {(problem.categories || []).slice(0, 2).map((cat: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] rounded-md border border-border">
                              {cat}
                            </span>
                          ))}
                          {(problem.categories?.length || 0) > 2 && (
                            <span className="text-[10px] text-muted-foreground font-medium">
                              +{problem.categories.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          problem.visibility === 'Published' || problem.visibility === 'Public' 
                            ? 'bg-blue-500/10 text-blue-500' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {problem.visibility || 'Public'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/problems/${probId}/edit`}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
