"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/config/api";
import { parseContests, type PublicContest } from "@/lib/contests";

export function usePublicContests() {
  const [contests, setContests] = useState<PublicContest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const refresh = useCallback(() => {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    return api.get("/contests", { signal: controller.signal }).then(response => {
      if (controller.signal.aborted) return;
      setContests(parseContests(response.data)); setError(null);
    }).catch(() => {
      if (!controller.signal.aborted) setError("Contests could not be loaded. Please try again.");
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
  }, []);
  useEffect(() => {
    void refresh();
    const refreshVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    const timer = setInterval(refreshVisible, 30000);
    window.addEventListener("focus", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      clearInterval(timer); window.removeEventListener("focus", refreshVisible);
      document.removeEventListener("visibilitychange", refreshVisible); request.current?.abort();
    };
  }, [refresh]);
  return { contests, loading, error, refresh };
}
