"use client";

import { useEffect, useState } from "react";
import { adminQuestionsAPI } from "@/config/api";
import Link from "next/link";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles, 
  Code, 
  ShieldCheck, 
  AlertCircle,
  RefreshCw,
  Eye,
  Check
} from "lucide-react";

export default function PendingQuestionsReviewPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingQuestions();
  }, []);

  const fetchPendingQuestions = async () => {
    setLoading(true);
    try {
      const res = await adminQuestionsAPI.getAll({
        status: "pending_review",
        limit: 50,
      });
      setQuestions(res.data.questions || []);
    } catch (err) {
      console.error("Failed to fetch pending questions", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await adminQuestionsAPI.approve(id);
      setQuestions((prev) => prev.filter((q) => (q._id || q.id) !== id));
    } catch (err) {
      console.error("Failed to approve question", err);
      alert("Failed to approve question.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalId) return;
    setActionLoading(rejectModalId);
    try {
      await adminQuestionsAPI.reject(rejectModalId, rejectionReason);
      setQuestions((prev) => prev.filter((q) => (q._id || q.id) !== rejectModalId));
      setRejectModalId(null);
      setRejectionReason("");
    } catch (err) {
      console.error("Failed to reject question", err);
      alert("Failed to reject question.");
    } finally {
      setActionLoading(null);
    }
  };

  const aiCount = questions.filter((q) => q.aiGenerated).length;
  const manualCount = questions.length - aiCount;

  return (
    <div className="p-8 font-sans max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/admin/questions" className="hover:text-foreground flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Question Bank
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Pending Review</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-amber-500" />
            Question Review Queue
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Verify questions submitted by faculty or synthesized by AI before admission into active university assessments.
          </p>
        </div>

        <button
          onClick={fetchPendingQuestions}
          className="inline-flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Queue
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Awaiting Review</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">{questions.length}</div>
          <span className="text-[11px] text-muted-foreground">Total submissions in queue</span>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">AI Generated</span>
          <div className="text-2xl font-bold text-purple-400 mt-1">{aiCount}</div>
          <span className="text-[11px] text-muted-foreground">Synthesized via LLM models</span>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Faculty Submissions</span>
          <div className="text-2xl font-bold text-primary mt-1">{manualCount}</div>
          <span className="text-[11px] text-muted-foreground">Manual author drafts</span>
        </div>
      </div>

      {/* Questions Review List */}
      {loading ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
          Loading pending review questions...
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground">Review Queue is Empty!</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            All submitted assessment questions have been reviewed and processed.
          </p>
          <Link
            href="/admin/questions"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-amber-500 text-zinc-950 font-semibold text-xs rounded-lg hover:bg-amber-400"
          >
            Back to Question Bank
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((q, qIndex) => {
            const qId = q._id || q.id;
            return (
              <div
                key={qId}
                className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5 hover:border-amber-500/30 transition-all"
              >
                {/* Question Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-muted text-foreground font-mono">
                      #{qIndex + 1}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      {q.topic}
                    </span>
                    {q.subtopic && (
                      <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted">
                        {q.subtopic}
                      </span>
                    )}
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                      q.difficulty === "easy"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : q.difficulty === "medium"
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-rose-500/10 text-rose-500"
                    }`}>
                      {q.difficulty}
                    </span>
                    {q.aiGenerated && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Sparkles className="w-3 h-3" />
                        AI ({q.aiModel || "LLM"})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={actionLoading === qId}
                      onClick={() => handleApprove(qId)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors shadow-sm disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Activate
                    </button>
                    <button
                      disabled={actionLoading === qId}
                      onClick={() => setRejectModalId(qId)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>

              {/* Statement */}
              <div>
                <p className="text-foreground font-medium text-base whitespace-pre-wrap leading-relaxed">
                  {q.question}
                </p>
              </div>

              {/* Code Snippet */}
              {q.codeSnippet && (
                <div className="bg-zinc-950 border border-border p-4 rounded-xl">
                  <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Code className="w-3.5 h-3.5 text-primary" />
                      Language: {q.language || "Code"}
                    </span>
                  </div>
                  <pre className="text-xs font-mono text-amber-300 overflow-x-auto">
                    <code>{q.codeSnippet}</code>
                  </pre>
                </div>
              )}

              {/* Options */}
              {q.options && q.options.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                    Options ({q.options.length})
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt: any, optIdx: number) => {
                      const isCorrect = Boolean(opt.isCorrect);
                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                            isCorrect
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                              : "bg-background border-border text-foreground"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 ${
                              isCorrect
                                ? "bg-emerald-500 text-zinc-950"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{opt.text}</div>
                            {opt.explanation && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {opt.explanation}
                              </p>
                            )}
                          </div>
                          {isCorrect && (
                            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                              CORRECT
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Solution / Explanation */}
              {q.explanation && (
                <div className="bg-muted/40 border border-border p-3.5 rounded-xl text-xs text-muted-foreground">
                  <span className="font-bold text-foreground block mb-1">Author Explanation:</span>
                  {q.explanation}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-border rounded-xl w-full max-w-md p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-foreground text-base">Reject Assessment Question</h3>
            <p className="text-xs text-muted-foreground">
              Please specify the reason for rejection to help refine questions.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Ambiguous option wording, incorrect key, or insufficient distractor quality."
              className="w-full p-3 bg-zinc-900 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-amber-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalId(null)}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-1.5 text-xs font-semibold bg-rose-500 text-white rounded-lg hover:bg-rose-600"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
