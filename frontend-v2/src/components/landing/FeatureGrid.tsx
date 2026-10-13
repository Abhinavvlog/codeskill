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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/60 text-foreground text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Comprehensive Skill Suite</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Everything you need to become interview-ready.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
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
                className="p-6 rounded-2xl bg-card border border-border/80 hover:border-foreground/40 hover:shadow-lg transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-foreground/5 text-foreground flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase font-bold text-muted-foreground px-2 py-0.5 rounded bg-muted/60 border border-border/60">
                      {feature.tag}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-foreground tracking-tight">
                    {feature.title}
                  </h3>

                  <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/40 text-[11px] font-semibold text-foreground/80 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
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
