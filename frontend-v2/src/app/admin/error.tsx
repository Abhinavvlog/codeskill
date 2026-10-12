"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, LayoutDashboard, LogIn } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin Workspace Error Caught:", error);
  }, [error]);

  return (
    <div className="p-8 max-w-xl mx-auto my-12 bg-card border border-border rounded-2xl shadow-xl text-center space-y-6 font-sans">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
        <AlertCircle className="w-7 h-7" />
      </div>
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Admin Workspace Encountered An Issue</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {error?.message || "An unexpected error occurred while loading this administrative view."}
        </p>
      </div>
      {error?.message && (
        <div className="p-3 bg-muted/60 border border-border rounded-xl text-left text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-36">
          {error.message}
          {error.digest && `\nDigest: ${error.digest}`}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reload Module
        </button>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-foreground font-semibold text-xs hover:bg-muted/80 transition-colors border border-border"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          Admin Dashboard
        </Link>
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.href = "/admin/login";
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-foreground font-semibold text-xs hover:bg-muted/80 transition-colors border border-border"
        >
          <LogIn className="w-3.5 h-3.5" />
          Re-authenticate
        </button>
      </div>
    </div>
  );
}
