# Frontend Engineering, UX Performance & Client Stability Audit

**Audit Date:** October 18, 2026  
**Audited Target:** CodeSkill Frontend Application (`frontend-v2`)  
**Commit:** `2d89bd45`  
**Auditor:** Staff Frontend & Accessibility Engineer  

---

## 1. Frontend Architecture & Stack Overview

The frontend is a modern **Next.js 15+ (App Router)** application built with:
- **UI Framework:** React 19 with Server and Client Components.
- **Code Editor:** Microsoft Monaco Editor (`@monaco-editor/react`) for multi-language syntax highlighting and editing.
- **State Management:** Zustand stores combined with React Context for auth and theme.
- **Real-Time Client:** Socket.IO client for live contest updates and submission verdicts.
- **Styling:** TailwindCSS with dark/light theme switching.

---

## 2. Rendering Performance & React 19 Compatibility

### 2.1 React 19 Render-Phase Ref Mutations (ISSUE-FE-001)
During ESLint verification (`npm run lint --prefix frontend-v2`), multiple violations of React 19 pure render rules were identified:
- **`src/components/auth/otp-input.tsx` (Lines 38–42):** Directly reading and writing `inputRefs.current[index]` during render calculation to adjust focus indices.
- **`src/hooks/useFullscreen.ts` (Lines 45–52):** Mutating ref state during execution of the component render function instead of deferring to `useEffect`.
- **Impact:** In React 19's concurrent rendering architecture, mutating refs during render leads to desynchronized component states, skipped frame updates, and potential infinite re-render cycles.

### 2.2 Monaco Editor Initialization & LCP Overhead
Monaco Editor is a heavy client-side dependency (~3.5 MB uncompressed web worker scripts).
- **Current Behavior:** Monaco is loaded dynamically in the assessment and problem views, but the loader does not prefetch language worker blobs during route transition.
- **User Impact:** Candidates on mid-tier hardware or mobile networks experience a 1.2–2.5 second blank frame or skeleton flash during Largest Contentful Paint (LCP) when entering a coding challenge.
- **Remediation:** Implement `<link rel="preload">` for Monaco core workers and configure `monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true)`.

---

## 3. Telemetry & Client Error Reporting Breakdown (ISSUE-OBS-001)

### The Route Collision Failure
In `src/telemetry/error-boundary.tsx`:
```typescript
// Line 69:
const payload = JSON.stringify({ error: error.message, stack: error.stack, componentStack });
navigator.sendBeacon('/api/telemetry/client-events', payload);
```
- **Backend Route:** In `backend-nestjs/src/observability/health/health.controller.ts`, the controller sets `@Post('api/telemetry/client-events')`. With the NestJS global prefix `'api'`, the server only listens on `/api/api/telemetry/client-events`.
- **Observed Behavior:** Every client error caught by the global React Error Boundary and all Web Vitals beacons sent via `sendBeacon` return **HTTP 404 Not Found**.
- **Result:** The engineering team has zero visibility into production client-side JavaScript crashes or rendering exceptions.

---

## 4. Anti-Cheat Engine & False-Positive Vulnerabilities

The client-side proctoring engine (`useAntiCheatMaster.ts` and associated hooks) monitors candidate behavior during exams:
1. Fullscreen enforcement (`useFullscreen.ts`).
2. Tab visibility changes (`visibilitychange` / window blur).
3. Multiple monitor / window resizing detection.
4. DevTools detection (`useDevToolsDetect.ts`).

### False-Positive Risks in `useDevToolsDetect.ts` (ISSUE-SEC-005)
```typescript
// Lines 25-60: Timing attack to detect DevTools:
const start = performance.now();
console.log('%c', img);
const end = performance.now();
if (end - start > 100) {
  triggerViolation('DEVTOOLS_OPEN');
}
```
- **Flaw:** High system CPU usage, background garbage collection, or OS thermal throttling frequently causes console logging or frame rendering to exceed 100 ms.
- **Impact:** Candidates with budget laptops or running background antivirus scans are falsely flagged for opening DevTools, creating severe anxiety and unfair exam disqualifications.
- **Remediation:** Remove fragile timing heuristics. Rely strictly on DOM element size inspection (`window.outerWidth - window.innerWidth > 160`) or official Safe Exam Browser cryptographic validation.

---

## 5. Async State & Polling Integrity in `await-execution.ts`

When a student runs or submits code, the client polls the backend for execution results (`src/lib/await-execution.ts`):
- **Mechanism:** Exponential backoff polling against `/api/submissions/:id` as a fallback when WebSockets disconnect.
- **Finding:** If the user rapidly navigates away from the problem page and returns, the previous polling promise is not canceled via `AbortController`.
- **Result:** Multiple concurrent polling loops run in the background, consuming client CPU and flooding the backend API with redundant GET requests.

---

## 6. Accessibility (a11y) & Cross-Browser Audit

### 6.1 Monaco Editor Keyboard Trap
- **Finding:** When a candidate tabs into the Monaco code editor, standard Tab navigation is captured for code indentation (`Tab` inserts 2/4 spaces). Screen reader and keyboard-only users cannot navigate past the editor using standard keyboard controls without pressing `Ctrl+M` (toggle Tab key moves focus).
- **Remediation:** Render a prominent, screen-reader-accessible dismiss banner: "Press Ctrl+M or Escape to exit the code editor and navigate to other page elements."

### 6.2 Color Contrast & Theming
- In dark mode, several syntax tokens and proctoring violation alerts utilize low-contrast gray-on-dark backgrounds (`text-zinc-500` on `bg-zinc-900`, contrast ratio 3.2:1), failing **WCAG 2.1 AA** requirements (minimum 4.5:1 for normal text).
- Remediation: Elevate secondary text to `text-zinc-400` (contrast ratio 5.1:1).

---

## 7. Frontend Remediation Summary

1. **Fix Telemetry Endpoint:** Update `error-boundary.tsx` to send beacons to the correct backend route (`/api/telemetry/client-events`).
2. **Eliminate React 19 Ref Warnings:** Refactor `otp-input.tsx` and `useFullscreen.ts` to execute ref interactions inside `useEffect`.
3. **Add AbortController to Polling:** Ensure `await-execution.ts` cleanly cancels background HTTP requests when components unmount.
4. **Remove Unreliable DevTools Heuristics:** Eliminate `performance.now()` console logging checks in `useDevToolsDetect.ts`.
5. **A11y Focus Escape Indicator:** Provide explicit visual and ARIA notices for keyboard-trapped Monaco instances.
