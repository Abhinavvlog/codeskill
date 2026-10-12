"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  ExternalLink, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Code2, 
  Clock, 
  Cpu, 
  FileText,
  Eye,
  RefreshCw
} from "lucide-react";
import { adminProblemsAPI } from "@/config/api";
import { Spinner } from "@/components/ui/spinner";

interface TestCaseRow {
  input: string;
  output: string;
  isHidden: boolean;
  weight?: number;
}

const LANGUAGES = [
  { id: "python", label: "Python 3" },
  { id: "cpp", label: "C++ (GCC)" },
  { id: "java", label: "Java (OpenJDK)" },
  { id: "javascript", label: "JavaScript (Node)" },
  { id: "c", label: "C (GCC)" },
];

const inputClass =
  "w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

const slugify = (v: string) =>
  v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

export default function EditProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const problemId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [visibility, setVisibility] = useState<"Draft" | "Published">("Published");
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

  useEffect(() => {
    async function loadProblem() {
      try {
        setLoading(true);
        setError(null);
        const res = await adminProblemsAPI.getById(problemId);
        const prob = res.data?.problem || res.data?.data || res.data;

        if (!prob) {
          throw new Error("Problem record could not be loaded.");
        }

        setTitle(prob.title || "");
        setSlug(prob.slug || "");
        setDifficulty(prob.difficulty || "Easy");
        setVisibility(prob.visibility === "Draft" ? "Draft" : "Published");

        if (Array.isArray(prob.categories)) {
          setCategories(prob.categories.join(", "));
        } else if (prob.category) {
          setCategories(prob.category);
        }

        if (prob.statement) {
          setDescription(prob.statement.description || "");
          setInputFormat(prob.statement.inputFormat || "");
          setOutputFormat(prob.statement.outputFormat || "");
          setConstraints(prob.statement.constraints || "");
        } else {
          setDescription(prob.description || "");
          setInputFormat(prob.inputFormat || "");
          setOutputFormat(prob.outputFormat || "");
          setConstraints(prob.constraints || "");
        }

        if (prob.config) {
          setTimeLimit(prob.config.timeLimit || 2000);
          setMemoryLimit(prob.config.memoryLimit || 256);
          if (Array.isArray(prob.config.supportedLanguages) && prob.config.supportedLanguages.length > 0) {
            setLanguages(prob.config.supportedLanguages);
          }
        }

        if (prob.testCases?.cases && Array.isArray(prob.testCases.cases)) {
          setCases(
            prob.testCases.cases.map((c: any) => ({
              input: c.input || "",
              output: c.output || "",
              isHidden: Boolean(c.isHidden),
              weight: c.weight || 1,
            }))
          );
        } else if (prob.statement?.samples && Array.isArray(prob.statement.samples)) {
          setCases(
            prob.statement.samples.map((s: any) => ({
              input: s.input || "",
              output: s.output || "",
              isHidden: false,
              weight: 1,
            }))
          );
        }
      } catch (err: any) {
        console.error("Failed to load problem:", err);
        setError(err.response?.data?.message || err.message || "Failed to load problem data.");
      } finally {
        setLoading(false);
      }
    }

    if (problemId) {
      loadProblem();
    }
  }, [problemId]);

  const toggleLanguage = (langId: string) => {
    setLanguages((prev) =>
      prev.includes(langId) ? prev.filter((l) => l !== langId) : [...prev, langId]
    );
  };

  const updateCase = (idx: number, patch: Partial<TestCaseRow>) => {
    setCases((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const addCase = (isHidden = true) => {
    setCases((prev) => [...prev, { input: "", output: "", isHidden, weight: 1 }]);
  };

  const removeCase = (idx: number) => {
    setCases((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (targetVisibility = visibility) => {
    setError(null);
    setSuccessMsg(null);

    if (!title.trim() || !slug.trim()) {
      setError("Problem title and URL slug are required.");
      return;
    }
    if (!description.trim()) {
      setError("Problem statement is required.");
      return;
    }
    if (languages.length === 0) {
      setError("Please select at least one supported programming language.");
      return;
    }

    const usableCases = cases.filter((c) => c.output.trim());
    if (targetVisibility === "Published" && usableCases.length === 0) {
      setError("Add at least one testcase with expected output before publishing.");
      return;
    }

    setSaving(true);
    try {
      const parsedCategories = categories
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      const payload = {
        metadata: {
          title: title.trim(),
          slug: slug.trim(),
          difficulty,
          categories: parsedCategories,
          visibility: targetVisibility,
        },
        languages,
        execution: {
          timeLimit: Number(timeLimit) || 2000,
          memoryLimit: Number(memoryLimit) || 256,
        },
        statement: {
          description: description.trim(),
          inputFormat: inputFormat.trim(),
          outputFormat: outputFormat.trim(),
          constraints: constraints.trim(),
        },
        sampleExamples: usableCases
          .filter((c) => !c.isHidden)
          .slice(0, 3)
          .map((c) => ({ input: c.input, output: c.output })),
        testCases: {
          cases: usableCases.map((c) => ({
            input: c.input,
            output: c.output,
            isHidden: Boolean(c.isHidden),
            weight: c.weight || 1,
          })),
        },
        publishing: {
          visibility: targetVisibility,
        },
      };

      await adminProblemsAPI.update(problemId, payload);
      setVisibility(targetVisibility);
      setSuccessMsg("Problem updated successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(", ") : msg || err.message || "Failed to update problem.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete problem "${title}"?`)) {
      return;
    }

    setDeleting(true);
    try {
      await adminProblemsAPI.delete(problemId);
      router.push("/admin/problems");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete problem");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-muted-foreground">
        <Spinner className="w-8 h-8 animate-spin mb-3 text-primary" />
        <p className="text-sm font-medium">Loading problem details...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 font-sans">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
            <Link href="/admin/problems" className="hover:text-foreground inline-flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Practice Problems
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Edit Problem</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            {title || "Edit Problem"}
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                visibility === "Published"
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              {visibility}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {slug && (
            <Link
              href={`/problems/${slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-semibold transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-primary" />
              Preview in Judge
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </Link>
          )}

          <button
            type="button"
            disabled={deleting || saving}
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>

          <button
            type="button"
            disabled={saving || deleting}
            onClick={() => handleSave()}
            className="inline-flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-semibold shadow-md shadow-primary/20 transition-all disabled:opacity-50"
          >
            {saving ? <Spinner className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm rounded-xl border border-rose-500/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm rounded-xl border border-emerald-500/20 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="flex-1">{successMsg}</span>
        </div>
      )}

      {/* Section 1: Core Problem Metadata */}
      <section className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <FileText className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Problem Identity & Scope</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Problem Title *</label>
            <input
              type="text"
              required
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Two Sum"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">URL Slug *</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                className={`${inputClass} font-mono`}
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="two-sum"
              />
              <button
                type="button"
                onClick={() => setSlug(slugify(title))}
                className="px-2.5 py-2 bg-muted hover:bg-muted/80 text-xs rounded-xl border border-border shrink-0 text-muted-foreground hover:text-foreground"
                title="Regenerate slug from title"
              >
                Sync
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Difficulty Level</label>
            <select
              className={inputClass}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Visibility Status</label>
            <select
              className={inputClass}
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as "Draft" | "Published")}
            >
              <option value="Published">Published (Active in Judge)</option>
              <option value="Draft">Draft (Internal Only)</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Topic Categories (comma-separated)</label>
            <input
              type="text"
              className={inputClass}
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              placeholder="Arrays, Hash Table, Dynamic Programming"
            />
          </div>
        </div>
      </section>

      {/* Section 2: Statement & Specifications */}
      <section className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Code2 className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Problem Statement & Formats</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Problem Statement / Description *</label>
            <textarea
              rows={7}
              required
              className={`${inputClass} font-sans leading-relaxed`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the challenge statement clearly..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Input Format</label>
              <textarea
                rows={3}
                className={`${inputClass} font-mono text-xs`}
                value={inputFormat}
                onChange={(e) => setInputFormat(e.target.value)}
                placeholder="e.g. First line contains an integer T..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Output Format</label>
              <textarea
                rows={3}
                className={`${inputClass} font-mono text-xs`}
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                placeholder="e.g. Return the indices of the elements..."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Constraints</label>
            <textarea
              rows={2}
              className={`${inputClass} font-mono text-xs`}
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="e.g. 2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9"
            />
          </div>
        </div>
      </section>

      {/* Section 3: Execution Runtime & Limits */}
      <section className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Cpu className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Execution Environment & Limits</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Time Limit (ms)
            </label>
            <input
              type="number"
              min={100}
              step={100}
              className={inputClass}
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-muted-foreground" /> Memory Limit (MB)
            </label>
            <input
              type="number"
              min={16}
              step={16}
              className={inputClass}
              value={memoryLimit}
              onChange={(e) => setMemoryLimit(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-xs font-semibold text-foreground block">Enabled Programming Languages</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => {
              const active = languages.includes(lang.id);
              return (
                <button
                  type="button"
                  key={lang.id}
                  onClick={() => toggleLanguage(lang.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    active
                      ? "bg-primary/10 border-primary text-primary shadow-xs"
                      : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 4: Test Cases */}
      <section className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Test Cases ({cases.length})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => addCase(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Sample Case
            </button>
            <button
              type="button"
              onClick={() => addCase(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Hidden Test Case
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {cases.map((c, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all space-y-3 ${
                c.isHidden
                  ? "bg-muted/10 border-border"
                  : "bg-emerald-500/5 border-emerald-500/20"
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-muted-foreground">#{idx + 1}</span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                      c.isHidden
                        ? "bg-muted text-muted-foreground border border-border"
                        : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    }`}
                  >
                    {c.isHidden ? "Hidden Evaluation Case" : "Public Sample Example"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={c.isHidden}
                      onChange={(e) => updateCase(idx, { isHidden: e.target.checked })}
                      className="rounded border-border text-primary focus:ring-primary/20"
                    />
                    Hidden
                  </label>
                  {cases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCase(idx)}
                      className="text-muted-foreground hover:text-rose-500 transition-colors"
                      title="Remove test case"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                    Input Stdin
                  </span>
                  <textarea
                    rows={2}
                    className={`${inputClass} font-mono text-xs`}
                    value={c.input}
                    onChange={(e) => updateCase(idx, { input: e.target.value })}
                    placeholder="Input data..."
                  />
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                    Expected Output
                  </span>
                  <textarea
                    rows={2}
                    className={`${inputClass} font-mono text-xs`}
                    value={c.output}
                    onChange={(e) => updateCase(idx, { output: e.target.value })}
                    placeholder="Exact expected output..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 bg-card/95 backdrop-blur-md border border-border rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <Link
          href="/admin/problems"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Cancel and return
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={saving || deleting}
            onClick={() => handleSave("Draft")}
            className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={saving || deleting}
            onClick={() => handleSave("Published")}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 transition-all disabled:opacity-50"
          >
            {saving ? <Spinner className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save & Publish
          </button>
        </div>
      </div>
    </div>
  );
}
