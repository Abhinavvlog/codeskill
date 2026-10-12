"use client";

import React, { useState } from "react";
import { Play, CheckCircle2, Terminal, Code2, Sparkles, Copy, Check } from "lucide-react";

export function HeroCodePreview() {
  const [activeTab, setActiveTab] = useState<"code" | "result">("code");
  const [copied, setCopied] = useState(false);

  const codeSnippet = `def two_sum(nums: list[int], target: int) -> list[int]:
    """Finds indices of the two numbers such that they add up to target."""
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Test execution: target = 9, nums = [2, 7, 11, 15]
print(two_sum([2, 7, 11, 15], 9)) # Output: [0, 1]`;

  const copyCode = () => {
    navigator.clipboard?.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-200">
      {/* IDE Top Window Chrome */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#FFFBF5] border-b border-[#E5E7EB]">
        {/* macOS Dots */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
          <div className="w-3 h-3 rounded-full bg-[#FACC15]" />
          <div className="w-3 h-3 rounded-full bg-[#22C55E]" />
          <span className="ml-2 text-xs font-semibold text-[#1F2937] flex items-center gap-1.5 font-mono">
            <Code2 className="w-3.5 h-3.5 text-[#7F1D1D]" />
            two_sum.py
          </span>
        </div>

        {/* Status Pill & Language */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A] bg-[#16A34A]/10 px-2 py-0.5 rounded-full border border-[#16A34A]/20">
            <CheckCircle2 className="w-3 h-3" />
            Accepted
          </span>
          <button
            onClick={copyCode}
            aria-label="Copy snippet"
            className="text-[#64748B] hover:text-[#1F2937] p-1 rounded-md transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Editor Surface (Preserving clean dark theme inside IDE canvas) */}
      <div className="bg-[#0F172A] p-4 text-[13px] font-mono leading-relaxed overflow-x-auto text-[#E2E8F0]">
        <div className="flex gap-4">
          {/* Line Numbers */}
          <div className="select-none text-[#475569] text-right space-y-0.5 shrink-0 pr-2 border-r border-[#1E293B]">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Syntax Code */}
          <div className="space-y-0.5 flex-1 min-w-0">
            <div>
              <span className="text-[#F43F5E]">def</span> <span className="text-[#38BDF8]">two_sum</span>(nums: <span className="text-[#FACC15]">list</span>[<span className="text-[#FACC15]">int</span>], target: <span className="text-[#FACC15]">int</span>) -&gt; <span className="text-[#FACC15]">list</span>[<span className="text-[#FACC15]">int</span>]:
            </div>
            <div className="text-[#64748B] italic pl-4">
              &quot;&quot;&quot;Find indices that sum to target.&quot;&quot;&quot;
            </div>
            <div className="pl-4">
              seen = &#123;&#125;
            </div>
            <div className="pl-4">
              <span className="text-[#F43F5E]">for</span> i, num <span className="text-[#F43F5E]">in</span> <span className="text-[#FACC15]">enumerate</span>(nums):
            </div>
            <div className="pl-8">
              complement = target - num
            </div>
            <div className="pl-8">
              <span className="text-[#F43F5E]">if</span> complement <span className="text-[#F43F5E]">in</span> seen:
            </div>
            <div className="pl-12">
              <span className="text-[#F43F5E]">return</span> [seen[complement], i]
            </div>
            <div className="pl-8">
              seen[num] = i
            </div>
            <div className="pl-4">
              <span className="text-[#F43F5E]">return</span> []
            </div>
            <div className="text-[#64748B] italic pt-1">
              # Output verification
            </div>
            <div>
              <span className="text-[#FACC15]">print</span>(two_sum([<span className="text-[#38BDF8]">2</span>, <span className="text-[#38BDF8]">7</span>, <span className="text-[#38BDF8]">11</span>, <span className="text-[#38BDF8]">15</span>], <span className="text-[#38BDF8]">9</span>)) <span className="text-[#64748B]"># [0, 1]</span>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Results Footer */}
      <div className="bg-[#FFFBF5] px-4 py-3 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#16A34A] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            <span>3 / 3 Test Cases Passed</span>
          </div>
          <span className="text-[#64748B] hidden sm:inline">•</span>
          <span className="text-[#64748B] font-mono">42 ms (Faster than 96%)</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-[11px] font-semibold text-[#1F2937] px-2 py-1 rounded bg-white border border-[#E5E7EB]">
            Memory: 14.2 MB
          </span>
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#7F1D1D] text-white font-bold text-xs shadow-xs">
            <Play className="w-3 h-3 fill-white" />
            <span>Passed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroCodePreview;
