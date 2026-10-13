"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Calendar, Clock, Code2, Search, ArrowRight } from "lucide-react";
import { usePublicContests } from "@/hooks/usePublicContests";
import { contestDuration, contestStatus } from "@/lib/contests";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function ContestsPage() {
  const { contests, loading, error, refresh } = usePublicContests();
  const [search, setSearch] = useState(""); const [filter, setFilter] = useState("All"); const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  const visible = contests.filter(contest => contest.title.toLowerCase().includes(search.trim().toLowerCase()) && (filter === "All" || contestStatus(contest, now) === filter));
  return <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-12 space-y-7">
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div><p className="flex items-center gap-2 text-sm font-semibold text-primary mb-2"><Trophy className="w-4 h-4" /> CodeSkill competitions</p><h1 className="text-3xl font-bold">Contests</h1><p className="text-muted-foreground mt-2">Explore upcoming challenges, compete live, and review completed contests.</p></div>
      <Link href="/contests/leaderboard" className="text-sm font-semibold text-primary hover:underline">Contests Leaderboard <ArrowRight className="inline w-4 h-4" /></Link>
    </header>
    <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
      <div className="relative"><Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" /><input aria-label="Search contests" placeholder="Search contests..." value={search} onChange={event => setSearch(event.target.value)} className="w-full sm:w-72 pl-10 pr-3 py-2 rounded-lg border border-border bg-background" /></div>
      <div className="flex flex-wrap gap-2">{["All", "Upcoming", "Live", "Completed"].map(status => <button key={status} onClick={() => setFilter(status)} aria-pressed={filter === status} className={`px-3 py-2 rounded-lg border text-sm ${filter === status ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-muted"}`}>{status}</button>)}</div>
    </div>
    {error && <div role="alert" className="border border-destructive/30 rounded-xl p-5 space-y-3"><p className="text-destructive">{error}</p><Button variant="outline" onClick={() => void refresh()}>Try again</Button></div>}
    {loading ? <div role="status" className="py-16 flex justify-center gap-3 text-muted-foreground"><Spinner />Loading contests...</div> : !error && visible.length === 0 ? <div className="border border-border bg-card rounded-2xl p-12 text-center text-muted-foreground">No contests found matching your criteria.</div> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">{visible.map(contest => {
      const status = contestStatus(contest, now);
      return <article key={contest.id} className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start gap-3"><div className="p-3 rounded-xl bg-primary/10 text-primary"><Trophy className="w-6 h-6" /></div><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status === "Live" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>{status}</span></div>
        <div><h2 className="text-lg font-bold break-words">{contest.title}</h2><p className="text-sm text-muted-foreground mt-2 line-clamp-3">{contest.description}</p></div>
        <dl className="text-sm space-y-2 mt-auto"><div className="flex items-start gap-2"><Calendar className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" /><div><dt className="text-muted-foreground">Starts / Ends</dt><dd>{new Date(contest.startTime).toLocaleString()}<br />{new Date(contest.endTime).toLocaleString()}</dd></div></div><div className="flex flex-wrap gap-4"><div className="flex gap-1.5 items-center"><Clock className="w-4 h-4 text-muted-foreground" /><dd>{contestDuration(contest)} mins</dd></div><div className="flex gap-1.5 items-center"><Code2 className="w-4 h-4 text-muted-foreground" /><dd>{contest.problems.length} problems</dd></div></div></dl>
        <Link href={`/contests/${encodeURIComponent(contest.slug)}`} className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-border hover:bg-muted text-sm font-semibold">View Contest <ArrowRight className="w-4 h-4" /></Link>
      </article>;
    })}</div>}
  </main>;
}
