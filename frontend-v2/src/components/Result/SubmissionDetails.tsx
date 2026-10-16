"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  MemoryStick,
  Gauge,
  Code2,
  Layers,
} from "lucide-react";
import { submissionAPI, runAPI, type ComplexityAnalysis } from "@/config/api";
import { normalizeVerdict, type PeerMetric } from "@/lib/submission-feedback";
import RuntimeDistributionChart from "@/components/Result/RuntimeDistributionChart";
import { Spinner } from "@/components/ui/spinner";

interface SubmissionRow {
  id: string;
  status: string;
  language: string;
  code?: string;
  runtime?: number;
  memory?: number;
  testCasesPassed?: number;
  totalTestCases?: number;
  createdAt?: string;
}

interface SubmissionDetailsProps {
  submission: SubmissionRow;
}

interface SubmissionVerdict {
  status: string;
  runtime?: number;
  memory?: number;
  testCasesPassed?: number;
  totalTestCases?: number;
  comparison?: {
    runtime?: PeerMetric | null;
    memory?: PeerMetric | null;
  } | null;
  distribution?: {
    buckets: Array<{ min: number; max: number | null; count: number }>;
    sampleSize: number;
  } | null;
}

function percentileText(metric: PeerMetric | null | undefined, kind: "faster" | "lighter") {
  if (!metric) return null;
  return `${kind} than ${metric.percentile}% of ${metric.sampleSize} ${metric.sampleSize === 1 ? "student" : "students"}`;
}

export default function SubmissionDetails({ submission }: SubmissionDetailsProps) {
  const [verdict, setVerdict] = useState<SubmissionVerdict | null>(null);
  const [complexity, setComplexity] = useState<ComplexityAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setVerdict(null);
    setComplexity(null);
    Promise.allSettled([
      submissionAPI.getResult(submission.id).then((res) => res.data),
      submission.code
        ? runAPI.analyzeComplexity({ code: submission.code, language: submission.language }).then((res) => res.data)
        : Promise.resolve(null),
    ]).then(([verdictResult, complexityResult]) => {
      if (cancelled) return;
      setVerdict(verdictResult.status === "fulfilled" ? verdictResult.value ?? null : null);
      setComplexity(complexityResult.status === "fulfilled" ? complexityResult.value ?? null : null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [submission.id, submission.code, submission.language]);

  const status = verdict?.status ?? submission.status;
  const accepted = normalizeVerdict(status) === "accepted";
  const runtime = verdict?.runtime ?? submission.runtime;
  const memory = verdict?.memory ?? submission.memory;
  const passedCount = verdict?.testCasesPassed ?? submission.testCasesPassed ?? 0;
  const totalCount = verdict?.totalTestCases ?? submission.totalTestCases ?? 0;
  const runtimeMetric = verdict?.comparison?.runtime;
  const memoryMetric = verdict?.comparison?.memory;

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-3">
      {/* Verdict banner */}
      <div className={`flex items-center gap-2 font-semibold text-sm ${accepted ? "text-emerald-400" : "text-rose-400"}`}>
        {accepted ? <CheckCircle2 className="w-4 h-4" /> : status === "system_error" || status === "compile_error" ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : <XCircle className="w-4 h-4" />}
        {accepted ? "Accepted" : normalizeVerdict(status).replace(/_/g, " ")}
        <span className="text-foreground/70 ml-auto text-[11px] font-medium bg-secondary px-2.5 py-0.5 rounded-full border border-border">
          {passedCount}/{totalCount} passed
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
          <Spinner className="w-4 h-4 animate-spin" /> Loading submission details...
        </div>
      ) : (
        <>
          {/* Submitted code */}
          {submission.code && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <Code2 className="w-3.5 h-3.5" /> Submitted Code · {submission.language}
              </div>
              <pre className="max-h-40 overflow-auto rounded-lg bg-background/60 border border-border p-3 font-mono text-[11px] text-foreground/85 whitespace-pre-wrap break-all">
                {submission.code}
              </pre>
            </div>
          )}

          {/* Runtime & memory comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="flex items-center gap-1.5 text-foreground/80">
                  <Clock className="w-3.5 h-3.5 text-primary" /> Runtime
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {runtime !== undefined && runtime !== null ? `${runtime} ms` : "—"}
                </span>
              </div>
              {runtimeMetric && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, runtimeMetric.percentile))}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{percentileText(runtimeMetric, "faster")}</span>
                </div>
              )}
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="flex items-center gap-1.5 text-foreground/80">
                  <MemoryStick className="w-3.5 h-3.5 text-primary" /> Memory
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {memory !== undefined && memory !== null ? `${memory} MB` : "—"}
                </span>
              </div>
              {memoryMetric && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, memoryMetric.percentile))}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{percentileText(memoryMetric, "lighter")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Distribution graph */}
          {runtime !== undefined && runtime !== null && (
            <RuntimeDistributionChart
              runtime={runtime}
              distribution={verdict?.distribution ?? null}
              comparisonRuntime={runtimeMetric}
              accepted={accepted}
            />
          )}

          {/* Complexity analysis */}
          <div className="rounded-xl border border-border bg-muted/30 p-3.5">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-2">
              <Gauge className="w-4 h-4 text-primary" /> Complexity Analysis
            </div>
            {complexity ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center rounded-lg bg-background/60 border border-border p-2.5">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Time</div>
                    <div className="font-mono font-bold text-foreground text-lg mt-0.5">{complexity.timeComplexity}</div>
                  </div>
                  <div className="text-center rounded-lg bg-background/60 border border-border p-2.5">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Space</div>
                    <div className="font-mono font-bold text-foreground text-lg mt-0.5">{complexity.spaceComplexity}</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{complexity.explanation}</p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Complexity analysis is unavailable right now.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
