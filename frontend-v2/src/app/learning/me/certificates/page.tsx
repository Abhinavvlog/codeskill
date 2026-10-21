"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Award,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Calendar,
  Sparkles,
} from "lucide-react";
import { learningAPI } from "@/config/api";
import { Spinner } from "@/components/ui/spinner";

interface CertificateItem {
  id: string;
  credentialId: string;
  pathTitle: string;
  recipientName: string;
  status: "valid" | "revoked" | "expired";
  issueDate: string;
  verificationUrl: string;
  metadata?: {
    skills?: string[];
    totalHours?: number;
    completionScore?: number;
  };
}

export default function MyCertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const res = await learningAPI.getMyCertificates();
      setCertificates(res.data || []);
    } catch (err) {
      console.error("Failed to load certificates", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (credId: string) => {
    const url = `${window.location.origin}/verify/${credId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(credId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center">
        <Spinner className="w-8 h-8 text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 pb-20">
      {/* Header */}
      <div className="border-b border-zinc-800/80 bg-gradient-to-b from-[#111116] to-[#08080a] pt-10 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/learning"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Learning Catalog</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verifiable Digital Credentials</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                My Earned Certificates
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                Official certificates awarded upon 100% verified mastery of learning paths.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {certificates.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/40 rounded-3xl border border-zinc-800 p-8">
            <Award className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white">No certificates yet</h3>
            <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto">
              Enroll in a learning path, complete all mandatory reading lessons, quizzes, and coding exercises to claim your official credential.
            </p>
            <Link
              href="/learning"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
            >
              <span>Explore Learning Paths</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-gradient-to-b from-[#14141a] to-[#0c0c10] border border-zinc-800 rounded-3xl p-7 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                      {cert.credentialId}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        cert.status === "valid"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      } capitalize`}
                    >
                      {cert.status}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-white">
                    {cert.pathTitle}
                  </h3>
                  <div className="text-xs text-zinc-400 mt-1">
                    Awarded to <span className="text-zinc-200 font-semibold">{cert.recipientName}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-4 text-xs text-zinc-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Issued on {new Date(cert.issueDate).toLocaleDateString()}
                    </span>
                  </div>

                  {cert.metadata?.skills && cert.metadata.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-5">
                      {cert.metadata.skills.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded-md bg-zinc-800/80 text-[11px] font-medium text-zinc-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => handleCopyLink(cert.credentialId)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
                  >
                    {copiedId === cert.credentialId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied Link!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Share Verification</span>
                      </>
                    )}
                  </button>

                  <Link
                    href={`/verify/${cert.credentialId}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
                  >
                    <span>View Public Credential</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
