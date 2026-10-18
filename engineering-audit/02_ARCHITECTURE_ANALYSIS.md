# Reconstructed System Architecture & Technical Analysis

**Target Repository:** CodeSkill Platform  
**Commit Hash:** `2d89bd45`  
**Auditor:** Principal Software Architect & Distributed Systems Engineer  

---

## 1. System Inventory & Runtime Stack

| Subsystem | Framework / Technology | Version / Runtime | Architectural Pattern |
| :--- | :--- | :--- | :--- |
| **Frontend Application** | Next.js (App Router), React, TailwindCSS, Monaco Editor | Node.js 20.x, Next.js 15.x / React 19 | Hybrid SSR & Client Components, Global Zustand & Context State |
| **Backend API Engine** | NestJS, Express, TypeORM, Passport.js, BullMQ | Node.js 20.x, TypeScript 5.x | Modular Monolith (Dependency Injection, DTO Validation Pipes, Guards) |
| **Primary Relational DB** | PostgreSQL (AWS RDS / Docker) | PostgreSQL 15+ | Relational with Declarative Partitioning & JSONB document columns |
| **Submission Shards** | PostgreSQL (Optional multi-shard) | PostgreSQL 15+ | Tenant/User Sharding with dedicated `SubmissionStore` |
| **Cache, Queues & PubSub** | Redis (ElastiCache / Docker), BullMQ | Redis 7.x | Queue broker for code execution, Socket.IO adapter, Throttle store |
| **Execution Sandboxes** | Piston Execution Engine, Docker CLI | Piston API / Docker Isolation | Ephemeral Container Execution & Resource Cgroup Limiting |
| **Storage & Media** | AWS S3 / Compatible Object Storage | AWS SDK v3 | Bucket storage for avatars, submissions, proctoring webcam frames |
| **Cloud Infrastructure** | Terraform, AWS (VPC, ALB, ECS/ASG, RDS, ElastiCache) | Terraform >= 1.0 | Infrastructure-as-Code with dev and production environments |

---

## 2. System Context & Component Architecture

### 2.1 System Context Diagram (C4 Level 1)

```mermaid
flowchart TD
    Candidate["Student / Candidate (Browser)"]
    Admin["Instructor / Administrator"]
    SEB["Safe Exam Browser (SEB Client)"]

    subgraph Platform["CodeSkill Production Platform"]
        Cloudflare["Cloudflare / WAF (CDN & Edge SSL)"]
        ALB["AWS Application Load Balancer"]
        FE["Next.js Frontend (SSR & Static Assets)"]
        API["NestJS Backend API (Port 5001)"]
        Judge["Worker / Judge Process (BullMQ Consumer)"]
        Postgres[("PostgreSQL Primary DB")]
        Redis[("Redis (Queues, Cache, PubSub)")]
        Shards[("PostgreSQL Shards (Optional)")]
    end

    subgraph External["External Ecosystem & Providers"]
        Piston["Piston Code Execution Cluster"]
        S3["AWS S3 Bucket (Storage)"]
        SES["AWS Simple Email Service (SES)"]
        GoogleOAuth["Google OAuth 2.0 Provider"]
        ClaudeGemini["Anthropic Claude / Google Gemini API (AI Pet)"]
    end

    Candidate -->|HTTPS / WSS| Cloudflare
    SEB -->|HTTPS / WSS| Cloudflare
    Admin -->|HTTPS / WSS| Cloudflare
    Cloudflare --> ALB
    ALB --> FE
    ALB --> API
    FE <-->|API Calls & SSR| API
    API <--> Postgres
    API <--> Redis
    API <--> Shards
    API --> SES
    API --> GoogleOAuth
    API --> ClaudeGemini
    API --> S3
    Judge <--> Redis
    Judge <--> Postgres
    Judge <--> Shards
    Judge --> Piston
```

---

### 2.2 Component Architecture Diagram (C4 Level 2)

```mermaid
flowchart LR
    subgraph ClientTier["Client Tier (frontend-v2)"]
        UI["React 19 / Next.js App Router"]
        Monaco["Monaco Code Editor"]
        AntiCheatHooks["useAntiCheatMaster / useProctorCapture"]
        State["Zustand Stores & React Context"]
    end

    subgraph APITier["Backend API Tier (backend-nestjs)"]
        Controllers["NestJS REST & WS Controllers"]
        Guards["JwtAuthGuard, RolesGuard, ThrottleGuard"]
        Services["Domain Services (Assessments, Contests, Submissions)"]
        TypeORM["TypeORM Data Access Layer"]
        QueueProducer["BullMQ Queue Producer ('submissions')"]
    end

    subgraph WorkerTier["Execution / Worker Tier"]
        WorkerProcess["Worker Daemon (PROCESS_ROLE=judge)"]
        BullMQProcessor["JudgeProcessor (BullMQ Worker)"]
        PistonClient["Piston Client / Docker Adapter"]
    end

    subgraph StorageTier["Data & Cache Tier"]
        PGPrimary[("PostgreSQL 16 Primary")]
        RedisStore[("Redis 7.2 (Queues + State)")]
        S3Bucket[("AWS S3 Asset Bucket")]
    end

    ClientTier -->|HTTP REST /api/*| Guards
    ClientTier -->|WSS Socket.IO| Controllers
    Guards --> Controllers
    Controllers --> Services
    Services --> TypeORM
    Services --> QueueProducer
    TypeORM --> PGPrimary
    QueueProducer --> RedisStore
    RedisStore --> BullMQProcessor
    BullMQProcessor --> PistonClient
    BullMQProcessor --> PGPrimary
    Services --> S3Bucket
```

---

## 3. Core Request Lifecycles & Sequence Diagrams

### 3.1 Authentication & Token Lifecycle Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Client Browser
    participant API as Auth Controller & Service
    participant DB as PostgreSQL (Users Table)
    participant Redis as Redis (Session & OTP)

    User->>API: POST /api/auth/login { email, password }
    API->>DB: findOne({ email })
    alt User Not Found or Inactive
        API-->>User: 401 Unauthorized
    else Valid Credentials
        API->>API: Argon2.verify(password, user.passwordHash)
        API->>DB: Increment tokenVersion or verify activeAccount
        API->>API: Generate Access Token (15m, signed with JWT_SECRET)
        API->>API: Generate Refresh Token (7d, signed with JWT_REFRESH_SECRET)
        API->>DB: Save hashed refresh token (refreshTokenHash)
        API-->>User: 200 OK { accessToken, refreshToken, userProfile }
    end

    Note over User, API: Token Refresh Cycle
    User->>API: POST /api/auth/refresh { refreshToken }
    API->>API: Verify JWT signature & expiration
    API->>DB: Fetch user by ID, verify tokenVersion matches
    API->>API: Argon2.verify(refreshToken, user.refreshTokenHash)
    API->>API: Issue rotated Access & Refresh tokens
    API->>DB: Update refreshTokenHash
    API-->>User: 200 OK { accessToken, refreshToken }
```

---

### 3.2 Submission Processing & Code Judging Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student Browser
    participant API as SubmissionsController
    participant Store as SubmissionStore (Primary or Shard)
    participant Redis as Redis (BullMQ 'submissions')
    participant Worker as JudgeProcessor (Worker)
    participant Piston as Piston Sandbox Engine
    participant Gate as Gateway (Socket.IO)

    Student->>API: POST /api/submissions/submit { problemId, code, language }
    API->>API: Validate problem & student eligibility
    API->>Store: INSERT submission (status: 'PENDING', verdict: 'QUEUED')
    API->>Redis: Add Job to BullMQ 'submissions' queue { submissionId, userId, code }
    API-->>Student: 201 Created { submissionId, status: 'QUEUED' }

    Note over Redis, Worker: Asynchronous Dequeue
    Worker->>Redis: Poll / Fetch next job
    Worker->>Store: UPDATE submission status: 'PROCESSING'
    Worker->>Store: Fetch problem test cases (Authoritative execution problem)

    loop For Each Test Case
        Worker->>Piston: POST /api/v2/execute { language, version, files: [{ content: code }], stdin }
        Piston-->>Worker: Execution result { stdout, stderr, exitCode, memory, time }
        Worker->>Worker: Compare stdout with expected output (Token / Exact match)
    end

    Worker->>Store: UPDATE submission (status: 'COMPLETED', verdict: 'ACCEPTED'|'WRONG_ANSWER')
    Worker->>Gate: Emit socket event 'submissionUpdated' (room: user_userId)
    Gate-->>Student: Push notification: Real-time verdict
```

---

### 3.3 Assessment Attempt Concurrency Flow (Revealing Race Conditions)

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Candidate Browser
    participant API as AssessmentsController
    participant DB as PostgreSQL (assessment_attempts)

    par Routine Auto-Save Progress (Every 30s)
        Candidate->>API: POST /api/assessments/:id/progress { responses: { q1: 'code_draft_v2' } }
        API->>DB: SELECT * FROM assessment_attempts WHERE id = :attemptId (Read State A)
    and High-Frequency Proctor Capture (Every 15s)
        Candidate->>API: POST /api/assessments/:id/proctor-capture { imageFrameUrl }
        API->>DB: SELECT * FROM assessment_attempts WHERE id = :attemptId (Read State A)
    end

    Note over API, DB: Critical Race Condition: No DB Lock or Atomic JSON Query
    API->>API: Process Proctor Capture: attempt.captures.push(frame)
    API->>DB: UPDATE assessment_attempts SET captures = :newCaptures (Writes State A + captures)

    API->>API: Process Progress Save: attempt.responses = :newResponses
    API->>DB: UPDATE assessment_attempts SET responses = :newResponses (Writes State A + responses, OVERWRITING CAPTURES)
    Note over DB: If Save reads first and writes second, it clobbers proctor captures.<br/>If Capture reads first and writes second, it CLOBBERS STUDENT ANSWERS!
```

---

## 4. Single Points of Failure (SPOF) Analysis

```mermaid
flowchart TD
    subgraph SPOF["Identified Architectural Single Points of Failure"]
        S1["Single Redis Instance / Cluster<br/><b>Impact:</b> Total outage of job queue, logins (throttles), Socket.IO"]
        S2["Single RDS PostgreSQL Primary<br/><b>Impact:</b> Read/write outage for entire platform"]
        S3["Worker Socket.IO Gateway Missing Server<br/><b>Impact:</b> Worker cannot emit real-time verdicts independently"]
        S4["Unbounded Piston Cluster Compilations<br/><b>Impact:</b> Execution queue saturation and system stall"]
        S5["RDS Hardcoded 50 Connection Limit<br/><b>Impact:</b> Immediate database rejection upon API horizontal scale"]
    end
```

1. **Single Redis ElastiCache Instance (No Multi-AZ Failover in Default Dev/Prod):**
   - Redis manages: (1) BullMQ job processing, (2) User session tracking, (3) OTP verification, (4) Throttler rate limiting, and (5) WebSockets pub/sub.
   - If Redis undergoes failover or memory saturation under `noeviction`, all authentication, submission, and notification channels fail simultaneously.
2. **PostgreSQL Connection Pool Sizing Mismatch:**
   - RDS parameter group restricts `max_connections` to 50.
   - API server pool defaults to 50; Judge worker process defaults to 50.
   - Any autoscaling event instantly exhausts PostgreSQL connection slots, bringing down all active transactions with `FATAL: remaining connection slots are reserved for non-replication superuser connections`.
3. **Decoupled Worker Socket.IO Emission:**
   - In production when `PROCESS_ROLE=judge` is deployed as a standalone PM2/Docker service, the NestJS `Gateway` is not attached to an active HTTP/WS listening server. Worker-side verdict push notifications fail to reach connected clients, requiring clients to poll.
4. **Shared Database Entity for Assessment State and Telemetry:**
   - The `assessment_attempts` table stores critical academic records (user answers) alongside high-frequency ephemeral telemetry (`captures` and `violations`). High-frequency proctoring updates lock or overwrite candidate exam submissions.
