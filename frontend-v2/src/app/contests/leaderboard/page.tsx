"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Trophy } from "lucide-react";
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
    <Suspense
      fallback={
        <div role="status" className="pt-28 text-center text-[#64748B]">
          Loading contest rankings...
        </div>
      }
    >
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
  const [result, setResult] = useState<{
    key: string;
    rows: Ranking[];
    contest?: PublicContest;
    error?: string;
  }>();

  const selected = slug || querySlug || contests[0]?.slug || "";
  const key = `${selected}:${retry}:${user?.id || user?._id || "guest"}`;
  const endpoint =
    user && !contests.some((contest) => contest.slug === selected)
      ? "member-leaderboard"
      : "leaderboard";

  useEffect(() => {
    if (!selected) return;
    let request: AbortController | undefined;
    const load = async () => {
      request?.abort();
      request = new AbortController();
      const active = request;
      try {
        const { data } = await api.get(
          `/contests/${encodeURIComponent(selected)}/${endpoint}`,
          { signal: active.signal }
        );
        if (!Array.isArray(data.leaderboard)) throw new Error("Invalid leaderboard response");
        if (!active.signal.aborted)
          setResult({ key, rows: data.leaderboard, contest: data.contest });
      } catch {
        if (!active.signal.aborted)
          setResult({
            key,
            rows: [],
            error: "Contest rankings could not be loaded. Please try again.",
          });
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
  const options =
    result?.key === key &&
    result.contest &&
    !contests.some((contest) => contest.slug === result.contest?.slug)
      ? [...contests, result.contest]
      : contests;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-12 space-y-6">
      <header>
        <p className="text-[#7F1D1D] text-sm font-semibold flex gap-2 items-center mb-2">
          <Trophy className="w-4 h-4 text-[#FACC15] fill-[#FACC15]" /> Contest standings
        </p>
        <h1 className="text-3xl font-bold text-[#1F2937]">Contests Leaderboard</h1>
        <p className="text-[#64748B] mt-2">
          Ranked by distinct problems solved with accepted submissions during the contest window.
        </p>
        <Link
          href="/contests"
          className="inline-block text-[#7F1D1D] text-sm font-semibold mt-3 hover:underline"
        >
          Browse contests
        </Link>
      </header>

      {options.length > 0 && (
        <div className="space-y-2">
          <label htmlFor="ranked-contest" className="text-sm font-semibold text-[#1F2937]">
            Contest
          </label>
          <select
            id="ranked-contest"
            value={selected}
            onChange={(event) => setSlug(event.target.value)}
            className="block w-full sm:max-w-lg p-3 rounded-lg border border-[#E5E7EB] bg-white text-[#1F2937]"
          >
            <option value="" disabled>
              Select a contest
            </option>
            {options.map((contest) => (
              <option key={contest.id} value={contest.slug}>
                {contest.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {error ? (
        <div role="alert" className="p-5 rounded-xl border border-destructive/30 space-y-3">
          <p className="text-destructive text-sm font-semibold">{error}</p>
          <Button variant="outline" onClick={() => setRetry((value) => value + 1)}>
            Try again
          </Button>
        </div>
      ) : loading || (selected && result?.key !== key) ? (
        <div role="status" className="py-12 flex justify-center gap-2 text-[#64748B]">
          <Spinner className="w-5 h-5 animate-spin text-[#7F1D1D]" />
          Loading rankings...
        </div>
      ) : !selected ? (
        <p className="p-8 border border-[#E5E7EB] rounded-xl text-center text-[#64748B]">
          No published public contests are available.
        </p>
      ) : (
        <div className="overflow-x-auto border border-[#E5E7EB] bg-white rounded-xl">
          <table className="w-full min-w-[480px] text-sm text-left">
            <thead className="bg-[#FFFBF5]">
              <tr>
                {["Rank", "Candidate", "Score (Solved / Total)"].map((label) => (
                  <th key={label} className="px-5 py-4 font-semibold text-[#1F2937]">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result?.rows.length ? (
                result.rows.map((row) => (
                  <tr key={`${row.rank}:${row.username || row.name}`} className="border-t border-[#E5E7EB]">
                    <td className="px-5 py-4 font-bold text-[#1F2937]">{row.rank}</td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-[#1F2937]">{row.name}</span>
                      {row.username && (
                        <span className="block text-xs text-[#64748B]">@{row.username}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#1F2937]">
                      {row.solved} / {row.totalProblems}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-5 py-12 text-center text-[#64748B]">
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
