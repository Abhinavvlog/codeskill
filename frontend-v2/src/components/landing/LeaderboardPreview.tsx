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
    <section className="w-full py-16 sm:py-20 px-4 sm:px-6 md:px-8 border-b border-[#E5E7EB] bg-white text-[#1F2937] dark:text-foreground">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7F1D1D]/5 text-[#7F1D1D] border border-[#7F1D1D]/20 text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-[#FACC15]" /> Platform Standings
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F2937] dark:text-foreground">
            Rankings and <span className="text-[#7F1D1D]">peer benchmarks</span>
          </h2>
          <p className="text-sm text-[#64748B] dark:text-muted-foreground leading-relaxed">
            Measure your algorithmic proficiency and compare solved challenges with peers.
          </p>
        </div>

        {/* Polished Table Card */}
        <div className="max-w-4xl mx-auto bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-xl shadow-xs overflow-hidden">
          
          {/* Table Header Controls */}
          <div className="p-4 sm:px-6 border-b border-[#E5E7EB] dark:border-border flex items-center justify-between bg-[#FFFBF5] dark:bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1F2937] dark:text-foreground">Top Solvers</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20">
                <Sparkles className="w-3 h-3 text-[#FACC15]" /> Live
              </span>
            </div>
            <Link
              href="/leaderboard"
              className="text-xs font-bold text-[#7F1D1D] hover:underline flex items-center gap-1 transition-colors"
            >
              <span>View Full Leaderboard</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#FACC15]" />
            </Link>
          </div>

          {/* List Rows */}
          <div className="divide-y divide-[#E5E7EB] dark:divide-border">
            {topStudents.map((student) => (
              <div
                key={student.rank}
                className="p-3.5 sm:px-6 flex items-center justify-between gap-4 hover:bg-[#FFFBF5]/70 dark:hover:bg-muted/20 transition-colors"
              >
                {/* Left: Rank & Avatar/Name */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-7 text-center shrink-0">
                    {student.rank === 1 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#FACC15] text-[#1F2937] font-bold text-xs shadow-xs ring-2 ring-[#FACC15]/40">
                        1
                      </span>
                    ) : student.rank === 2 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-[#1F2937] font-bold text-xs border border-slate-300">
                        2
                      </span>
                    ) : student.rank === 3 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200">
                        3
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-bold text-[#64748B]">
                        #{student.rank}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#1F2937] dark:text-foreground truncate">{student.name}</p>
                      <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FFFBF5] text-[#64748B] border border-[#E5E7EB]">
                        {student.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] truncate">{student.dept}</p>
                  </div>
                </div>

                {/* Right: Solved & Score */}
                <div className="flex items-center gap-4 sm:gap-8 shrink-0 text-right">
                  <div className="hidden sm:block">
                    <span className="text-[10px] text-[#64748B] block">Solved</span>
                    <span className="text-xs font-bold font-mono text-[#1F2937] dark:text-foreground">{student.solved}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#64748B] block">Score</span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-[#7F1D1D] dark:text-[#FACC15]">
                      {student.score} pts
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Bar */}
          <div className="p-4 bg-[#FFFBF5] dark:bg-muted/20 border-t border-[#E5E7EB] dark:border-border text-center">
            <p className="text-xs text-[#64748B]">
              Rankings refresh automatically after every evaluated assessment submission.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}

export default LeaderboardPreview;
