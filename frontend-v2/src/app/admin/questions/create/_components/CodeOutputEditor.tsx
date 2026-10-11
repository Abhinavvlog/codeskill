"use client";

import { useState, useRef, useEffect } from "react";
import { useQuestionStore, ALL_LANGUAGES } from "../_store/useQuestionStore";
import SectionCard from "./SectionCard";
import { Code2, ChevronDown, Check } from "lucide-react";
import { ProgrammingLanguageIcon } from "@/components/ui/ProgrammingLanguageIcon";

const inputClass =
  "w-full px-3.5 py-2.5 bg-muted/50 dark:bg-card border border-border dark:border-border rounded-xl text-sm text-foreground dark:text-white placeholder:text-gray-400 dark:placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:ring-indigo-400/20 dark:focus:border-indigo-400 transition-all";

const labelClass = "text-[13px] font-medium text-gray-700 dark:text-slate-300 mb-1.5 block";

export default function CodeOutputEditor() {
  const { codeOutput, updateCodeOutput } = useQuestionStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLang =
    ALL_LANGUAGES.find((l) => l.id === codeOutput.language) || ALL_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <SectionCard
      id="code-output"
      title="Code Output Snippet"
      subtitle="Define the code snippet and the expected console output."
      icon={Code2}
      delay={0.1}
    >
      <div className="space-y-5">
        <div>
          <label className={labelClass}>Programming Language</label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`${inputClass} flex items-center justify-between text-left cursor-pointer`}
            >
              <span className="flex items-center gap-2.5">
                <ProgrammingLanguageIcon language={selectedLang.id} className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">{selectedLang.label}</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto bg-popover dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-xl shadow-xl py-1.5 backdrop-blur-sm animate-in fade-in-0 zoom-in-95">
                {ALL_LANGUAGES.map((lang) => {
                  const isSelected = lang.id === selectedLang.id;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => {
                        updateCodeOutput({ language: lang.id });
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors text-left hover:bg-muted dark:hover:bg-zinc-800/80 ${
                        isSelected
                          ? "bg-indigo-50/70 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 font-medium"
                          : "text-foreground dark:text-zinc-200"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <ProgrammingLanguageIcon language={lang.id} className="w-4 h-4 flex-shrink-0" />
                        <span>{lang.label}</span>
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className={labelClass}>Code Snippet</label>
          <textarea
            rows={8}
            placeholder="// Enter the code snippet candidates will analyze"
            value={codeOutput.code}
            onChange={(e) => updateCodeOutput({ code: e.target.value })}
            className={`${inputClass} font-mono text-xs`}
          />
        </div>

        <div>
          <label className={labelClass}>Expected Output</label>
          <textarea
            rows={4}
            placeholder="Enter the exact expected output candidates should guess"
            value={codeOutput.expectedOutput}
            onChange={(e) => updateCodeOutput({ expectedOutput: e.target.value })}
            className={`${inputClass} font-mono text-xs`}
          />
        </div>
      </div>
    </SectionCard>
  );
}
