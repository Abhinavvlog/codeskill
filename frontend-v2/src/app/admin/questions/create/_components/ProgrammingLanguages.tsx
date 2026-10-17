"use client";

import { useQuestionStore, ALL_LANGUAGES, DEFAULT_COMPILER_VERSIONS } from "../_store/useQuestionStore";
import SectionCard from "./SectionCard";
import { Code2, Check } from "lucide-react";
import { ProgrammingLanguageIcon } from "@/components/ui/ProgrammingLanguageIcon";

const PRESETS = [
  { label: "All Languages", langs: ALL_LANGUAGES.map((l) => l.id) },
  { label: "Web Dev", langs: ["javascript", "typescript", "python3", "go", "ruby", "php"] },
  { label: "Competitive", langs: ["cpp", "java", "python3", "c"] },
] as const;

export default function ProgrammingLanguages() {
  const { languages, toggleLanguage, setCompilerVersion } = useQuestionStore();

  const applyPreset = (langs: readonly string[]) => {
    // We'll set exactly these languages
    const store = useQuestionStore.getState();
    store.updateLanguages({ supported: [...langs] });
  };

  return (
    <SectionCard
      id="languages"
      title="Programming Languages"
      subtitle="Select supported languages and compiler/runtime versions."
      icon={Code2}
      delay={0.05}
    >
      <div className="space-y-5">
        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset.langs)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border dark:border-border bg-muted/50 dark:bg-card text-muted-foreground dark:text-muted-foreground hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:border-indigo-500/30 dark:hover:text-indigo-400 transition-all"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Language grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ALL_LANGUAGES.map((lang) => {
            const isSelected = languages.supported.includes(lang.id);
            return (
              <div
                key={lang.id}
                className={`relative flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-indigo-50/50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/20"
                    : "bg-muted/50/50 border-border dark:bg-card/50 dark:border-border hover:border-gray-300 dark:hover:border-slate-600"
                }`}
                onClick={() => toggleLanguage(lang.id)}
              >
                {/* Checkbox */}
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500"
                      : "border-gray-300 dark:border-slate-600"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>

                {/* Icon + Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <ProgrammingLanguageIcon language={lang.id} className="w-5 h-5 flex-shrink-0" />
                    <span className={`text-sm font-medium ${isSelected ? "text-foreground dark:text-white" : "text-muted-foreground dark:text-muted-foreground"}`}>
                      {lang.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Default language */}
        {languages.supported.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/[0.04]">
            <h3 className="text-[13px] font-semibold text-gray-700 dark:text-slate-300 mb-3">
              Default Language
            </h3>
            <select
              value={languages.supported.includes(languages.default) ? languages.default : languages.supported[0]}
              onChange={(e) => useQuestionStore.getState().updateLanguages({ default: e.target.value })}
              className="w-full sm:w-64 px-3 py-2 bg-muted/50 dark:bg-card border border-border dark:border-border rounded-lg text-sm text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              {languages.supported.map((langId) => {
                const lang = ALL_LANGUAGES.find((l) => l.id === langId);
                return (
                  <option key={langId} value={langId}>
                    {lang?.label || langId}
                  </option>
                );
              })}
            </select>
            <p className="text-[11px] text-gray-400 dark:text-muted-foreground mt-1.5">
              Candidates see this language pre-selected and can switch to any supported language.
            </p>
          </div>
        )}

        {/* Compiler Versions */}
        {languages.supported.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/[0.04]">
            <h3 className="text-[13px] font-semibold text-gray-700 dark:text-slate-300 mb-3">
              Compiler / Runtime Versions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {languages.supported.map((langId) => {
                const lang = ALL_LANGUAGES.find((l) => l.id === langId);
                if (!lang) return null;
                return (
                  <div key={langId} className="space-y-1">
                    <label className="text-[11px] font-medium text-gray-500 dark:text-muted-foreground uppercase tracking-wider">
                      {lang.label}
                    </label>
                    <input
                      type="text"
                      value={languages.compilerVersions[langId] || DEFAULT_COMPILER_VERSIONS[langId] || ""}
                      onChange={(e) => setCompilerVersion(langId, e.target.value)}
                      className="w-full px-3 py-2 bg-muted/50 dark:bg-card border border-border dark:border-border rounded-lg text-xs font-mono text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-[11px] text-gray-400 dark:text-muted-foreground">
          {languages.supported.length} language{languages.supported.length !== 1 ? "s" : ""} selected
        </p>
      </div>
    </SectionCard>
  );
}
