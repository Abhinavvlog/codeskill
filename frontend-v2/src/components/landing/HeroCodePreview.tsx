"use client";

import React from "react";
import { CheckCircle2, Code2, Play, ShieldCheck, Terminal, Zap, FileCode, Check } from "lucide-react";
import { motion } from "framer-motion";

export function HeroCodePreview() {
  const languages = ["Python 3", "C++", "Java", "JavaScript"];
  const activeLang = "Python 3";

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Subtle background ambient blur */}
      <div className="absolute -inset-2 bg-gradient-to-r from-[#FACC15]/10 via-[#7F1D1D]/5 to-transparent rounded-3xl blur-xl pointer-events-none" />

      {/* Main Assessment IDE Surface */}
      <div className="relative rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.08)] overflow-hidden transition-all duration-300">
        
        {/* Assessment Header Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#FFFBF5] border-b border-[#E5E7EB]">
          {/* Window dots & problem info */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
            </div>
            <div className="h-4 w-px bg-[#E5E7EB] mx-1" />
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#111827]">
              <FileCode className="w-3.5 h-3.5 text-[#7F1D1D]" />
              <span>two_sum.py</span>
            </div>
          </div>

          {/* Test Case Success Indicator */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16A34A] bg-[#16A34A]/10 px-2.5 py-0.5 rounded-full border border-[#16A34A]/20">
              <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
              3/3 Passed
            </span>
          </div>
        </div>

        {/* Language Tabs & Assessment Progress */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#F8FAFC] border-b border-[#E5E7EB] text-xs">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {languages.map((lang) => (
              <span
                key={lang}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  lang === activeLang
                    ? "bg-white text-[#7F1D1D] border border-[#E5E7EB] shadow-xs"
                    : "text-[#64748B] hover:text-[#111827]"
                }`}
              >
                {lang}
              </span>
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-medium text-[#64748B]">
            <span>Problem 1 of 3</span>
            <div className="w-16 h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
              <div className="w-full h-full bg-[#7F1D1D] rounded-full" />
            </div>
          </div>
        </div>

        {/* Code Canvas (Clean Deep Navy Editor Area) */}
        <div className="bg-[#080D1B] p-4 text-[13px] font-mono leading-relaxed text-[#F8FAFC] overflow-x-auto">
          <div className="flex gap-4">
            {/* Line numbers */}
            <div className="select-none text-[#64748B] text-right space-y-0.5 shrink-0 pr-3 border-r border-[#1E293B]">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Syntax snippet */}
            <div className="space-y-0.5 flex-1 min-w-0">
              <div>
                <span className="text-[#F43F5E] font-semibold">def</span> <span className="text-[#38BDF8]">two_sum</span>(nums: <span className="text-[#FACC15]">list</span>[<span className="text-[#FACC15]">int</span>], target: <span className="text-[#FACC15]">int</span>) -&gt; <span className="text-[#FACC15]">list</span>[<span className="text-[#FACC15]">int</span>]:
              </div>
              <div className="pl-4">
                seen = &#123;&#125;
              </div>
              <div className="pl-4">
                <span className="text-[#F43F5E]">for</span> i, num <span className="text-[#F43F5E]">in</span> <span className="text-[#FACC15]">enumerate</span>(nums):
              </div>
              <div className="pl-8">
                diff = target - num
              </div>
              <div className="pl-8">
                <span className="text-[#F43F5E]">if</span> diff <span className="text-[#F43F5E]">in</span> seen:
              </div>
              <div className="pl-12">
                <span className="text-[#F43F5E]">return</span> [seen[diff], i]
              </div>
              <div className="pl-8">
                seen[num] = i
              </div>
              <div className="pl-4">
                <span className="text-[#F43F5E]">return</span> []
              </div>
              <div className="pt-1 text-[#64748B] italic">
                # Docker sandbox: memory limit 256MB • time limit 1000ms
              </div>
            </div>
          </div>
        </div>

        {/* Floating Test-case Evaluation Bar */}
        <div className="bg-[#FFFBF5] px-4 py-3 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[#16A34A] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span>All Test Cases Passed</span>
            </div>
            <span className="text-[#64748B] hidden sm:inline">•</span>
            <span className="text-[#64748B] font-mono">42 ms (Faster than 96%)</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-[11px] font-semibold text-[#111827] px-2 py-1 rounded bg-white border border-[#E5E7EB]">
              RAM: 14.2 MB
            </span>
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#7F1D1D] text-white font-bold text-xs shadow-xs">
              <Check className="w-3.5 h-3.5 text-[#FACC15]" />
              <span>Accepted</span>
            </div>
          </div>
        </div>

      </div>

      {/* Floating Scorecard Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="absolute -bottom-4 -left-4 sm:-bottom-5 sm:-left-6 bg-white border border-[#E5E7EB] rounded-2xl p-3.5 shadow-xl flex items-center gap-3 z-20 backdrop-blur-md"
      >
        <div className="w-10 h-10 rounded-xl bg-[#7F1D1D]/10 text-[#7F1D1D] flex items-center justify-center font-black text-sm border border-[#7F1D1D]/15">
          <Zap className="w-5 h-5 text-[#FACC15] fill-[#FACC15]" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold text-[#111827]">98 / 100 Score</span>
            <span className="text-[10px] font-bold text-[#16A34A] bg-[#16A34A]/10 px-1.5 py-0.2 rounded">Top 4%</span>
          </div>
          <p className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5">
            <ShieldCheck className="w-3 h-3 text-[#16A34A]" /> Safe proctoring active
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default HeroCodePreview;
