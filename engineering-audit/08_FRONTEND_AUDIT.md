# Frontend Engineering, UX Performance & Client Stability Audit (Commit `b846d107`)

**Audit Date:** October 18, 2026  
**Audited Target:** CodeSkill Frontend Application (`frontend-v2`)  
**Commit Inspected:** `b846d107`  
**Auditor:** Staff Frontend & Accessibility Engineer  
**Output Location:** `engineering-audit/`  

---

## 1. Frontend Architecture & Stack Overview

The frontend is a **Next.js 15+ (App Router)** client application configured with:
- **UI Runtime:** React 19 (Server and Client Components).
- **Code Editor:** Microsoft Monaco Editor (`@monaco-editor/react`) for multi-language code editing.
- **State Architecture:** Zustand global stores paired with React Context providers for authentication and UI themes.
- **Real-Time Client:** Socket.IO client for live contest announcements and submission verdict pushes.
- **Styling & Motion:** TailwindCSS with Motion (`motion/react`).

---

## 2. Re-Assessment of Recent Frontend Remediations (PR #95)

### 2.1 Ref Access During Render in `otp-input.tsx` (Remediated)
- **Previous Finding:** In `otp-input.tsx`, `inputRefs.current[index]` was mutated directly during render.
- **Status: REMEDIATED**
  - Ref assignments were moved into `useEffect` hooks and standard callback refs (`refs.current[index] = el`).
  - ESLint React 19 compiler warnings on `otp-input.tsx` render-phase mutations were resolved.

### 2.2 DevTools False-Positive Timing Heuristics (Remediated)
- **File:** `frontend-v2/src/hooks/anti-cheat/useDevToolsDetect.ts`
- **Previous Finding:** Timing heuristics using `console.log` and `performance.now()` triggered false-positive cheating infractions on slower machines.
- **Status: REMEDIATED**
  - The fragile console timing checks were removed.
  - Detection now relies solely on window outer/inner dimension differences (`window.outerWidth - window.innerWidth > 160`).

---

## 3. Remaining Frontend Defects & Quality Observations

### 3.1 React 19 Ref Access During Render in `contribution-skyline.tsx` (ISSUE-FE-001)
- **File:** `frontend-v2/src/components/ui/contribution-skyline.tsx` (Line 509)
- **Code Evidence:**
  ```typescript
  // Line 508-509:
  const cfg = React.useRef({ model, duration, heightScale, orbit, palette, legendLevel, ... });
  cfg.current = { model, duration, heightScale, orbit, palette, legendLevel, onCellClick, ... };
  ```
- **Finding:** Directly updating `cfg.current` during the component render phase violates React 19 concurrent render purity constraints.
- **Impact:** In concurrent mode, React may call render multiple times before committing. Mutating refs during render leads to desynchronized animations or visual tearing in the 3D contribution skyline.
- **Remediation:** Move `cfg.current = ...` into a `React.useEffect` or `useLayoutEffect` hook.

---

### 3.2 Synchronous `setState` in Effects (Cascading Re-Renders) (ISSUE-FE-002)
- **Files:**
  - `src/components/ui/otp-input.tsx` (Line 115)
  - `src/components/ui/modern-loader.tsx` (Line 75)
  - `src/context/AuthContext.tsx` (Line 56)
- **Code Evidence (`otp-input.tsx` L115):**
  ```typescript
  useEffect(() => {
    setChars((prev) =>
      prev.length === length ? prev : Array.from({ length }, (_, i) => prev[i] ?? ""),
    );
  }, [length]);
  ```
- **Finding:** Calling `setState` synchronously inside `useEffect` forces React to schedule an immediate second render pass before the browser can paint.
- **Impact:** Sub-optimal frame rates, microsecond layout shifts, and unnecessary CPU cycles on mobile devices.
- **Remediation:** Derive state during render:
  ```typescript
  const displayedChars = chars.length === length ? chars : Array.from({ length }, (_, i) => chars[i] ?? "");
  ```

---

## 4. Test Suite Execution & TypeScript Verification

### Empirical Test Execution Results
- **Command:** `npm test --prefix frontend-v2 -- --runInBand`
- **Result:** **PASSED (100% Pass Rate)**
- **Test Suites:** 47 passed, 47 total
- **Tests:** 344 passed, 344 total
- **Snapshots:** 0 total
- **Execution Duration:** ~11.3 seconds

### TypeScript Compilation Status
- **Command:** `(cd frontend-v2 && npx --no-install tsc --noEmit --incremental false)`
- **Result:** **PASSED (0 TypeScript Errors)**

---

## 5. Accessibility (a11y) & UX Findings

1. **Monaco Code Editor Keyboard Trap:**
   - Navigating via the `Tab` key traps focus inside Monaco Editor for code indentation. Screen reader and keyboard-only users cannot leave the editor without pressing `Ctrl+M` / `Cmd+M`.
   - Remediation: Surface an accessible ARIA announcement: "Press Ctrl+M or Escape to toggle focus trap and navigate to the next element."
2. **Color Contrast in Dark Theme:**
   - Proctoring alert texts and code output metadata utilize `text-zinc-500` against dark backgrounds, yielding a contrast ratio of 3.2:1 (below WCAG 2.1 AA 4.5:1 requirement).
   - Remediation: Elevate secondary text classes to `text-zinc-400` (5.1:1 ratio).
