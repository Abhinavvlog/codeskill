"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Trophy, ArrowLeft, Medal } from "lucide-react";
import api from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { usePublicContests } from "@/hooks/usePublicContests";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { type PublicContest } from "@/lib/contests";

interface Ranking {
  rank: number;
  name: string;
  username?: string;
  solved: number;
  totalProblems: number;
}

export default function ContestLeaderboardPage() {
  return (
    <Suspense fallback={<div role="status" className="pt-28 text-center text-sm font-medium text-[#64748B]">Loading contest rankings...</div>}>
      <ContestLeaderboard />
    </Suspense>
  );
}

function ContestLeaderboard() {
  const querySlug = useSearchParams().get("contest");
  const { user } = useAuth();
  const { contests, loading, error: catalogError } = usePublicContests();
  const [slug, setSlug] = useState("");
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{ key: string; rows: Ranking[]; contest?: PublicContest; error?: string }>();

  const selected = slug || querySlug || contests[0]?.slug || "";
  const key = `${selected}:${retry}:${user?.id || user?._id || "guest"}`;
  const endpoint = user && !contests.some(contest => contest.slug === selected) ? "member-leaderboard" : "leaderboard";

  useEffect(() => {
    if (!selected) return;
    let request: AbortController | undefined;
    const load = async () => {
      request?.abort();
      request = new AbortController();
      const active = request;
      try {
        const { data } = await api.get(`/contests/${encodeURIComponent(selected)}/${endpoint}`, { signal: active.signal });
        if (!Array.isArray(data.leaderboard)) throw new Error("Invalid leaderboard response");
        if (!active.signal.aborted) setResult({ key, rows: data.leaderboard, contest: data.contest });
      } catch {
        if (!active.signal.aborted) setResult({ key, rows: [], error: "Contest rankings could not be loaded. Please try again." });
      }
    };
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 30000);
    return () => {
      clearInterval(timer);
      request?.abort();
    };
  }, [selected, key, endpoint]);

  const error = catalogError || (result?.key === key ? result.error : null);
  const options = result?.key === key && result.contest && !contests.some(contest => contest.slug === result.contest?.slug)
    ? [...contests, result.contest]
    : contests;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 md:pt-28 pb-16 space-y-6 font-sans text-[#1F2937]">
      <header className="pb-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-[#7F1D1D]" />
          <p className="text-xs font-bold text-[#7F1D1D] uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#FACC15] fill-[#FACC15]" />
            Official Contest Standings
          </p>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1F2937]">
          Contests <span className="text-[#7F1D1D]">Leaderboard</span>
        </h1>
        <p className="text-sm text-[#64748B] mt-1.5">
          Ranked by distinct problems solved with accepted submissions during the contest window.
        </p>
        <Link
          href="/contests"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7F1D1D] mt-3 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Browse contests
        </Link>
      </header>

      {options.length > 0 && (
        <div className="space-y-2 bg-white border border-[#E5E7EB] p-4 sm:p-5 rounded-2xl shadow-xs">
          <label htmlFor="ranked-contest" className="text-xs font-bold text-[#1F2937] uppercase tracking-wider block">
            Contest
          </label>
          <select
            id="ranked-contest"
            aria-label="Contest"
            value={selected}
            onChange={event => setSlug(event.target.value)}
            className="block w-full sm:max-w-lg p-3 rounded-xl border border-[#E5E7EB] bg-white text-sm font-semibold text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#7F1D1D] focus:border-[#7F1D1D]"
          >
            <option value="" disabled>Select a contest</option>
            {options.map(contest => (
              <option key={contest.id} value={contest.slug}>
                {contest.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {error ? (
        <div role="alert" className="p-6 rounded-2xl border border-red-200 bg-red-50/50 space-y-3">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <Button variant="outline" onClick={() => setRetry(value => value + 1)} className="rounded-xl border-red-300 hover:bg-red-50 text-red-800">
            Try again
          </Button>
        </div>
      ) : loading || (selected && result?.key !== key) ? (
        <div role="status" className="py-16 flex justify-center items-center gap-3 text-sm font-medium text-[#64748B]">
          <Spinner className="w-5 h-5 text-[#7F1D1D] animate-spin" />
          Loading rankings...
        </div>
      ) : !selected ? (
        <p className="p-12 border border-[#E5E7EB] bg-white rounded-2xl text-center text-sm text-[#64748B] shadow-xs">
          No published public contests are available.
        </p>
      ) : (
        <div className="overflow-x-auto border border-[#E5E7EB] bg-white rounded-2xl shadow-xs">
          <table className="w-full min-w-[480px] text-sm text-left">
            <thead className="bg-[#FFFBF5]/90 border-b border-[#E5E7EB]">
              <tr>
                {["Rank", "Candidate", "Score (Solved / Total)"].map(label => (
                  <th key={label} className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {result?.rows.length ? (
                result.rows.map(row => (
                  <tr key={`${row.rank}:${row.username || row.name}`} className="hover:bg-[#FFFBF5]/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#1F2937]">
                      {row.rank === 1 ? (
                        <span className="inline-flex items-center gap-1 text-[#854D0E] font-black">
                          🥇 #{row.rank}
                        </span>
                      ) : row.rank === 2 ? (
                        <span className="inline-flex items-center gap-1 text-slate-700 font-bold">
                          🥈 #{row.rank}
                        </span>
                      ) : row.rank === 3 ? (
                        <span className="inline-flex items-center gap-1 text-amber-800 font-bold">
                          🥉 #{row.rank}
                        </span>
                      ) : (
                        <span>#{row.rank}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-[#1F2937]">{row.name}</span>
                      {row.username && <span className="block text-xs text-[#64748B]">@{row.username}</span>}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#7F1D1D]">
                      {row.solved} / {row.totalProblems}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-sm text-[#64748B]">
                    No contest participants or ranked submissions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
