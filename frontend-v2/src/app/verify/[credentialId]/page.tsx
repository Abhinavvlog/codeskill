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
  Printer,
  Share2,
  Copy,
  Check,
  ArrowLeft,
} from "lucide-react";
import { certificateVerificationAPI } from "@/config/api";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  ChandigarhUniversityCertificate,
  CertificateData,
} from "@/components/learning/ChandigarhUniversityCertificate";

interface VerificationResult extends CertificateData {
  valid: boolean;
  status?: string;
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    verify();
  }, [credentialId]);

  const verify = async () => {
    try {
      setLoading(true);
      const res = await certificateVerificationAPI.verify(credentialId);
      setResult(res.data);
    } catch (err) {
      setResult({
        valid: false,
        credentialId,
        recipientName: "",
        learningPath: "",
        error: "Unable to verify credential against the official registry",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareLinkedIn = () => {
    const currentUrl = window.location.href;
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      currentUrl
    )}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=650,height=600");
  };

  const handleAddToLinkedInProfile = () => {
    if (!result) return;
    const certName = result.learningPath || "Data Structures & Algorithms in Practice";
    const orgName = "Chandigarh University";
    const currentUrl = window.location.href;
    const issueDate = result.issuedAt ? new Date(result.issuedAt) : new Date();
    const issueYear = issueDate.getFullYear();
    const issueMonth = issueDate.getMonth() + 1;

    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(
      certName
    )}&organizationName=${encodeURIComponent(
      orgName
    )}&issueYear=${issueYear}&issueMonth=${issueMonth}&certUrl=${encodeURIComponent(
      currentUrl
    )}&certId=${encodeURIComponent(result.credentialId)}`;

    window.open(linkedInUrl, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors">
      {/* Top Banner / Verification Header (Hidden on Print) */}
      <header className="print:hidden border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between">
          <Link
            href="/learning"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>CodeSkill Learning Catalog</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official University Ledger</span>
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-4 lg:p-6 space-y-4">
        {/* Verification Status Overview Banner (Hidden on Print) */}
        <div className="print:hidden text-center max-w-2xl mx-auto space-y-2 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-muted text-foreground border border-border">
            <GraduationCap className="w-3.5 h-3.5 text-primary" />
            <span>Chandigarh University · Verifiable Digital Credential</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            Certificate Authenticity Record
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Verification ID:{" "}
            <span className="font-mono text-foreground font-bold bg-muted px-2 py-0.5 rounded">
              {credentialId}
            </span>{" "}
            · Issued under the academic auspices of Chandigarh University
          </p>
        </div>

        {/* Action Toolbar (Hidden on Print) */}
        {result?.valid && (
          <div className="print:hidden flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 py-2">
            <Button
              onClick={handlePrint}
              variant="default"
              size="sm"
              className="gap-1.5 bg-primary text-primary-foreground font-semibold shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </Button>

            <Button
              onClick={handleShareLinkedIn}
              variant="outline"
              size="sm"
              className="gap-1.5 border-border bg-card text-foreground hover:bg-muted font-semibold shadow-sm"
            >
              {/* LinkedIn SVG Icon */}
              <svg className="w-4 h-4 fill-[#0A66C2]" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c-.97 0-1.75-.79-1.75-1.76s.78-1.75 1.75-1.75 1.75.78 1.75 1.75-.78 1.76-1.75 1.76m1.4 9.74v-8.37H5.06v8.37h2.8z" />
              </svg>
              <span>Share on LinkedIn</span>
            </Button>

            <Button
              onClick={handleAddToLinkedInProfile}
              variant="outline"
              size="sm"
              className="gap-1.5 border-border bg-card text-foreground hover:bg-muted font-semibold shadow-sm"
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span>Add to LinkedIn Profile</span>
            </Button>

            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="sm"
              className="gap-1.5 border-border bg-card text-foreground hover:bg-muted font-semibold shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Link Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-muted-foreground" />
                  <span>Copy Verification URL</span>
                </>
              )}
            </Button>
          </div>
        )}

        {/* Certificate Display Area */}
        {result?.valid ? (
          <div className="py-2">
            <ChandigarhUniversityCertificate data={result} />
          </div>
        ) : (
          <div className="max-w-md mx-auto rounded-2xl bg-card border border-rose-500/40 p-8 text-center shadow-lg">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto mb-4">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Unverified or Invalid Credential
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              The credential ID{" "}
              <span className="font-mono text-foreground font-semibold">
                {credentialId}
              </span>{" "}
              could not be validated in the official Chandigarh University digital registry.
            </p>
            <div className="mt-6">
              <Link
                href="/learning"
                className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
              >
                <span>Return to Learning Catalog</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Metadata Card Below Certificate (Hidden on Print) */}
        {result?.valid && (
          <div className="print:hidden max-w-5xl mx-auto bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-foreground">
                  Official Verification & Issuance Audit
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                STATUS: VALID & ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground font-medium block">
                  Issuing Institution
                </span>
                <span className="text-foreground font-semibold">
                  {result.institution || "Chandigarh University"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground font-medium block">
                  Accreditation
                </span>
                <span className="text-foreground font-semibold">
                  {result.accreditation || "NAAC A+ Accredited"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground font-medium block">
                  Issuance Date
                </span>
                <span className="text-foreground font-semibold">
                  {result.issuedAt
                    ? new Date(result.issuedAt).toLocaleDateString()
                    : "Official"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground font-medium block">
                  Record Ledger
                </span>
                <span className="text-foreground font-semibold">
                  Cryptographically Anchored
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer (Hidden on Print) */}
      <footer className="print:hidden border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} Chandigarh University · Department of Computer Science & Engineering. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
