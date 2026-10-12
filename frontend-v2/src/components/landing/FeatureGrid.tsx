"use client";

import React from "react";
import { Code2, FileCheck2, ShieldCheck, Zap, BarChart3, Briefcase, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: Code2,
    title: "Practice",
    description: "Solve curated DSA problems with multiple difficulty levels, structured hints, and comprehensive editorial guides.",
    tag: "Core DSA",
  },
  {
    icon: FileCheck2,
    title: "Assessments",
    description: "Take structured technical assessments with automated evaluation, timed sections, and standardized scoring rubrics.",
    tag: "Evaluations",
  },
  {
    icon: ShieldCheck,
    title: "Proctored Exams",
    description: "Secure assessment environment with browser lockdown, tab-switch monitoring, and anti-cheating audit controls.",
    tag: "Security",
  },
  {
    icon: Zap,
    title: "Instant Evaluation",
    description: "Get immediate feedback from automated test-case execution with memory quotas and runtime performance breakdowns.",
    tag: "Speed",
  },
  {
    icon: BarChart3,
    title: "Skill Analytics",
    description: "Track your progress across algorithms, data structures, and programming languages with radar charts and ELO ratings.",
    tag: "Analytics",
  },
  {
    icon: Briefcase,
    title: "Interview Preparation",
    description: "Practice problems designed around real technical interview patterns from top software engineering companies.",
    tag: "Placement",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="w-full py-20 px-4 sm:px-6 md:px-8 border-b border-border/70 bg-background text-foreground">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#7F1D1D]/20 bg-[#7F1D1D]/5 text-[#7F1D1D] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#FACC15]" />
            <span>Comprehensive Skill Suite</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1F2937] dark:text-foreground">
            Everything you need to <span className="text-[#7F1D1D]">become interview-ready.</span>
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] dark:text-muted-foreground leading-relaxed">
            Designed for collegiate students, competitive coders, and technical recruiters seeking uncompromising evaluation fidelity.
          </p>
        </div>

        {/* 6 Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="p-6 rounded-2xl bg-white dark:bg-card border border-[#E5E7EB] dark:border-border hover:border-[#7F1D1D]/40 hover:shadow-lg transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#7F1D1D]/10 text-[#7F1D1D] flex items-center justify-center group-hover:bg-[#7F1D1D] group-hover:text-white transition-all">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase font-bold text-[#64748B] px-2 py-0.5 rounded bg-[#FFFBF5] border border-[#E5E7EB]">
                      {feature.tag}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[#1F2937] dark:text-foreground tracking-tight group-hover:text-[#7F1D1D] transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-xs sm:text-[13px] text-[#64748B] dark:text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E5E7EB] dark:border-border text-[11px] font-bold text-[#7F1D1D] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Explore module &rarr;</span>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
