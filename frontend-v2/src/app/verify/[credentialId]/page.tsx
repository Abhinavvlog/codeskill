"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  XCircle,
  Award,
  CheckCircle2,
  Calendar,
  Building,
  GraduationCap,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { certificateVerificationAPI } from "@/config/api";
import { Spinner } from "@/components/ui/spinner";

interface VerificationResult {
  valid: boolean;
  credentialId?: string;
  recipientName?: string;
  learningPath?: string;
  issuedAt?: string;
  status?: string;
  issuer?: string;
  skills?: string[];
  estimatedHours?: number;
  error?: string;
}

export default function PublicCertificateVerificationPage({
  params,
}: {
  params: Promise<{ credentialId: string }>;
}) {
  const { credentialId } = use(params);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verify();
  }, [credentialId]);

  const verify = async () => {
    try {
      setLoading(true);
      const res = await certificateVerificationAPI.verify(credentialId);
      setResult(res.data);
    } catch (err) {
      setResult({ valid: false, error: "Unable to verify credential" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center">
        <Spinner className="w-8 h-8 text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-2xl w-full">
        {/* Verification Status Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 mb-3 shadow-sm">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>CodeSkill Digital Credential Verification</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white">
            Certificate Authenticity Record
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Verification ID: <span className="font-mono text-zinc-400 font-bold">{credentialId}</span>
          </p>
        </div>

        {/* Certificate Verification Container */}
        {result?.valid ? (
          <div className="relative rounded-3xl bg-gradient-to-b from-[#14141d] to-[#0d0d12] border-2 border-emerald-500/40 p-8 sm:p-10 shadow-2xl shadow-emerald-500/10">
            {/* Top Seal */}
            <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-500/20">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Verified Authentic
                  </span>
                  <div className="text-[11px] text-zinc-400">
                    Official Record in CodeSkill Ledger
                  </div>
                </div>
              </div>

              <span className="font-mono text-xs font-bold text-zinc-400 bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">
                {result.credentialId}
              </span>
            </div>

            {/* Recipient Details */}
            <div className="py-8 space-y-6 text-center">
              <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">
                This is to certify that
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {result.recipientName}
              </h2>
              <p className="text-sm text-zinc-400 max-w-lg mx-auto">
                has successfully completed all requirements, coding assessments, and verified milestones for
              </p>
              <div className="inline-block px-5 py-2.5 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-300 font-bold text-lg sm:text-xl">
                {result.learningPath}
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 py-6 border-t border-b border-zinc-800 text-xs">
              <div>
                <span className="text-zinc-500 font-medium">Issuing Authority</span>
                <div className="text-zinc-200 font-semibold mt-1">
                  {result.issuer}
                </div>
              </div>
              <div>
                <span className="text-zinc-500 font-medium">Issue Date</span>
                <div className="text-zinc-200 font-semibold mt-1">
                  {result.issuedAt ? new Date(result.issuedAt).toLocaleDateString() : "N/A"}
                </div>
              </div>
            </div>

            {/* Verified Skills */}
            {result.skills && result.skills.length > 0 && (
              <div className="pt-6">
                <span className="text-xs text-zinc-400 font-semibold block mb-2">
                  Demonstrated Competencies:
                </span>
                <div className="flex flex-wrap gap-2">
                  {result.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-xs font-medium text-zinc-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-3xl bg-zinc-900 border border-rose-500/40 p-8 sm:p-10 text-center shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-4">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Invalid or Revoked Credential
            </h2>
            <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto">
              The credential ID <span className="font-mono text-zinc-300 font-semibold">{credentialId}</span> could not be verified against the official CodeSkill certification registry.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <Link
            href="/learning"
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1.5"
          >
            <span>Explore CodeSkill Learning Paths</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
