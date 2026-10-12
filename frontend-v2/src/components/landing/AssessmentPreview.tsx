"use client";

import React, { useState } from "react";
import {
  FileCheck2,
  Clock,
  Code2,
  ShieldCheck,
  CheckCircle2,
  BarChart3,
  Users,
  Settings,
  Sparkles,
  Layers,
} from "lucide-react";
import { motion } from "framer-motion";

const ASSESSMENT_STEPS = [
  {
    icon: Settings,
    title: "1. Assessment Configuration",
    desc: "Set time limits, proctoring strictness, and allowed programming runtimes.",
    metric: "60 mins • Multi-section",
  },
  {
    icon: Code2,
    title: "2. Question Selection",
    desc: "Pick from curated DSA question banks or add custom proprietary problem specs.",
    metric: "4 Algorithmic Tasks",
  },
  {
    icon: ShieldCheck,
    title: "3. Proctored Taking",
    desc: "Secure full-screen candidate examination with anti-tamper telemetry.",
    metric: "Live Integrity Shield",
  },
  {
    icon: BarChart3,
    title: "4. Automated Evaluation",
    desc: "Instant test execution, code quality audits, and candidate rank generation.",
    metric: "Instant Scorecards",
  },
];

export function AssessmentPreview() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="w-full py-20 px-4 sm:px-6 md:px-8 border-b border-border/70 bg-muted/20 text-foreground">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#7F1D1D]/20 bg-[#7F1D1D]/5 text-[#7F1D1D] text-xs font-bold uppercase tracking-wider">
            <FileCheck2 className="w-3.5 h-3.5 text-[#FACC15]" />
            <span>Structured Evaluation Pipeline</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1F2937] dark:text-foreground">
            Assess skills with <span className="text-[#7F1D1D]">confidence.</span>
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] dark:text-muted-foreground leading-relaxed">
            Create structured coding assessments for students, candidates, and technical teams with automated evaluation and performance analytics.
          </p>
        </div>

        {/* 4-Step Interactive Pipeline Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ASSESSMENT_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === idx;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                onClick={() => setActiveStep(idx)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? "bg-white border-[#7F1D1D] shadow-md ring-2 ring-[#7F1D1D]/15 dark:bg-card"
                    : "bg-white/80 border-[#E5E7EB] hover:border-[#7F1D1D]/40 hover:bg-white dark:bg-card/60"
                }`}
              >
                <div className="space-y-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? "bg-[#7F1D1D] text-white" : "bg-[#7F1D1D]/10 text-[#7F1D1D]"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-[#1F2937] dark:text-foreground">{step.title}</h3>
                  <p className="text-xs text-[#64748B] dark:text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#FFFBF5] text-[#64748B] border border-[#E5E7EB] w-fit">
                  {step.metric}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Assessment Interface Card Preview */}
        <div className="max-w-4xl mx-auto rounded-2xl bg-white dark:bg-card border border-[#E5E7EB] dark:border-border/80 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
            <div>
              <div className="text-xs font-mono uppercase text-[#64748B]">Active Examination</div>
              <h4 className="text-lg font-bold text-[#1F2937] dark:text-foreground">Mid-Term Algorithmic Assessment 2026</h4>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#1F2937] bg-[#FFFBF5] border border-[#E5E7EB] px-3 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-[#FACC15]" /> 58:42 Remaining
              </span>
              <span className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#16A34A] bg-[#16A34A]/10 border border-[#16A34A]/25 px-3 py-1 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5" /> Proctor Active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-[#FFFBF5] border border-[#E5E7EB] space-y-1">
              <span className="text-[#64748B] text-[11px]">Candidate Batch</span>
              <div className="font-bold text-[#1F2937] text-sm">CSE 2026 - Section A</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FFFBF5] border border-[#E5E7EB] space-y-1">
              <span className="text-[#64748B] text-[11px]">Submission Status</span>
              <div className="font-bold text-[#16A34A] text-sm">3 / 4 Solved (100%)</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FFFBF5] border border-[#E5E7EB] space-y-1">
              <span className="text-[#64748B] text-[11px]">Security Score</span>
              <div className="font-bold text-[#16A34A] text-sm">99.8% Integrity</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
