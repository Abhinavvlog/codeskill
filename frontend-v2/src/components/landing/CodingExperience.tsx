"use client";

import React, { useState } from "react";
import { CheckCircle2, Play, Code2, Sparkles, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CODE_RENDERERS: Record<string, React.ReactNode> = {
  "C++17": (
    <div className="space-y-1">
      <div>
        <span className="text-purple-600 dark:text-purple-400 font-semibold">vector</span>
        <span className="text-neutral-500">&lt;</span>
        <span className="text-cyan-600 dark:text-cyan-400">int</span>
        <span className="text-neutral-500">&gt;</span>{" "}
        <span className="text-amber-600 dark:text-amber-400 font-bold">twoSum</span>
        <span className="text-neutral-500">(</span>
        <span className="text-purple-600 dark:text-purple-400 font-semibold">vector</span>
        <span className="text-neutral-500">&lt;</span>
        <span className="text-cyan-600 dark:text-cyan-400">int</span>
        <span className="text-neutral-500">&gt;&amp;</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">nums</span>
        <span className="text-neutral-500">,</span>{" "}
        <span className="text-cyan-600 dark:text-cyan-400">int</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">target</span>
        <span className="text-neutral-500">) &#123;</span>
      </div>
      <div className="pl-6">
        <span className="text-purple-600 dark:text-purple-400 font-semibold">unordered_map</span>
        <span className="text-neutral-500">&lt;</span>
        <span className="text-cyan-600 dark:text-cyan-400">int</span>
        <span className="text-neutral-500">,</span>{" "}
        <span className="text-cyan-600 dark:text-cyan-400">int</span>
        <span className="text-neutral-500">&gt;</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">numMap</span>
        <span className="text-neutral-500">;</span>
      </div>
      <div className="pl-6">
        <span className="text-purple-600 dark:text-purple-400 font-semibold">for</span>{" "}
        <span className="text-neutral-500">(</span>
        <span className="text-cyan-600 dark:text-cyan-400">int</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">i</span>{" "}
        <span className="text-pink-600 dark:text-pink-400">=</span>{" "}
        <span className="text-emerald-600 dark:text-emerald-400">0</span>
        <span className="text-neutral-500">;</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">i</span>{" "}
        <span className="text-pink-600 dark:text-pink-400">&lt;</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">nums</span>
        <span className="text-neutral-500">.</span>
        <span className="text-amber-600 dark:text-amber-400">size</span>
        <span className="text-neutral-500">();</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">i</span>
        <span className="text-pink-600 dark:text-pink-400">++</span>
        <span className="text-neutral-500">) &#123;</span>
      </div>
      <div className="pl-12">
        <span className="text-cyan-600 dark:text-cyan-400">int</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">complement</span>{" "}
        <span className="text-pink-600 dark:text-pink-400">=</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">target</span>{" "}
        <span className="text-pink-600 dark:text-pink-400">-</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">nums</span>
        <span className="text-neutral-500">[</span>
        <span className="text-neutral-800 dark:text-neutral-200">i</span>
        <span className="text-neutral-500">];</span>
      </div>
      <div className="pl-12">
        <span className="text-purple-600 dark:text-purple-400 font-semibold">if</span>{" "}
        <span className="text-neutral-500">(</span>
        <span className="text-neutral-800 dark:text-neutral-200">numMap</span>
        <span className="text-neutral-500">.</span>
        <span className="text-amber-600 dark:text-amber-400">count</span>
        <span className="text-neutral-500">(</span>
        <span className="text-neutral-800 dark:text-neutral-200">complement</span>
        <span className="text-neutral-500">))</span>{" "}
        <span className="text-purple-600 dark:text-purple-400 font-semibold">return</span>{" "}
        <span className="text-neutral-500">&#123;</span>
        <span className="text-neutral-800 dark:text-neutral-200">numMap</span>
        <span className="text-neutral-500">[</span>
        <span className="text-neutral-800 dark:text-neutral-200">complement</span>
        <span className="text-neutral-500">],</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">i</span>
        <span className="text-neutral-500">&#125;;</span>
      </div>
      <div className="pl-12">
        <span className="text-neutral-800 dark:text-neutral-200">numMap</span>
        <span className="text-neutral-500">[</span>
        <span className="text-neutral-800 dark:text-neutral-200">nums</span>
        <span className="text-neutral-500">[</span>
        <span className="text-neutral-800 dark:text-neutral-200">i</span>
        <span className="text-neutral-500">]]</span>{" "}
        <span className="text-pink-600 dark:text-pink-400">=</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">i</span>
        <span className="text-neutral-500">;</span>
      </div>
      <div className="pl-6">
        <span className="text-neutral-500">&#125;</span>
      </div>
      <div className="pl-6">
        <span className="text-purple-600 dark:text-purple-400 font-semibold">return</span>{" "}
        <span className="text-neutral-500">&#123;&#125;;</span>
      </div>
      <div>
        <span className="text-neutral-500">&#125;</span>
      </div>
    </div>
  ),
  "Python 3.12": (
    <div className="space-y-1">
      <div>
        <span className="text-purple-600 dark:text-purple-400 font-semibold">def</span>{" "}
        <span className="text-amber-600 dark:text-amber-400 font-bold">twoSum</span>
        <span className="text-neutral-500">(</span>
        <span className="text-neutral-800 dark:text-neutral-200">nums</span>
        <span className="text-neutral-500">:</span>{" "}
        <span className="text-cyan-600 dark:text-cyan-400">list</span>
        <span className="text-neutral-500">[</span>
        <span className="text-cyan-600 dark:text-cyan-400">int</span>
        <span className="text-neutral-500">],</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">target</span>
        <span className="text-neutral-500">:</span>{" "}
        <span className="text-cyan-600 dark:text-cyan-400">int</span>
        <span className="text-neutral-500">) -&gt;</span>{" "}
        <span className="text-cyan-600 dark:text-cyan-400">list</span>
        <span className="text-neutral-500">[</span>
        <span className="text-cyan-600 dark:text-cyan-400">int</span>
        <span className="text-neutral-500">]:</span>
      </div>
      <div className="pl-6">
        <span className="text-neutral-800 dark:text-neutral-200">seen</span>{" "}
        <span className="text-pink-600 dark:text-pink-400">=</span>{" "}
        <span className="text-neutral-500">&#123;&#125;</span>
      </div>
      <div className="pl-6">
        <span className="text-purple-600 dark:text-purple-400 font-semibold">for</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">i</span>
        <span className="text-neutral-500">,</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">num</span>{" "}
        <span className="text-purple-600 dark:text-purple-400 font-semibold">in</span>{" "}
        <span className="text-cyan-600 dark:text-cyan-400">enumerate</span>
        <span className="text-neutral-500">(</span>
        <span className="text-neutral-800 dark:text-neutral-200">nums</span>
        <span className="text-neutral-500">):</span>
      </div>
      <div className="pl-12">
        <span className="text-neutral-800 dark:text-neutral-200">complement</span>{" "}
        <span className="text-pink-600 dark:text-pink-400">=</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">target</span>{" "}
        <span className="text-pink-600 dark:text-pink-400">-</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">num</span>
      </div>
      <div className="pl-12">
        <span className="text-purple-600 dark:text-purple-400 font-semibold">if</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">complement</span>{" "}
        <span className="text-purple-600 dark:text-purple-400 font-semibold">in</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">seen</span>
        <span className="text-neutral-500">:</span>
      </div>
      <div className="pl-16">
        <span className="text-purple-600 dark:text-purple-400 font-semibold">return</span>{" "}
        <span className="text-neutral-500">[</span>
        <span className="text-neutral-800 dark:text-neutral-200">seen</span>
        <span className="text-neutral-500">[</span>
        <span className="text-neutral-800 dark:text-neutral-200">complement</span>
        <span className="text-neutral-500">],</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">i</span>
        <span className="text-neutral-500">]</span>
      </div>
      <div className="pl-12">
        <span className="text-neutral-800 dark:text-neutral-200">seen</span>
        <span className="text-neutral-500">[</span>
        <span className="text-neutral-800 dark:text-neutral-200">num</span>
        <span className="text-neutral-500">]</span>{" "}
        <span className="text-pink-600 dark:text-pink-400">=</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">i</span>
      </div>
      <div className="pl-6">
        <span className="text-purple-600 dark:text-purple-400 font-semibold">return</span>{" "}
        <span className="text-neutral-500">[]</span>
      </div>
    </div>
  ),
  "Java 17": (
    <div className="space-y-1">
      <div>
        <span className="text-purple-600 dark:text-purple-400 font-semibold">public int</span>
        <span className="text-neutral-500">[]</span>{" "}
        <span className="text-amber-600 dark:text-amber-400 font-bold">twoSum</span>
        <span className="text-neutral-500">(</span>
        <span className="text-cyan-600 dark:text-cyan-400">int</span>
        <span className="text-neutral-500">[]</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">nums</span>
        <span className="text-neutral-500">,</span>{" "}
        <span className="text-cyan-600 dark:text-cyan-400">int</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">target</span>
        <span className="text-neutral-500">) &#123;</span>
      </div>
      <div className="pl-6">
        <span className="text-purple-600 dark:text-purple-400 font-semibold">Map</span>
        <span className="text-neutral-500">&lt;</span>
        <span className="text-cyan-600 dark:text-cyan-400">Integer</span>
        <span className="text-neutral-500">,</span>{" "}
        <span className="text-cyan-600 dark:text-cyan-400">Integer</span>
        <span className="text-neutral-500">&gt;</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">map</span>{" "}
        <span className="text-pink-600 dark:text-pink-400">= new</span>{" "}
        <span className="text-purple-600 dark:text-purple-400 font-semibold">HashMap</span>
        <span className="text-neutral-500">&lt;&gt;();</span>
      </div>
      <div className="pl-6">
        <span className="text-purple-600 dark:text-purple-400 font-semibold">for</span>{" "}
        <span className="text-neutral-500">(</span>
        <span className="text-cyan-600 dark:text-cyan-400">int</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">i</span>{" "}
        <span className="text-pink-600 dark:text-pink-400">=</span>{" "}
        <span className="text-emerald-600 dark:text-emerald-400">0</span>
        <span className="text-neutral-500">;</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">i</span>{" "}
        <span className="text-pink-600 dark:text-pink-400">&lt;</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">nums</span>
        <span className="text-neutral-500">.</span>
        <span className="text-neutral-800 dark:text-neutral-200">length</span>
        <span className="text-neutral-500">;</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">i</span>
        <span className="text-pink-600 dark:text-pink-400">++</span>
        <span className="text-neutral-500">) &#123;</span>
      </div>
      <div className="pl-12">
        <span className="text-cyan-600 dark:text-cyan-400">int</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">complement</span>{" "}
        <span className="text-pink-600 dark:text-pink-400">=</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">target</span>{" "}
        <span className="text-pink-600 dark:text-pink-400">-</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">nums</span>
        <span className="text-neutral-500">[</span>
        <span className="text-neutral-800 dark:text-neutral-200">i</span>
        <span className="text-neutral-500">];</span>
      </div>
      <div className="pl-12">
        <span className="text-purple-600 dark:text-purple-400 font-semibold">if</span>{" "}
        <span className="text-neutral-500">(</span>
        <span className="text-neutral-800 dark:text-neutral-200">map</span>
        <span className="text-neutral-500">.</span>
        <span className="text-amber-600 dark:text-amber-400">containsKey</span>
        <span className="text-neutral-500">(</span>
        <span className="text-neutral-800 dark:text-neutral-200">complement</span>
        <span className="text-neutral-500">))</span>{" "}
        <span className="text-purple-600 dark:text-purple-400 font-semibold">return new int</span>
        <span className="text-neutral-500">[] &#123;</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">map</span>
        <span className="text-neutral-500">.</span>
        <span className="text-amber-600 dark:text-amber-400">get</span>
        <span className="text-neutral-500">(</span>
        <span className="text-neutral-800 dark:text-neutral-200">complement</span>
        <span className="text-neutral-500">),</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">i</span>{" "}
        <span className="text-neutral-500">&#125;;</span>
      </div>
      <div className="pl-12">
        <span className="text-neutral-800 dark:text-neutral-200">map</span>
        <span className="text-neutral-500">.</span>
        <span className="text-amber-600 dark:text-amber-400">put</span>
        <span className="text-neutral-500">(</span>
        <span className="text-neutral-800 dark:text-neutral-200">nums</span>
        <span className="text-neutral-500">[</span>
        <span className="text-neutral-800 dark:text-neutral-200">i</span>
        <span className="text-neutral-500">],</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">i</span>
        <span className="text-neutral-500">);</span>
      </div>
      <div className="pl-6">
        <span className="text-neutral-500">&#125;</span>
      </div>
      <div className="pl-6">
        <span className="text-purple-600 dark:text-purple-400 font-semibold">return new int</span>
        <span className="text-neutral-500">[</span>
        <span className="text-emerald-600 dark:text-emerald-400">0</span>
        <span className="text-neutral-500">];</span>
      </div>
      <div>
        <span className="text-neutral-500">&#125;</span>
      </div>
    </div>
  ),
  "TypeScript": (
    <div className="space-y-1">
      <div>
        <span className="text-purple-600 dark:text-purple-400 font-semibold">function</span>{" "}
        <span className="text-amber-600 dark:text-amber-400 font-bold">twoSum</span>
        <span className="text-neutral-500">(</span>
        <span className="text-neutral-800 dark:text-neutral-200">nums</span>
        <span className="text-neutral-500">:</span>{" "}
        <span className="text-cyan-600 dark:text-cyan-400">number</span>
        <span className="text-neutral-500">[],</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">target</span>
        <span className="text-neutral-500">:</span>{" "}
        <span className="text-cyan-600 dark:text-cyan-400">number</span>
        <span className="text-neutral-500">):</span>{" "}
        <span className="text-cyan-600 dark:text-cyan-400">number</span>
        <span className="text-neutral-500">[] &#123;</span>
      </div>
      <div className="pl-6">
        <span className="text-purple-600 dark:text-purple-400 font-semibold">const</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">map</span>{" "}
        <span className="text-pink-600 dark:text-pink-400">= new</span>{" "}
        <span className="text-purple-600 dark:text-purple-400 font-semibold">Map</span>
        <span className="text-neutral-500">&lt;</span>
        <span className="text-cyan-600 dark:text-cyan-400">number</span>
        <span className="text-neutral-500">,</span>{" "}
        <span className="text-cyan-600 dark:text-cyan-400">number</span>
        <span className="text-neutral-500">&gt;();</span>
      </div>
      <div className="pl-6">
        <span className="text-purple-600 dark:text-purple-400 font-semibold">for</span>{" "}
        <span className="text-neutral-500">(</span>
        <span className="text-purple-600 dark:text-purple-400 font-semibold">let</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">i</span>{" "}
        <span className="text-pink-600 dark:text-pink-400">=</span>{" "}
        <span className="text-emerald-600 dark:text-emerald-400">0</span>
        <span className="text-neutral-500">;</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">i</span>{" "}
        <span className="text-pink-600 dark:text-pink-400">&lt;</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">nums</span>
        <span className="text-neutral-500">.</span>
        <span className="text-neutral-800 dark:text-neutral-200">length</span>
        <span className="text-neutral-500">;</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">i</span>
        <span className="text-pink-600 dark:text-pink-400">++</span>
        <span className="text-neutral-500">) &#123;</span>
      </div>
      <div className="pl-12">
        <span className="text-purple-600 dark:text-purple-400 font-semibold">const</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">complement</span>{" "}
        <span className="text-pink-600 dark:text-pink-400">=</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">target</span>{" "}
        <span className="text-pink-600 dark:text-pink-400">-</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">nums</span>
        <span className="text-neutral-500">[</span>
        <span className="text-neutral-800 dark:text-neutral-200">i</span>
        <span className="text-neutral-500">];</span>
      </div>
      <div className="pl-12">
        <span className="text-purple-600 dark:text-purple-400 font-semibold">if</span>{" "}
        <span className="text-neutral-500">(</span>
        <span className="text-neutral-800 dark:text-neutral-200">map</span>
        <span className="text-neutral-500">.</span>
        <span className="text-amber-600 dark:text-amber-400">has</span>
        <span className="text-neutral-500">(</span>
        <span className="text-neutral-800 dark:text-neutral-200">complement</span>
        <span className="text-neutral-500">))</span>{" "}
        <span className="text-purple-600 dark:text-purple-400 font-semibold">return</span>{" "}
        <span className="text-neutral-500">[</span>
        <span className="text-neutral-800 dark:text-neutral-200">map</span>
        <span className="text-neutral-500">.</span>
        <span className="text-amber-600 dark:text-amber-400">get</span>
        <span className="text-neutral-500">(</span>
        <span className="text-neutral-800 dark:text-neutral-200">complement</span>
        <span className="text-neutral-500">)!,</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">i</span>
        <span className="text-neutral-500">];</span>
      </div>
      <div className="pl-12">
        <span className="text-neutral-800 dark:text-neutral-200">map</span>
        <span className="text-neutral-500">.</span>
        <span className="text-amber-600 dark:text-amber-400">set</span>
        <span className="text-neutral-500">(</span>
        <span className="text-neutral-800 dark:text-neutral-200">nums</span>
        <span className="text-neutral-500">[</span>
        <span className="text-neutral-800 dark:text-neutral-200">i</span>
        <span className="text-neutral-500">],</span>{" "}
        <span className="text-neutral-800 dark:text-neutral-200">i</span>
        <span className="text-neutral-500">);</span>
      </div>
      <div className="pl-6">
        <span className="text-neutral-500">&#125;</span>
      </div>
      <div className="pl-6">
        <span className="text-purple-600 dark:text-purple-400 font-semibold">return</span>{" "}
        <span className="text-neutral-500">[];</span>
      </div>
    </div>
  ),
};

export function CodingExperience() {
  const [lang, setLang] = useState("C++17");
  const [isRunning, setIsRunning] = useState(false);
  const [showResult, setShowResult] = useState(true);
  const [runtime, setRuntime] = useState(38);

  const triggerRun = () => {
    setIsRunning(true);
    setShowResult(false);
    setTimeout(() => {
      setIsRunning(false);
      setShowResult(true);
      setRuntime(Math.floor(Math.random() * 12) + 32);
    }, 550);
  };

  return (
    <section className="w-full py-16 sm:py-20 px-4 sm:px-6 md:px-8 border-b border-border bg-background text-foreground">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border border-border bg-muted/60 text-foreground text-xs font-semibold uppercase tracking-wider">
            <Code2 className="w-3.5 h-3.5 text-primary" />
            <span>Online Judge</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Code. Run. Improve.
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Write code, run test cases instantly, and benchmark runtime efficiency.
          </p>
        </div>

        {/* 1. Entrance Animation: Motion Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl bg-card border border-border/80 shadow-md hover:shadow-lg transition-shadow overflow-hidden"
        >
          
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between px-5 py-3 bg-neutral-50/80 dark:bg-neutral-900/60 border-b border-border text-xs gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">Two Sum</span>
              <span className="text-neutral-400">•</span>
              <span className="text-[11px] font-medium text-neutral-500">Easy</span>
            </div>

            {/* 2. Interactive Hover Effects on Language Tabs */}
            <div className="flex items-center gap-1.5">
              {Object.keys(CODE_RENDERERS).map((item) => {
                const isActive = lang === item;
                return (
                  <button
                    key={item}
                    onClick={() => setLang(item)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer border ${
                      isActive
                        ? "bg-background text-white dark:bg-white dark:text-slate-950 font-bold border-transparent shadow-xs"
                        : "bg-transparent text-neutral-600 dark:text-neutral-400 border-transparent hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/30"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Syntax Highlighting & Clean Monospace UI */}
          <div className="p-6 sm:p-7 font-mono text-xs sm:text-[13px] leading-relaxed bg-background/60 text-foreground overflow-x-auto select-none">
            {CODE_RENDERERS[lang]}
          </div>

          {/* 4. Success State Reveal & Run Button Animation */}
          <div className="px-5 py-3.5 bg-neutral-50/80 dark:bg-neutral-900/60 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">
            
            {/* Success State Animation */}
            <div className="min-h-[28px] flex items-center">
              <AnimatePresence mode="wait">
                {isRunning ? (
                  <motion.div
                    key="running"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 font-mono text-xs text-neutral-500"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Executing in isolated sandbox...</span>
                  </motion.div>
                ) : showResult ? (
                  <motion.div
                    key="accepted"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="flex flex-wrap items-center gap-3 font-mono text-[11px] sm:text-xs"
                  >
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <span className="text-sm">✓</span> Accepted
                    </span>
                    <span className="text-neutral-300 dark:text-neutral-700">|</span>
                    <span className="text-neutral-600 dark:text-neutral-400">12/12 Test Cases Passed</span>
                    <span className="text-neutral-300 dark:text-neutral-700">|</span>
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Runtime: <strong className="text-foreground">{runtime}ms</strong>
                    </span>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* 3. Run Button Animation with Hover Scale and Active Press */}
            <button
              onClick={triggerRun}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white hover:bg-neutral-100 text-black font-bold text-xs transition-all duration-200 hover:scale-105 active:scale-95 shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3 h-3 fill-current ${isRunning ? "animate-spin" : ""}`} />
              <span>{isRunning ? "Running..." : "Run Solution"}</span>
            </button>

          </div>

        </motion.div>

      </div>
    </section>
  );
}

export default CodingExperience;
