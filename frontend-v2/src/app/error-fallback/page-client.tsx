"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import RootError from "@/app/error";
import type { CriticalFailure } from "@/lib/error-fallback-navigation";

export default function ErrorFallbackRoute({ failure, returnTo }: { failure: CriticalFailure; returnTo: string }) {
  const router = useRouter();
  const error = useMemo(() => {
    if (failure === "server") return Object.assign(new Error("Server failure"), { status: 500 });
    if (failure === "network") return Object.assign(new Error("Network failure"), { code: "ERR_NETWORK" });
    if (failure === "timeout") return Object.assign(new Error("Request timed out"), { code: "ECONNABORTED" });
    return new Error("Unexpected application failure");
  }, [failure]);

  return <RootError error={error} reset={() => router.replace(returnTo)} reportError={false} />;
}
