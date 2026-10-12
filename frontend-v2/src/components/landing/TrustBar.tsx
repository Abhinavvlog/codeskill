"use client";

import React from "react";
import { ShieldCheck, Zap, Code2, Clock, CheckCircle2 } from "lucide-react";

const CAPABILITIES = [
  {
    icon: ShieldCheck,
    title: "Secure Code Execution",
    desc: "Isolated Docker sandbox runtime",
  },
  {
    icon: Zap,
    title: "Instant Test Evaluation",
    desc: "Millisecond automated test runs",
  },
  {
    icon: Code2,
    title: "Multiple Languages",
    desc: "C++, Java, Python, JS, TS, C",
  },
  {
    icon: Clock,
    title: "Real-Time Submissions",
    desc: "Instant metrics, memory & runtime",
  },
  {
    icon: CheckCircle2,
    title: "Automated Scoring",
    desc: "Objective rubric & benchmarks",
  },
];

export function TrustBar() {
  return (
    <section className="w-full border-b border-[#E5E7EB] bg-[#FFFBF5]/60 py-6 px-4 sm:px-6 md:px-8">
      <div className="max-w-6xl mx-auto space-y-4">
        
        {/* Capability Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] ring-2 ring-[#16A34A]/25" />
            <span className="text-xs font-semibold text-[#1F2937] dark:text-foreground">
              Proctored execution environment with instant evaluation
            </span>
          </div>
          <span className="text-xs text-[#64748B] font-mono">
            Zero setup required • High throughput sandbox
          </span>
        </div>

        {/* 5 Capability Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.title}
                className="p-3.5 rounded-xl bg-white dark:bg-card border border-[#E5E7EB] dark:border-border shadow-xs hover:border-[#7F1D1D]/30 transition-all flex flex-col items-start gap-2"
              >
                <div className="w-7 h-7 rounded-lg bg-[#7F1D1D]/10 text-[#7F1D1D] flex items-center justify-center border border-[#7F1D1D]/15">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#1F2937] dark:text-foreground tracking-tight">
                    {cap.title}
                  </div>
                  <div className="text-[11px] text-[#64748B] leading-tight mt-0.5">
                    {cap.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

export default TrustBar;
