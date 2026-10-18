# Evidence, Reproduction Proofs & Verification Logs (Commit `b846d107`)

**Audit Date:** October 18, 2026  
**Audited Target:** CodeSkill Platform  
**Commit Inspected:** `b846d107`  
**Auditor:** Quality Assurance & Verification Specialist  
**Output Location:** `engineering-audit/`  

---

## 1. Reproduction Proofs & Verification Logs

This document contains empirical commands, observed outputs, and reproduction traces collected during the independent engineering reassessment of commit `b846d107`.

---

### Reproduction 1: Backend TypeScript Compilation & Test Suite Failure (ISSUE-BUILD-001)

#### Verification Command
```bash
(cd backend-nestjs && npx --no-install tsc -p tsconfig.build.json --noEmit --incremental false)
```

#### Observed Compiler Output (Exit Code: 2)
```
src/s3/s3.service.ts:13:30 - error TS2307: Cannot find module '@aws-sdk/s3-request-presigner' or its corresponding type declarations.

13 import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
                                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Found 1 error in src/s3/s3.service.ts:13
```

#### Observed Test Suite Failure (Jest Log)
```bash
npm test --prefix backend-nestjs -- --runInBand
```
Output:
```
FAIL src/assessments/assessment-concurrency-integrity.spec.ts
  ● Test suite failed to run

    Cannot find module '@aws-sdk/s3-request-presigner' from 's3/s3.service.ts'

    Require stack:
      s3/s3.service.ts
      assessments/assessments.service.ts
      assessments/assessment-concurrency-integrity.spec.ts

      11 |   GetObjectCommand,
      12 | } from '@aws-sdk/client-s3';
    > 13 | import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
         | ^

Test Suites: 9 failed, 63 passed, 72 total
Tests:       9 skipped, 535 passed, 544 total
Snapshots:   0 total
Time:        15.043 s
```
*Proof:* The missing dependency breaks the TypeScript build and immediately fails 9 backend test suites.

---

### Reproduction 2: Safe Exam Browser Bypass via Plaintext ConfigKey (ISSUE-SEC-001)

#### Code Trace in `backend-nestjs/src/exam-security/exam-security.service.ts`
```typescript
// Line 50:
const clientType = (clientBody.isSEB || hasSebHeader || isSebUserAgent) ? 'SEB' : 'BROWSER';

// Lines 64-65:
const clientSentKey = String(configKey || '').trim();
const hasMatchingKey = clientSentKey && clientSentKey === expectedConfigKey;

if (!hasMatchingKey && !hasMatchingHash) {
  throw new ForbiddenException('Safe Exam Browser configuration key mismatch...');
}
```

#### Verification Command (Bypassing SEB from Terminal)
```bash
# Attacker inspects exam .seb file, extracts configKey, and sends request from curl:
curl -X POST http://localhost:5001/api/exam-security/init-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <STUDENT_JWT>" \
  -d '{
    "assessmentId": "asmt-uuid-1",
    "isSEB": true,
    "configKey": "SECRET_EXAM_CONFIG_KEY_123"
  }'
```

#### Expected Server Response
```json
{
  "success": true,
  "sessionId": "session-uuid",
  "status": "VERIFIED",
  "token": "4a7c89f..."
}
```
*Proof:* `hasMatchingKey` evaluates to `true`, granting verified SEB access without cryptographic RequestHash validation.

---

### Reproduction 3: Assessment Save vs Proctor Capture Race Trace (ISSUE-CONC-001)

#### Code Trace in `backend-nestjs/src/assessments/assessments.service.ts`

**Thread A: Student Auto-Save (`saveProgress` L1531-1638):**
```typescript
const attempt = await this.attemptRepo.findOne({
  where: { assessmentId: assessment.id, studentId, status: 'in_progress' },
});
// attempt.captures holds [frame1...frame20]
attempt.responses = updatedResponses;
// Writes back entire attempt row with stale captures array:
await this.attemptRepo.save(attempt);
```

**Thread B: Background Proctoring (`recordProctorCapture` L2384-2390):**
```typescript
const freshAttempt = await this.attemptRepo.findOne({ where: { id: attempt.id } });
const targetAttempt = freshAttempt || attempt;
targetAttempt.captures = [...captures, newCapture]; // holds [frame1...frame21]
await this.attemptRepo.save(targetAttempt);
```

**Failure Sequence:**
1. Thread A loads `attempt` at $T=0$ (captures: 20).
2. Thread B completes S3 upload, loads `freshAttempt` at $T=50\text{ ms}$ (captures: 20).
3. Thread B saves `targetAttempt` at $T=60\text{ ms}$ (captures: 21).
4. Thread A completes response validation and saves `attempt` at $T=70\text{ ms}$ (captures: 20).
5. **Database Row Overwritten:** `captures` array is reverted from 21 back to 20. Frame 21 is permanently erased.

---

### Reproduction 4: React 19 Ref Access During Render (ISSUE-FE-001)

#### ESLint Verification Command
```bash
npm run lint --prefix frontend-v2
```

#### Observed Linter Warning
```
/Users/venkateshk22/Documents/codeskill/frontend-v2/src/components/ui/contribution-skyline.tsx
   509:3  warning  Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

/Users/venkateshk22/Documents/codeskill/frontend-v2/src/components/ui/contribution-skyline.tsx:509:3
  507 |   // Everything the render loop reads, refreshed every render so the loop never closes over stale props.
  508 |   const cfg = React.useRef({ model, duration, heightScale, orbit, palette, legendLevel, ... })
> 509 |   cfg.current = { model, duration, heightScale, orbit, palette, legendLevel, ... }
      |   ^^^^^^^^^^^ Cannot update ref during render
```
*Proof:* Direct mutation of `ref.current` during render violates React 19 compiler constraints.

---

### Reproduction 5: Verified Fixes from PR #95

#### Verified Remediations on Commit `b846d107`
1. **Telemetry Route:** Tested route `POST /api/telemetry/client-events` returns HTTP 204 No Content (route collision resolved).
2. **Prometheus Metrics IP Check:** Tested in `metrics.controller.spec.ts`: RFC 1918 regexes reject unauthorized public IPs containing substring `'10.'` (e.g. `210.45.1.2`).
3. **Discussion Voting:** Tested in `discussions.service.ts`: `voteThread` runs inside a pessimistic write lock transaction, preventing vote count write skew.
4. **Temporary Password Encryption:** Tested in `credential-crypto.util.spec.ts`: AES-256-GCM encrypts temporary passwords before database storage.
