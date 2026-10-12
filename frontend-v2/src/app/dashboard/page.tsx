"use client";

import {
  Code2,
  Trophy,
  CheckCircle2,
  Clock,
  ChevronRight,
  Target,
  BookOpen,
  ArrowRight,
  BarChart3,
  ClipboardList,
  AlertCircle,
  Play,
  FileText,
  Flame,
  Layers,
  Sparkles,
  Compass,
  Cpu,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { studentAssessmentsAPI } from "@/config/api";
import { Spinner } from "@/components/ui/spinner";

interface Assessment {
  _id: string;
  title: string;
  description?: string;
  status: "draft" | "published" | "ongoing" | "completed" | "archived";
  duration?: number;
  durationMinutes?: number;
  totalQuestions?: number;
  questionCount?: number;
  totalMarks?: number;
  scheduledStart?: string;
  scheduledEnd?: string;
  attemptStatus?: string;
  attemptScore?: number | null;
}

const DSA_TOPICS = [
  {
    title: "Arrays & Hashing",
    category: "Arrays",
    problems: "24 Problems",
    difficulty: "Fundamental",
    color: "from-blue-600/20 to-blue-900/10",
    border: "border-blue-500/20",
    badge: "bg-blue-500/10 text-blue-400",
  },
  {
    title: "Two Pointers & Sliding Window",
    category: "Two Pointers",
    problems: "18 Problems",
    difficulty: "Medium",
    color: "from-amber-600/20 to-amber-900/10",
    border: "border-amber-500/20",
    badge: "bg-amber-500/10 text-amber-400",
  },
  {
    title: "Trees & Binary Search",
    category: "Trees",
    problems: "22 Problems",
    difficulty: "Intermediate",
    color: "from-emerald-600/20 to-emerald-900/10",
    border: "border-emerald-500/20",
    badge: "bg-emerald-500/10 text-emerald-400",
  },
  {
    title: "Dynamic Programming",
    category: "Dynamic Programming",
    problems: "16 Problems",
    difficulty: "Advanced",
    color: "from-purple-600/20 to-purple-900/10",
    border: "border-purple-500/20",
    badge: "bg-purple-500/10 text-purple-400",
  },
];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(true);
  const [assessmentsError, setAssessmentsError] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchAssessments = async () => {
      try {
        setAssessmentsLoading(true);
        const res = await studentAssessmentsAPI.getMyAssessments();
        const data = res.data;
        const list = Array.isArray(data) ? data : data?.data ?? data?.assessments ?? [];
        setAssessments(list);
      } catch (err) {
        console.error("Failed to fetch assessments", err);
        setAssessmentsError(true);
      } finally {
        setAssessmentsLoading(false);
      }
    };
    fetchAssessments();
  }, [user]);

  if (!mounted || loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#080D1B] min-h-screen text-[#F8FAFC]">
        <div className="w-8 h-8 border-4 border-[#7F1D1D]/40 border-t-[#FACC15] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const activeAssessments = assessments.filter(
    (a) => a.status === "published" || a.status === "ongoing"
  );
  const nextAssessment = activeAssessments[0] ?? null;

  return (
    <div className="flex-1 bg-[#080D1B] text-[#F8FAFC] font-sans min-h-screen pt-20 pb-16 selection:bg-[#7F1D1D] selection:text-white">
      {/* Background Subtle Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(153,27,27,0.12),transparent)] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        {/* Top Header / Candidate Greeting */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#334155]/60">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#7F1D1D]/30 text-[#FACC15] border border-[#7F1D1D]/50">
                <GraduationCap className="w-3.5 h-3.5" />
                Student Workspace
              </span>
              <span className="text-xs text-[#94A3B8]">
                ID: {user.email || user.name || "Enrolled"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
              Welcome back,{" "}
              <span className="text-[#FACC15]">{user.name?.split(" ")[0] || "Student"}</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
              Track your algorithmic growth, practice coding problems, and complete assigned assessments.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/problems"
              className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-[#F8FAFC] text-xs font-semibold border border-[#334155] transition-all shadow-xs"
            >
              <Code2 className="w-3.5 h-3.5 text-[#FACC15]" />
              Practice DSA
            </Link>
            <Link
              href="/assessments"
              className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-[#7F1D1D] hover:bg-[#991B1B] text-white text-xs font-bold transition-all shadow-md shadow-[#7F1D1D]/20 active:scale-[0.98]"
            >
              <ClipboardList className="w-3.5 h-3.5 text-[#FACC15]" />
              View Assessments
            </Link>
          </div>
        </div>

        {/* Learning Dashboard Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Area (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Featured Recommendation Hero Card (CodeSignal style) */}
            <div className="bg-[#151E30] rounded-2xl border border-[#334155] p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#7F1D1D]/20 via-[#FACC15]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30">
                      <Sparkles className="w-3 h-3 text-[#FACC15]" />
                      Recommended Daily Challenge
                    </span>
                    <span className="text-[11px] text-[#94A3B8]">~15 mins</span>
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#F8FAFC] tracking-tight group-hover:text-[#FACC15] transition-colors">
                      Two Sum &amp; Hash Map Patterns
                    </h2>
                    <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 max-w-xl line-clamp-2 leading-relaxed">
                      Given an array of integers and a target sum, identify two indices that total the target with an optimal O(n) hash table solution.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#94A3B8] pt-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Easy
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-[#FACC15]" />
                      Arrays &amp; Hashing
                    </span>
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-[#64748B]" />
                      Docker Sandbox
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex sm:flex-col justify-end">
                  <Link
                    href="/problems/two-sum"
                    className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-[#7F1D1D] hover:bg-[#991B1B] text-white text-xs font-bold transition-all shadow-md shadow-[#7F1D1D]/30 group/btn"
                  >
                    <span>Solve Challenge</span>
                    <Play className="w-3.5 h-3.5 text-[#FACC15] fill-[#FACC15] group-hover/btn:scale-110 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            {/* 2. DSA Topic Collections / Practice Tracks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#F8FAFC]">
                    DSA Practice Tracks
                  </h2>
                  <p className="text-xs text-[#94A3B8]">
                    Systematic topic collections with curated algorithmic problems.
                  </p>
                </div>
                <Link
                  href="/problems"
                  className="text-xs font-semibold text-[#FACC15] hover:underline flex items-center"
                >
                  Browse all <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {DSA_TOPICS.map((track) => (
                  <Link
                    key={track.title}
                    href={`/problems?category=${encodeURIComponent(track.category)}`}
                    className="p-4 rounded-xl bg-[#151E30] hover:bg-[#1E293B] border border-[#334155] transition-all flex flex-col justify-between group hover:border-[#FACC15]/40"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${track.badge}`}>
                          {track.difficulty}
                        </span>
                        <span className="text-[11px] text-[#94A3B8] font-mono">
                          {track.problems}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#FACC15] transition-colors">
                        {track.title}
                      </h3>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#334155]/60 flex items-center justify-between text-xs text-[#94A3B8]">
                      <span>Start practicing</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#FACC15] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 3. Assigned Examinations & Assessments */}
            <div className="bg-[#151E30] rounded-2xl border border-[#334155] shadow-lg overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-[#334155] flex items-center justify-between bg-[#111827]">
                <div className="flex items-center gap-2.5">
                  <ClipboardList className="w-4 h-4 text-[#FACC15]" />
                  <div>
                    <h2 className="text-sm font-bold text-[#F8FAFC]">
                      Active Assessments
                    </h2>
                    <span className="text-[11px] text-[#94A3B8]">
                      Assigned by university administration
                    </span>
                  </div>
                </div>
                <Link
                  href="/assessments"
                  className="text-xs font-semibold text-[#FACC15] hover:underline flex items-center"
                >
                  View all <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>

              {assessmentsLoading ? (
                <div className="p-10 flex flex-col items-center justify-center gap-2 text-[#94A3B8]">
                  <Spinner className="w-5 h-5 animate-spin text-[#FACC15]" />
                  <span className="text-xs">Loading assigned assessments...</span>
                </div>
              ) : assessmentsError ? (
                <div className="p-8 flex flex-col items-center gap-2 text-[#94A3B8]">
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                  <p className="text-xs text-rose-300">
                    Failed to connect to assessment services. Please refresh.
                  </p>
                </div>
              ) : activeAssessments.length === 0 ? (
                <div className="p-10 flex flex-col items-center gap-2 text-center text-[#94A3B8]">
                  <CheckCircle2 className="w-8 h-8 text-[#334155]" />
                  <p className="text-xs font-semibold text-[#F8FAFC]">
                    No pending assessments right now.
                  </p>
                  <p className="text-[11px] max-w-sm">
                    All scheduled tests have been attempted, or no new assessments are active for your batch.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#334155]/80">
                  {activeAssessments.map((item) => (
                    <div
                      key={item._id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#1E293B]/60 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Live
                          </span>
                          <h3 className="text-sm font-bold text-[#F8FAFC] truncate">
                            {item.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
                          {item.totalQuestions && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-[#FACC15]" />
                              {item.totalQuestions} questions
                            </span>
                          )}
                          {item.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              {item.duration} mins
                            </span>
                          )}
                          {item.totalMarks && (
                            <span className="flex items-center gap-1">
                              <Trophy className="w-3.5 h-3.5 text-[#7F1D1D]" />
                              {item.totalMarks} marks
                            </span>
                          )}
                        </div>
                      </div>

                      <Link
                        href={`/assessments/${item._id}`}
                        className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl bg-[#7F1D1D] hover:bg-[#991B1B] text-white text-xs font-bold transition-all shadow-xs shrink-0"
                      >
                        <Play className="w-3 h-3 text-[#FACC15] fill-[#FACC15]" />
                        Attempt Now
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar Column (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Stats Summary */}
            <div className="bg-[#151E30] rounded-2xl border border-[#334155] p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#F8FAFC]">
                  Progress Overview
                </h2>
                <BarChart3 className="w-4 h-4 text-[#94A3B8]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#1E293B] border border-[#334155]/80">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                    Active Tests
                  </span>
                  <span className="text-2xl font-black text-[#FACC15] mt-1 block">
                    {assessmentsLoading ? "—" : activeAssessments.length}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#1E293B] border border-[#334155]/80">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                    Assigned
                  </span>
                  <span className="text-2xl font-black text-[#F8FAFC] mt-1 block">
                    {assessmentsLoading ? "—" : assessments.length}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#111827] border border-[#334155]/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4 text-[#FACC15]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#F8FAFC]">Daily Streak</p>
                  <p className="text-[10px] text-[#94A3B8]">
                    Practice daily to stay interview-ready
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Navigation Hub */}
            <div className="bg-[#151E30] rounded-2xl border border-[#334155] p-5 shadow-lg space-y-2">
              <h2 className="text-sm font-bold text-[#F8FAFC] mb-3">
                Quick Access
              </h2>

              {[
                { href: "/problems", label: "Problem Repository", icon: Code2, desc: "DSA problems with test cases" },
                { href: "/contests", label: "Coding Contests", icon: Trophy, desc: "Live university competitions" },
                { href: "/leaderboard", label: "Campus Standings", icon: Target, desc: "Rankings & percentiles" },
                { href: "/profile", label: "My Profile & Submissions", icon: GraduationCap, desc: "Execution history & badges" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#1E293B] transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#1E293B] group-hover:bg-[#7F1D1D]/30 text-[#FACC15] flex items-center justify-center shrink-0 transition-colors">
                    <item.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#FACC15] block transition-colors">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-[#94A3B8] block truncate">
                      {item.desc}
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#334155] group-hover:text-[#FACC15] transition-colors" />
                </Link>
              ))}
            </div>

            {/* Skill Analytics Roadmap (Future Scope notice per instructions) */}
            <div className="bg-[#151E30] rounded-2xl border border-[#334155] p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#FACC15]" />
                  Skill Analytics
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#334155] text-[#94A3B8]">
                  Future Scope
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                Institution-wide benchmark percentiles, ELO skill ratings, and automated topic strength radar charts will integrate into your student scorecard upon university rollout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
