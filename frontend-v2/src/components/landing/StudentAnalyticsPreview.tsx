"use client";

import React, { useMemo } from "react";
import { BarChart3, Trophy, Flame, CheckCircle2, TrendingUp, Sparkles, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { ContributionSkyline, type ContributionDay, dayMs, DAY_MS, toKey } from "@/components/ui/contribution-skyline";

const SKILL_METRICS = [
  { name: "Data Structures", score: 88, color: "bg-primary" },
  { name: "Algorithms & Logic", score: 76, color: "bg-indigo-500" },
  { name: "Problem Solving", score: 79, color: "bg-emerald-500" },
  { name: "Overall DSA Mastery", score: 82, color: "bg-cyan-500" },
];

function generateTelemetryActivity(): ContributionDay[] {
  const end = dayMs(new Date());
  const days = 371;
  const result: ContributionDay[] = [];

  // Match telemetry metrics:
  // - 247 problems total
  // - 21 day active streak ending today
  // - 52 active days in the last 60 days
  const last21DaysCounts = [2, 1, 3, 1, 2, 4, 2, 1, 3, 2, 1, 4, 3, 2, 1, 2, 3, 1, 2, 3, 2];
  
  // 39 days before the 21-day streak (index 0 is day 22 before today, must be 0 for exact 21 streak)
  // Exactly 31 active days, 8 rest days (31 + 21 = 52 active in last 60 days)
  const prev39DaysActivePattern = [
    0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1,
    1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1,
    1, 0, 1, 1, 1, 1, 1
  ];

  let totalAssigned = 0;
  for (let i = 0; i < days; i++) {
    const offsetFromEnd = days - 1 - i;
    const dateMs = end - offsetFromEnd * DAY_MS;
    const dateStr = toKey(dateMs);
    let count = 0;

    if (offsetFromEnd < 21) {
      count = last21DaysCounts[20 - offsetFromEnd];
    } else if (offsetFromEnd < 60) {
      const idx = offsetFromEnd - 21;
      const isActive = prev39DaysActivePattern[idx] === 1;
      count = isActive ? ((idx % 3 === 0) ? 3 : (idx % 2 === 0 ? 2 : 1)) : 0;
    } else {
      const phase = (i % 7);
      const isWeekend = phase === 0 || phase === 6;
      if (!isWeekend && (i % 5 === 1 || i % 11 === 0 || i % 8 === 2)) {
        if (i === 180) count = 9; // Busiest day
        else if (i % 13 === 0) count = 5;
        else if (i % 7 === 1) count = 3;
        else count = 2;
      }
    }
    result.push({ date: dateStr, count });
    totalAssigned += count;
  }

  // Finely calibrate total to exactly 247 problems
  let diff = 247 - totalAssigned;
  for (let i = 0; i < days - 60 && diff !== 0; i++) {
    if (diff > 0 && result[i].count === 0 && (i % 4 === 0)) {
      result[i].count = 1;
      diff--;
    } else if (diff < 0 && result[i].count > 0 && i !== 180) {
      const dec = Math.min(result[i].count, -diff);
      result[i].count -= dec;
      diff += dec;
    }
  }

  return result;
}

export function StudentAnalyticsPreview() {
  const telemetryData = useMemo(() => generateTelemetryActivity(), []);

  return (
    <section className="w-full py-20 px-4 sm:px-6 md:px-8 border-b border-border/70 bg-background text-foreground">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/60 text-foreground text-xs font-semibold uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span>Telemetry &amp; Progress Insights</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Track coding progress in real-time.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Gain granular transparency over your algorithmic strengths, benchmark performance across campus percentiles, and build interview readiness.
          </p>
        </div>

        {/* Dashboard Preview Container */}
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left Column: Topline Metric Stats (3 cards) */}
            <div className="lg:col-span-5 flex flex-col gap-4">

              {/* Stat 1: Problems Solved */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="text-xs font-mono uppercase text-muted-foreground">Problems Solved</span>
                  <div className="text-3xl font-extrabold text-foreground font-mono">247</div>
                  <div className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +14 this week
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </motion.div>

              {/* Stat 2: Assessments */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="text-xs font-mono uppercase text-muted-foreground">Assessments Completed</span>
                  <div className="text-3xl font-extrabold text-foreground font-mono">18</div>
                  <div className="text-[11px] text-muted-foreground font-mono">Avg Score: 92.4%</div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Trophy className="w-6 h-6" />
                </div>
              </motion.div>

              {/* Stat 3: Current Streak */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="text-xs font-mono uppercase text-muted-foreground">Current Streak</span>
                  <div className="text-3xl font-extrabold text-foreground font-mono">21 days</div>
                  <div className="text-[11px] text-emerald-500 font-semibold">Top 3% consistency</div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-foreground/5 text-foreground flex items-center justify-center">
                  <Flame className="w-6 h-6" />
                </div>
              </motion.div>

            </div>

            {/* Right Column: Skill Matrix Progress Breakdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="lg:col-span-7 p-6 sm:p-7 rounded-2xl bg-card border border-border/80 shadow-md flex flex-col justify-between space-y-6"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                  <h4 className="font-bold text-base text-foreground">Algorithmic Skill Breakdown</h4>
                  <span className="text-xs text-muted-foreground">Mastery levels across core curriculum domains</span>
                </div>
                <span className="text-xs font-mono font-bold text-foreground bg-muted px-2.5 py-1 rounded-md border border-border">
                  Tier: Expert
                </span>
              </div>

              <div className="space-y-4">
                {SKILL_METRICS.map((skill) => (
                  <div key={skill.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-foreground">{skill.name}</span>
                      <span className="font-mono font-bold text-foreground">{skill.score}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.score}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${skill.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-semibold text-foreground">Consistency Heatmap</span>
                  <p className="text-[11px] text-muted-foreground">Interactive 2D heat map &amp; 3D isometric skyline below</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  Active 52 of last 60 days
                </span>
              </div>
            </motion.div>

          </div>

          {/* Full Interactive Contribution Skyline Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="w-full"
          >
            <ContributionSkyline
              data={telemetryData}
              unit="problem"
              unitPlural="problems"
              palette="github"
              defaultView="3d"
              heightScale={1.1}
              title={
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-bold text-base text-foreground">Consistency Heatmap</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    Active 52 of last 60 days
                  </span>
                </div>
              }
            />
          </motion.div>

        </div>

      </div>
    </section>
  );
}

export default StudentAnalyticsPreview;
