"use client";

import { useQuestionStore } from "../_store/useQuestionStore";
import SectionCard from "./SectionCard";
import { MonacoEditor } from "@/components/editor/MonacoEditor";
import { Shield } from "lucide-react";

export default function CustomChecker() {
  const { customChecker, updateCustomChecker } = useQuestionStore();
  const activeLang = customChecker.language;

  return (
    <SectionCard
      id="custom-checker"
      title="Custom Checker"
      subtitle="Optional custom judge to verify outputs with special comparison logic."
      icon={Shield}
      badge="Optional"
      badgeColor="bg-muted text-muted-foreground dark:bg-slate-700 dark:text-muted-foreground"
      delay={0.5}
    >
      <div className="space-y-4">
        {/* Toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            role="switch"
            aria-label="Enable Custom Checker"
            checked={customChecker.enabled}
            onChange={(event) => updateCustomChecker({ enabled: event.target.checked })}
            className="peer sr-only"
          />
          <div
            aria-hidden="true"
            className={`relative shrink-0 w-11 h-6 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-2 ${
              customChecker.enabled ? "bg-indigo-600 dark:bg-indigo-500" : "bg-gray-300 dark:bg-slate-600"
            }`}
          >
            <div
              className={`absolute left-0 top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                customChecker.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Enable Custom Checker
          </span>
        </label>

        {customChecker.enabled && (
          <div className="space-y-4 pt-2">
            {/* Language selector */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-700 dark:text-slate-300">Checker Language</label>
              <div className="flex gap-2">
                {[
                  { id: "cpp", label: "C++" },
                  { id: "python", label: "Python" },
                  { id: "java", label: "Java" },
                ].map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => updateCustomChecker({ language: lang.id })}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                      activeLang === lang.id
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-300"
                        : "bg-muted/50 border-border text-muted-foreground dark:bg-card dark:border-border dark:text-muted-foreground hover:border-gray-300 dark:hover:border-slate-600"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reusable Monaco Editor */}
            <div className="border border-border dark:border-border rounded-xl overflow-hidden bg-card">
              <MonacoEditor
                height="300px"
                language={activeLang === "cpp" ? "cpp" : activeLang === "java" ? "java" : "python"}
                value={customChecker.code}
                onChange={(val) => 
                  updateCustomChecker({ code: val || "" })
                }
              />
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
