export type CriticalFailure = "server" | "network" | "timeout" | "unexpected";

const FALLBACK_PATH = "/error-fallback";

export function classifyCriticalApiFailure({
  status,
  code,
  hasResponse,
  method,
}: {
  status?: number;
  code?: string;
  hasResponse: boolean;
  method?: string;
}): CriticalFailure | null {
  const requestMethod = method?.toUpperCase() || "GET";
  if (requestMethod !== "GET" && requestMethod !== "HEAD") return null;
  if (status !== undefined && status >= 500) return "server";
  if (status === 408 || code === "ECONNABORTED" || code === "ETIMEDOUT") return "timeout";
  if (!hasResponse && (code === "ERR_NETWORK" || code === "ECONNREFUSED")) return "network";
  return null;
}

export function redirectToCriticalErrorFallback(failure: CriticalFailure): void {
  if (typeof window === "undefined" || window.location.pathname === FALLBACK_PATH) return;

  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const params = new URLSearchParams({ failure, returnTo });
  window.location.replace(`${FALLBACK_PATH}?${params.toString()}`);
}
