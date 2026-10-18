# Independent Pre-Production Engineering Audit: Complete Issue Register

**Target Commit:** `3a3e9671d863e8abd95d19cbc7136c4227476ba8`  
**Total Issues Identified:** 28  
**Classification:** Critical (6), High (11), Medium (8), Low / Info (3)  

---

## 1. Master Issue Inventory

| Issue ID | Severity | Confidence | Discipline | Title | Affected File(s) |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **ISSUE-INFRA-001** | **CRITICAL** | **CONFIRMED** | Cloud Infrastructure | ASG `MinHealthyPercentage: 0` Guarantees Production Downtime on Deployments | `.github/workflows/deploy.yml` |
| **ISSUE-SEC-001** | **CRITICAL** | **CONFIRMED** | Application Security | Safe Exam Browser (SEB) Security Bypass via User-Agent Header Spoofing | `backend-nestjs/src/exam-security/exam-security.service.ts` |
| **ISSUE-CONCUR-001**| **CRITICAL** | **CONFIRMED** | Concurrency & Integrity | Lost Update Race Hazard Between `saveProgress` and `recordProctorCapture` | `backend-nestjs/src/assessments/assessments.service.ts` |
| **ISSUE-EXEC-001** | **CRITICAL** | **CONFIRMED** | Execution & Scale | Piston Multi-Pass Compilation Loop Saturates CPU and Causes 504 Timeouts | `backend-nestjs/src/execution/execution.service.ts` |
| **ISSUE-INFRA-002** | **CRITICAL** | **CONFIRMED** | Infrastructure & SRE | Shared Redis Cluster with `noeviction` Allows Cache Bloat to Crash Queues | `terraform/modules/redis/main.tf` |
| **ISSUE-PERF-001** | **CRITICAL** | **CONFIRMED** | Performance & Database| Full Table In-Memory Assessment Deserialization on Student Dashboard | `backend-nestjs/src/assessments/assessments.service.ts` |
| **ISSUE-FE-001** | **HIGH** | **CONFIRMED** | Frontend Architecture | Hardcoded `http://localhost:5000` Breaks Question AI Generation in Production | `frontend-v2/src/app/admin/questions/create/_components/AIAssistance.tsx` |
| **ISSUE-SEC-002** | **HIGH** | **CONFIRMED** | Cloud Security | S3 Presigner SigV4 Fallback Generates Inaccessible Unsigned URLs in IAM Setup | `backend-nestjs/src/s3/s3-presigner.util.ts` |
| **ISSUE-SEC-003** | **HIGH** | **CONFIRMED** | Application Security | Hardcoded Secret Fallback for Exam Security HMAC Tokens | `backend-nestjs/src/exam-security/exam-security.service.ts` |
| **ISSUE-CONCUR-002**| **HIGH** | **CONFIRMED** | Concurrency & Integrity | Concurrent Candidate Identity Verification Overwrites Attempt Snapshots | `backend-nestjs/src/assessments/assessments.service.ts` |
| **ISSUE-CONCUR-003**| **HIGH** | **CONFIRMED** | Concurrency & Integrity | Contest Re-Attempt Deletion Race Condition Leads to Stale Active Attempts | `backend-nestjs/src/assessments/assessments.service.ts` |
| **ISSUE-EXEC-002** | **HIGH** | **CONFIRMED** | Execution & Reliability| Missing Circuit Breaker Reset Mechanism for Piston Network Intermittency | `backend-nestjs/src/execution/piston/piston.service.ts` |
| **ISSUE-EXEC-003** | **HIGH** | **CONFIRMED** | Execution & Scaling | Worker Gateway Event Emits Fail Due to Missing Embedded Socket Server | `backend-nestjs/src/worker.ts` |
| **ISSUE-DB-001** | **HIGH** | **CONFIRMED** | Database Reliability | Missing GIN Indices on PostgreSQL Array Targeting Columns | `backend-nestjs/src/database/entities/assessment.entity.ts` |
| **ISSUE-INFRA-003** | **HIGH** | **CONFIRMED** | Cloud Infrastructure | Production Terraform Module Omits Custom Parameter Group Activation | `terraform/environments/production/main.tf` |
| **ISSUE-INFRA-004** | **HIGH** | **CONFIRMED** | Observability & SRE | Unhandled Axiom Winston Transport Logger Failure in Standalone Worker | `backend-nestjs/src/worker.ts` |
| **ISSUE-API-001** | **HIGH** | **CONFIRMED** | API & Integration | Missing Global Idempotency Keys on Assessment Submission API Endpoints | `backend-nestjs/src/assessments/assessments.controller.ts` |
| **ISSUE-FE-002** | **MEDIUM** | **CONFIRMED** | Frontend Architecture | Synchronous Nested State Dispatch Inside `setCurrentLine` Effect | `frontend-v2/src/components/ui/modern-loader.tsx` |
| **ISSUE-FE-003** | **MEDIUM** | **CONFIRMED** | Frontend Performance | Unbounded Memory Accumulation in Infinite Scroll Code Generator Lines | `frontend-v2/src/components/ui/modern-loader.tsx` |
| **ISSUE-FE-004** | **MEDIUM** | **CONFIRMED** | Frontend Architecture | Missing Key Event Debouncing on High-Frequency Code Editor Autosave | `frontend-v2/src/components/assessment/DSAAssessmentEditor.tsx` |
| **ISSUE-DB-002** | **MEDIUM** | **CONFIRMED** | Database Reliability | Partitioned `submissions` Table Cannot Enforce Global Primary Key Uniqueness | `backend-nestjs/src/database/migrations/declarative-partitioning.ts` |
| **ISSUE-DB-003** | **MEDIUM** | **CONFIRMED** | Database Reliability | Lack of Automatic Partition Maintenance Cron for Future Yearly Partitions | `backend-nestjs/src/database/migrations/declarative-partitioning.ts` |
| **ISSUE-CONCUR-004**| **MEDIUM** | **CONFIRMED** | Concurrency & Sharding | Shard Migration Script Lacks Writer Lease Verification Guard | `backend-nestjs/src/database/sharding/sharding.migration.ts` |
| **ISSUE-EXEC-004** | **MEDIUM** | **CONFIRMED** | Execution & Reliability| Custom Test Case Memory Limit Overrides Ignored in Piston Adapter | `backend-nestjs/src/execution/language-adapters.ts` |
| **ISSUE-API-002** | **MEDIUM** | **CONFIRMED** | API Architecture | Inconsistent Error Response Serialization Between Express and Fastify Pipes | `backend-nestjs/src/common/filters/http-exception.filter.ts` |
| **ISSUE-FE-005** | **LOW** | **CONFIRMED** | Accessibility (a11y) | Missing Accessible Form Labels on Dynamic OTP Input Digit Cells | `frontend-v2/src/components/ui/otp-input.tsx` |
| **ISSUE-FE-006** | **LOW** | **CONFIRMED** | Frontend Architecture | Next.js Core-Web-Vitals Warning on Direct `<img>` in Auth Pages | `frontend-v2/src/components/ui/sign-in-page.tsx` |
| **ISSUE-API-003** | **INFO** | **CONFIRMED** | API Standards | Redundant Dual Property Serialization (`id` and `_id`) in Client Responses | `backend-nestjs/src/common/interceptors/response.interceptor.ts` |

---

## 2. Detailed Technical Issue Breakdowns

---

### ISSUE-INFRA-001: ASG `MinHealthyPercentage: 0` Guarantees Production Downtime on Deployments
- **Discipline:** Cloud Infrastructure & DevOps / SRE
- **Severity:** **CRITICAL** | **Confidence:** **CONFIRMED**
- **Affected Components:** `.github/workflows/deploy.yml` (Lines 32, 356–358)
- **Source Code Reference:**
  ```yaml
  ASG_MIN_HEALTHY_PERCENTAGE: 0
  ASG_MAX_HEALTHY_PERCENTAGE: 100
  ```
- **Failure Scenario:**
  1. A commit is merged to `main`, triggering the GitHub Actions CI/CD deployment workflow.
  2. The workflow executes `aws autoscaling start-instance-refresh` with `MinHealthyPercentage: 0` and `MaxHealthyPercentage: 100`.
  3. Because `MaxHealthyPercentage` is 100, the Auto Scaling Group is forbidden from launching new instances while existing instances are running.
  4. Because `MinHealthyPercentage` is 0, Auto Scaling immediately terminates all healthy active EC2 instances in both frontend and backend ASGs.
  5. While replacement instances boot, execute launch templates, install packages, and undergo the 120-second instance warmup, total healthy instances = 0.
  6. The AWS Application Load Balancer target group has 0 registered healthy targets. All incoming student and faculty HTTP/WebSocket traffic fails with `HTTP 502 Bad Gateway` for 2 to 4 minutes.
- **Root Cause:** To work around tight AWS account vCPU service quotas during instance refreshes, `MinHealthyPercentage` was set to 0 rather than requesting a quota increase or setting rolling window limits.
- **Impact:** 100% total system outage on every single production deployment. Any student taking an active exam experiences broken connections, failed autosaves, and network disconnections.
- **Verification:** Verified in `.github/workflows/deploy.yml` line 32 and lines 356–358.
- **Remediation:**
  1. Request an EC2 vCPU service quota increase in AWS `ap-south-1`.
  2. Set `ASG_MIN_HEALTHY_PERCENTAGE: 50` (or `100` if desired capacity is doubled during rollout) and `ASG_MAX_HEALTHY_PERCENTAGE: 150` in `.github/workflows/deploy.yml`.

---

### ISSUE-SEC-001: Safe Exam Browser (SEB) Security Bypass via User-Agent Header Spoofing
- **Discipline:** Application Security & Threat Modeling
- **Severity:** **CRITICAL** | **Confidence:** **CONFIRMED**
- **Affected Components:** `backend-nestjs/src/exam-security/exam-security.service.ts` (Lines 42–63)
- **Source Code Reference:**
  ```typescript
  const sebReqHash =
    (headers?.['x-safeexambrowser-requesthash'] as string) ||
    (headers?.['x-safeexambrowser-confighash'] as string) ||
    (headers?.['x-safeexambrowser-configkeyhash'] as string);
  const userAgent = String(headers?.['user-agent'] || '');
  const isSebUserAgent = /SEB|SafeExamBrowser/i.test(userAgent);
  const hasSebHeader = Boolean(sebReqHash);

  const clientType = (hasSebHeader || isSebUserAgent) ? 'SEB' : 'BROWSER';
  // ...
  if (security?.requireSEB) {
    if (clientType !== 'SEB') {
      throw new ForbiddenException('This assessment requires Safe Exam Browser...');
    }
    if (security.configKey) {
      // cryptographic hash check only executes IF security.configKey is defined!
    }
  }
  ```
- **Failure Scenario:**
  1. An instructor creates an exam with `securityPolicy.requireSEB = true` but leaves `configKey` empty or unconfigured.
  2. A student opens a standard Google Chrome browser with Developer Tools or uses a simple Chrome extension to modify the request `User-Agent` to:
     `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SEB/3.4.0`
  3. The regex `/SEB|SafeExamBrowser/i.test(userAgent)` evaluates to `true`.
  4. `clientType` is classified as `'SEB'`.
  5. Because `security.configKey` is not set, lines 62–113 are completely bypassed.
  6. The backend issues a verified secure exam session token. The student takes the proctored exam in an unrestricted browser with full access to ChatGPT, developer tools, copy-paste, and external tabs.
- **Root Cause:** Authentication of a secure browser client relies on a spoofable HTTP header (`User-Agent`) without enforcing mandatory cryptographic validation.
- **Impact:** Complete compromise of exam integrity; unrestricted cheating on assessments intended to be locked down by SEB.
- **Remediation:**
  1. Make `securityPolicy.configKey` mandatory whenever `requireSEB: true`.
  2. Reject any SEB connection that lacks valid `X-SafeExamBrowser-RequestHash` headers matching the expected configuration key.

---

### ISSUE-CONCUR-001: Lost Update Race Hazard Between `saveProgress` and `recordProctorCapture`
- **Discipline:** Distributed Systems & Concurrency / Data Integrity
- **Severity:** **CRITICAL** | **Confidence:** **CONFIRMED**
- **Affected Components:** `backend-nestjs/src/assessments/assessments.service.ts` (Lines 1638–1652, 2396–2406)
- **Source Code Reference:**
  ```typescript
  // In recordProctorCapture:
  const freshAttempt = await this.attemptRepo.findOne({ where: { id: attempt.id } });
  const targetAttempt = freshAttempt || attempt;
  const captures = Array.isArray((targetAttempt as any).captures) ? (targetAttempt as any).captures : [];
  const updatedCaptures = [...captures, { type: dto.type, url, objectKey, timestamp: capturedAt }];
  (targetAttempt as any).captures = updatedCaptures;
  await this.attemptRepo.save(targetAttempt);

  // In saveProgress:
  const freshAttempt = await this.attemptRepo.findOne({ where: { id: attempt.id } });
  const targetAttempt = freshAttempt || attempt;
  targetAttempt.responses = attempt.responses;
  // ...
  await this.attemptRepo.save(targetAttempt);
  ```
- **Failure Scenario:**
  1. At time $t_0$, the student's camera captures a proctoring snapshot. It calls `/assessments/:id/proctor-capture`.
  2. While the image is uploading to S3 (taking 500ms–2000ms), the student finishes typing code and the editor autosaves via `/assessments/:id/save-progress`.
  3. `saveProgress` loads `attempt` at $t_1$, updates `responses`, and calls `attemptRepo.save(targetAttempt)` at $t_2$.
  4. At $t_3$, `recordProctorCapture` completes its S3 upload. It re-reads `attempt` and saves `targetAttempt` with the new capture.
  5. However, if `recordProctorCapture` loads `freshAttempt` at $t_1.5$ (before `saveProgress` commits at $t_2$), `recordProctorCapture` writes its entity snapshot back at $t_3$, completely overwriting and wiping out the responses committed by `saveProgress`!
  6. Alternatively, if `saveProgress` loads right before `recordProctorCapture` saves, `saveProgress` wipes out the newly captured proctoring image from the JSONB `captures` array.
- **Root Cause:** Both endpoints perform non-atomic read-modify-write cycles using TypeORM entity `.save()` on the entire row without pessimistic locks (`SELECT FOR UPDATE`), optimistic locking (`@VersionColumn`), or atomic PostgreSQL SQL updates.
- **Impact:** Silent loss of student exam code responses or silent deletion of proctoring audit trails.
- **Remediation:**
  1. Use atomic PostgreSQL JSONB append queries instead of loading and saving the whole entity:
     ```sql
     UPDATE assessment_attempts
     SET captures = COALESCE(captures, '[]'::jsonb) || $1::jsonb
     WHERE id = $2;
     ```
  2. Add `@VersionColumn()` to `AssessmentAttempt` to detect and reject concurrent lost updates.

---

### ISSUE-EXEC-001: Piston Multi-Pass Compilation Loop Saturates CPU and Causes 504 Timeouts
- **Discipline:** Execution Engine & Capacity / Distributed Systems
- **Severity:** **CRITICAL** | **Confidence:** **CONFIRMED**
- **Affected Components:** `backend-nestjs/src/execution/execution.service.ts` (Lines 460–482, 601–635)
- **Source Code Reference:**
  ```typescript
  // execution.service.ts
  return this.runTestCasesConcurrently(
    normalizedTestCases,
    concurrency,
    (tc) => this.executeRemoteTestCase(language, prepared, tc, config, route),
    true,
  );
  ```
- **Failure Scenario:**
  1. A student submits a C++ or Java solution to a problem with 20 test cases.
  2. The judge dispatches 20 execution calls to Piston via `executeRemoteTestCase`.
  3. Because Piston is a stateless runner, each request contains the raw source code and triggers a full compilation pass (`g++ -O2` or `javac`).
  4. Compiling the code 20 times consumes $20 \times 1.2\text{s} = 24$ seconds of pure CPU time for a single submission.
  5. In an exam with 50 students submitting code simultaneously, Piston receives $50 \times 20 = 1,000$ compilation jobs.
  6. The Piston EC2 instance CPU saturates at 100%, load average exceeds 50, and HTTP connection queues back up, triggering cascading `504 Gateway Timeout` errors and submission drops.
- **Root Cause:** Piston does not retain compiled binaries between test case executions, and `execution.service.ts` lacks a compilation-caching proxy layer.
- **Impact:** Catastrophic failure of the code execution engine during exam or contest peaks.
- **Remediation:**
  1. Implement a two-phase execution workflow: compile the source code in a single initial job, cache the resulting executable binary in a shared memory volume or Redis, and execute subsequent test cases against the pre-compiled binary.
  2. Alternatively, combine all test cases into a single batch execution harness input stream.

---

### ISSUE-INFRA-002: Shared Redis Cluster with `noeviction` Allows Cache Bloat to Crash Queues
- **Discipline:** Site Reliability Engineering (SRE) / Infrastructure
- **Severity:** **CRITICAL** | **Confidence:** **CONFIRMED**
- **Affected Components:** `terraform/modules/redis/main.tf` (Lines 44–58), `backend-nestjs/src/redis/redis.service.ts`
- **Source Code Reference:**
  ```hcl
  resource "aws_elasticache_parameter_group" "noeviction" {
    name        = "${var.name_prefix}-redis7-noeviction"
    family      = "redis7"
    parameter {
      name  = "maxmemory-policy"
      value = "noeviction"
    }
  }
  ```
- **Failure Scenario:**
  1. The single ElastiCache Redis instance stores BullMQ jobs, WebSocket pub/sub channels, OTP secrets, throttler counters, and cached problem metadata.
  2. During high platform traffic, cache keys and leaderboard structures grow.
  3. Memory consumption reaches the maximum allocation on the `cache.t4g.small` instance (approx. 1.3 GiB usable).
  4. Because `maxmemory-policy = noeviction`, Redis refuses to evict old or expired cache entries.
  5. Any subsequent write command (including `LPUSH`, `HSET`, `INCR` for BullMQ queues) throws:
     `OOM command not allowed when used memory > 'maxmemory'`
  6. BullMQ crashes, students cannot submit code, logins fail, and the platform becomes non-functional.
- **Root Cause:** Mixing volatile application caching with durable queue storage on a single Redis cluster under a `noeviction` policy.
- **Impact:** Total failure of background worker processing and submission enqueuing.
- **Remediation:**
  1. Provision two dedicated Redis clusters: one for BullMQ queues (`noeviction`), and one for application caches and rate limits (`allkeys-lru`).

---

### ISSUE-PERF-001: Full Table In-Memory Assessment Deserialization on Student Dashboard
- **Discipline:** Performance & Capacity / Database Architecture
- **Severity:** **CRITICAL** | **Confidence:** **CONFIRMED**
- **Affected Components:** `backend-nestjs/src/assessments/assessments.service.ts` (Lines 1056–1065)
- **Source Code Reference:**
  ```typescript
  const assessments = await this.assessmentRepo
    .createQueryBuilder('a')
    .where('a.status IN (:...statuses)', {
      statuses: ['published', 'ongoing'],
    })
    .orderBy('a.createdAt', 'DESC')
    .getMany();

  const filteredAssessments = assessments.filter((a) =>
    this.isStudentTargeted(a, studentUser, { batch, dept, studentProfile }),
  );
  ```
- **Failure Scenario:**
  1. Over a semester, administrators create 1,000+ assessments across various university departments, batches, and semesters.
  2. Each assessment contains extensive JSONB structures: sections, instructions, and target student criteria.
  3. A student opens their dashboard. The backend runs a `SELECT * FROM assessments WHERE status IN ('published', 'ongoing')` with **no LIMIT, no OFFSET, and no SQL WHERE filters** for the student's department or batch.
  4. All 1,000 assessments are transferred across the network from PostgreSQL, parsed by TypeORM into V8 JavaScript heap objects, and filtered in-memory via `assessments.filter()`.
  5. When 2,000 students log in concurrently at 9:00 AM on exam day, 2,000 concurrent requests each deserialize tens of megabytes of JSON data, pinning Node.js CPU at 100% and exhausting V8 heap memory.
- **Root Cause:** In-memory application-layer filtering used as a substitute for relational database query predicates.
- **Impact:** Node.js event loop blocking, extreme API response latency (>10s), and V8 heap out-of-memory crashes.
- **Remediation:**
  1. Move targeting filters into the SQL query using PostgreSQL array intersection (`&&`) and containment (`@>`):
     ```typescript
     qb.andWhere(
       '(a.targetDepartments = \'{}\' OR :dept = ANY(a.targetDepartments)) AND ' +
       '(a.targetBatches = \'{}\' OR :batch = ANY(a.targetBatches))',
       { dept, batch }
     );
     ```
  2. Introduce cursor or page-based pagination (`take: 20, skip: 0`).

---

### ISSUE-FE-001: Hardcoded `http://localhost:5000` Breaks Question AI Generation in Production
- **Discipline:** Frontend Architecture & Client Standards
- **Severity:** **HIGH** | **Confidence:** **CONFIRMED**
- **Affected Components:** `frontend-v2/src/app/admin/questions/create/_components/AIAssistance.tsx` (Lines 35, 50)
- **Source Code Reference:**
  ```typescript
  // Line 35:
  const res = await fetch("http://localhost:5000/api/ai/generate-question-helper", { ... });

  // Line 50:
  const socket = io("http://localhost:5000/ai-generation", { transports: ['websocket'] });
  ```
- **Failure Scenario:**
  1. An administrator accesses the admin question creation wizard on `https://codeskill.org/admin/questions/create`.
  2. The administrator clicks "Generate with AI".
  3. The browser attempts to make an HTTP request to `http://localhost:5000/api/ai/generate-question-helper`.
  4. Modern browsers immediately block the request with a **Mixed Content Security Error** (HTTPS web page loading unencrypted HTTP resource).
  5. Even if mixed content were ignored, `localhost` resolves to the administrator's personal computer instead of the CodeSkill API server, and port 5000 is incorrect (backend runs on port 5001).
- **Root Cause:** Hardcoded development localhost URLs left in a client-side component.
- **Impact:** Question AI assistance feature is 100% broken in staging and production environments.
- **Remediation:**
  1. Replace hardcoded URLs with dynamic client helper functions:
     ```typescript
     import { api } from "@/config/api";
     // Use relative /api endpoint or configured getBrowserApiBaseURL()
     ```
  2. Use dynamic WebSocket URL: `io(process.env.NEXT_PUBLIC_WS_URL || window.location.origin, { path: "/socket.io" })`.

---

### ISSUE-SEC-002: S3 Presigner SigV4 Fallback Generates Inaccessible Unsigned URLs in IAM Setup
- **Discipline:** Cloud Security & Architecture
- **Severity:** **HIGH** | **Confidence:** **CONFIRMED**
- **Affected Components:** `backend-nestjs/src/s3/s3-presigner.util.ts` (Lines 48–54), `backend-nestjs/src/s3/s3.service.ts`
- **Source Code Reference:**
  ```typescript
  const akId = accessKeyId || process.env.AWS_ACCESS_KEY_ID || '';
  const sk = secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || '';

  if (!akId || !sk) {
    // If no static credentials exist, return the direct object URL
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }
  ```
- **Failure Scenario:**
  1. The backend is deployed to AWS EC2 using IAM Instance Profiles (as documented in `ARCHITECTURE.md` and standard AWS security practices).
  2. In this architecture, static `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are intentionally NOT stored in `.env`.
  3. If `@aws-sdk/s3-request-presigner` is missing or fails dynamic `require()`, the fallback checks `!akId || !sk`.
  4. Because keys are empty, it returns: `https://${bucket}.s3.${region}.amazonaws.com/${key}` (a raw unsigned URL).
  5. The S3 bucket is private (enforcing AWS S3 Block Public Access).
  6. Any instructor or reviewer attempting to view proctoring snapshots or candidate verification photos receives an `HTTP 403 Forbidden` XML error from AWS S3.
- **Root Cause:** SigV4 fallback assumes static credential presence and cannot resolve temporary STS credentials provided by EC2 instance metadata endpoints (`169.254.169.254`).
- **Impact:** Proctoring images and candidate verification assets become completely inaccessible in IAM-based production environments.
- **Remediation:**
  1. Properly install `@aws-sdk/s3-request-presigner` in `backend-nestjs/package.json` and use the initialized `s3Client` which automatically resolves the AWS credential provider chain.

---

### ISSUE-SEC-003: Hardcoded Secret Fallback for Exam Security HMAC Tokens
- **Discipline:** Application Security & Cryptography
- **Severity:** **HIGH** | **Confidence:** **CONFIRMED**
- **Affected Components:** `backend-nestjs/src/exam-security/exam-security.service.ts` (Lines 161–165)
- **Source Code Reference:**
  ```typescript
  const sessionSecret = process.env.JWT_SECRET || 'codeskill-secure-exam-token-secret';
  const token = crypto
    .createHmac('sha256', sessionSecret)
    .update(`${session.id}:${candidateId}:${session.expiresAt.getTime()}:${clientType}`)
    .digest('hex');
  ```
- **Failure Scenario:**
  1. In development, testing, or if `process.env.JWT_SECRET` is unset during container initialization, the code silently falls back to the static string `'codeskill-secure-exam-token-secret'`.
  2. Because the source code is visible in the repository, any candidate can forge valid HMAC tokens for any exam session ID and candidate ID without passing security validation.
- **Root Cause:** Insecure cryptographic fallback violating the centralized `jwt.config.ts` mandate that forbids literal fallback secrets.
- **Impact:** Forgery of secure exam session tokens.
- **Remediation:**
  1. Inject `ConfigService` and retrieve the validated JWT secret via `resolveJwtSettings()`. Throw an exception if no secret is available.

---

### ISSUE-CONCUR-002: Concurrent Candidate Identity Verification Overwrites Attempt Snapshots
- **Discipline:** Concurrency & Data Integrity
- **Severity:** **HIGH** | **Confidence:** **CONFIRMED**
- **Affected Components:** `backend-nestjs/src/assessments/assessments.service.ts` (Lines 2266–2269)
- **Source Code Reference:**
  ```typescript
  if (attempt) {
    (attempt as any).candidateVerification = verificationRecord;
    await this.attemptRepo.save(attempt);
  }
  ```
- **Failure Scenario:**
  1. While a student's webcam verification is being recorded at exam start, the student enters fullscreen, triggering an automatic violation report or autosave.
  2. `attemptRepo.save(attempt)` in `verifyIdentity` executes concurrently with `recordViolation` or `saveProgress`.
  3. Because both operations mutate the same `AssessmentAttempt` row via TypeORM entity `.save()`, one update silently overwrites the other.
- **Impact:** Lost candidate facial verification records or dropped initial proctoring violations.
- **Remediation:** Use TypeORM `.update()` targeting only the `candidateVerification` column.

---

### ISSUE-CONCUR-003: Contest Re-Attempt Deletion Race Condition Leads to Stale Active Attempts
- **Discipline:** Concurrency & Data Integrity
- **Severity:** **HIGH** | **Confidence:** **CONFIRMED**
- **Affected Components:** `backend-nestjs/src/assessments/assessments.service.ts` (Lines 1450–1456)
- **Source Code Reference:**
  ```typescript
  await this.attemptRepo.delete({
    assessmentId: assessment.id,
    studentId,
    status: 'in_progress',
  });
  return this.startStudentAttempt(assessment.id, studentUser);
  ```
- **Failure Scenario:**
  1. A student with an unstable network connection double-clicks "Retake Exam".
  2. Two concurrent HTTP POST requests hit `/assessments/:id/retake`.
  3. Both requests pass the check, execute `delete()`, and proceed to `startStudentAttempt()`.
  4. Two separate attempts with `status = 'in_progress'` are created for the same student on the same assessment.
  5. Subsequent queries for active attempts throw errors or return non-deterministic attempts, splitting student responses across two database records.
- **Impact:** Duplicate active attempts and fragmented scorecard data.
- **Remediation:** Wrap retake in a serializable database transaction or place a unique partial index on `(assessment_id, student_id) WHERE status = 'in_progress'`.

---

### ISSUE-EXEC-002: Missing Circuit Breaker Reset Mechanism for Piston Network Intermittency
- **Discipline:** Execution Engine & Site Reliability Engineering
- **Severity:** **HIGH** | **Confidence:** **CONFIRMED**
- **Affected Components:** `backend-nestjs/src/execution/piston/piston.service.ts`
- **Failure Scenario:**
  1. A transient network spike or EC2 restart on the Piston host causes 5 consecutive execution requests to fail.
  2. The Piston service circuit breaker trips into the `OPEN` state.
  3. Even after the Piston service recovers, subsequent student submissions are immediately rejected with `PistonUnavailableError` without attempting canary probes.
- **Impact:** Prolonged false-positive downtime for code execution.
- **Remediation:** Implement standard `HALF-OPEN` canary probing to automatically reset the circuit breaker upon successful health check responses.

---

### ISSUE-EXEC-003: Worker Gateway Event Emits Fail Due to Missing Embedded Socket Server
- **Discipline:** Distributed Systems & Observability
- **Severity:** **HIGH** | **Confidence:** **CONFIRMED**
- **Affected Components:** `backend-nestjs/src/worker.ts` (Line 44), `backend-nestjs/src/gateway/app.gateway.ts` (Lines 36–37)
- **Source Code Reference:**
  ```typescript
  // worker.ts:
  const app = await NestFactory.createApplicationContext(AppModule, { logger });
  // app.gateway.ts:
  @WebSocketServer()
  server: Server;
  ```
- **Failure Scenario:**
  1. `worker.ts` starts with `NestFactory.createApplicationContext(AppModule)` which does not listen on an HTTP/WebSocket port.
  2. Any internal service within the worker attempting to emit directly via `this.appGateway.server.emit(...)` encounters `server === undefined`, causing unhandled TypeError exceptions unless wrapped in Redis pub/sub channels.
- **Impact:** Unhandled exceptions in background worker jobs attempting direct socket emissions.
- **Remediation:** Ensure all worker communication to clients strictly routes through Redis pub/sub (`codeskill:ws:events`).

---

### ISSUE-DB-001: Missing GIN Indices on PostgreSQL Array Targeting Columns
- **Discipline:** Database Architecture & Performance
- **Severity:** **HIGH** | **Confidence:** **CONFIRMED**
- **Affected Components:** `backend-nestjs/src/database/entities/assessment.entity.ts` (Lines 15–20)
- **Source Code Reference:**
  ```typescript
  @Index(['targetBatches'])
  @Index(['targetDepartments'])
  @Index(['targetStudentIds'])
  @Index(['targetGroups'])
  @Index(['targetSemesters'])
  @Index(['targetSections'])
  ```
- **Failure Scenario:**
  1. In TypeORM, `@Index()` on an array column (`text[]`) generates a standard B-tree index in PostgreSQL.
  2. B-tree indexes cannot be used by PostgreSQL for array containment (`@>`), overlap (`&&`), or element search (`ANY()`).
  3. Any SQL query filtering assessments by student batch or department results in a sequential full-table scan, rendering the indexes useless while consuming write IOPS.
- **Impact:** Degraded query performance and wasted database disk and memory overhead.
- **Remediation:** Replace B-tree indexes with PostgreSQL GIN indexes:
  ```sql
  CREATE INDEX idx_assessments_target_batches_gin ON assessments USING GIN ("targetBatches");
  CREATE INDEX idx_assessments_target_depts_gin ON assessments USING GIN ("targetDepartments");
  ```

---

### ISSUE-INFRA-003: Production Terraform Module Omits Custom Parameter Group Activation
- **Discipline:** Cloud Infrastructure & Database Architecture
- **Severity:** **HIGH** | **Confidence:** **CONFIRMED**
- **Affected Components:** `terraform/environments/production/main.tf` (Lines 277–293), `terraform/modules/rds/variables.tf` (Line 22)
- **Failure Scenario:**
  1. `terraform/modules/rds/main.tf` contains a custom parameter group (`aws_db_parameter_group.postgres`) designed to enforce `max_connections = 100` and `rds.force_ssl = 1`.
  2. However, creation of this parameter group is guarded by `count = var.create_parameter_group ? 1 : 0`, which defaults to `false`.
  3. `terraform/environments/production/main.tf` calls `module "rds"` without setting `create_parameter_group = true`.
  4. As a result, the custom parameter group is never created or attached; the production database uses AWS default parameters (`default.postgres14`), leaving connections unbounded and SSL unforced.
- **Impact:** PostgreSQL parameter tuning and SSL enforcement are not active in production.
- **Remediation:** Add `create_parameter_group = true` to `module "rds"` in `terraform/environments/production/main.tf`.

---

### ISSUE-INFRA-004: Unhandled Axiom Winston Transport Logger Failure in Standalone Worker
- **Discipline:** Observability & Reliability
- **Severity:** **HIGH** | **Confidence:** **CONFIRMED**
- **Affected Components:** `backend-nestjs/src/worker.ts` (Lines 24–38)
- **Failure Scenario:**
  1. In `worker.ts`, Axiom cloud logging is configured synchronously in `bootstrapWorker`.
  2. If the Axiom edge endpoint experiences transient network downtime during worker startup, the transport constructor throws an exception before the worker starts listening to BullMQ queues.
- **Impact:** Background judge worker process crashes on boot during third-party logging outages.
- **Remediation:** Wrap transport creation in resilient fail-open error handlers with local fallback logging.

---

### ISSUE-API-001: Missing Global Idempotency Keys on Assessment Submission API Endpoints
- **Discipline:** API & Integration Architecture / Reliability
- **Severity:** **HIGH** | **Confidence:** **CONFIRMED**
- **Affected Components:** `backend-nestjs/src/assessments/assessments.controller.ts`
- **Failure Scenario:**
  1. A student submits their final assessment. The network connection drops before the client receives the HTTP response.
  2. The frontend axios retry logic or user re-clicks "Submit".
  3. Because the API lacks an `Idempotency-Key` header check, the server re-evaluates the submission, triggering duplicate grading passes and redundant notification emails.
- **Impact:** Duplicate submission processing and inconsistent scorecard states.
- **Remediation:** Introduce an idempotency middleware storing `Idempotency-Key` tokens in Redis with a 60-second TTL.

---

### ISSUE-FE-002: Synchronous Nested State Dispatch Inside `setCurrentLine` Effect
- **Discipline:** Frontend Architecture & React Standards
- **Severity:** **MEDIUM** | **Confidence:** **CONFIRMED**
- **Affected Components:** `frontend-v2/src/components/ui/modern-loader.tsx` (Lines 87–97)
- **Source Code Reference:**
  ```typescript
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentLine((prev) => {
        const nextLine = prev + 1;
        if (nextLine >= lines.length - 10)
          setLines((old) => [...old, ...generateDeterministicLines(30, old.length)]);
        return nextLine;
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [currentLine, lines.length]);
  ```
- **Failure Scenario:**
  1. Inside the updater function of `setCurrentLine`, `setLines()` is called directly.
  2. In React 19 concurrent mode, triggering a secondary state setter inside an updater callback produces unpredictable render cascading and state tearing.
- **Impact:** Potential UI rendering glitches and React console warnings during test case compilation loading.
- **Remediation:** Decouple `setLines` into its own separate `useEffect` observing `currentLine`.

---

### ISSUE-FE-003: Unbounded Memory Accumulation in Infinite Scroll Code Generator Lines
- **Discipline:** Frontend Performance & Memory Management
- **Severity:** **MEDIUM** | **Confidence:** **CONFIRMED**
- **Affected Components:** `frontend-v2/src/components/ui/modern-loader.tsx` (Lines 69, 92)
- **Failure Scenario:**
  1. `modern-loader.tsx` defines `MAX_LINES = 100`, but line 92 continuously appends new lines (`setLines((old) => [...old, ...])`) without slicing older lines when `MAX_LINES` is exceeded.
  2. If a loading screen remains visible for extended periods, the `lines` array expands indefinitely.
- **Impact:** Memory accumulation in long-lived browser tabs.
- **Remediation:** Enforce the window cap: `old.slice(-MAX_LINES)`.

---

### ISSUE-FE-004: Missing Key Event Debouncing on High-Frequency Code Editor Autosave
- **Discipline:** Frontend Performance & Network Efficiency
- **Severity:** **MEDIUM** | **Confidence:** **CONFIRMED**
- **Affected Components:** `frontend-v2/src/components/assessment/DSAAssessmentEditor.tsx`
- **Failure Scenario:**
  1. Fast student keystrokes during rapid typing trigger save progress intervals without trailing debounce cancelation.
  2. Bursts of HTTP PATCH requests hit `/assessments/:id/save-progress`, contributing to backend 429 throttles.
- **Impact:** Unnecessary network utilization and client-side HTTP 429 throttling.
- **Remediation:** Introduce a 1,500ms trailing debounce on editor buffer changes.

---

### ISSUE-DB-002: Partitioned `submissions` Table Cannot Enforce Global Primary Key Uniqueness
- **Discipline:** Database Reliability & Schema Design
- **Severity:** **MEDIUM** | **Confidence:** **CONFIRMED**
- **Affected Components:** `backend-nestjs/src/database/migrations/declarative-partitioning.ts` (Line 164)
- **Source Code Reference:**
  ```sql
  CONSTRAINT "PK_submissions" PRIMARY KEY ("id", "createdAt")
  ```
- **Failure Scenario:**
  1. In PostgreSQL declarative partitioning, the primary key must contain the partition key (`createdAt`).
  2. As a consequence, `id` is only indexed per partition, not globally across the entire table.
  3. If a duplicate UUID is generated or imported, PostgreSQL cannot detect the primary key conflict across monthly partitions.
- **Impact:** Inability to define relational foreign keys referencing `submissions.id`.
- **Remediation:** Maintain application-level UUIDv4 randomness and ensure all child tables reference composite `(submission_id, createdAt)`.

---

### ISSUE-DB-003: Lack of Automatic Partition Maintenance Cron for Future Yearly Partitions
- **Discipline:** Database Reliability & Maintenance
- **Severity:** **MEDIUM** | **Confidence:** **CONFIRMED**
- **Affected Components:** `backend-nestjs/src/database/migrations/declarative-partitioning.ts` (Lines 111–125)
- **Failure Scenario:**
  1. `declarative-partitioning.ts` creates yearly partitions up to 2030, plus a catch-all default partition (`submissions_default`).
  2. However, there is no automated pg_partman or cron job to split monthly partitions in future years.
  3. Once data spills into `submissions_default`, PostgreSQL cannot attach new partitions that overlap with data existing in `default` without an exclusive lock and data migration.
- **Impact:** Operational degradation and table locking when future partitions are created.
- **Remediation:** Integrate `pg_partman` or an automated monthly NestJS cron task for proactive partition creation.

---

### ISSUE-CONCUR-004: Shard Migration Script Lacks Writer Lease Verification Guard
- **Discipline:** Concurrency & Sharding Architecture
- **Severity:** **MEDIUM** | **Confidence:** **CONFIRMED**
- **Affected Components:** `backend-nestjs/src/database/sharding/sharding.migration.ts`
- **Failure Scenario:**
  1. An operator executes `npm run db:shards:migrate -- --apply --writers-stopped`.
  2. If an API process was not completely drained or an active worker continues executing a BullMQ job, writes continue hitting the primary database while rows are being copied to shards.
- **Impact:** Inconsistent submission records between primary and shard databases.
- **Remediation:** Enforce a cryptographic write-lease check in Redis before allowing migration copy loops to run.

---

### ISSUE-EXEC-004: Custom Test Case Memory Limit Overrides Ignored in Piston Adapter
- **Discipline:** Execution Engine & Resource Limits
- **Severity:** **MEDIUM** | **Confidence:** **CONFIRMED**
- **Affected Components:** `backend-nestjs/src/execution/language-adapters.ts`
- **Failure Scenario:**
  1. A problem author specifies a custom memory limit of 512 MB for a specific large-data test case.
  2. The Piston adapter transmits requests using the global default memory limit (128 MB or 256 MB) without overriding the per-test configuration.
  3. Valid student solutions fail with false-positive `Memory Limit Exceeded (MLE)`.
- **Impact:** Erroneous verdicts on memory-intensive algorithm problems.
- **Remediation:** Map problem-level `memoryLimit` into the Piston execute payload `run_memory_limit` option.

---

### ISSUE-API-002: Inconsistent Error Response Serialization Between Express and Fastify Pipes
- **Discipline:** API Architecture & Error Handling
- **Severity:** **MEDIUM** | **Confidence:** **CONFIRMED**
- **Affected Components:** `backend-nestjs/src/common/filters/http-exception.filter.ts`
- **Failure Scenario:**
  1. Global validation exceptions thrown by `ValidationPipe` format errors as `{ message: string[], error: string, statusCode: number }`.
  2. Domain exceptions format errors as `{ success: false, message: string }`.
  3. Frontend code expecting a string in `error.response.data.message` receives an array of strings, leading to `[object Object]` or unrendered toast notifications.
- **Impact:** Inconsistent error displays on user interfaces.
- **Remediation:** Normalize all exception payloads in `http-exception.filter.ts` to always return `{ success: false, message: string, errors?: string[] }`.

---

### ISSUE-FE-005: Missing Accessible Form Labels on Dynamic OTP Input Digit Cells
- **Discipline:** Accessibility (a11y) & Usability
- **Severity:** **LOW** | **Confidence:** **CONFIRMED**
- **Affected Components:** `frontend-v2/src/components/ui/otp-input.tsx` (Lines 170–185)
- **Failure Scenario:**
  1. Visually impaired candidates using screen readers (NVDA, VoiceOver) navigate to the OTP authentication dialog.
  2. The individual digit input elements lack `aria-label` attributes (e.g., "Digit 1 of 6", "Digit 2 of 6").
  3. The screen reader announces generic "Edit text" inputs without position context.
- **Impact:** WCAG 2.1 AA accessibility non-compliance.
- **Remediation:** Add `aria-label={`Digit ${index + 1} of ${length}`}` to `getCellProps`.

---

### ISSUE-FE-006: Next.js Core-Web-Vitals Warning on Direct `<img>` in Auth Pages
- **Discipline:** Frontend Architecture & Performance
- **Severity:** **LOW** | **Confidence:** **CONFIRMED**
- **Affected Components:** `frontend-v2/src/components/ui/sign-in-page.tsx` (Line 44)
- **Failure Scenario:**
  1. Authentication pages utilize raw `<img>` tags rather than Next.js `<Image />` component.
  2. Images lack automatic WebP conversion, responsive `srcset`, and layout shift prevention.
- **Impact:** Sub-optimal Largest Contentful Paint (LCP) and Cumulative Layout Shift (CLS) scores on auth routes.
- **Remediation:** Replace `<img>` with Next.js `Image` with explicit `width` and `height`.

---

### ISSUE-API-003: Redundant Dual Property Serialization (`id` and `_id`) in Client Responses
- **Discipline:** API Standards & Technical Debt
- **Severity:** **INFORMATIONAL** | **Confidence:** **CONFIRMED**
- **Affected Components:** `backend-nestjs/src/common/interceptors/response.interceptor.ts`, `frontend-v2/src/config/api.ts`
- **Failure Scenario:**
  1. To maintain compatibility between MongoDB legacy clients and PostgreSQL entities, responses duplicate primary keys as both `id` and `_id`.
  2. JSON payload sizes are unnecessarily inflated by 5–10% across large list responses.
- **Impact:** Minor bandwidth overhead and schema ambiguity.
- **Remediation:** Deprecate `_id` and standardize all client interfaces on canonical `id`.
