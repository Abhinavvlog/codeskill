"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Code2,
  Activity,
  ShieldCheck,
  ClipboardList,
  Terminal,
  BarChart3,
  GraduationCap,
  Plus,
  UploadCloud,
  FileText,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Cpu,
} from "lucide-react";
import { adminDashboardAPI } from "@/config/api";
import { Spinner } from "@/components/ui/spinner";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface RecentUser {
  _id: string;
  name: string;
  email: string;
  role?: string;
  createdAt: string;
}

interface RecentSubmission {
  _id: string;
  user?: {
    name?: string;
    email?: string;
  };
  problem?: {
    title?: string;
  };
  verdict?: string;
  createdAt: string;
}

interface RecentAssessment {
  _id: string;
  title: string;
  status: string;
  durationMinutes?: number;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProblems: 0,
    totalContests: 0,
    totalSubmissions: 0,
    totalAssessments: 0,
    totalQuestions: 0,
    activeToday: 0,
  });

  const [recentActivity, setRecentActivity] = useState<{
    users: RecentUser[];
    submissions: RecentSubmission[];
    assessments: RecentAssessment[];
  }>({
    users: [],
    submissions: [],
    assessments: [],
  });

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          defaults: { duration: 0.35, clearProps: "opacity,transform,translate,rotate,scale" },
        });
        tl.fromTo(".page-header", { opacity: 0, y: -15 }, { opacity: 1, y: 0 })
          .fromTo(".stat-card", { opacity: 0, y: 15 }, { opacity: 1, y: 0, stagger: 0.05 }, "-=0.15")
          .fromTo(".action-tile", { opacity: 0, y: 15 }, { opacity: 1, y: 0, stagger: 0.05 }, "-=0.2")
          .fromTo(".activity-section", { opacity: 0, y: 15 }, { opacity: 1, y: 0 }, "-=0.2");
      });
      return () => mm.revert();
    },
    { scope: containerRef }
  );

  const fetchStats = useCallback(async (isRefreshCall = false) => {
    if (isRefreshCall) setIsRefreshing(true);
    else setLoading(true);

    try {
      const res = await adminDashboardAPI.getStats();
      if (res.data.success || res.data.stats) {
        setStats((prev) => ({
          ...prev,
          ...(res.data.stats || {}),
        }));
        if (res.data.recentActivity) {
          setRecentActivity({
            users: res.data.recentActivity.users || [],
            submissions: res.data.recentActivity.submissions || [],
            assessments: res.data.recentActivity.assessments || [],
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const kpis = [
    {
      title: "Enrolled Candidates",
      value: stats.totalUsers || 0,
      sublabel: "Students & Portal Users",
      icon: GraduationCap,
      href: "/admin/students",
      color: "text-[#7F1D1D]",
      bg: "bg-[#7F1D1D]/10",
      border: "hover:border-[#7F1D1D]/40",
    },
    {
      title: "Assessments",
      value: stats.totalAssessments || 0,
      sublabel: "Examination Drives",
      icon: ClipboardList,
      href: "/admin/assessments",
      color: "text-[#7F1D1D]",
      bg: "bg-[#7F1D1D]/10",
      border: "hover:border-[#7F1D1D]/40",
    },
    {
      title: "Question Bank",
      value: stats.totalQuestions || 0,
      sublabel: "Active Question Items",
      icon: Code2,
      href: "/admin/questions",
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "hover:border-purple-300",
    },
    {
      title: "Coding Problems",
      value: stats.totalProblems || 0,
      sublabel: "Practice Challenges",
      icon: Terminal,
      href: "/admin/problems",
      color: "text-[#854D0E]",
      bg: "bg-[#FACC15]/20",
      border: "hover:border-[#FACC15]",
    },
    {
      title: "Evaluations & Runs",
      value: stats.totalSubmissions || 0,
      sublabel: "Total Code Submissions",
      icon: BarChart3,
      href: "/admin/candidates",
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "hover:border-emerald-300",
    },
    {
      title: "Active Today",
      value: stats.activeToday ?? 0,
      sublabel: "Live Platform Activity",
      icon: Activity,
      href: "/admin/students",
      color: "text-cyan-700",
      bg: "bg-cyan-50",
      border: "hover:border-cyan-300",
    },
  ];

  const quickActions = [
    {
      title: "Create Assessment",
      description: "Set up proctored examination drives, timing windows, and question banks.",
      href: "/admin/assessments/create",
      icon: Plus,
      cta: "New Assessment",
      accent: "from-[#7F1D1D]/10 to-transparent",
      btnClass: "bg-[#7F1D1D] hover:bg-[#450A0A] text-white",
    },
    {
      title: "Question Bank",
      description: "Author algorithmic problems, MCQs, or bulk-import standard CSV datasets.",
      href: "/admin/questions/create",
      icon: Code2,
      cta: "Add Question",
      accent: "from-[#7F1D1D]/10 to-transparent",
      btnClass: "bg-[#7F1D1D] hover:bg-[#450A0A] text-white",
    },
    {
      title: "Bulk Import Students",
      description: "Onboard student rosters, automatically assign roll numbers and send credentials.",
      href: "/admin/students/import",
      icon: UploadCloud,
      cta: "Import Students",
      accent: "from-blue-500/10 to-transparent",
      btnClass: "bg-white border border-[#E5E7EB] hover:bg-[#FFFBF5] text-[#1F2937]",
    },
    {
      title: "Candidate Performance",
      description: "Inspect student scoring tables, percentiles, and generate official university PDFs.",
      href: "/admin/candidates",
      icon: FileText,
      cta: "View Results",
      accent: "from-emerald-500/10 to-transparent",
      btnClass: "bg-white border border-[#E5E7EB] hover:bg-[#FFFBF5] text-[#1F2937]",
    },
  ];

  return (
    <div ref={containerRef} className="p-6 md:p-8 font-sans relative min-h-full bg-[#FFFBF5]/20 text-[#1F2937]">
      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Header Strip */}
        <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase bg-[#7F1D1D]/10 text-[#7F1D1D] border border-[#7F1D1D]/20 rounded-md">
                Chandigarh University
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Examination Infrastructure Live
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1F2937] tracking-tight">
              Admin <span className="text-[#7F1D1D]">Dashboard</span>
            </h1>
            <p className="text-sm md:text-base text-[#64748B] mt-0.5">
              Executive overview &amp; real-time telemetry for departmental examinations and candidate evaluations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchStats(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#FFFBF5] text-[#1F2937] transition-all shadow-xs hover:border-[#7F1D1D]/40 disabled:opacity-50 cursor-pointer"
              title="Refresh telemetry data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#64748B] ${isRefreshing ? "animate-spin text-[#7F1D1D]" : ""}`} />
              <span>{isRefreshing ? "Refreshing..." : "Sync Telemetry"}</span>
            </button>
            <Link
              href="/admin/assessments/create"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#7F1D1D] text-white hover:bg-[#450A0A] transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-[#FACC15]" />
              <span>New Assessment</span>
            </Link>
          </div>
        </div>

        {/* 6 Key Performance Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Link
                key={kpi.title}
                href={kpi.href}
                className={`stat-card bg-white p-4 md:p-5 rounded-2xl border border-[#E5E7EB] transition-all group hover:-translate-y-0.5 shadow-xs ${kpi.border}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${kpi.bg} ${kpi.color} group-hover:scale-105 transition-transform`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#64748B]/40 group-hover:text-[#7F1D1D] group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider truncate mb-1">
                    {kpi.title}
                  </p>
                  {loading ? (
                    <Spinner className="w-5 h-5 animate-spin text-[#7F1D1D]" />
                  ) : (
                    <p className="text-2xl md:text-3xl font-extrabold text-[#1F2937] tracking-tight">
                      {kpi.value.toLocaleString()}
                    </p>
                  )}
                  <p className="text-[10px] text-[#64748B] truncate mt-1">
                    {kpi.sublabel}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Action Center - 4 Functional Tiles */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#7F1D1D]" />
              Administrative Operations Hub
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <div
                  key={action.title}
                  className={`action-tile relative bg-white border border-[#E5E7EB] rounded-2xl p-5 flex flex-col justify-between hover:border-[#7F1D1D]/40 transition-all group overflow-hidden shadow-xs hover:shadow-sm`}
                >
                  <div className="relative z-10 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FFFBF5] border border-[#E5E7EB] flex items-center justify-center text-[#7F1D1D] mb-3 group-hover:scale-105 transition-transform">
                      <ActionIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#1F2937] mb-1 group-hover:text-[#7F1D1D] transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                      {action.description}
                    </p>
                  </div>

                  <div className="relative z-10 pt-2 border-t border-[#E5E7EB]">
                    <Link
                      href={action.href}
                      className={`inline-flex items-center justify-center w-full gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${action.btnClass}`}
                    >
                      <span>{action.cta}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity & System Health Split Section */}
        <div className="activity-section grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols): Recent Candidates Feed */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#7F1D1D]/10 text-[#7F1D1D] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1F2937]">Recent Candidate Onboarding</h3>
                  <p className="text-[11px] text-[#64748B]">Latest registered student profiles &amp; accounts</p>
                </div>
              </div>

              <Link
                href="/admin/students"
                className="text-xs font-bold text-[#7F1D1D] hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center items-center">
                <Spinner className="w-6 h-6 animate-spin text-[#7F1D1D]" />
              </div>
            ) : recentActivity.users.length === 0 ? (
              <div className="py-10 text-center text-[#64748B] text-xs">
                No recent candidates found in system records.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentActivity.users.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#FFFBF5]/40 border border-[#E5E7EB] hover:bg-[#FFFBF5] transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#7F1D1D]/10 border border-[#7F1D1D]/20 text-[#7F1D1D] font-bold flex items-center justify-center shrink-0 text-xs">
                        {u.name?.charAt(0)?.toUpperCase() || "S"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#1F2937] truncate">{u.name || "Unnamed Student"}</p>
                        <p className="text-[11px] text-[#64748B] truncate">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-[#64748B] uppercase">
                        {u.role || "student"}
                      </span>
                      <span className="text-[10px] text-[#64748B] hidden sm:inline">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Recent"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column (1 Col): Verified Examination Infrastructure & Status */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#E5E7EB]">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1F2937]">Infrastructure Security</h3>
                  <p className="text-[11px] text-[#64748B]">Examination safeguards &amp; engine health</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-[#1F2937]">Safe Exam Browser Integrity</p>
                    <p className="text-[11px] text-[#64748B]">Fullscreen lock &amp; tab-switch violation guard active.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-[#1F2937]">Isolated Code Sandbox</p>
                    <p className="text-[11px] text-[#64748B]">Multi-language execution engine ready with time/memory caps.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-[#1F2937]">Automated Proctoring Telemetry</p>
                    <p className="text-[11px] text-[#64748B]">Webcam snapshot &amp; device event streaming active.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#64748B]">
              <span>Department of Skill Development &amp; Lab</span>
              <span className="font-bold text-[#7F1D1D]">CU Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
