"use client";

import { useEffect } from "react";
import { useQuestionStore, normalizeTrueFalseOptions } from "../_store/useQuestionStore";
import SectionCard from "./SectionCard";
import { ListChecks, Plus, Trash2, Check, CheckCircle2 } from "lucide-react";
import { useToast } from "./Toast";

const inputClass =
  "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all";

export default function MCQEditor() {
  const { metadata, mcqOptions, updateMCQOptions } = useQuestionStore();
  const { addToast } = useToast();

  const isMultiple = metadata.questionType === "MULTIPLE_CHOICE";
  const isTrueFalse = metadata.questionType === "TRUE_FALSE";

  // Auto-normalize if True/False options are invalid, not length 2, or missing correct values
  useEffect(() => {
    if (isTrueFalse) {
      const isInvalid =
        mcqOptions.length !== 2 ||
        mcqOptions[0]?.text !== "True" ||
        mcqOptions[1]?.text !== "False" ||
        mcqOptions[0]?.isCorrect === mcqOptions[1]?.isCorrect;

      if (isInvalid) {
        updateMCQOptions(normalizeTrueFalseOptions(mcqOptions));
      }
    }
  }, [isTrueFalse, mcqOptions, updateMCQOptions]);

  // For True/False, ensure exactly 2 normalized options
  const displayOptions = isTrueFalse
    ? mcqOptions.length === 2 && mcqOptions[0]?.text === "True" && mcqOptions[1]?.text === "False"
      ? mcqOptions
      : normalizeTrueFalseOptions(mcqOptions)
    : mcqOptions;

  const handleOptionTextChange = (index: number, val: string) => {
    if (isTrueFalse) return; // True/False text cannot be altered
    const next = [...mcqOptions];
    next[index] = { ...next[index], text: val };
    updateMCQOptions(next);
  };

  const handleOptionExplanationChange = (index: number, val: string) => {
    const next = [...displayOptions];
    next[index] = { ...next[index], explanation: val };
    updateMCQOptions(next);
  };

  const handleCorrectToggle = (index: number) => {
    if (isTrueFalse) {
      // Exactly one answer marked correct (index 0 is True, index 1 is False)
      updateMCQOptions([
        { text: "True", isCorrect: index === 0, explanation: displayOptions[0]?.explanation || "" },
        { text: "False", isCorrect: index === 1, explanation: displayOptions[1]?.explanation || "" },
      ]);
    } else if (!isMultiple) {
      updateMCQOptions(mcqOptions.map((opt, i) => ({ ...opt, isCorrect: i === index })));
    } else {
      const next = [...mcqOptions];
      next[index] = { ...next[index], isCorrect: !next[index].isCorrect };
      updateMCQOptions(next);
    }
  };

  const handleAddOption = () => {
    if (isTrueFalse) return;
    updateMCQOptions([...mcqOptions, { text: "", isCorrect: false, explanation: "" }]);
  };

  const handleRemoveOption = (index: number) => {
    if (isTrueFalse) return;
    if (mcqOptions.length <= 4) {
      addToast("error", "Minimum Options", "At least 4 options are required.");
      return;
    }
    updateMCQOptions(mcqOptions.filter((_, i) => i !== index));
  };

  return (
    <SectionCard
      id="mcq-options"
      title="Answer Options"
      subtitle={
        isMultiple
          ? "Check all options that are correct. (Minimum 4 options required)"
          : isTrueFalse
          ? "Select either True or False as the single correct answer."
          : "Select the single correct answer. (Minimum 4 options required)"
      }
      icon={ListChecks}
      delay={0.1}
    >
      <div className="flex items-start justify-end mb-4">
        {!isTrueFalse && (
          <button
            type="button"
            onClick={handleAddOption}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-muted hover:bg-muted/70 text-foreground transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Option
          </button>
        )}
      </div>

      <div className="space-y-3">
        {displayOptions.map((opt, idx) => {
          const isOptionCorrect = opt.isCorrect;
          const optionLabel = isTrueFalse
            ? idx === 0
              ? "True"
              : "False"
            : `Option ${String.fromCharCode(65 + idx)}`;

          return (
            <div
              key={idx}
              onClick={() => {
                if (isTrueFalse) {
                  handleCorrectToggle(idx);
                }
              }}
              className={`rounded-xl border transition-all ${
                isTrueFalse ? "cursor-pointer select-none" : ""
              } ${
                isOptionCorrect
                  ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 ring-1 ring-emerald-500/30 shadow-xs"
                  : "border-border bg-card hover:border-emerald-500/40"
              }`}
            >
              <div className="flex items-start gap-3.5 p-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCorrectToggle(idx);
                  }}
                  title={isOptionCorrect ? "Correct answer" : "Mark as correct"}
                  className={`mt-0.5 w-5 h-5 ${isMultiple ? "rounded" : "rounded-full"} flex items-center justify-center shrink-0 border transition-all ${
                    isOptionCorrect
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                      : "border-muted-foreground/30 bg-background hover:border-emerald-500/60"
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </button>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isTrueFalse ? (
                        <span
                          className={`text-xs font-bold tracking-wide px-2.5 py-0.5 rounded-md border ${
                            idx === 0
                              ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                              : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {optionLabel}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-foreground/80">
                          {optionLabel}
                        </span>
                      )}

                      {isOptionCorrect && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          CORRECT ANSWER
                        </span>
                      )}
                    </div>

                    {!isTrueFalse && mcqOptions.length > 4 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveOption(idx);
                        }}
                        className="text-muted-foreground hover:text-rose-500 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {!isTrueFalse && (
                    <input
                      type="text"
                      placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                      value={opt.text}
                      onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className={inputClass}
                    />
                  )}

                  <input
                    type="text"
                    placeholder={`Explanation for ${optionLabel} (optional, shown post-assessment)`}
                    value={opt.explanation || ""}
                    onChange={(e) => handleOptionExplanationChange(idx, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-muted-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
