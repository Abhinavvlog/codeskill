# Test Coverage, Quality Assurance & Verification Gaps (Commit `b846d107`)

**Audit Date:** October 18, 2026  
**Audited Target:** CodeSkill Test Suites (`backend-nestjs` & `frontend-v2`)  
**Commit Inspected:** `b846d107`  
**Auditor:** Quality Assurance & Test Automation Architect  
**Output Location:** `engineering-audit/`  

---

## 1. Empirical Test Suite Execution Results

### 1.1 Backend Unit Test Suite Status (DEGRADED)
- **Command:** `npm test --prefix backend-nestjs -- --runInBand`
- **Result:** **FAILED (Exit Code 1)**
- **Test Suites:** **9 Failed, 63 Passed, 72 Total**
- **Tests:** 535 passed, 9 skipped, 544 total
- **Root Cause of Failure:**
  The backend test suite cannot resolve module `'@aws-sdk/s3-request-presigner'`, which was imported into `src/s3/s3.service.ts` in PR #95:
  ```
  Cannot find module '@aws-sdk/s3-request-presigner' from 's3/s3.service.ts'
  ```
- **Failing Suites (9):**
  1. `assessments/assessment-concurrency-integrity.spec.ts`
  2. `s3/s3.service.spec.ts`
  3. `assessments/assessment-semester-targeting.spec.ts`
  4. `assessments/assessment-code-evaluation.spec.ts`
  5. `assessments/assessment-integrity.security.spec.ts`
  6. `assessments/assessments-update.spec.ts`
  7. `assessments/assessment-cards.spec.ts`
  8. `assessments/assessment-slug-resolution.spec.ts`
  9. `assessments/assessment-partial-proctoring.spec.ts`

---

### 1.2 Frontend Unit Test Suite Status (OPTIMAL)
- **Command:** `npm test --prefix frontend-v2 -- --runInBand`
- **Result:** **PASSED (100% Pass Rate)**
- **Test Suites:** 47 passed, 47 total
- **Tests:** 344 passed, 344 total
- **Snapshots:** 0 total
- **Execution Time:** ~11.3 seconds

---

### 1.3 TypeScript Compilation Status
- **Backend Type-Check:** `(cd backend-nestjs && npx --no-install tsc -p tsconfig.build.json --noEmit --incremental false)`  
  **Result:** **FAILED (Exit Code 2, 1 Error)**  
  `src/s3/s3.service.ts:13:30 - error TS2307: Cannot find module '@aws-sdk/s3-request-presigner' or its corresponding type declarations.`
- **Frontend Type-Check:** `(cd frontend-v2 && npx --no-install tsc --noEmit --incremental false)`  
  **Result:** **PASSED (0 Errors)**

---

## 2. Analysis of Tests Added in PR #95

PR #95 introduced 4 new test suites to verify previous audit findings:
1. `assessment-concurrency-integrity.spec.ts`: Tests CAS submission lock and proctor capture state reload.
2. `metrics.controller.spec.ts`: Tests RFC 1918 CIDR IP regex validation.
3. `s3.service.spec.ts`: Tests presigned URL generation.
4. `credential-crypto.util.spec.ts`: Tests AES-256-GCM encryption/decryption of temporary credentials.

### Critical QA Finding: The Mocking Delusion in Concurrency Tests
In `assessment-concurrency-integrity.spec.ts` (lines 161–178):
```typescript
attemptRepo.findOne
  .mockResolvedValueOnce(staleAttempt)
  .mockResolvedValueOnce(freshAttemptWithConcurrentResponses);

await service.recordProctorCapture('asmt-1', { type: 'webcam', image: '...' }, { id: 'stud-1' });

expect(attemptRepo.save).toHaveBeenCalled();
const saved = attemptRepo.save.mock.calls[0][0];
expect(saved.responses).toEqual([{ questionId: 'q-concurrent', code: '...' }]);
```
- **Why this test passes on mocks but fails in reality:**
  - The test sequentially controls what `findOne` returns to `recordProctorCapture`.
  - It does **not** simulate `saveProgress` running simultaneously on another thread or process.
  - In a real application, `saveProgress` executes `findOne` concurrently and holds `staleAttempt`. When `saveProgress` calls `save(attempt)`, it writes back its stale snapshot, destroying the proctoring capture array.
  - Relying on sequential unit mocks gives a false sense of concurrency safety while leaving the underlying race condition wide open.

---

## 3. Prioritized Missing Regression Tests

1. **Multi-Threaded Concurrency Test (Testcontainers):**
   - Author an integration test using Testcontainers (real PostgreSQL instance).
   - Fire 20 parallel `saveProgress` requests and 20 parallel `recordProctorCapture` requests on a single attempt ID, asserting that 100% of responses and captures are preserved.
2. **Safe Exam Browser Real Header Verification Test:**
   - Author a test generating authentic SHA-256 HMAC headers (`X-SafeExamBrowser-RequestHash`) matching official SEB client behavior.
3. **CI Dependency Integrity Verification:**
   - Add a preflight script ensuring all imported dependencies exist in `node_modules` before running `tsc` or `jest`.
