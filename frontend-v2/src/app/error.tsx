"use client";

import React, { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root Application Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-card border border-border p-8 rounded-2xl shadow-xl text-center space-y-6">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          {error?.message || "An unexpected error occurred while loading this page."}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-colors"
          >
            Retry
          </button>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.href = "/";
              }
            }}
            className="flex-1 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium text-sm transition-colors border border-border"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
