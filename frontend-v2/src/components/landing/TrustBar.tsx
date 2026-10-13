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
    <section className="w-full border-b border-border bg-card/40 py-6 px-4 sm:px-6 md:px-8">
      <div className="max-w-5xl mx-auto space-y-4">
        
        {/* Capability Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-foreground">
              Proctored execution environment with instant evaluation
            </span>
          </div>
          <span className="text-xs text-neutral-500 font-mono">
            Zero setup required • High throughput
          </span>
        </div>

        {/* 5 Capability Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.title}
                className="p-3 rounded-md bg-background border border-border flex flex-col items-start gap-1.5"
              >
                <div className="w-6 h-6 rounded bg-neutral-100 dark:bg-neutral-800 text-foreground flex items-center justify-center border border-border">
                  <Icon className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
                </div>
                <div>
                  <div className="font-medium text-xs text-foreground tracking-tight">
                    {cap.title}
                  </div>
                  <div className="text-[11px] text-neutral-500 leading-tight mt-0.5">
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
