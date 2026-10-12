"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Calendar, Clock, Code2, Search, ArrowRight, Sparkles } from "lucide-react";
import { usePublicContests } from "@/hooks/usePublicContests";
import { contestDuration, contestStatus } from "@/lib/contests";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function ContestsPage() {
  const { contests, loading, error, refresh } = usePublicContests();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const visible = contests.filter(contest =>
    contest.title.toLowerCase().includes(search.trim().toLowerCase()) &&
    (filter === "All" || contestStatus(contest, now) === filter)
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 md:pt-28 pb-16 space-y-8 font-sans text-[#1F2937]">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#7F1D1D]" />
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#7F1D1D] uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-[#FACC15] fill-[#FACC15]" />
              Official Competitions
            </p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1F2937]">
            Coding <span className="text-[#7F1D1D]">Contests</span>
          </h1>
          <p className="text-sm text-[#64748B] mt-1.5 max-w-2xl">
            Compete against university peers in real-time algorithmic challenges with automated judging and live ranking.
          </p>
        </div>
        <Link
          href="/contests/leaderboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#7F1D1D] hover:text-[#7F1D1D] text-xs font-bold text-[#1F2937] transition-colors shadow-xs"
        >
          Contests Leaderboard <ArrowRight className="w-3.5 h-3.5 text-[#7F1D1D]" />
        </Link>
      </header>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            aria-label="Search contests"
            placeholder="Search contests..."
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#1F2937] placeholder:text-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#7F1D1D] focus:border-[#7F1D1D] shadow-xs"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["All", "Upcoming", "Live", "Completed"].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              aria-pressed={filter === status}
              className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all shadow-xs ${
                filter === status
                  ? "bg-[#7F1D1D] text-white border-[#7F1D1D]"
                  : "bg-white border-[#E5E7EB] text-[#64748B] hover:text-[#7F1D1D] hover:border-[#7F1D1D]/30"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div role="alert" className="bg-red-50/50 border border-red-200 rounded-2xl p-6 space-y-3">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <Button variant="outline" onClick={() => void refresh()} className="rounded-xl border-red-300 hover:bg-red-50 text-red-800">
            Try again
          </Button>
        </div>
      )}

      {/* Loading & Content */}
      {loading ? (
        <div role="status" className="py-20 flex justify-center items-center gap-3 text-sm font-medium text-[#64748B]">
          <Spinner className="w-5 h-5 text-[#7F1D1D] animate-spin" />
          Loading contests...
        </div>
      ) : !error && visible.length === 0 ? (
        <div className="border border-[#E5E7EB] bg-white rounded-2xl p-16 text-center text-sm text-[#64748B] shadow-xs">
          No contests found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {visible.map(contest => {
            const status = contestStatus(contest, now);
            return (
              <article
                key={contest.id}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-6 flex flex-col gap-4 shadow-xs hover:border-[#7F1D1D]/30 hover:shadow-sm transition-all"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="p-3 rounded-xl bg-[#7F1D1D]/10 text-[#7F1D1D]">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      status === "Live"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse"
                        : status === "Upcoming"
                        ? "bg-[#FFFBF5] text-[#854D0E] border-[#FACC15]"
                        : "bg-gray-50 text-[#64748B] border-gray-200"
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#1F2937] break-words line-clamp-1">{contest.title}</h2>
                  <p className="text-xs text-[#64748B] mt-1.5 line-clamp-2 leading-relaxed">
                    {contest.description || "Compete in algorithmic challenges against peers and view live leaderboards."}
                  </p>
                </div>

                <dl className="text-xs space-y-2 mt-auto pt-2 border-t border-[#E5E7EB]">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#7F1D1D]" />
                    <div>
                      <dt className="text-[#64748B] font-medium">Timeline</dt>
                      <dd className="text-[#1F2937] font-semibold">
                        {new Date(contest.startTime).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        {" — "}
                        {new Date(contest.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </dd>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 pt-1">
                    <div className="flex gap-1.5 items-center">
                      <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                      <dd className="text-[#64748B] font-medium">{contestDuration(contest)} mins</dd>
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <Code2 className="w-3.5 h-3.5 text-[#64748B]" />
                      <dd className="text-[#64748B] font-medium">{contest.problems.length} problems</dd>
                    </div>
                  </div>
                </dl>

                <Link
                  href={`/contests/${encodeURIComponent(contest.slug)}`}
                  className="mt-2 flex items-center justify-between px-4 py-2.5 rounded-xl border border-[#E5E7EB] hover:bg-[#7F1D1D] hover:border-[#7F1D1D] hover:text-white text-xs font-bold text-[#1F2937] transition-all shadow-xs group"
                >
                  View Contest
                  <ArrowRight className="w-3.5 h-3.5 text-[#7F1D1D] group-hover:text-white transition-colors" />
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
