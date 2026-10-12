"use client";

import { useQuestionStore } from "../_store/useQuestionStore";
import SectionCard from "./SectionCard";
import { Cpu } from "lucide-react";

const inputClass =
  "w-full px-3.5 py-2.5 bg-muted/50 dark:bg-card border border-border dark:border-border rounded-xl text-sm text-foreground dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";

const labelClass = "text-[13px] font-medium text-gray-700 dark:text-slate-300";

export default function ExecutionSettings() {
  const { execution, updateExecution } = useQuestionStore();

  return (
    <SectionCard
      id="execution-settings"
      title="Execution Settings"
      subtitle="Configure resource limits and execution environment."
      icon={Cpu}
      delay={0.1}
    >
      <div className="space-y-5">
        {/* Numeric inputs grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className={labelClass}>Time Limit</label>
            <div className="relative">
              <input
                type="number"
                value={execution.timeLimit}
                onChange={(e) => updateExecution({ timeLimit: Number(e.target.value) })}
                min={100}
                step={100}
                className={inputClass}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-muted-foreground">ms</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Memory Limit</label>
            <div className="relative">
              <input
                type="number"
                value={execution.memoryLimit}
                onChange={(e) => updateExecution({ memoryLimit: Number(e.target.value) })}
                min={16}
                step={16}
                className={inputClass}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-muted-foreground">MB</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Stack Size</label>
            <div className="relative">
              <input
                type="number"
                value={execution.stackSize}
                onChange={(e) => updateExecution({ stackSize: Number(e.target.value) })}
                min={1}
                className={inputClass}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-muted-foreground">MB</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Output Limit</label>
            <div className="relative">
              <input
                type="number"
                value={execution.outputLimit}
                onChange={(e) => updateExecution({ outputLimit: Number(e.target.value) })}
                min={1}
                className={inputClass}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-muted-foreground">MB</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Max Source Size</label>
            <div className="relative">
              <input
                type="number"
                value={execution.maxSourceCodeSize}
                onChange={(e) => updateExecution({ maxSourceCodeSize: Number(e.target.value) })}
                min={1}
                className={inputClass}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-muted-foreground">KB</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>CPU Limit</label>
            <div className="relative">
              <input
                type="number"
                value={execution.cpuLimit}
                onChange={(e) => updateExecution({ cpuLimit: Number(e.target.value) })}
                min={0.5}
                step={0.5}
                className={inputClass}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-muted-foreground">cores</span>
            </div>
          </div>
        </div>

        {/* Toggle switches */}
        <div className="pt-4 border-t border-gray-100 dark:border-white/[0.04]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { key: "enableCustomInput" as const, label: "Enable Custom Input", desc: "Allow candidates to test with custom input" },
              { key: "allowMultipleFiles" as const, label: "Allow Multiple Files", desc: "Support multi-file submissions" },
              { key: "enableFileUpload" as const, label: "Enable File Upload", desc: "Allow file upload in submission" },
            ].map((toggle) => (
              <label
                key={toggle.key}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  execution[toggle.key]
                    ? "bg-indigo-50/50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/20"
                    : "bg-muted/50 border-border dark:bg-card/50 dark:border-border"
                }`}
              >
                <div className="relative pt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    role="switch"
                    aria-label={toggle.label}
                    checked={execution[toggle.key]}
                    onChange={(event) => updateExecution({ [toggle.key]: event.target.checked })}
                    className="peer sr-only"
                  />
                  <div
                    className={`relative w-9 h-5 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-2 ${
                      execution[toggle.key] ? "bg-indigo-600 dark:bg-indigo-500" : "bg-gray-300 dark:bg-slate-600"
                    }`}
                    aria-hidden="true"
                  >
                    <div
                      className={`absolute left-0 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                        execution[toggle.key] ? "translate-x-[18px]" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground dark:text-white">{toggle.label}</p>
                  <p className="text-[11px] text-gray-500 dark:text-muted-foreground mt-0.5">{toggle.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
