'use client';

let isPatched = false;

export function initClientTracePropagation(): void {
  if (typeof window === 'undefined' || isPatched) return;
  isPatched = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      const headers = new Headers(init?.headers || {});
      if (!headers.has('x-request-id')) {
        const traceId =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `web-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        headers.set('x-request-id', traceId);
      }
      return await originalFetch(input, { ...init, headers });
    } catch {
      return originalFetch(input, init);
    }
  };
}
