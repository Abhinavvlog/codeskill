"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  BookOpen,
  Award,
  Users,
  ShieldCheck,
  Plus,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Layers,
  GraduationCap,
} from "lucide-react";
import { adminLearningAPI } from "@/config/api";
import { Spinner } from "@/components/ui/spinner";

interface OverviewMetrics {
  totalPaths: number;
  totalCourses: number;
  totalEnrollments: number;
  totalCertificates: number;
  recentCertificates: Array<{
    id: string;
    credentialId: string;
    pathTitle: string;
    recipientName: string;
    issueDate: string;
    status: string;
  }>;
}

export default function AdminLearningDashboard() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await adminLearningAPI.getOverview();
      setMetrics(res.data);
    } catch (err) {
      console.error("Failed to load admin learning overview", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="w-8 h-8 text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8 font-sans text-zinc-100">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Admin Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Learning, Practice & Certification Control
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Author paths, build practice curricula, configure badges, and oversee student certifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/learning/paths"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Manage Learning Paths</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-3">
            <span>Learning Paths</span>
            <Compass className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {metrics?.totalPaths || 0}
          </div>
          <span className="text-[11px] text-zinc-500 mt-1 block">Active Tracks</span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-3">
            <span>Total Courses</span>
            <BookOpen className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {metrics?.totalCourses || 0}
          </div>
          <span className="text-[11px] text-zinc-500 mt-1 block">Modules & Reading</span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-3">
            <span>Student Enrollments</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {metrics?.totalEnrollments || 0}
          </div>
          <span className="text-[11px] text-zinc-500 mt-1 block">Active Learners</span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-3">
            <span>Issued Certificates</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {metrics?.totalCertificates || 0}
          </div>
          <span className="text-[11px] text-zinc-500 mt-1 block">Verified Credentials</span>
        </div>
      </div>

      {/* Recent Certificates Table */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Recently Awarded Certificates</span>
          </h2>
          <span className="text-xs text-zinc-500">Live Registry</span>
        </div>

        {!metrics?.recentCertificates || metrics.recentCertificates.length === 0 ? (
          <div className="text-center py-12 text-xs text-zinc-500">
            No certificates issued yet. Students will appear here once they complete paths.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Credential ID</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Learning Path</th>
                  <th className="py-2.5 px-3">Issue Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {metrics.recentCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-zinc-800/30">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-400">
                      {cert.credentialId}
                    </td>
                    <td className="py-3 px-3 font-semibold text-zinc-200">
                      {cert.recipientName}
                    </td>
                    <td className="py-3 px-3 text-zinc-300">{cert.pathTitle}</td>
                    <td className="py-3 px-3 text-zinc-400">
                      {new Date(cert.issueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                        {cert.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/verify/${cert.credentialId}`}
                        target="_blank"
                        className="text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        Verify ↗
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
