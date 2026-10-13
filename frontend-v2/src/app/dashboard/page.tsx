"use client";

import {
  Code2,
  GitCommit,
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
    <div className="flex-1 bg-[#FFFBF5]/30 text-[#1F2937] font-sans min-h-screen">
      <div className="max-w-7xl mx-auto w-full px-6 py-8 mt-16 md:mt-24">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 text-[#1F2937]">
              Dashboard
            </h1>
            <p className="text-sm text-[#64748B]">
              Welcome back, <span className="text-[#7F1D1D] font-semibold">{user?.name || "Student"}</span>. Here&apos;s your assessment overview.
            </p>
          </div>
          <Link
            href="/assessments"
            className="inline-flex items-center justify-center h-9 px-4 rounded-xl bg-[#7F1D1D] hover:bg-[#450A0A] text-white text-xs font-semibold transition-all shadow-xs"
          >
            View Assessments <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-[#FACC15]" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Hero / Up Next Card */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6 overflow-hidden relative">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-[#7F1D1D]/10 text-[#7F1D1D] text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-[#7F1D1D]/20">
                      Up Next
                    </span>
                  </div>

                  {assessmentsLoading ? (
                    <div className="flex items-center gap-2 text-[#64748B]">
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
                          "Complete this assessment to evaluate algorithmic performance."}
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
                              <Clock className="w-3.5 h-3.5 text-[#FACC15] fill-[#FACC15]" />
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
                        No assessments are currently available. Check back later or contact your instructor.
                      </p>
                    </div>
                  )}
                </div>

                {!assessmentsLoading && nextAssessment && (
                  <Link
                    href={`/assessments/${nextAssessment._id}`}
                    className="inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl bg-[#7F1D1D] text-white text-xs font-bold transition-all hover:bg-[#450A0A] whitespace-nowrap shadow-xs shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 text-[#FACC15] fill-[#FACC15]" />
                    Start Assessment
                  </Link>
                )}

                {!assessmentsLoading && !nextAssessment && !assessmentsError && (
                  <Link
                    href="/assessments"
                    className="inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl bg-white text-[#1F2937] text-xs font-semibold transition-colors hover:bg-[#FFFBF5] whitespace-nowrap shadow-xs shrink-0 border border-[#E5E7EB]"
                  >
                    Browse All
                  </Link>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: "Available Tests",
                  value: assessmentsLoading ? "—" : String(activeAssessments.length),
                  icon: ClipboardList,
                  color: "text-[#7F1D1D]",
                  bg: "bg-[#7F1D1D]/10",
                },
                {
                  label: "Completed",
                  value: "—",
                  icon: CheckCircle2,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  label: "Best Score",
                  value: "—",
                  icon: Trophy,
                  color: "text-[#854D0E]",
                  bg: "bg-[#FACC15]/20",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-4 flex flex-col hover:border-[#7F1D1D]/30 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                      <stat.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[#64748B] text-xs font-bold uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-[#1F2937] mt-auto">{stat.value}</span>
                </div>
              ))}
            </div>

            {/* Active Assessments List */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FFFBF5]/70">
                <h2 className="text-sm font-bold text-[#1F2937]">Available Assessments</h2>
                <Link
                  href="/assessments"
                  className="text-xs font-bold text-[#7F1D1D] hover:underline flex items-center transition-colors"
                >
                  View all <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>

              {assessmentsLoading ? (
                <div className="p-8 flex items-center justify-center gap-2 text-[#64748B]">
                  <Spinner className="w-4 h-4 animate-spin text-[#7F1D1D]" />
                  <span className="text-xs">Loading…</span>
                </div>
              ) : assessmentsError ? (
                <div className="p-8 flex flex-col items-center gap-2 text-[#64748B]">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-xs">Failed to load assessments.</p>
                </div>
              ) : activeAssessments.length === 0 ? (
                <div className="p-8 flex flex-col items-center gap-2 text-[#64748B]">
                  <ClipboardList className="w-6 h-6 opacity-30 text-[#7F1D1D]" />
                  <p className="text-xs">No active assessments at the moment.</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-[#E5E7EB]">
                  {activeAssessments.slice(0, 5).map((assessment) => (
                    <div
                      key={assessment._id}
                      className="p-3.5 flex items-center justify-between hover:bg-[#FFFBF5]/50 transition-colors gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-[#7F1D1D]/10 text-[#7F1D1D]">
                          <ClipboardList className="w-3.5 h-3.5" />
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
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#7F1D1D] text-white text-xs font-semibold hover:bg-[#450A0A] transition-colors shadow-xs"
                      >
                        <Play className="w-3 h-3 text-[#FACC15] fill-[#FACC15]" />
                        Start
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">

            {/* Quick Links */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-[#1F2937]">Quick Links</h2>
                <BookOpen className="w-3.5 h-3.5 text-[#64748B]" />
              </div>
              <div className="space-y-1">
                {[
                  { href: "/assessments", label: "My Assessments", icon: ClipboardList },
                  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
                  { href: "/profile", label: "My Profile", icon: BarChart3 },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#FFFBF5] transition-colors group"
                  >
                    <item.icon className="w-3.5 h-3.5 text-[#7F1D1D] transition-colors" />
                    <span className="text-xs font-semibold text-[#1F2937] group-hover:text-[#7F1D1D] transition-colors">{item.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#64748B] ml-auto" />
                  </Link>
                ))}
              </div>
            </div>

            {/* All Assessments Summary */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#E5E7EB] bg-[#FFFBF5]/70">
                <h2 className="text-sm font-bold text-[#1F2937]">All Assessments</h2>
              </div>
              {assessmentsLoading ? (
                <div className="p-6 flex justify-center">
                  <Spinner className="w-4 h-4 animate-spin text-[#7F1D1D]" />
                </div>
              ) : assessments.length === 0 ? (
                <div className="p-5 text-center text-xs text-[#64748B]">
                  No assessments assigned.
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-[#E5E7EB]">
                  {assessments.slice(0, 6).map((assessment) => (
                    <Link
                      key={assessment._id}
                      href={`/assessments/${assessment._id}`}
                      className="px-3.5 py-2.5 hover:bg-[#FFFBF5]/50 transition-colors flex items-center justify-between group gap-2"
                    >
                      <span className="text-xs text-[#1F2937] font-semibold truncate group-hover:text-[#7F1D1D]">
                        {assessment.title}
                      </span>
                      <span
                        className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          assessment.status === "published" || assessment.status === "ongoing"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-gray-100 text-[#64748B] border-gray-200"
                        }`}
                      >
                        {assessment.status === "ongoing" || assessment.status === "published" ? "Active" : assessment.status}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
