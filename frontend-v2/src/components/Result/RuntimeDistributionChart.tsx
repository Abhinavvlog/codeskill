"use client";

import { TrendingUp } from "lucide-react";
import type { PeerMetric } from "@/lib/submission-feedback";

/** Mirrors the backend width_bucket boundaries; shown empty until peers submit. */
const DEFAULT_RUNTIME_BUCKETS = [0, 10, 20, 40, 80, 160, 320, 640, 1280].map((min, index, boundaries) => ({
  min,
  max: index < boundaries.length - 1 ? boundaries[index + 1] : null,
  count: 0,
}));

interface RuntimeDistributionChartProps {
  runtime: number;
  distribution?: {
    buckets: Array<{ min: number; max: number | null; count: number }>;
    sampleSize: number;
  } | null;
  comparisonRuntime?: PeerMetric | null;
  /** Whether the current submission itself is accepted and joins the chart. */
  accepted: boolean;
}

export default function RuntimeDistributionChart({
  runtime,
  distribution,
  comparisonRuntime,
  accepted,
}: RuntimeDistributionChartProps) {
  const sampleSize = distribution?.sampleSize ?? 0;
  const buckets = distribution?.buckets?.length
    ? distribution.buckets
    : DEFAULT_RUNTIME_BUCKETS;

  const currentIndex = buckets.findIndex(
    (bucket) => runtime >= bucket.min && (bucket.max === null || runtime < bucket.max),
  );
  const index = currentIndex === -1 ? buckets.length - 1 : currentIndex;
  const bucket = buckets[index];
  const within = bucket.max === null ? 1 : Math.min(1, (runtime - bucket.min) / (bucket.max - bucket.min));
  const position = Math.min(100, ((index + Math.max(0, within)) / buckets.length) * 100);
  // The user's own accepted submission joins the distribution.
  const counts = buckets.map((b, i) => b.count + (i === index && accepted ? 1 : 0));
  const maxCount = Math.max(1, ...counts);

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3.5">
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <TrendingUp className="w-4 h-4 text-primary" /> Runtime Distribution
        </span>
        <span className="text-[11px] text-muted-foreground">
          {sampleSize > 0
            ? `${sampleSize} accepted ${sampleSize === 1 ? "solution" : "solutions"} from other candidates`
            : "no peer solutions yet"}
        </span>
      </div>
      <div>
        <div className="relative flex items-end justify-between px-1 h-16 mb-1">
          {buckets.map((b, i) => {
            const count = counts[i];
            const height = count === 0 ? 5 : Math.max(16, (count / maxCount) * 100);
            return (
              <div key={b.min} className="relative flex-1 h-full flex items-end justify-center">
                <div
                  className={`w-1.5 rounded-full transition-colors ${
                    i === index ? "bg-primary" : count === 0 ? "bg-muted-foreground/25" : "bg-primary/40 hover:bg-primary/60"
                  }`}
                  style={{ height: `${height}%` }}
                  title={`${b.min}${b.max === null ? "+" : `–${b.max}`} ms: ${count} solution${count === 1 ? "" : "s"}`}
                />
              </div>
            );
          })}
          <div
            aria-label="Your runtime position"
            className="absolute -top-1 -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${position}%` }}
          >
            <span className="text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full whitespace-nowrap">
              You · {runtime} ms
            </span>
            <span className="w-px h-[calc(100%+0.25rem)] bg-primary" />
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>0–10 ms</span>
          <span>1280+ ms</span>
        </div>
        <p className="text-xs text-foreground/70 mt-2">
          Your {runtime} ms lands in the {bucket.min}
          {bucket.max === null ? "+" : `–${bucket.max}`} ms band.
          {comparisonRuntime
            ? ` Faster than ${comparisonRuntime.percentile}% of comparable accepted solutions.`
            : " You are among the first solvers — the chart fills in as other candidates submit."}
        </p>
      </div>
    </div>
  );
}
