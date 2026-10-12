"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Code2, Zap } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative w-full py-20 px-4 sm:px-6 md:px-8 border-b border-[#E5E7EB] bg-[#FFFBF5]/60 text-[#1F2937] dark:text-foreground">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        
        <div className="space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1F2937] dark:text-foreground">
            Start building better <span className="text-[#7F1D1D]">coding skills today.</span>
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] dark:text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Practice data structures, take timed technical assessments, and benchmark your programming proficiency with institutional-grade evaluation.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <Link
            href="/problems"
            className="inline-flex items-center justify-center gap-2 h-11 px-7 rounded-lg bg-[#7F1D1D] text-white hover:bg-[#450A0A] font-bold text-sm transition-all shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
          >
            <span>Start Coding</span>
            <ArrowRight className="w-4 h-4 text-[#FACC15]" />
          </Link>

          <Link
            href="/assessments"
            className="inline-flex items-center justify-center gap-2 h-11 px-7 rounded-lg bg-white hover:bg-[#FFFBF5] text-[#1F2937] font-semibold text-sm border border-[#E5E7EB] transition-colors w-full sm:w-auto shadow-xs"
          >
            <span>Explore Assessments</span>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-xs text-[#64748B] font-mono">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Anti-Cheating Proctoring</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-[#7F1D1D]" />
            <span>Multi-Language Sandbox</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Instant Evaluation</span>
          </span>
        </div>

      </div>
    </section>
  );
}

export default FinalCTA;
