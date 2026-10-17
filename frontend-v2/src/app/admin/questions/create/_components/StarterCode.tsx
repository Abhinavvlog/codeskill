"use client";

import { useState } from "react";
import { ALL_LANGUAGES } from "../_store/useQuestionStore";
import { useQuestionEditorStore } from "../_store/QuestionEditorProvider";
import SectionCard from "./SectionCard";
import Editor from "@monaco-editor/react";
import { Code2 } from "lucide-react";
import { ProgrammingLanguageIcon } from "@/components/ui/ProgrammingLanguageIcon";

export default function StarterCode() {
  const { languages, starterCode, setStarterCode, isDarkMode } = useQuestionEditorStore();
  const [activeTab, setActiveTab] = useState(languages.supported[0] || "javascript");

  const supportedLangs = ALL_LANGUAGES.filter((l) => languages.supported.includes(l.id));

  return (
    <SectionCard
      id="starter-code"
      title="Starter Code"
      subtitle="Provide the initial boilerplate code shown to candidates."
      icon={Code2}
      delay={0.35}
    >
      <div className="space-y-4">
        {/* Language Tabs */}
        <div className="flex flex-wrap gap-2 pb-2">
          {supportedLangs.map((lang) => (
            <button
              key={lang.id}
              type="button"
              onClick={() => setActiveTab(lang.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all rounded-lg border ${
                activeTab === lang.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <ProgrammingLanguageIcon language={lang.id} className="w-4 h-4 flex-shrink-0" />
              {lang.label}
            </button>
          ))}
        </div>

        {/* Monaco Editor */}
        <div className="border border-border dark:border-border rounded-xl overflow-hidden bg-card">
          <Editor
            height="380px"
            language={ALL_LANGUAGES.find((l) => l.id === activeTab)?.monacoId || "plaintext"}
            theme="vs-dark"
            value={starterCode[activeTab] || ""}
            onChange={(value) => setStarterCode(activeTab, value || "")}
            options={{
              minimap: { enabled: false },
              padding: { top: 16 },
              fontSize: 14,
              scrollBeyondLastLine: false,
              renderLineHighlightOnlyWhenFocus: true,
            }}
          />
        </div>

        {supportedLangs.length === 0 && (
          <p className="text-sm text-primary dark:text-primary bg-primary/10 dark:bg-primary/10 border border-primary/20 dark:border-primary/20 rounded-xl px-4 py-3">
            Please select at least one programming language in the Languages section above.
          </p>
        )}
      </div>
    </SectionCard>
  );
}
