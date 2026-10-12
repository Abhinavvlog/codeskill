"use client";

import {
  Code2,
  Trophy,
  CheckCircle2,
  Clock,
  ChevronRight,
  Flame,
  BookOpen,
  ArrowRight,
  BarChart3,
  ClipboardList,
  AlertCircle,
  Play,
  FileText,
  TrendingUp,
  Award,
  Zap,
  Calendar,
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
        // Handle both { data: [...] } and direct array responses
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
      <div className="flex-1 flex items-center justify-center bg-white min-h-screen">
        <div className="w-8 h-8 border-4 border-[#7F1D1D]/20 border-t-[#7F1D1D] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  // Pick the first active assessment as the "next" one
  const nextAssessment = assessments.find((a) => a.status === "published" || a.status === "ongoing") ?? null;

  // Available = all active
  const activeAssessments = assessments.filter((a) => a.status === "published" || a.status === "ongoing");

  return (
    <div className="flex-1 bg-[#FFFBF5]/40 text-[#1F2937] font-sans min-h-screen">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 mt-16 md:mt-20">

        {/* Welcome Header */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 mb-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#7F1D1D]/10 text-[#7F1D1D]">
                  Student Portal
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FACC15]/20 text-[#854D0E]">
                  <Flame className="w-3.5 h-3.5 fill-[#FACC15] text-[#D97706]" />
                  21-Day Streak
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F2937]">
                Welcome back, <span className="text-[#7F1D1D]">{user?.name || "Student"}</span>!
              </h1>
              <p className="text-sm text-[#64748B] mt-1 max-w-xl">
                Track your active university assessments, code submissions, and global ranking all in one place.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/problems"
                className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-white border border-[#E5E7EB] text-[#1F2937] text-xs font-semibold hover:border-[#7F1D1D] hover:text-[#7F1D1D] transition-colors shadow-xs"
              >
                <Code2 className="w-4 h-4 mr-1.5 text-[#7F1D1D]" />
                Solve Problems
              </Link>
              <Link
                href="/assessments"
                className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-[#7F1D1D] hover:bg-[#450A0A] text-white text-xs font-semibold transition-all shadow-sm"
              >
                View Assessments <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-[#FACC15]" />
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Core Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs hover:border-[#7F1D1D]/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Problems Solved</span>
              <div className="w-8 h-8 rounded-lg bg-[#7F1D1D]/10 flex items-center justify-center text-[#7F1D1D]">
                <Code2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-[#1F2937]">142</span>
              <span className="text-xs text-[#64748B]">/ 450 total</span>
            </div>
            <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-[#7F1D1D] h-full rounded-full" style={{ width: "31.5%" }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs hover:border-[#7F1D1D]/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Assessments</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ClipboardList className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-[#1F2937]">
                {assessmentsLoading ? "—" : activeAssessments.length}
              </span>
              <span className="text-xs text-emerald-600 font-semibold">Active now</span>
            </div>
            <p className="text-xs text-[#64748B] mt-2">18 completed this term</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs hover:border-[#FACC15] transition-colors relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Coding Streak</span>
              <div className="w-8 h-8 rounded-lg bg-[#FACC15]/20 flex items-center justify-center text-[#D97706]">
                <Flame className="w-4 h-4 fill-[#FACC15]" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-[#1F2937]">21</span>
              <span className="text-xs text-[#D97706] font-bold">Days in a row</span>
            </div>
            <p className="text-xs text-[#64748B] mt-2">Personal best: 28 days</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs hover:border-[#7F1D1D]/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Contest Rating</span>
              <div className="w-8 h-8 rounded-lg bg-[#7F1D1D]/10 text-[#7F1D1D] flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-[#1F2937]">1,640</span>
              <span className="text-xs font-semibold text-[#7F1D1D]">Top 8%</span>
            </div>
            <p className="text-xs text-[#64748B] mt-2">Rank #142 of 2,400</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Up Next Assessment Card */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-[#7F1D1D] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      Up Next
                    </span>
                    <span className="bg-[#FFFBF5] text-[#7F1D1D] text-[11px] font-semibold px-2 py-0.5 rounded border border-[#E5E7EB]">
                      Official Exam
                    </span>
                  </div>

                  {assessmentsLoading ? (
                    <div className="flex items-center gap-2 text-[#64748B] py-2">
                      <Spinner className="w-4 h-4 animate-spin text-[#7F1D1D]" />
                      <span className="text-sm">Loading your assessments…</span>
                    </div>
                  ) : assessmentsError ? (
                    <div>
                      <h2 className="text-lg font-bold text-[#1F2937] mb-1">No assessments found</h2>
                      <p className="text-[#64748B] text-xs">
                        Could not load assessments. Please try again later.
                      </p>
                    </div>
                  ) : nextAssessment ? (
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-[#7F1D1D] mb-1 truncate">{nextAssessment.title}</h2>
                      <p className="text-[#64748B] text-xs sm:text-sm max-w-md line-clamp-2">
                        {nextAssessment.description ||
                          "Complete this assessment to evaluate algorithmic performance under proctored conditions."}
                      </p>
                      {(nextAssessment.duration || nextAssessment.totalQuestions) && (
                        <div className="flex items-center gap-4 mt-3 text-xs text-[#64748B]">
                          {nextAssessment.totalQuestions && (
                            <span className="flex items-center gap-1.5 font-medium">
                              <FileText className="w-3.5 h-3.5 text-[#7F1D1D]" />
                              {nextAssessment.totalQuestions} questions
                            </span>
                          )}
                          {nextAssessment.duration && (
                            <span className="flex items-center gap-1.5 font-medium">
                              <Clock className="w-3.5 h-3.5 text-[#FACC15] fill-[#FACC15]/20" />
                              {nextAssessment.duration} min
                            </span>
                          )}
                          {nextAssessment.totalMarks && (
                            <span className="flex items-center gap-1.5 font-medium">
                              <Trophy className="w-3.5 h-3.5 text-[#7F1D1D]" />
                              {nextAssessment.totalMarks} marks
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-lg font-bold text-[#1F2937] mb-1">No Active Assessments</h2>
                      <p className="text-[#64748B] text-xs sm:text-sm max-w-md">
                        No examination is currently scheduled. Practice your algorithms in the problem bank or check back later.
                      </p>
                    </div>
                  )}
                </div>

                {!assessmentsLoading && nextAssessment && (
                  <Link
                    href={`/assessments/${nextAssessment._id}`}
                    className="inline-flex items-center gap-2 justify-center h-10 px-6 rounded-xl bg-[#7F1D1D] text-white text-xs font-bold transition-all hover:bg-[#450A0A] whitespace-nowrap shadow-sm shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 text-[#FACC15] fill-[#FACC15]" />
                    Start Assessment
                  </Link>
                )}

                {!assessmentsLoading && !nextAssessment && !assessmentsError && (
                  <Link
                    href="/problems"
                    className="inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl bg-[#7F1D1D] text-white text-xs font-semibold transition-colors hover:bg-[#450A0A] whitespace-nowrap shadow-xs shrink-0"
                  >
                    Solve Problems
                  </Link>
                )}
              </div>
            </div>

            {/* Available Assessments List */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FFFBF5]/60">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#7F1D1D]" />
                  <h2 className="text-sm font-bold text-[#1F2937]">Active & Upcoming Assessments</h2>
                </div>
                <Link
                  href="/assessments"
                  className="text-xs font-bold text-[#7F1D1D] hover:underline flex items-center transition-colors"
                >
                  View all ({assessments.length}) <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>

              {assessmentsLoading ? (
                <div className="p-8 flex items-center justify-center gap-2 text-[#64748B]">
                  <Spinner className="w-4 h-4 animate-spin text-[#7F1D1D]" />
                  <span className="text-xs">Loading assessments…</span>
                </div>
              ) : assessmentsError ? (
                <div className="p-8 flex flex-col items-center gap-2 text-[#64748B]">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-xs">Failed to load assessments.</p>
                </div>
              ) : activeAssessments.length === 0 ? (
                <div className="p-8 flex flex-col items-center gap-2 text-[#64748B]">
                  <ClipboardList className="w-8 h-8 opacity-30 text-[#7F1D1D]" />
                  <p className="text-xs">No active assessments at the moment.</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-[#E5E7EB]">
                  {activeAssessments.slice(0, 5).map((assessment) => (
                    <div
                      key={assessment._id}
                      className="p-4 flex items-center justify-between hover:bg-[#FFFBF5]/50 transition-colors gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#7F1D1D]/10 text-[#7F1D1D]">
                          <ClipboardList className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#1F2937] text-xs sm:text-sm truncate">
                            {assessment.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#64748B]">
                            {assessment.totalQuestions && (
                              <span>{assessment.totalQuestions} questions</span>
                            )}
                            {assessment.totalQuestions && assessment.duration && (
                              <span className="opacity-40">•</span>
                            )}
                            {assessment.duration && (
                              <span className="flex items-center gap-1 font-medium">
                                <Clock className="w-3 h-3 text-[#D97706]" />
                                {assessment.duration} min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/assessments/${assessment._id}`}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#7F1D1D] text-white text-xs font-semibold hover:bg-[#450A0A] transition-colors shadow-xs"
                      >
                        <Play className="w-3 h-3 text-[#FACC15] fill-[#FACC15]" />
                        Start
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Submissions */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FFFBF5]/60">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#FACC15]" />
                  <h2 className="text-sm font-bold text-[#1F2937]">Recent Submissions</h2>
                </div>
                <Link
                  href="/problems"
                  className="text-xs font-bold text-[#7F1D1D] hover:underline flex items-center transition-colors"
                >
                  All Problems <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFFBF5]/80 text-[#64748B] font-semibold border-b border-[#E5E7EB]">
                    <tr>
                      <th className="py-2.5 px-4">Problem</th>
                      <th className="py-2.5 px-4">Language</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Runtime</th>
                      <th className="py-2.5 px-4 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-[#1F2937]">
                    {[
                      { title: "Two Sum", lang: "Python 3", status: "Accepted", time: "42 ms", when: "2h ago" },
                      { title: "LRU Cache", lang: "C++ 20", status: "Accepted", time: "18 ms", when: "5h ago" },
                      { title: "Merge Intervals", lang: "Java 21", status: "Wrong Answer", time: "65 ms", when: "1d ago" },
                      { title: "Valid Parentheses", lang: "TypeScript", status: "Accepted", time: "28 ms", when: "2d ago" },
                    ].map((sub, i) => (
                      <tr key={i} className="hover:bg-[#FFFBF5]/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#1F2937]">{sub.title}</td>
                        <td className="py-3 px-4 text-[#64748B]">{sub.lang}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                              sub.status === "Accepted"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#64748B]">{sub.time}</td>
                        <td className="py-3 px-4 text-right text-[#64748B]">{sub.when}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">

            {/* Skill Progress */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#7F1D1D]" />
                  <h2 className="text-sm font-bold text-[#1F2937]">Skill Progress</h2>
                </div>
                <span className="text-[11px] font-bold text-[#7F1D1D]">Advanced</span>
              </div>
              <div className="space-y-4">
                {[
                  { skill: "Data Structures", level: 82, color: "bg-[#7F1D1D]" },
                  { skill: "Algorithms & Search", level: 74, color: "bg-[#7F1D1D]" },
                  { skill: "Dynamic Programming", level: 65, color: "bg-[#FACC15]" },
                  { skill: "System Design", level: 58, color: "bg-[#854D0E]" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-[#1F2937]">{item.skill}</span>
                      <span className="font-mono text-[#64748B] text-[11px]">{item.level}%</span>
                    </div>
                    <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${item.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Contest Card */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-[#FACC15]/20 text-[#854D0E]">
                  <Trophy className="w-3 h-3 text-[#D97706]" />
                  Weekly Contest #42
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Registered
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#1F2937] mb-1">
                Saturday Night Algorithm Cup
              </h3>
              <p className="text-xs text-[#64748B] mb-4">
                Starts in 1d 14h 30m • 4 problems • 90 minutes
              </p>
              <Link
                href="/contests"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#7F1D1D] hover:text-[#7F1D1D] text-xs font-bold text-[#1F2937] transition-colors"
              >
                Go to Contest Arena
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-[#1F2937]">Quick Links</h2>
                <BookOpen className="w-3.5 h-3.5 text-[#64748B]" />
              </div>
              <div className="space-y-1">
                {[
                  { href: "/problems", label: "Practice Problem Bank", icon: Code2 },
                  { href: "/assessments", label: "My Assessments", icon: ClipboardList },
                  { href: "/contests", label: "Contest Arena", icon: Trophy },
                  { href: "/leaderboard", label: "Global Leaderboard", icon: Award },
                  { href: "/profile", label: "My Profile & Submissions", icon: BarChart3 },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#FFFBF5] transition-colors group"
                  >
                    <item.icon className="w-4 h-4 text-[#7F1D1D] group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-[#1F2937] group-hover:text-[#7F1D1D] transition-colors">{item.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#64748B] ml-auto group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
