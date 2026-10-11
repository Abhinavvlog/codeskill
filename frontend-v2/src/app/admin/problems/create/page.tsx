"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { adminProblemsAPI } from "@/config/api";
import { Spinner } from "@/components/ui/spinner";

interface TestCaseRow {
  input: string;
  output: string;
  isHidden: boolean;
}

const LANGUAGES = ["python", "cpp", "java", "javascript", "c"];
const inputClass =
  "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

const slugify = (v: string) =>
  v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

export default function CreateProblemPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [categories, setCategories] = useState("");
  const [description, setDescription] = useState("");
  const [inputFormat, setInputFormat] = useState("");
  const [outputFormat, setOutputFormat] = useState("");
  const [constraints, setConstraints] = useState("");
  const [timeLimit, setTimeLimit] = useState(2000);
  const [memoryLimit, setMemoryLimit] = useState(256);
  const [languages, setLanguages] = useState<string[]>(["python", "cpp"]);
  const [cases, setCases] = useState<TestCaseRow[]>([
    { input: "", output: "", isHidden: false },
  ]);

  const toggleLanguage = (l: string) =>
    setLanguages((prev) =>
      prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l],
    );

  const updateCase = (i: number, patch: Partial<TestCaseRow>) =>
    setCases((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const submit = async (visibility: "Draft" | "Published") => {
    setError(null);
    const usableCases = cases.filter((c) => c.output.trim());
    if (!title.trim() || !slug.trim()) return setError("Title and slug are required.");
    if (!description.trim()) return setError("Problem statement is required.");
    if (languages.length === 0) return setError("Select at least one language.");
    if (timeLimit <= 0 || memoryLimit <= 0)
      return setError("Time and memory limits must be positive.");
    if (visibility === "Published" && usableCases.length === 0)
      return setError("Add at least one test case with expected output to publish.");

    setSaving(true);
    try {
      await adminProblemsAPI.create({
        metadata: {
          title: title.trim(),
          slug: slug.trim(),
          difficulty,
          categories: categories.split(",").map((c) => c.trim()).filter(Boolean),
        },
        languages,
        execution: { timeLimit, memoryLimit },
        statement: {
          description: description.trim(),
          inputFormat,
          outputFormat,
          constraints,
        },
        sampleExamples: usableCases
          .filter((c) => !c.isHidden)
          .slice(0, 3)
          .map((c) => ({ input: c.input, output: c.output })),
        testCases: {
          cases: usableCases.map((c) => ({
            input: c.input,
            output: c.output,
            isHidden: c.isHidden,
            weight: 1,
          })),
        },
        publishing: { visibility },
      });
      router.push("/admin/problems");
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(", ") : msg || err.message);
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/problems"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Problems
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Create Practice Problem</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 text-sm rounded-lg border border-red-500/20">
          {error}
        </div>
      )}

      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title *</label>
            <input
              className={inputClass}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSlug(slugify(e.target.value));
              }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Slug *</label>
            <input
              className={`${inputClass} font-mono`}
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Difficulty</label>
            <select
              className={inputClass}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Categories (comma separated)</label>
            <input
              className={inputClass}
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              placeholder="Arrays, Hashing"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Problem statement *</label>
          <textarea
            rows={6}
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Input format</label>
            <textarea rows={3} className={inputClass} value={inputFormat} onChange={(e) => setInputFormat(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Output format</label>
            <textarea rows={3} className={inputClass} value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Constraints</label>
          <textarea rows={2} className={inputClass} value={constraints} onChange={(e) => setConstraints(e.target.value)} />
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Execution</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Time limit (ms)</label>
            <input type="number" min={100} className={inputClass} value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Memory limit (MB)</label>
            <input type="number" min={16} className={inputClass} value={memoryLimit} onChange={(e) => setMemoryLimit(Number(e.target.value))} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <button
              type="button"
              key={l}
              onClick={() => toggleLanguage(l)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                languages.includes(l)
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Test cases</h2>
          <button
            type="button"
            onClick={() => setCases((p) => [...p, { input: "", output: "", isHidden: true }])}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
          >
            <Plus className="w-4 h-4" /> Add test case
          </button>
        </div>
        {cases.map((c, i) => (
          <div key={i} className="grid md:grid-cols-[1fr_1fr_auto] gap-3 items-start border border-border rounded-lg p-3">
            <textarea rows={2} placeholder="Input" className={`${inputClass} font-mono`} value={c.input} onChange={(e) => updateCase(i, { input: e.target.value })} />
            <textarea rows={2} placeholder="Expected output" className={`${inputClass} font-mono`} value={c.output} onChange={(e) => updateCase(i, { output: e.target.value })} />
            <div className="flex flex-col gap-2 items-end">
              <label className="text-xs flex items-center gap-1.5">
                <input type="checkbox" checked={c.isHidden} onChange={(e) => updateCase(i, { isHidden: e.target.checked })} /> Hidden
              </label>
              {cases.length > 1 && (
                <button type="button" onClick={() => setCases((p) => p.filter((_, idx) => idx !== i))} className="text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={() => submit("Draft")}
          className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted disabled:opacity-50"
        >
          Save as Draft
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => submit("Published")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
        >
          {saving ? <Spinner className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Publish
        </button>
      </div>
    </div>
  );
}
