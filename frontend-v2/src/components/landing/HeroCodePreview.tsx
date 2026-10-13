"use client";

import React from "react";
import ModernLoader from "@/components/ui/modern-loader";

export function HeroCodePreview() {
  return (
    <div className="w-full max-w-2xl mx-auto flex items-center justify-center min-h-[400px]">
      <ModernLoader
        words={[
          "Spinning up Docker sandbox...",
          "Running test case suite...",
          "Calculating time & memory limits...",
          "Finalizing evaluation...",
        ]}
        className="w-full max-w-none p-0"
      />
    </div>
  );
}

export default HeroCodePreview;
