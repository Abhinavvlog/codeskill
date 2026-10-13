"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  Users2,
  Layers,
  FileCheck2,
  BarChart3,
  Trophy,
  FileSpreadsheet,
  UserCheck,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { motion } from "framer-motion";

const INSTITUTION_FEATURES = [
  {
    icon: Users2,
    title: "Student Management",
    desc: "Import roster batches via CSV/Excel, manage departmental roles, and issue secure login credentials.",
  },
  {
    icon: Layers,
    title: "Batch Management",
    desc: "Group students by academic year, section, or specialized technical training cohort.",
  },
  {
    icon: FileCheck2,
    title: "Assessment Creation",
    desc: "Configure proctored exam windows, custom time limits, and weighted scoring models.",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    desc: "Compare section averages, uncover syllabus skill gaps, and generate exportable accreditation metrics.",
  },
  {
    icon: Trophy,
    title: "Campus Leaderboards",
    desc: "Live, anti-cheat verified rankings to foster healthy competitive programming culture.",
  },
  {
    icon: FileSpreadsheet,
    title: "Detailed Reports",
    desc: "Export comprehensive PDF/Excel scorecards for faculty reviews and university audit boards.",
  },
  {
    icon: UserCheck,
    title: "Candidate Evaluation",
    desc: "Screen campus drive applicants with realistic coding challenges and automated rubric grading.",
  },
  {
    icon: Building2,
    title: "Enterprise Multi-Tenancy",
    desc: "Isolated departments, proctor roles, and centralized university controller oversight.",
  },
];

export function InstitutionalSection() {
  return (
    <section className="w-full py-20 px-4 sm:px-6 md:px-8 border-b border-border/70 bg-muted/20 text-foreground">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/60 text-foreground text-xs font-semibold uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5 text-primary" />
            <span>Collegiate &amp; Enterprise Infrastructure</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Built for classrooms, assessments, and hiring.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Empower educators, departmental lab coordinators, and placement cells with a standardized platform built for massive-scale student evaluation.
          </p>
        </div>

        {/* 8 Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {INSTITUTION_FEATURES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="p-5 rounded-2xl bg-card border border-border/80 hover:border-foreground/30 hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-foreground/5 text-foreground flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Bar */}
        <div className="text-center pt-4">
          <Link
            href="/assessments"
            className="inline-flex items-center justify-center gap-2 h-11 px-7 rounded-lg bg-white hover:bg-neutral-100 text-black font-bold text-sm transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Explore Assessments</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
