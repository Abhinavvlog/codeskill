"use client";

import Link from "next/link";
import { Trophy, Medal, ArrowRight, Sparkles, UserCheck } from "lucide-react";

export function LeaderboardPreview() {
  const topStudents = [
    { rank: 1, name: "Aarav Sharma", dept: "CSE (Batch 2026)", score: 980, solved: 142, badge: "Grandmaster" },
    { rank: 2, name: "Diya Patel", dept: "CSE (Batch 2026)", score: 945, solved: 138, badge: "Master" },
    { rank: 3, name: "Rohan Verma", dept: "IT (Batch 2025)", score: 920, solved: 131, badge: "Master" },
    { rank: 4, name: "Ananya Singh", dept: "AI/ML (Batch 2026)", score: 890, solved: 126, badge: "Candidate Master" },
    { rank: 5, name: "Kabir Mehta", dept: "CSE (Batch 2025)", score: 870, solved: 120, badge: "Expert" },
  ];

  return (
    <section className="w-full py-16 sm:py-20 px-4 sm:px-6 md:px-8 border-b border-border bg-background text-foreground">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border text-[11px] font-medium uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-primary" /> Platform Standings
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Rankings and peer benchmarks
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Measure your algorithmic proficiency and compare solved challenges with peers.
          </p>
        </div>

        {/* Polished Table Card */}
        <div className="max-w-4xl mx-auto bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          
          {/* Table Header Controls */}
          <div className="p-4 sm:px-6 border-b border-border flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">Top Solvers</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Sparkles className="w-3 h-3" /> Live
              </span>
            </div>
            <Link
              href="/leaderboard"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              <span>View Full Leaderboard</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* List Rows */}
          <div className="divide-y divide-border">
            {topStudents.map((student) => (
              <div
                key={student.rank}
                className="p-3.5 sm:px-6 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
              >
                {/* Left: Rank & Avatar/Name */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-7 text-center shrink-0">
                    {student.rank === 1 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background font-bold text-xs shadow-xs">
                        1
                      </span>
                    ) : student.rank === 2 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-400/10 text-muted-foreground font-bold text-xs border border-slate-400/20">
                        2
                      </span>
                    ) : student.rank === 3 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground font-bold text-xs border border-border">
                        3
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-bold text-muted-foreground">
                        #{student.rank}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground truncate">{student.name}</p>
                      <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                        {student.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{student.dept}</p>
                  </div>
                </div>

                {/* Right: Solved & Score */}
                <div className="flex items-center gap-4 sm:gap-8 shrink-0 text-right">
                  <div className="hidden sm:block">
                    <span className="text-[10px] text-muted-foreground block">Solved</span>
                    <span className="text-xs font-bold font-mono text-foreground">{student.solved}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground block">Score</span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-primary">
                      {student.score} pts
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Bar */}
          <div className="p-4 bg-muted/20 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Rankings refresh automatically after every evaluated assessment submission.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
