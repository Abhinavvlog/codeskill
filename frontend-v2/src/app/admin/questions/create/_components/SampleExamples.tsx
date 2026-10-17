"use client";

import { BookOpen, Plus, Trash2 } from "lucide-react";
import { useQuestionEditorStore } from "../_store/QuestionEditorProvider";
import SectionCard from "./SectionCard";

const inputClass = "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";

export default function SampleExamples() {
  const { sampleExamples, addSampleExample, updateSampleExample, removeSampleExample } = useQuestionEditorStore();
  return (
    <SectionCard id="sample-examples" title="Example Test Cases" icon={BookOpen}
      subtitle="Write the examples students will see in the left panel. These examples are separate from the public and hidden tests used to judge submissions.">
      <div className="space-y-4">
        {sampleExamples.length === 0 && (
          <p className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            No examples added. Add an input, output, and optional explanation for students.
          </p>
        )}
        {sampleExamples.map((example, index) => (
          <div key={example.id} className="overflow-hidden rounded-xl border border-border">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
              <h3 className="text-sm font-semibold">Example {index + 1}</h3>
              <button type="button" aria-label={`Remove example ${index + 1}`} onClick={() => removeSampleExample(example.id)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 p-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                <span>Input</span>
                <textarea aria-label={`Example ${index + 1} input`} rows={3} value={example.input}
                  onChange={(event) => updateSampleExample(example.id, { input: event.target.value })}
                  className={`${inputClass} font-mono`} placeholder="Example input (can be empty)" />
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span>Output</span>
                <textarea aria-label={`Example ${index + 1} output`} rows={3} value={example.output}
                  onChange={(event) => updateSampleExample(example.id, { output: event.target.value })}
                  className={`${inputClass} font-mono`} placeholder="Example output" />
              </label>
              <label className="space-y-2 text-sm font-medium md:col-span-2">
                <span>Explanation (optional)</span>
                <textarea aria-label={`Example ${index + 1} explanation`} rows={2} value={example.explanation}
                  onChange={(event) => updateSampleExample(example.id, { explanation: event.target.value })}
                  className={inputClass} placeholder="Explain how the input produces this output" />
              </label>
            </div>
          </div>
        ))}
        <button type="button" onClick={addSampleExample}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted">
          <Plus className="h-4 w-4" /> Add Example
        </button>
      </div>
    </SectionCard>
  );
}
