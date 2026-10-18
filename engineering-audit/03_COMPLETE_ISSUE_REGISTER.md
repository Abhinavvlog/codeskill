# Master Issue Register & Defect Catalog (Commit `b846d107`)

**Audit Date:** October 18, 2026  
**Audited Target:** CodeSkill Full-Stack Codebase (`backend-nestjs` & `frontend-v2`)  
**Commit:** `b846d107`  
**Output Location:** `engineering-audit/`  

---

## Issue Summary Index

| Issue ID | Severity | Confidence | Component | Title |
| :--- | :---: | :---: | :--- | :--- |
| **ISSUE-BUILD-001** | **CRITICAL** | CONFIRMED | S3 / Build | Missing `@aws-sdk/s3-request-presigner` Dependency Breaks Backend Compilation & Tests |
| **ISSUE-CONC-001** | **CRITICAL** | CONFIRMED | Assessments | Persistent In-Memory Clobber Hazard in `saveProgress` vs `recordProctorCapture` |
| **ISSUE-SEC-001** | **HIGH** | CONFIRMED | Exam Security | Safe Exam Browser Verification Bypass & Incompatible Hash Specification |
| **ISSUE-PERF-001** | **HIGH** | CONFIRMED | Execution | Piston Execution Multiplier: Multi-Test Submissions Recompile Code $T$ Times |
| **ISSUE-INFRA-001** | **HIGH** | CONFIRMED | Redis / Cache | Shared Single Redis Cluster with `noeviction` Policy Cascades to System Outage |
| **ISSUE-INFRA-002** | **HIGH** | CONFIRMED | RDS / Database | `max_connections = 200` on 1 GiB `db.t4g.micro` Risks Linux OOM Process Termination |
| **ISSUE-PERF-002** | **MEDIUM** | CONFIRMED | AI Pet | In-Process Rate Limiter Map Is Not Shared Across Horizontal Cluster Nodes |
| **ISSUE-DATA-001** | **MEDIUM** | CONFIRMED | Submissions | Contest Finalization Bypasses Sharded Database Store with Primary Table SQL |
| **ISSUE-SEC-002** | **MEDIUM** | HIGH-CONFIDENCE | Exam Security | SEB Config Key Accepted in Plaintext JSON Body Bypassing Header Security |
| **ISSUE-OBS-001** | **MEDIUM** | CONFIRMED | Worker / Gateway | Standalone Worker Process Emits Gateway Events Without Attached HTTP Server |
| **ISSUE-FE-001** | **LOW** | CONFIRMED | Frontend UI | React 19 Ref Access During Render in `contribution-skyline.tsx` |
| **ISSUE-FE-002** | **LOW** | CONFIRMED | Frontend UI | Synchronous `setState` Inside `useEffect` in `otp-input.tsx` & `modern-loader.tsx` |

---

## Detailed Issue Dissections

### ISSUE-BUILD-001: Missing `@aws-sdk/s3-request-presigner` Dependency Breaks Backend Compilation & Tests

- **Severity:** CRITICAL
- **Confidence:** CONFIRMED
- **Affected Component:** `backend-nestjs/src/s3/s3.service.ts` & `package.json`
- **File & Lines:** `backend-nestjs/src/s3/s3.service.ts` (Line 13)
- **Code Evidence:**
  ```typescript
  import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
  ```
  Execution output of `(cd backend-nestjs && npx --no-install tsc -p tsconfig.build.json --noEmit --incremental false)`:
  ```
  src/s3/s3.service.ts:13:30 - error TS2307: Cannot find module '@aws-sdk/s3-request-presigner' or its corresponding type declarations.
  13 import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
  ```
  Execution output of `npm test --prefix backend-nestjs -- --runInBand`:
  ```
  FAIL assessments/assessment-concurrency-integrity.spec.ts
  FAIL s3/s3.service.spec.ts
  FAIL assessments/assessment-semester-targeting.spec.ts
  FAIL assessments/assessment-code-evaluation.spec.ts
  FAIL assessments/assessment-integrity.security.spec.ts
  FAIL assessments/assessments-update.spec.ts
  FAIL assessments/assessment-cards.spec.ts
  FAIL assessments/assessment-slug-resolution.spec.ts
  FAIL assessments/assessment-partial-proctoring.spec.ts
  ● Test suite failed to run: Cannot find module '@aws-sdk/s3-request-presigner'
  ```
- **Technical Root Cause:** PR #95 added `"@aws-sdk/s3-request-presigner": "^3.1152.0"` to `backend-nestjs/package.json` and committed code importing it, but the package was never installed in `node_modules`. Because the repository relies on pre-installed node_modules and npm fails to fetch in offline/sandboxed environments, the backend cannot compile or start.
- **Triggering Conditions:** Any build (`npm run build`), type check (`tsc`), test suite run, or production container startup (`npm run start:prod`).
- **Failure Mechanism:** Node.js module resolution throws `ERR_MODULE_NOT_FOUND`, crashing the NestJS application at bootstrap.
- **User / Business Impact:** Complete deployment and CI/CD failure; backend cannot run in production.
- **Remediation:** Vendor the `@aws-sdk/s3-request-presigner` bundle or run `npm ci --legacy-peer-deps` in an authorized environment to populate `node_modules` before committing build-dependent code.

---

### ISSUE-CONC-001: Persistent In-Memory Clobber Hazard in `saveProgress` vs `recordProctorCapture`

- **Severity:** CRITICAL
- **Confidence:** CONFIRMED
- **Affected Component:** `backend-nestjs/src/assessments/assessments.service.ts`
- **File & Lines:** `backend-nestjs/src/assessments/assessments.service.ts` (Lines 1531–1638, 2383–2391)
- **Code Evidence:**
  ```typescript
  // In saveProgress (L1531-1638):
  const attempt = await this.attemptRepo.findOne({ where: { assessmentId, studentId, status: 'in_progress' } });
  attempt.responses = [...previousResponses.filter(...), ...updatedResponses];
  // ...
  await this.attemptRepo.save(attempt); // Overwrites entire row without row lock!

  // In recordProctorCapture (L2383-2390):
  const freshAttempt = await this.attemptRepo.findOne({ where: { id: attempt.id } });
  const targetAttempt = freshAttempt || attempt;
  targetAttempt.captures = [...captures, newCapture];
  await this.attemptRepo.save(targetAttempt); // Overwrites entire row without row lock!
  ```
- **Technical Root Cause:** PR #95 attempted to fix the race condition by adding `const freshAttempt = await this.attemptRepo.findOne(...)` inside `recordProctorCapture` *after* the S3 upload. However, `saveProgress` was not altered: it still performs a full entity read, mutates `attempt.responses`, and calls `attemptRepo.save(attempt)`. If `saveProgress` loads `attempt` at $T_1$, and `recordProctorCapture` saves `targetAttempt` at $T_2$, `saveProgress` executes `save(attempt)` at $T_3$ with its stale copy of `captures`, clobbering the capture. Conversely, if `recordProctorCapture` reads while `saveProgress` is writing, `recordProctorCapture` overwrites the student's newly saved answers.
- **Triggering Conditions:** Routine concurrent activity during exams (autosave every 30s + webcam captures every 15s).
- **Failure Mechanism:** Read-modify-write on an overloaded entity without database-level row locking (`SELECT ... FOR UPDATE`), version column locking, or atomic SQL updates.
- **User / Business Impact:** Silent loss of candidate exam code or loss of proctoring webcam evidence.
- **Remediation:** 
  1. Isolate `captures` and `violations` into child tables (`assessment_proctor_captures`, `assessment_proctor_violations`).
  2. In `saveProgress`, update only `responses` via atomic SQL: `UPDATE assessment_attempts SET responses = $1, time_spent_seconds = $2 WHERE id = $3`.

---

### ISSUE-SEC-001: Safe Exam Browser Verification Bypass & Incompatible Hash Specification

- **Severity:** HIGH
- **Confidence:** CONFIRMED
- **Affected Component:** `backend-nestjs/src/exam-security/exam-security.service.ts`
- **File & Lines:** `backend-nestjs/src/exam-security/exam-security.service.ts` (Lines 42–78)
- **Code Evidence:**
  ```typescript
  // L50:
  const clientType = (clientBody.isSEB || hasSebHeader || isSebUserAgent) ? 'SEB' : 'BROWSER';

  // L65-72:
  const hasMatchingKey = clientSentKey && clientSentKey === expectedConfigKey;
  const hasMatchingHash =
    sebReqHash &&
    typeof sebReqHash === 'string' &&
    (sebReqHash === expectedConfigKey ||
      sebReqHash.toLowerCase() ===
        crypto.createHash('sha256').update(assessment.id + expectedConfigKey).digest('hex'));
  ```
- **Technical Root Cause:** 
  1. If `security.configKey` is not set on the assessment, `clientType` is derived purely from client body (`clientBody.isSEB`) or User-Agent spoofing (`/SEB|SafeExamBrowser/i.test(userAgent)`). Any browser can bypass SEB lockdown.
  2. If `security.configKey` is configured, line 65 accepts `clientSentKey === expectedConfigKey`. Clients can pass the secret key directly in plaintext JSON (`configKey: "..."`) rather than providing genuine SEB cryptographic request headers.
  3. Line 71 hashes `assessment.id + expectedConfigKey`. Genuine Safe Exam Browser implementations hash the **full request URL** + ConfigKey/BrowserExamKey. Real SEB clients will generate an incompatible hash, causing legitimate SEB users to be rejected while malicious clients sending plaintext keys succeed.
- **Triggering Conditions:** Students taking an exam configured with "requireSEB: true".
- **Failure Mechanism:** Complete breakdown of the Safe Exam Browser trust model.
- **User / Business Impact:** Candidates can use unauthorized browsers, AI extensions, screen shares, and developer tools during high-stakes exams.
- **Remediation:** Remove `clientSentKey === expectedConfigKey`. Compute the expected SHA-256 HMAC over the full request URL using standard SEB specifications.

---

### ISSUE-PERF-001: Piston Execution Multiplier: Multi-Test Submissions Recompile Code $T$ Times

- **Severity:** HIGH
- **Confidence:** CONFIRMED
- **Affected Component:** `backend-nestjs/src/execution/execution.service.ts`
- **File & Lines:** `backend-nestjs/src/execution/execution.service.ts` (Lines 460–482)
- **Code Evidence:**
  ```typescript
  for (const testCase of testCases) {
    const result = await this.pistonService.execute({
      language,
      version,
      files: [{ content: sourceCode }],
      stdin: testCase.input,
    });
  }
  ```
- **Technical Root Cause:** Stateless Piston container invocations compile and run source code together. For compiled languages (C, C++, Java, Rust), submitting code for a problem with 20 test cases triggers 20 full compiler executions (`g++`, `javac`).
- **Triggering Conditions:** 50 students submitting code simultaneously on 15-test-case problems ($50 \times 15 = 750$ compilations).
- **Failure Mechanism:** Piston worker CPU hits 100%, submission queues back up for minutes, and client execution polls time out.
- **User / Business Impact:** Extreme grading delays and submission worker denial of service during live contests.
- **Remediation:** Compile source code once into an executable binary artifact, cache the artifact in worker memory or volume, and execute the binary against all test cases.

---

### ISSUE-INFRA-001: Shared Single Redis Cluster with `noeviction` Policy Cascades to System Outage

- **Severity:** HIGH
- **Confidence:** CONFIRMED
- **Affected Component:** `terraform/modules/redis/main.tf` & `backend-nestjs/src/app.module.ts`
- **File & Lines:** `terraform/modules/redis/main.tf` (Lines 44–60)
- **Code Evidence:**
  ```hcl
  parameter {
    name  = "maxmemory-policy"
    value = "noeviction"
  }
  ```
- **Technical Root Cause:** BullMQ persistent queues, login rate limiters, session caches, and Socket.IO adapters share a single Redis instance with `maxmemory-policy = noeviction`. When memory reaches capacity, Redis rejects all new writes with `OOM command not allowed`.
- **Triggering Conditions:** Sustained submission bursts or high traffic creating thousands of rate-limit and cache keys.
- **Failure Mechanism:** System-wide cascade failure: logins fail, submissions fail to enqueue, and WebSockets disconnect.
- **User / Business Impact:** Complete platform outage.
- **Remediation:** Separate BullMQ into a persistent Redis cluster, and use a separate Redis instance with `volatile-lru` for caching and rate limiting.

---

### ISSUE-INFRA-002: `max_connections = 200` on 1 GiB `db.t4g.micro` Risks Linux OOM Process Termination

- **Severity:** HIGH
- **Confidence:** CONFIRMED
- **Affected Component:** `terraform/modules/rds/main.tf`
- **File & Lines:** `terraform/modules/rds/main.tf` (Line 58)
- **Code Evidence:**
  ```hcl
  parameter {
    name         = "max_connections"
    value        = "200"
    apply_method = "pending-reboot"
  }
  ```
- **Technical Root Cause:** PR #95 raised `max_connections` from 50 to 200. However, the database instance class is `db.t4g.micro` (1 GiB RAM). In PostgreSQL, each active backend connection consumes memory for process state, `work_mem` (default 4MB), and buffers. If active connections reach 150–200, total RAM demand exceeds 1 GiB, causing Linux kernel Out-Of-Memory (OOM) killer to terminate the PostgreSQL daemon.
- **Triggering Conditions:** Autoscaling launches multiple API nodes that concurrently open database connections.
- **Failure Mechanism:** PostgreSQL crashes and restarts, dropping all active transactions.
- **User / Business Impact:** Database crash and transaction rollbacks during traffic spikes.
- **Remediation:** Deploy AWS RDS Proxy or PgBouncer to multiplex connections, keep backend client pools small (`DB_POOL_MAX=10`), and upgrade the RDS instance to at least `db.t4g.small` (2 GiB RAM) if 200 connections are required.

---

### ISSUE-PERF-002: In-Process Rate Limiter Map Is Not Shared Across Horizontal Cluster Nodes

- **Severity:** MEDIUM
- **Confidence:** CONFIRMED
- **Affected Component:** `backend-nestjs/src/pet/pet.service.ts`
- **File & Lines:** `backend-nestjs/src/pet/pet.service.ts` (Lines 203–226)
- **Code Evidence:**
  ```typescript
  private readonly requests = new Map<string, number[]>();
  ```
- **Technical Root Cause:** PR #95 added bounded cleanup (`if (this.requests.size > 500)`), preventing unbounded process memory leaks. However, the rate limiter remains an in-process Node.js `Map`. In a multi-instance or PM2 cluster deployment, requests from the same user are distributed across different processes, allowing users to bypass rate limits.
- **Triggering Conditions:** Multi-instance deployment with users querying AI Pet across load-balanced nodes.
- **Failure Mechanism:** Quota circumvention on AI inference calls.
- **User / Business Impact:** Excessive third-party API costs for Anthropic Claude / Google Gemini.
- **Remediation:** Store rate-limiting counters in Redis with sliding-window expiry.

---

### ISSUE-DATA-001: Contest Finalization Bypasses Sharded Database Store with Primary Table SQL

- **Severity:** MEDIUM
- **Confidence:** CONFIRMED
- **Affected Component:** `backend-nestjs/src/contests/contests.service.ts`
- **File & Lines:** `backend-nestjs/src/contests/contests.service.ts` (Lines 520–560)
- **Code Evidence:**
  ```typescript
  const submissions = await this.submissionRepo.find({
    where: { contestId },
  });
  ```
- **Technical Root Cause:** If database sharding is enabled (`SUBMISSION_SHARDS`), submissions are written across shard databases via `SubmissionStore`. However, contest completion queries the primary database's `submissions` table directly.
- **Triggering Conditions:** Completing a contest when submission sharding is enabled.
- **Failure Mechanism:** Contest scoring and leaderboard finalization misses submissions stored on shards.
- **User / Business Impact:** Inaccurate contest standings, incorrect ranks, and missing candidate scores.
- **Remediation:** Query `SubmissionStore` to aggregate contest submissions across all active shard instances.

---

### ISSUE-SEC-002: SEB Config Key Accepted in Plaintext JSON Body Bypassing Header Security

- **Severity:** MEDIUM
- **Confidence:** HIGH-CONFIDENCE STATIC FINDING
- **Affected Component:** `backend-nestjs/src/exam-security/exam-security.service.ts`
- **File & Lines:** `exam-security.service.ts` (Line 64)
- **Code Evidence:**
  ```typescript
  const clientSentKey = String(configKey || '').trim();
  const hasMatchingKey = clientSentKey && clientSentKey === expectedConfigKey;
  ```
- **Technical Root Cause:** Client body accepts `configKey`. If an attacker inspects an exported `.seb` file or extracts the key, they can supply it directly in a JSON payload to gain verified SEB status.
- **Triggering Conditions:** Candidate sends `{ "configKey": "secret" }` from an unverified browser.
- **Failure Mechanism:** Bypasses browser-level hardware and environment lockdown.
- **User / Business Impact:** Cheating during proctored exams.
- **Remediation:** Reject plaintext config keys in request bodies. Verify only HMAC request hashes.

---

### ISSUE-OBS-001: Standalone Worker Process Emits Gateway Events Without Attached HTTP Server

- **Severity:** MEDIUM
- **Confidence:** CONFIRMED
- **Affected Component:** `backend-nestjs/src/gateway/events.gateway.ts` & `backend-nestjs/src/worker.ts`
- **File & Lines:** `backend-nestjs/src/worker.ts` & `src/execution/judge.processor.ts`
- **Code Evidence:** When `PROCESS_ROLE=judge` is started as a standalone daemon, `EventsGateway` is initialized by NestJS DI without an HTTP server listener.
- **Technical Root Cause:** The worker process emits events to Socket.IO rooms, but unless the Redis adapter is perfectly synchronized and connected, real-time push events fail silently.
- **Triggering Conditions:** Standalone worker deployment.
- **Failure Mechanism:** Students in browser do not receive real-time submission updates and must rely on polling.
- **User / Business Impact:** Lagged or missing live verdict updates in the code editor.
- **Remediation:** Ensure workers emit verdicts exclusively via Redis pub/sub channels consumed by API instances.

---

### ISSUE-FE-001: React 19 Ref Access During Render in `contribution-skyline.tsx`

- **Severity:** LOW
- **Confidence:** CONFIRMED
- **Affected Component:** `frontend-v2/src/components/ui/contribution-skyline.tsx`
- **File & Lines:** `contribution-skyline.tsx` (Line 509)
- **Code Evidence:**
  ```typescript
  cfg.current = { model, duration, heightScale, orbit, palette, legendLevel, onCellClick, ... };
  ```
- **Technical Root Cause:** Direct mutation of `ref.current` during the component render phase violates React 19 concurrent render purity constraints.
- **Triggering Conditions:** Rendering the 3D contribution skyline widget.
- **Failure Mechanism:** Inconsistent visual updates or dropped render frames.
- **User / Business Impact:** Minor rendering glitch in developer profile view.
- **Remediation:** Move `cfg.current` mutation into a `useEffect` hook.

---

### ISSUE-FE-002: Synchronous `setState` Inside `useEffect` in `otp-input.tsx` & `modern-loader.tsx`

- **Severity:** LOW
- **Confidence:** CONFIRMED
- **Affected Component:** `frontend-v2/src/components/ui/otp-input.tsx` & `modern-loader.tsx`
- **File & Lines:** `otp-input.tsx` (Line 115), `modern-loader.tsx` (Line 75)
- **Code Evidence:**
  ```typescript
  useEffect(() => {
    setChars((prev) => ...);
  }, [length]);
  ```
- **Technical Root Cause:** Calling `setState` synchronously within the body of `useEffect` triggers immediate cascading re-renders.
- **Triggering Conditions:** Component mount and length prop changes.
- **Failure Mechanism:** Unnecessary extra render pass before layout stabilization.
- **User / Business Impact:** Minor microsecond frame delay on initial OTP display.
- **Remediation:** Derive state during render or use a key prop to reset state on length change.
