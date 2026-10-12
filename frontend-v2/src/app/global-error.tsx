"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-lg w-full bg-card border border-border p-8 rounded-2xl shadow-2xl text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            An unexpected application error occurred. Click below to reload the page or navigate to login.
          </p>
          {error?.message && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-left text-xs font-mono text-red-500 overflow-x-auto whitespace-pre-wrap max-h-40">
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => reset()}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-lg shadow-indigo-600/20"
            >
              Try again
            </button>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/admin/login";
                }
              }}
              className="flex-1 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium transition-colors border border-border"
            >
              Admin Login
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
