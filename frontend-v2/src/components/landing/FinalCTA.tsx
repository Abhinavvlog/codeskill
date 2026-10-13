"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Code2, Zap } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative w-full py-20 px-4 sm:px-6 md:px-8 border-b border-border bg-background text-foreground">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        
        <div className="space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Start building better coding skills today.
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Practice data structures, take timed technical assessments, and benchmark your programming proficiency.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/problems"
            className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-md bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 font-medium text-sm transition-colors w-full sm:w-auto"
          >
            <span>Start Coding</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/assessments"
            className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-md bg-background hover:bg-neutral-100 dark:hover:bg-neutral-900 text-foreground font-medium text-sm border border-border transition-colors w-full sm:w-auto"
          >
            <span>Explore Assessments</span>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-xs text-neutral-500 font-mono">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Anti-Cheating Proctoring</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-neutral-500" />
            <span>Multi-Language Sandbox</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-neutral-500" />
            <span>Instant Evaluation</span>
          </span>
        </div>

      </div>
    </section>
  );
}

export default FinalCTA;
