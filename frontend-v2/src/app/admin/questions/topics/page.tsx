"use client";

import { useEffect, useState } from "react";
import { adminQuestionsAPI } from "@/config/api";
import Link from "next/link";
import { 
  ArrowLeft, 
  Layers, 
  BookOpen, 
  BarChart2, 
  RefreshCw, 
  ChevronRight,
  Sparkles,
  Search,
  Plus
} from "lucide-react";

export default function TopicsDistributionPage() {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const res = await adminQuestionsAPI.getTopics();
      const list = Array.isArray(res.data?.topics)
        ? res.data.topics
        : Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      setTopics(list);
    } catch (err) {
      console.error("Failed to fetch topics distribution", err);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTopics = Array.isArray(topics)
    ? topics.filter((t) => t.topic?.toLowerCase().includes(search.toLowerCase()))
    : [];

  const totalQuestionsAll = Array.isArray(topics)
    ? topics.reduce((acc, curr) => acc + (curr.total || 0), 0)
    : 0;

  return (
    <div className="p-8 font-sans max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/admin/questions" className="hover:text-foreground flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Question Bank
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Topics & Distribution</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-amber-500" />
            Topic Breakdown & Curriculum Coverage
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Assess question inventory balance across university computer science subject areas and difficulty tiers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/questions/create"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Question
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Indexed Topics</span>
          <div className="text-2xl font-bold text-foreground mt-1">{topics.length}</div>
          <span className="text-[11px] text-muted-foreground">Unique subject categories</span>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Questions Indexed</span>
          <div className="text-2xl font-bold text-amber-500 mt-1">{totalQuestionsAll}</div>
          <span className="text-[11px] text-muted-foreground">Across all university question banks</span>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Average Questions / Topic</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {topics.length > 0 ? Math.round(totalQuestionsAll / topics.length) : 0}
          </div>
          <span className="text-[11px] text-muted-foreground">Inventory depth per discipline</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          onClick={fetchTopics}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Topics Grid */}
      {loading ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
          Analyzing topic distribution...
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-bold text-foreground">No Topics Found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {search ? "No topics matched your search query." : "Questions must be created first to index topics."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTopics.map((t) => {
            const easyPct = t.total > 0 ? ((t.easy || 0) / t.total) * 100 : 0;
            const medPct = t.total > 0 ? ((t.medium || 0) / t.total) * 100 : 0;
            const hardPct = t.total > 0 ? ((t.hard || 0) / t.total) * 100 : 0;

            return (
              <div
                key={t.topic}
                className="bg-card border border-border rounded-2xl p-5 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-foreground text-base tracking-tight">{t.topic}</h3>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {t.total} {t.total === 1 ? "Question" : "Questions"}
                    </span>
                  </div>

                  {/* Difficulty Distribution Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Difficulty Spread</span>
                      <span className="font-mono">
                        <span className="text-emerald-400 font-semibold">{t.easy || 0}E</span> /{" "}
                        <span className="text-amber-400 font-semibold">{t.medium || 0}M</span> /{" "}
                        <span className="text-rose-400 font-semibold">{t.hard || 0}H</span>
                      </span>
                    </div>

                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${easyPct}%` }}
                        className="bg-emerald-500 h-full transition-all"
                        title={`Easy: ${t.easy || 0}`}
                      />
                      <div
                        style={{ width: `${medPct}%` }}
                        className="bg-amber-500 h-full transition-all"
                        title={`Medium: ${t.medium || 0}`}
                      />
                      <div
                        style={{ width: `${hardPct}%` }}
                        className="bg-rose-500 h-full transition-all"
                        title={`Hard: ${t.hard || 0}`}
                      />
                    </div>
                  </div>

                  {/* Subtopics */}
                  {t.subtopics && t.subtopics.length > 0 && (
                    <div className="mt-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                        Subtopics ({t.subtopics.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {t.subtopics.slice(0, 5).map((st: string) => (
                          <span
                            key={st}
                            className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium"
                          >
                            {st}
                          </span>
                        ))}
                        {t.subtopics.length > 5 && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                            +{t.subtopics.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Active: <b className="text-emerald-400">{t.active || t.total}</b>
                  </span>
                  <Link
                    href={`/admin/questions?topic=${encodeURIComponent(t.topic)}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500 hover:text-amber-400 transition-colors"
                  >
                    Browse Questions
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
