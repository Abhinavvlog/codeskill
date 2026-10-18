# Master Issue Register & Defect Catalog

**Audit Date:** October 18, 2026  
**Audited Target:** CodeSkill Full-Stack Codebase (`backend-nestjs` & `frontend-v2`)  
**Commit:** `2d89bd45`  

---

## Issue Summary Index

| Issue ID | Severity | Confidence | Component | Title |
| :--- | :---: | :---: | :--- | :--- |
| **ISSUE-CONC-001** | **CRITICAL** | CONFIRMED | Assessments | High-Frequency Proctoring Capture Overwrites Candidate Assessment Answers (Data Loss) |
| **ISSUE-CONC-002** | **CRITICAL** | CONFIRMED | Assessments | Unlocked Assessment Submission Allows Concurrent Double Evaluation & Worker Starvation |
| **ISSUE-SEC-001** | **HIGH** | CONFIRMED | Exam Security | Safe Exam Browser (SEB) Security Verification Bypass via Client JSON Header |
| **ISSUE-SEC-002** | **HIGH** | CONFIRMED | Assessments | Client-Supplied Violation Array Overwrites Authoritative Server Proctoring Logs |
| **ISSUE-INFRA-001** | **HIGH** | CONFIRMED | S3 / Media | S3 Proctoring Frames Inaccessible (403 Forbidden) Due to Missing Presigned URLs |
| **ISSUE-OBS-001** | **HIGH** | CONFIRMED | Observability | Telemetry Route Prefix Mismatch (`/api/api/telemetry/...`) Causes 404 on Client Errors |
| **ISSUE-ROUT-001** | **HIGH** | CONFIRMED | Health API | Conflicting Health Route Declarations Between Competing Health Controllers |
| **ISSUE-SEC-003** | **HIGH** | CONFIRMED | Metrics | Metrics IP Filter Regex Bypass & Unauthenticated Prometheus Scrape Exposure |
| **ISSUE-PERF-001** | **HIGH** | CONFIRMED | Execution | Piston Execution Redundancy: Multi-Test Submissions Recompile Code N Times |
| **ISSUE-INFRA-002** | **HIGH** | CONFIRMED | Database / RDS | Hardcoded RDS `max_connections = 50` Triggers Pool Starvation Under Autoscaling |
| **ISSUE-INFRA-003** | **HIGH** | CONFIRMED | Redis / Cache | Shared Single Redis with `noeviction` Policy Cascades Memory Full to Total Platform Lockup |
| **ISSUE-SEC-004** | **MEDIUM** | CONFIRMED | Students / Auth | Plaintext Temporary Passwords Stored in `email_jobs` Database Table |
| **ISSUE-DATA-001** | **MEDIUM** | CONFIRMED | Discussions | Non-Atomic Discussion Voting and Reply Counters Cause Lost Updates (Write Skew) |
| **ISSUE-PERF-002** | **MEDIUM** | CONFIRMED | AI Pet | In-Memory Rate Limiting Map Leaks Memory and Bypasses Horizontal Cluster Controls |
| **ISSUE-DB-001** | **MEDIUM** | CONFIRMED | Database | TypeORM `null: 'ignore'` Setting Risks Object-Level Authorization Bypass |
| **ISSUE-DB-002** | **MEDIUM** | CONFIRMED | Partitioning | Hardcoded Partition Ranges in `declarative-partitioning.ts` Expire Beyond 2027 |
| **ISSUE-FE-001** | **LOW** | CONFIRMED | Frontend UI | React 19 Ref Access During Render in `otp-input.tsx` and `useFullscreen.ts` |
| **ISSUE-SEC-005** | **LOW** | HIGH-CONFIDENCE | Exam Security | Aggressive Client Anti-Cheat DevTools Detection Generates False Positives |

---

## Detailed Issue Dissections

### ISSUE-CONC-001: High-Frequency Proctoring Capture Overwrites Candidate Assessment Answers (Data Loss)

- **Severity:** CRITICAL
- **Confidence:** CONFIRMED
- **Affected Component:** `backend-nestjs/src/assessments/assessments.service.ts`
- **File & Lines:** `backend-nestjs/src/assessments/assessments.service.ts` (L1530-1620, L2230-2335)
- **Code Evidence:**
  ```typescript
  // saveProgress (L1530-1620):
  const attempt = await this.attemptRepo.findOne({ where: { id: attemptId } });
  attempt.responses = { ...attempt.responses, ...newResponses };
  await this.attemptRepo.save(attempt);

  // recordProctorCapture (L2300-2335):
  const attempt = await this.attemptRepo.findOne({ where: { id: attemptId } });
  attempt.captures.push(captureData);
  await this.attemptRepo.save(attempt);
  ```
- **Technical Root Cause:** Both endpoints read the complete TypeORM entity into Node.js memory, modify one disjoint JSON/array field, and execute a full entity `save()`. Neither method utilizes pessimistic row locking (`SELECT ... FOR UPDATE`), optimistic version locking (`@VersionColumn`), or isolated atomic SQL update expressions (e.g., `UPDATE assessment_attempts SET captures = captures || ...`).
- **Triggering Conditions:** Any student taking a proctored assessment where webcams capture snapshots every 10–30 seconds while auto-save triggers concurrently every 30 seconds or upon student typing pause.
- **Failure Mechanism:** Thread 1 reads attempt at time $T_0$ (with responses $R_0$, captures $C_0$). Thread 2 reads attempt at time $T_1$ (with responses $R_0$, captures $C_0$). Thread 2 writes $C_1$. Thread 1 writes $R_1$, but its in-memory entity still holds $C_0$, clobbering $C_1$. Conversely, if Thread 1 writes $R_1$ first, Thread 2 writing $C_1$ clobbers $R_1$ back to $R_0$. Student code is permanently erased.
- **User / Business Impact:** Students lose submitted code and essay answers during live examinations. Test scores are corrupted or zeroed out.
- **Remediation:** 
  1. Decompose `captures` and `violations` out of the `assessment_attempts` table into dedicated child tables: `assessment_proctor_captures` and `assessment_proctor_violations` with foreign keys to `attempt_id`.
  2. For remaining fields in `assessment_attempts`, use PostgreSQL atomic queries (`UPDATE assessment_attempts SET responses = jsonb_set(...)`) or wrap updates in pessimistic row locking (`pessimistic_write`).
- **Regression Test:** Write an integration test concurrently firing 20 `saveProgress` requests and 20 `recordProctorCapture` requests against a single attempt ID, asserting all responses and captures persist.

---

### ISSUE-CONC-002: Unlocked Assessment Submission Allows Concurrent Double Evaluation & Worker Starvation

- **Severity:** CRITICAL
- **Confidence:** CONFIRMED
- **Affected Component:** `backend-nestjs/src/assessments/assessments.service.ts`
- **File & Lines:** `backend-nestjs/src/assessments/assessments.service.ts` (L1624-1750)
- **Code Evidence:**
  ```typescript
  async submitAttempt(attemptId: string, userId: string) {
    const attempt = await this.attemptRepo.findOne({ where: { id: attemptId, userId } });
    if (attempt.status !== 'in_progress') {
      throw new BadRequestException('Attempt is not in progress');
    }
    // Execution proceeds to run code questions without locking attempt row
    return this.evaluateAttempt(attempt);
  }
  ```
- **Technical Root Cause:** The `in_progress` validation occurs before evaluation starts. Evaluation executes synchronous or asynchronous grading of coding problems via external execution engines (Piston/Docker), which takes 5–30 seconds. Because the attempt row is not locked and its status is only updated to `'submitted'` *after* evaluation completes, concurrent requests pass the `in_progress` check.
- **Triggering Conditions:** Rapid double-clicks on the "Submit Assessment" button, browser retries, or opening the exam in two tabs and submitting simultaneously.
- **Failure Mechanism:** Both requests pass `attempt.status === 'in_progress'`. Both execute 10–20 test cases against Piston/Docker. Double jobs flood the worker queue, duplicate submissions are recorded, and CPU is exhausted.
- **User / Business Impact:** Extreme CPU spikes, candidate test grading discrepancies, and denial-of-service on the code execution cluster.
- **Remediation:** 
  Use a database transaction with a pessimistic write lock or an atomic compare-and-swap update at the start of submission:
  ```sql
  UPDATE assessment_attempts 
  SET status = 'evaluating', submitted_at = NOW() 
  WHERE id = $1 AND status = 'in_progress' 
  RETURNING id;
  ```
  If zero rows are returned, reject the duplicate request with HTTP 409 Conflict.
- **Regression Test:** Execute two concurrent POST requests to `/api/assessments/:id/submit`; assert exactly one receives 200 OK and the second receives 409/400.

---

### ISSUE-SEC-001: Safe Exam Browser (SEB) Security Verification Bypass via Client JSON Header

- **Severity:** HIGH
- **Confidence:** CONFIRMED
- **Affected Component:** `backend-nestjs/src/exam-security/exam-security.service.ts`
- **File & Lines:** `backend-nestjs/src/exam-security/exam-security.service.ts` (L39-44, L98-102)
- **Code Evidence:**
  ```typescript
  // L39-44:
  const clientType = clientBody.isSEB ? 'SEB' : 'BROWSER';
  // L98-102:
  return {
    verified: true,
    clientType,
    token: 'simulate-secure-token',
  };
  ```
- **Technical Root Cause:** The system trusts the unverified payload property `isSEB` from the client request body. The standard Safe Exam Browser protocol requires hashing the request URL with the secret Config Key (`X-SafeExamBrowser-ConfigKeyHash`) or Browser Exam Key (`X-SafeExamBrowser-RequestHash`) and verifying it against the server's preconfigured hash. No header verification exists, and the returned token is a static string literal (`'simulate-secure-token'`).
- **Triggering Conditions:** Any user attempting to take an exam designated as "SEB Required" using standard Chrome, Postman, or a Python script.
- **Failure Mechanism:** The client sends `{ "isSEB": true }` in the POST body. The backend marks the session as `SEB` verified, unlocking the exam.
- **User / Business Impact:** Complete circumvention of exam lockdown environments, enabling unauthorized external tools, screen recording, and unauthorized AI assistance during exams.
- **Remediation:** Implement real cryptographic validation of `X-SafeExamBrowser-RequestHash` and `X-SafeExamBrowser-ConfigKeyHash` headers using SHA256 hashes generated from the exam URL and authorized SEB configuration keys. Reject any request lacking valid cryptographic signatures.

---

### ISSUE-SEC-002: Client-Supplied Violation Array Overwrites Authoritative Server Proctoring Logs

- **Severity:** HIGH
- **Confidence:** CONFIRMED
- **Affected Component:** `backend-nestjs/src/assessments/assessments.service.ts`
- **File & Lines:** `backend-nestjs/src/assessments/assessments.service.ts` (L1917-1926)
- **Code Evidence:**
  ```typescript
  const clientViolations = body.violations || [];
  const existingViolations = attempt.violations || [];
  const violations = clientViolations.length >= existingViolations.length 
    ? clientViolations 
    : existingViolations;
  attempt.violations = violations;
  await this.attemptRepo.save(attempt);
  ```
- **Technical Root Cause:** The server allows the client to supply an arbitrary list of violations. If the length of the client array is greater than or equal to the server's existing violations, the server overwrites the entire authoritative list with the client's version.
- **Triggering Conditions:** Candidate intercepts the `/submit` or `/progress` network request and sends a synthetic array of harmless violations (e.g., `['TAB_BLUR']`) with length $\ge$ the server's detected severe violations (`['MULTIPLE_FACES_DETECTED', 'SECONDARY_DEVICE_DETECTED']`).
- **Failure Mechanism:** High-severity cheating infractions recorded by AI computer-vision or proctoring background threads are erased and replaced by benign events.
- **User / Business Impact:** Cheating candidates can game proctoring algorithms and evade academic penalties.
- **Remediation:** Make proctoring violations append-only on the server. Never accept client-supplied violation lists as replacements for server-recorded infractions.

---

### ISSUE-INFRA-001: S3 Proctoring Frames Inaccessible (403 Forbidden) Due to Missing Presigned URLs

- **Severity:** HIGH
- **Confidence:** CONFIRMED
- **Affected Component:** `backend-nestjs/src/s3/s3.service.ts` & `terraform/modules/s3/main.tf`
- **File & Lines:** `backend-nestjs/src/s3/s3.service.ts` (L90-98), `terraform/modules/s3/main.tf` (L9-34)
- **Code Evidence:**
  ```typescript
  // s3.service.ts returns a raw public URL:
  return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  ```
  ```hcl
  # terraform s3 policy restricts public GetObject to avatars/*:
  Resource = "${aws_s3_bucket.app_storage.arn}/avatars/*"
  ```
- **Technical Root Cause:** Proctoring frames are stored in S3 under `proctoring/${attemptId}/${frameId}.jpg`. The S3 bucket policy strictly limits public access to `avatars/*`. The backend constructs public URL strings instead of generating time-limited AWS S3 Presigned URLs (`@aws-sdk/s3-request-presigner`).
- **Triggering Conditions:** An instructor or administrator opens candidate evaluation reports to review proctoring snapshots or violation evidence.
- **Failure Mechanism:** Browser requests to `https://bucket.s3.region.amazonaws.com/proctoring/...` return HTTP 403 Forbidden AccessDenied.
- **User / Business Impact:** Administrators cannot inspect exam integrity evidence; proctoring functionality is non-functional in production.
- **Remediation:** Implement `getSignedUrl(s3Client, new GetObjectCommand({ Bucket, Key }), { expiresIn: 3600 })` in `S3Service` for all `proctoring/*` and `submissions/*` objects.

---

### ISSUE-OBS-001: Telemetry Route Prefix Mismatch (`/api/api/telemetry/...`) Causes 404 on Client Errors

- **Severity:** HIGH
- **Confidence:** CONFIRMED
- **Affected Component:** `backend-nestjs/src/observability/health/health.controller.ts` & `frontend-v2/src/telemetry/error-boundary.tsx`
- **File & Lines:** `health.controller.ts` (L106), `error-boundary.tsx` (L69)
- **Code Evidence:**
  ```typescript
  // health.controller.ts:
  @Controller() // no prefix
  export class HealthAndTelemetryController {
    @Post('api/telemetry/client-events') // Nest registers this as /api + api/telemetry/client-events
    recordClientEvent(@Body() event: any) { ... }
  }
  ```
  ```typescript
  // error-boundary.tsx:
  navigator.sendBeacon('/api/telemetry/client-events', payload);
  ```
- **Technical Root Cause:** NestJS defines `app.setGlobalPrefix('api')` in `main.ts`. A route annotated with `@Post('api/telemetry/client-events')` inside an un-prefixed `@Controller()` resolves to `/api/api/telemetry/client-events`. The frontend transmits beacons to `/api/telemetry/client-events`.
- **Triggering Conditions:** Any client-side JavaScript uncaught exception, React Error Boundary catch, or Core Web Vitals telemetry beacon.
- **Failure Mechanism:** Beacons return HTTP 404 Not Found. Telemetry fails silently.
- **User / Business Impact:** Zero client-side error visibility; production frontend crashes remain completely unmonitored.
- **Remediation:** Change `@Post('api/telemetry/client-events')` to `@Post('telemetry/client-events')` in `HealthAndTelemetryController`.

---

### ISSUE-ROUT-001: Conflicting Health Route Declarations Between Competing Health Controllers

- **Severity:** HIGH
- **Confidence:** CONFIRMED
- **Affected Component:** `backend-nestjs/src/health/health.controller.ts` and `backend-nestjs/src/observability/health/health.controller.ts`
- **File & Lines:** `backend-nestjs/src/health/health.controller.ts` (L1-45), `backend-nestjs/src/observability/health/health.controller.ts` (L1-90)
- **Code Evidence:** Both controllers bind `@Get('health/live')` and `@Get('health/ready')`. Both modules (`HealthModule` and `ObservabilityModule`) are imported into `AppModule`.
- **Technical Root Cause:** Route shadowing in Express/Nest router table. The first loaded route handler captures requests, while the other is ignored. One controller checks TypeORM database health; the other checks both TypeORM and Redis health.
- **Triggering Conditions:** Load balancer health probes polling `/api/health/ready` or `/api/health/live`.
- **Failure Mechanism:** Load balancer readiness checks may report healthy even when Redis is down, routing traffic to workers that immediately fail.
- **User / Business Impact:** Flapping pod health and improper Kubernetes/ALB traffic routing during partial outages.
- **Remediation:** Consolidate health checks into a single canonical `HealthModule` leveraging `@nestjs/terminus` and delete duplicate controller definitions.

---

### ISSUE-SEC-003: Metrics IP Filter Regex Bypass & Unauthenticated Prometheus Scrape Exposure

- **Severity:** HIGH
- **Confidence:** CONFIRMED
- **Affected Component:** `backend-nestjs/src/observability/metrics/metrics.controller.ts`
- **File & Lines:** `backend-nestjs/src/observability/metrics/metrics.controller.ts` (L20-29)
- **Code Evidence:**
  ```typescript
  const clientIp = req.ip || req.connection.remoteAddress || '';
  const isPrivate = clientIp.includes('10.') || clientIp.includes('172.') || clientIp.includes('192.168.');
  if (!isPrivate && scrapeToken !== expectedToken) {
    throw new ForbiddenException('Access denied');
  }
  ```
- **Technical Root Cause:** The IP verification uses naive substring matching (`clientIp.includes('10.')`). Any public IP containing `10.` (e.g. `210.45.1.2`, `104.28.1.1`) or `172.` satisfies `isPrivate === true`. Additionally, if `METRICS_SCRAPE_TOKEN` is unset in configuration, unauthenticated access is permitted.
- **Triggering Conditions:** Any external actor curling `/api/metrics` from an IP containing the substrings `10.` or `172.`.
- **Failure Mechanism:** The request bypasses the token check, dumping internal Prometheus metrics (queue sizes, active DB connections, user registration counts, error rates).
- **User / Business Impact:** Information disclosure aiding targeted attacks.
- **Remediation:** Use proper CIDR parsing (`ipaddr.js` or `netmask`) to validate RFC 1918 addresses (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) and enforce mandatory bearer tokens regardless of IP.

---

### ISSUE-PERF-001: Piston Execution Redundancy: Multi-Test Submissions Recompile Code N Times

- **Severity:** HIGH
- **Confidence:** CONFIRMED
- **Affected Component:** `backend-nestjs/src/execution/execution.service.ts`
- **File & Lines:** `backend-nestjs/src/execution/execution.service.ts` (L460-482)
- **Code Evidence:**
  ```typescript
  for (const testCase of testCases) {
    const result = await this.pistonService.execute({
      language,
      version,
      files: [{ content: sourceCode }],
      stdin: testCase.input,
    });
    // Piston executes full compile + run cycle for each testCase iteration
  }
  ```
- **Technical Root Cause:** Piston's `/api/v2/execute` endpoint performs compilation and execution in a single stateless container invocation. For compiled languages (C, C++, Java, Rust), sending 20 test cases triggers 20 full compiler invocations (e.g., `g++ -O3 ...`).
- **Triggering Conditions:** 50 students submitting code simultaneously on a problem with 20 test cases ($50 \times 20 = 1,000$ compilations).
- **Failure Mechanism:** CPU on Piston nodes hits 100%, submission queues back up for minutes, and requests time out.
- **User / Business Impact:** Extreme platform latency and submission grading timeouts during exams and contests.
- **Remediation:** For compiled languages, compile the source code once into an executable binary, cache the binary artifact in worker memory or shared volume, and execute the binary against all test cases.

---

### ISSUE-INFRA-002: Hardcoded RDS `max_connections = 50` Triggers Pool Starvation Under Autoscaling

- **Severity:** HIGH
- **Confidence:** CONFIRMED
- **Affected Component:** `terraform/modules/rds/main.tf` & `backend-nestjs/src/database/database.module.ts`
- **File & Lines:** `terraform/modules/rds/main.tf` (L56-60), `database.module.ts` (L88)
- **Code Evidence:**
  ```hcl
  # terraform rds parameter group:
  parameter {
    name  = "max_connections"
    value = "50"
  }
  ```
  ```typescript
  // database.module.ts:
  extra: {
    max: parseInt(configService.get('DB_POOL_MAX', '50'), 10),
  }
  ```
- **Technical Root Cause:** The RDS PostgreSQL database instance is constrained to 50 max connections. The backend application configures its connection pool max to 50 connections per instance.
- **Triggering Conditions:** 1 API server (50 connections) + 1 Judge worker (50 connections), or horizontal autoscaling spinning up a second API task.
- **Failure Mechanism:** Total requested connections exceed 50. PostgreSQL rejects connections with `FATAL: remaining connection slots are reserved for non-replication superuser connections`.
- **User / Business Impact:** Platform-wide 500 errors and server crashes whenever traffic increases.
- **Remediation:** Deploy AWS RDS Proxy or PgBouncer in front of PostgreSQL, lower client pool size (`DB_POOL_MAX = 10`), and scale RDS instance size to allow appropriate connection limits.

---

### ISSUE-INFRA-003: Shared Single Redis with `noeviction` Policy Cascades Memory Full to Total Platform Lockup

- **Severity:** HIGH
- **Confidence:** CONFIRMED
- **Affected Component:** `terraform/modules/redis/main.tf` & `backend-nestjs/src/app.module.ts`
- **File & Lines:** `terraform/modules/redis/main.tf` (L44-60)
- **Code Evidence:**
  ```hcl
  parameter {
    name  = "maxmemory-policy"
    value = "noeviction"
  }
  ```
- **Technical Root Cause:** Redis is shared among BullMQ (which requires persistent jobs), Throttler rate limiting (ephemeral keys), cache keys (ephemeral), and Socket.IO adapter. When Redis memory fills up, `noeviction` rejects all write commands with `OOM command not allowed when used memory > 'maxmemory'`.
- **Triggering Conditions:** High submission volume, caching of large leaderboards, or high traffic creating millions of ephemeral rate-limit keys in Redis.
- **Failure Mechanism:** All writes fail, preventing job queueing, login authentication (rate limiting), and OTP creation.
- **User / Business Impact:** Total application paralysis.
- **Remediation:** Separate BullMQ persistent queues into a dedicated Redis instance, and use a separate Redis instance with `volatile-lru` for rate limiting, cache, and session data.

---

### ISSUE-SEC-004: Plaintext Temporary Passwords Stored in `email_jobs` Database Table

- **Severity:** MEDIUM
- **Confidence:** CONFIRMED
- **Affected Component:** `backend-nestjs/src/students/students.service.ts` & `backend-nestjs/src/database/entities/email-job.entity.ts`
- **File & Lines:** `students.service.ts` (L782), `email-job.entity.ts` (L37-38)
- **Code Evidence:**
  ```typescript
  // students.service.ts:
  await this.emailJobRepo.save({
    userId: user.id,
    type: 'WELCOME_PASSWORD',
    temporaryPassword: rawTemporaryPassword, // Stored directly in cleartext column!
    status: 'PENDING',
  });
  ```
- **Technical Root Cause:** During student batch CSV import, the newly generated random password is saved in plaintext in the `temporaryPassword` column of the `email_jobs` table.
- **Triggering Conditions:** Batch student onboardings.
- **Failure Mechanism:** The plaintext password remains in the database until (or even after) the email job is processed.
- **User / Business Impact:** Any read-only database breach or replica leak exposes all newly invited student passwords in plaintext.
- **Remediation:** Do not store plaintext passwords. Generate a secure, one-time, time-limited password-reset token (hashed in DB) and email the link to the student.

---

### ISSUE-DATA-001: Non-Atomic Discussion Voting and Reply Counters Cause Lost Updates (Write Skew)

- **Severity:** MEDIUM
- **Confidence:** CONFIRMED
- **Affected Component:** `backend-nestjs/src/discussions/discussions.service.ts`
- **File & Lines:** `discussions.service.ts` (L103-143, L179-180)
- **Code Evidence:**
  ```typescript
  const thread = await this.threadRepo.findOne({ where: { id } });
  thread.upvotes = thread.upvotes + 1;
  await this.threadRepo.save(thread);
  ```
- **Technical Root Cause:** Upvotes and reply counts use read-modify-write without database atomic increments (`UPDATE ... SET upvotes = upvotes + 1`) or transactions.
- **Triggering Conditions:** Multiple users upvoting or replying to a popular discussion thread simultaneously.
- **Failure Mechanism:** Lost updates due to race conditions.
- **User / Business Impact:** Discussion vote counts and reply numbers become inaccurate and desynchronized.
- **Remediation:** Use TypeORM's `increment` API: `this.threadRepo.increment({ id }, 'upvotes', 1)`.

---

### ISSUE-PERF-002: In-Memory Rate Limiting Map Leaks Memory and Bypasses Horizontal Cluster Controls

- **Severity:** MEDIUM
- **Confidence:** CONFIRMED
- **Affected Component:** `backend-nestjs/src/pet/pet.service.ts`
- **File & Lines:** `backend-nestjs/src/pet/pet.service.ts` (L50, L214-216)
- **Code Evidence:**
  ```typescript
  private readonly requests = new Map<string, number[]>();
  ```
- **Technical Root Cause:** The AI Pet service enforces rate limiting using an in-memory `Map` keyed by user ID. Old user keys are never evicted.
- **Triggering Conditions:** Prolonged server uptime with thousands of distinct users interacting with the AI Pet.
- **Failure Mechanism:** Node.js process memory increases monotonically. Furthermore, rate limiting is bypassed across multiple cluster instances because state is not shared.
- **User / Business Impact:** Node.js process Out-Of-Memory crashes; users can bypass AI query quotas by hitting different load-balanced instances.
- **Remediation:** Replace the local in-memory Map with Redis-backed sliding window rate limiting.

---

### ISSUE-DB-001: TypeORM `null: 'ignore'` Setting Risks Object-Level Authorization Bypass

- **Severity:** MEDIUM
- **Confidence:** CONFIRMED
- **Affected Component:** `backend-nestjs/src/database/database.module.ts`
- **File & Lines:** `database.module.ts` (L121-123, L139-141)
- **Code Evidence:**
  ```typescript
  invalidWhereValuesBehavior: {
    null: 'ignore',
  }
  ```
- **Technical Root Cause:** When `null: 'ignore'` is set, passing `null` or `undefined` for a filter key in a `where` condition causes TypeORM to silently omit that condition from the generated SQL WHERE clause instead of throwing an error or matching `IS NULL`.
- **Triggering Conditions:** A query intended to scope by user ownership: `repo.findOne({ where: { id: resourceId, userId: req.user?.id } })` when `req.user?.id` evaluates to `undefined`.
- **Failure Mechanism:** The query generates `WHERE id = $1`, returning any user's resource regardless of ownership.
- **User / Business Impact:** Broken Object Level Authorization (BOLA / IDOR).
- **Remediation:** Set `invalidWhereValuesBehavior: { null: 'throw' }` in TypeORM configuration.

---

### ISSUE-DB-002: Hardcoded Partition Ranges in `declarative-partitioning.ts` Expire Beyond 2027

- **Severity:** MEDIUM
- **Confidence:** CONFIRMED
- **Affected Component:** `backend-nestjs/src/database/declarative-partitioning.ts`
- **File & Lines:** `declarative-partitioning.ts` (L58-85)
- **Code Evidence:** Hardcoded partition range definitions for years 2025, 2026, and 2027 only.
- **Technical Root Cause:** No automated mechanism (pg_partman or cron job) exists to create partition tables for future years.
- **Triggering Conditions:** Timestamp exceeding December 31, 2027.
- **Failure Mechanism:** Inserts into partitioned tables fail with `no partition of relation found for row`.
- **User / Business Impact:** Complete write failure on partitioned tables when time passes the hardcoded window.
- **Remediation:** Implement dynamic table partition maintenance via PostgreSQL `pg_partman` or an automated annual migration job.

---

### ISSUE-FE-001: React 19 Ref Access During Render in `otp-input.tsx` and `useFullscreen.ts`

- **Severity:** LOW
- **Confidence:** CONFIRMED
- **Affected Component:** `frontend-v2/src/components/auth/otp-input.tsx` & `frontend-v2/src/hooks/useFullscreen.ts`
- **File & Lines:** `otp-input.tsx` (L38-42), `useFullscreen.ts` (L45-52)
- **Code Evidence:** Reading or writing `ref.current` during the component render phase, flagged by ESLint React 19 rules.
- **Technical Root Cause:** Violates React 19's pure render constraints. Ref mutations during render cause desynchronized states under concurrent rendering.
- **Triggering Conditions:** Concurrent UI updates during OTP entry or entering fullscreen exam mode.
- **Failure Mechanism:** UI flickers, input focus desynchronization, or potential render loops.
- **User / Business Impact:** Sub-optimal candidate experience during authentication or exam entry.
- **Remediation:** Move ref mutations and side-effects into `useEffect` or event handlers.

---

### ISSUE-SEC-005: Aggressive Client Anti-Cheat DevTools Detection Generates False Positives

- **Severity:** LOW
- **Confidence:** HIGH-CONFIDENCE STATIC FINDING
- **Affected Component:** `frontend-v2/src/hooks/useDevToolsDetect.ts`
- **File & Lines:** `useDevToolsDetect.ts` (L25-60)
- **Code Evidence:** Timing heuristics measuring `console.log` execution time (`performance.now()`) or window outer/inner dimension differences.
- **Technical Root Cause:** Browser window resizing, high system CPU load, or OS zoom levels trigger the same timing anomalies as opening DevTools.
- **Triggering Conditions:** Candidate takes exam on a low-end laptop or resizes browser window.
- **Failure Mechanism:** Triggers false-positive "DevTools Opened" violations.
- **User / Business Impact:** Candidates falsely accused of cheating or unfairly penalized.
- **Remediation:** Rely on legitimate window blur/fullscreen change events and remove unreliable microsecond console timing heuristics.
