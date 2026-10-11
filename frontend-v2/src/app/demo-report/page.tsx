"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { StudentResultReport, StudentResult } from "@/components/pdf/StudentResultReport";
import Navbar from "@/components/Navbar";
import { Download, CheckCircle2, ShieldCheck, Printer } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

// Dynamically import PDFViewer to avoid Next.js SSR issues with Canvas/@react-pdf
const PDFViewer = dynamic(
  () => import("@/components/reports/pdf/PDFComponents").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[850px] bg-muted/40 rounded-xl flex flex-col items-center justify-center gap-3">
        <Spinner className="w-6 h-6 animate-spin text-primary" />
        <span className="text-xs font-medium text-muted-foreground">Rendering Official Assessment Report...</span>
      </div>
    ),
  }
);

const MOCK_RESULT: StudentResult = {
  studentName: "Alex Developer",
  studentEmail: "alex.developer@cuchd.in",
  rollNumber: "24BCS-10492",
  studentId: "UID-89421",
  institution: "Chandigarh University",
  program: "B.Tech Computer Science & Engineering",
  examName: "Advanced Algorithms & Data Structures",
  dateTaken: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
  score: 85,
  maxScore: 100,
  duration: "1h 45m",
  rank: 18,
  totalParticipants: 245,
  percentile: "Top 3%",
  questions: [
    { id: "1", title: "Two Sum", difficulty: "Easy", status: "Passed", points: 15, maxPoints: 15 },
    { id: "2", title: "LRU Cache Implementation", difficulty: "Medium", status: "Passed", points: 25, maxPoints: 25 },
    { id: "3", title: "Merge K Sorted Linked Lists", difficulty: "Hard", status: "Passed", points: 30, maxPoints: 30 },
    { id: "4", title: "N-Queens Backtracking", difficulty: "Hard", status: "Partial", points: 15, maxPoints: 20 },
    { id: "5", title: "Trapping Rain Water", difficulty: "Hard", status: "Failed", points: 0, maxPoints: 10 },
  ],
};

export default function DemoReportPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const blob = await pdf(<StudentResultReport result={MOCK_RESULT} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CodeSkill_Assessment_Report_${MOCK_RESULT.rollNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-8 flex flex-col mt-20 space-y-6">
        
        {/* Header Strip with Branding & Download Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[11px] font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Official Examination Scorecard
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Assessment Performance Report
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Chandigarh University • Department of Skill Development &amp; Lab
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Spinner className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Official PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live A4 Interactive Preview */}
        <div className="flex-1 bg-card border rounded-2xl shadow-md overflow-hidden flex flex-col min-h-[850px]">
          {isMounted ? (
            <PDFViewer className="w-full h-full flex-1 border-none min-h-[850px]">
              <StudentResultReport result={MOCK_RESULT} />
            </PDFViewer>
          ) : (
            <div className="w-full h-[850px] bg-muted/30 flex items-center justify-center">
              <Spinner className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
