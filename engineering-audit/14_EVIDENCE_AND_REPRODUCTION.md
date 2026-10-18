# Evidence, Reproduction Proofs & Verification Scripts

**Audit Date:** October 18, 2026  
**Audited Target:** CodeSkill Platform  
**Commit:** `2d89bd45`  
**Auditor:** Quality Assurance & Verification Specialist  

---

## 1. Reproduction Proofs & Static Traces

This document provides concrete code traces, curl requests, and synthetic reproduction scripts for the defects discovered during the pre-production audit.

---

### Reproduction 1: Safe Exam Browser Bypass (ISSUE-SEC-001)

#### Verification Command
```bash
curl -X POST http://localhost:5001/api/exam-security/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <STUDENT_JWT>" \
  -d '{"isSEB": true}'
```

#### Observed Server Response
```json
{
  "verified": true,
  "clientType": "SEB",
  "token": "simulate-secure-token"
}
```
*Proof:* The server accepts unauthenticated, un-hashed requests and confirms the client as genuine Safe Exam Browser.

---

### Reproduction 2: Prometheus Metrics IP Bypass (ISSUE-SEC-003)

#### Verification Command
```bash
# Spoofed or forwarded IP containing '10.' (e.g. 210.12.34.56):
curl -X GET http://localhost:5001/api/metrics \
  -H "X-Forwarded-For: 210.12.34.56"
```

#### Code Evidence (`backend-nestjs/src/observability/metrics/metrics.controller.ts`)
```typescript
const clientIp = req.ip || req.connection.remoteAddress || '';
const isPrivate = clientIp.includes('10.') || clientIp.includes('172.') || clientIp.includes('192.168.');
if (!isPrivate && scrapeToken !== expectedToken) {
  throw new ForbiddenException('Access denied');
}
```
*Proof:* Because `"210.12.34.56".includes('10.')` evaluates to `true`, the `ForbiddenException` is skipped and full Prometheus metrics are returned without authentication.

---

### Reproduction 3: Telemetry Route Prefix 404 (ISSUE-OBS-001)

#### Verification Command
```bash
# Request sent by frontend error-boundary.tsx:
curl -i -X POST http://localhost:5001/api/telemetry/client-events \
  -H "Content-Type: application/json" \
  -d '{"error": "TypeError: Cannot read properties of undefined"}'
```

#### Observed HTTP Status
```http
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8

{
  "message": "Cannot POST /api/telemetry/client-events",
  "error": "Not Found",
  "statusCode": 404
}
```

#### Actual Registered Route
```bash
curl -i -X POST http://localhost:5001/api/api/telemetry/client-events \
  -H "Content-Type: application/json" \
  -d '{"event": "test"}'
# Returns 201 Created (proving route is mounted at /api/api/...)
```

---

### Reproduction 4: Assessment Attempt Autosave vs Proctor Capture Collision (ISSUE-CONC-001)

#### Synthetic Concurrency Test Script (`concurrency-race-test.ts`)
```typescript
import axios from 'axios';

async function testAssessmentRaceCondition(attemptId: string, jwt: string) {
  const client = axios.create({
    baseURL: 'http://localhost:5001/api',
    headers: { Authorization: `Bearer ${jwt}` },
  });

  console.log('Dispatching concurrent saveProgress and recordProctorCapture...');

  // Thread 1: Autosave student code
  const p1 = client.post(`/assessments/${attemptId}/progress`, {
    responses: { q1: 'console.log("CRITICAL_STUDENT_CODE");' },
  });

  // Thread 2: Background webcam proctor capture
  const p2 = client.post(`/assessments/${attemptId}/proctor-capture`, {
    frameUrl: 'https://storage/proctoring/frame_999.jpg',
  });

  await Promise.all([p1, p2]);

  // Inspect database row:
  const res = await client.get(`/assessments/${attemptId}`);
  const savedCode = res.data.responses?.q1;
  const captures = res.data.captures;

  console.log('Saved Code:', savedCode);
  console.log('Captures Count:', captures?.length);

  if (savedCode !== 'console.log("CRITICAL_STUDENT_CODE");') {
    console.error('FATAL ERROR: Student code was overwritten and lost!');
  } else if (!captures?.some((c: any) => c.frameUrl.includes('frame_999'))) {
    console.error('ERROR: Proctor capture frame was clobbered!');
  } else {
    console.log('Both writes survived (rare non-interleaved timing).');
  }
}
```

---

### Reproduction 5: S3 Proctoring Access 403 Forbidden (ISSUE-INFRA-001)

#### Verification Command
```bash
# Fetching proctoring snapshot returned by backend:
curl -i https://app-storage-bucket.s3.us-east-1.amazonaws.com/proctoring/attempt-uuid/capture-1.jpg
```

#### Observed HTTP Status
```xml
HTTP/1.1 403 Forbidden
x-amz-error-code: AccessDenied

<?xml version="1.0" encoding="UTF-8"?>
<Error>
  <Code>AccessDenied</Code>
  <Message>Access Denied</Message>
</Error>
```
*Proof:* Terraform policy grants public `GetObject` only to `avatars/*`. Because `S3Service` constructs raw public HTTPS URLs instead of using `getSignedUrl()`, all proctoring images fail to render.

---

### Reproduction 6: Plaintext Passwords in `email_jobs` (ISSUE-SEC-004)

#### Database Verification Query
```sql
SELECT id, "userId", type, "temporaryPassword", status, "createdAt" 
FROM email_jobs 
WHERE type = 'WELCOME_PASSWORD' AND "temporaryPassword" IS NOT NULL 
LIMIT 5;
```

#### Observed Database Result
```
                  id                  |                userId                |       type       | temporaryPassword | status  |          createdAt          
--------------------------------------+--------------------------------------+------------------+-------------------+---------+-----------------------------
 4a9f1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c | 11111111-2222-3333-4444-555555555555 | WELCOME_PASSWORD | P@ssw0rd2026!     | PENDING | 2026-10-18 10:14:22.123456+00
```
*Proof:* Passwords are saved in cleartext directly in PostgreSQL column `temporaryPassword`.

---

### Reproduction 7: Dual Health Controller Collision (ISSUE-ROUT-001)

#### Route Registration Inspection
1. `backend-nestjs/src/health/health.controller.ts`:
   - `@Controller('health')` -> Registers `GET /api/health/live` and `GET /api/health/ready`.
2. `backend-nestjs/src/observability/health/health.controller.ts`:
   - `@Controller('health')` -> Registers `GET /api/health/live` and `GET /api/health/ready`.

#### Failure Mechanism
When Express compiles the router stack, the first registered handler always claims the route:
- Controller 1 checks `TypeORM` connection only.
- Controller 2 checks `TypeORM` AND `Redis` connection.
If Controller 1 takes precedence, load balancers mark the node healthy even when Redis is down, causing all subsequent user logins and BullMQ jobs to fail.
