<p align="center">
  <img src="https://raw.githubusercontent.com/sazamansari/codeskill/main/frontend-v2/public/favicon.ico" width="80" alt="CodeSkill Logo" />
</p>

<h1 align="center">⚡ CodeSkill Platform</h1>

<p align="center">
  <strong>Enterprise-Grade Technical Assessment, Algorithmic Evaluation & University Examination Infrastructure</strong>
</p>

<p align="center">
  <a href="#-architecture-overview"><img src="https://img.shields.io/badge/Architecture-Distributed%20Microservices-blue?style=for-the-badge&logo=blueprint" alt="Architecture" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/Frontend-Next.js%2016%20%7C%20React%2019-black?style=for-the-badge&logo=next.js" alt="Next.js 16" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/Backend-NestJS%2011%20%7C%20TypeScript-E0234E?style=for-the-badge&logo=nestjs" alt="NestJS 11" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/Database-PostgreSQL%2015%20%7C%20TypeORM-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL 15" /></a>
  <a href="#-code-execution-sandbox"><img src="https://img.shields.io/badge/Sandbox-Docker%20Hardened%20Judge-2496ED?style=for-the-badge&logo=docker" alt="Docker Sandbox" /></a>
  <a href="#-infrastructure--deployment"><img src="https://img.shields.io/badge/Infra-Terraform%20%7C%20AWS-FF9900?style=for-the-badge&logo=amazon-aws" alt="AWS Terraform" /></a>
  <a href="#-security-and-anti-cheat-telemetry"><img src="https://img.shields.io/badge/Proctoring-SEB%20%7C%20AI%20Telemetry-success?style=for-the-badge&logo=shield" alt="Proctoring" /></a>
  <a href="#-test-suite--verification"><img src="https://img.shields.io/badge/Tests-580%2B%20Passing%20(100%25)-brightgreen?style=for-the-badge&logo=jest" alt="Tests 100%" /></a>
</p>

<p align="center">
  <a href="#-executive-overview">Overview</a> •
  <a href="#-system-architecture">Architecture</a> •
  <a href="#-end-to-end-workflows">Workflows</a> •
  <a href="#-code-execution-sandbox">Judge Sandbox</a> •
  <a href="#-security-and-anti-cheat-telemetry">Security & Proctoring</a> •
  <a href="#-66-column-bulk-question-ingestion">Question Ingestion</a> •
  <a href="#-repository-structure">Repository</a> •
  <a href="#-quick-start-local-development">Quick Start</a> •
  <a href="#-production-deployment">Production AWS</a>
</p>

---

## 📌 Executive Overview

**CodeSkill** is an enterprise-scale online examination, coding practice, competitive programming, and proctored assessment platform built for prestigious academic institutions (such as **Chandigarh University**) and corporate recruitment teams.

The platform provides:
1. **High-Stakes Academic Examinations**: Proctored tests with semester, year, and subject-wise access controls, Safe Exam Browser (SEB) lockouts, and automated grading for Single Choice, Multi-Select, Code-Output, and DSA Coding questions.
2. **Isolated Multi-Language Judge Engine**: Zero-trust Docker container sandbox (`codeskill-judge:1.0`) enforcing strict CPU, memory, execution timeouts, non-root privileges, and network isolation (`--network none`).
3. **Live Anti-Cheat & Telemetry Hub**: Real-time Socket.IO bidirectional monitoring capturing window blurs, full-screen exits, multi-monitor setups, and web camera proctoring.
4. **LeetCode-Style Practice & Coding Contests**: Timed algorithmic competitions with dynamic leaderboards, penalty calculations, and personalized AI hint tutors ("Byte Companion").
5. **Automated Institutional Administration**: Bulk CSV imports for 66-column question schemas, student batches, automated deduplication, and PDF grade report generation.

---

## 🏛️ System Architecture

CodeSkill employs a **modern decoupled architecture** featuring an optimized Next.js 16 App Router frontend, a high-throughput NestJS 11 backend API, Redis-backed BullMQ job queues, and an autonomous Judge Worker execution service.

```mermaid
flowchart TB
    subgraph Clients["🌐 Client Layer (Next.js 16 / React 19)"]
        StudentPortal["🎓 Student Examination & Workspace\n(Monaco Editor, SEB, Audio/Video Proctor)"]
        AdminPortal["🛡️ University & Admin Console\n(Question Bank, Subject Scoping, Grading)"]
        SocketClient["⚡ Real-Time Socket.IO Client\n(Anti-Cheat Master & Event Telemetry)"]
    end

    subgraph AWS_Edge["☁️ AWS Edge & Gateway Ingress"]
        ALB["⚖️ AWS Application Load Balancer (:80 / :443)"]
        Nginx["🛡️ Nginx Reverse Proxy (:80)\n/ -> Next.js :3000\n/api/* & /socket.io/* -> NestJS :5001"]
    end

    subgraph EC2_Compute["🖥️ AWS EC2 Auto Scaling Cluster (t3.large)"]
        subgraph PM2_Processes["PM2 Process Cluster"]
            NextApp["⚡ Frontend SSR Engine\n(Next.js 16 Turbopack :3000)"]
            NestAPI["🚀 Core Backend API Gateway\n(NestJS 11 Express Monolith :5001)"]
            WorkerApp["⚙️ Headless Judge Worker\n(worker.ts | PROCESS_ROLE=judge)"]
        end
        subgraph Sandbox_Host["🔒 Execution Security Boundary"]
            JudgeDocker["🐳 Docker Sandbox Runner\n(codeskill-judge:1.0 | --network none)"]
        end
    end

    subgraph Data_Services["🗄️ Persistence, Queue & Cloud Services"]
        RDS[("🐘 AWS RDS PostgreSQL 15\n(29 TypeORM Entities + Partitions)")]
        Redis[("⚡ AWS ElastiCache Redis 7\n(BullMQ Queues + Cache + WS PubSub)")]
        S3[("📦 AWS S3\n(PDF Reports, Avatars, Backups)")]
        SES["✉️ AWS SES\n(OTP & Credential Emails)"]
        LLM["🤖 OpenRouter / DeepSeek\n(AI Hint Tutor - Byte)"]
    end

    StudentPortal --> ALB
    AdminPortal --> ALB
    SocketClient --> ALB
    ALB --> Nginx
    Nginx --> NextApp
    Nginx --> NestAPI
    NestAPI <--> RDS
    NestAPI <--> Redis
    NestAPI --> S3
    NestAPI --> SES
    NestAPI --> LLM

    NestAPI -->|"Enqueue Job"| Redis
    Redis -->|"BullMQ 'submissions' Queue"| WorkerApp
    WorkerApp --> JudgeDocker
    WorkerApp --> RDS
    WorkerApp -->|"Emit run_complete"| Redis
    NestAPI -->|"Broadcast Live Telemetry"| SocketClient
```

---

## 🔄 End-to-End Workflows

### 1. Proctored University Examination Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Student as 🎓 Student Candidate
    participant NextUI as 🖥️ Next.js Exam Client
    participant API as 🚀 NestJS API Gateway
    participant Guard as 🛡️ Exam Security / SEB Guard
    participant DB as 🐘 PostgreSQL Database
    participant Worker as ⚙️ Judge Worker Sandbox

    Student->>NextUI: Open Proctored Assessment (/assessments/:id/take)
    NextUI->>API: POST /api/assessments/:id/start
    API->>Guard: Validate SEB Headers & Active Attempt Status
    Guard-->>API: Authorized (Signed Session Token)
    API->>DB: Query Assessment & Questions (with Sample Test Cases)
    DB-->>API: Assessment Snapshot
    API-->>NextUI: Return Exam Session (MCQ, Multi-Select, Output, DSA)

    loop Every 15 Seconds & On Answer Change
        NextUI->>API: POST /api/assessments/:id/save-progress
        API->>DB: Persist Snapshot (selectedAnswers, answerText, code)
    end

    opt Proctoring Violation Detected
        NextUI->>API: POST /api/exam-security/event (Tab Switch / Fullscreen Blur)
        API->>DB: Record ExamSecurityEvent & Audit Log
    end

    Student->>NextUI: Click "Submit Assessment"
    NextUI->>API: POST /api/assessments/:id/submit
    activate API
    API->>Worker: Grade Coding Questions (Sandbox Run)
    Worker-->>API: Test Cases Passed / Failed
    API->>API: Authoritative Grading (Negative Marking & Score Calculation)
    API->>DB: Update AssessmentAttempt (Status: 'submitted', Score, Percentile)
    deactivate API
    API-->>NextUI: Return Submission Confirmation
    NextUI->>Student: Display Completion Screen & Download PDF Scorecard
```

---

### 2. Zero-Trust Distributed Code Execution Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor User as 👨‍💻 Student / Contestant
    participant Editor as 📝 Monaco Workspace UI
    participant ExecCtrl as 🎛️ ExecutionController
    participant Limiter as 🚦 RateLimitGuard (Redis)
    participant Queue as 📥 BullMQ ('submissions')
    participant Judge as ⚙️ JudgeProcessor (Worker)
    participant Docker as 🐳 Docker Sandbox (codeskill-judge:1.0)
    participant Socket as ⚡ Socket.IO Gateway

    User->>Editor: Click "Run Code" / "Submit"
    Editor->>ExecCtrl: POST /api/execution/run { code, language, input }
    ExecCtrl->>Limiter: Check Sliding Window (Max 15 submissions/min)
    Limiter-->>ExecCtrl: Allowed
    ExecCtrl->>Queue: Enqueue Job ('run-code' / 'evaluate-code')
    ExecCtrl-->>Editor: 200 OK { status: 'queued', jobId }

    loop Status Polling (Every 800ms)
        Editor->>ExecCtrl: GET /api/execution/jobs/:jobId
        ExecCtrl-->>Editor: { status: 'processing' }
    end

    Queue->>Judge: Pick Job from Queue
    activate Judge
    Judge->>Docker: docker run --network none --read-only --cpus 1 -m 256m codeskill-judge:1.0
    activate Docker
    Docker-->>Judge: STDOUT / STDERR / Execution Metrics (Time, Memory)
    deactivate Docker
    Judge->>Judge: Compare Expected vs Actual Output (Diff Engine)
    Judge->>Socket: Emit 'run_complete' / 'submission_update'
    deactivate Judge

    Editor->>ExecCtrl: GET /api/execution/jobs/:jobId
    ExecCtrl-->>Editor: { status: 'completed', testCases, executionTime, memory }
    Editor->>User: Display Test Suite Results with Green / Red Status
```

---

### 3. Real-Time Anti-Cheat Proctoring & Telemetry

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as 🧑‍💻 Candidate
    participant Master as 👁️ useAntiCheatMaster Hook
    participant Gateway as ⚡ AppGateway (WebSockets)
    participant Proctor as 🧑‍🏫 University Proctor Console

    Candidate->>Master: Mounts Exam / Contest Page
    Master->>Gateway: WebSocket Handshake (auth: { token: JWT })
    Gateway-->>Master: Connection Approved & Joined room `contest_${id}`
    Master->>Gateway: Event: `join_contest` { candidateId, contestId }

    par Real-Time Violation Telemetry
        Candidate->>Master: Switches Tab / Minimizes Window
        Master->>Gateway: Event: `violation` { type: 'TAB_SWITCH', count: 1 }
        Gateway->>Proctor: Broadcast: `student_violation` { studentId, type }
    and Video & Heartbeat Monitoring
        Master->>Gateway: Event: `camera_snapshot_pulse`
        Gateway->>Proctor: Stream Verification Status
    end

    opt Exceeded Maximum Permitted Violations
        Proctor->>Gateway: Trigger `force_submit` { studentId, contestId }
        Gateway->>Master: Push: `force_submit_command`
        Master->>Candidate: Lock Screen & Auto-Finalize Assessment
    end
```

---

## 🔒 Code Execution Sandbox (`codeskill-judge:1.0`)

CodeSkill compiles and executes untrusted student-submitted code in a custom hardened Docker sandbox environment.

### Supported Language Toolchains
| Language | Runtime Version | Execution Mode | Adapter Entry |
| :--- | :--- | :--- | :--- |
| **C** | GCC 12 (C17) | Compiled Binary | `codeskill-judge:1.0` |
| **C++** | G++ 12 (C++20) | Compiled Binary (`-O2 -std=c++20`) | `codeskill-judge:1.0` |
| **Java** | OpenJDK 17 / 21 | Compiled Bytecode (`javac` / `java`) | `codeskill-judge:1.0` |
| **Python** | Python 3.11 | Interpreted | `codeskill-judge:1.0` / `python:3.11-alpine` |
| **JavaScript** | Node.js 20 LTS | V8 Engine | `codeskill-judge:1.0` / `node:20-alpine` |
| **TypeScript** | Node.js 20 + TSX | Direct Execution (`tsx`) | `codeskill-judge:1.0` |
| **Go** | Golang 1.22 | Compiled Binary | `codeskill-judge:1.0` |
| **Rust** | Rust 1.77 (`rustc`) | Compiled Binary (`-O`) | `codeskill-judge:1.0` |

### Security Isolation Parameters
Every execution runs with strict Linux kernel cgroups and namespace restrictions:
```bash
docker run --rm \
  --network none \
  --read-only \
  --user 1000:1000 \
  --cpus 1.0 \
  --memory 256m \
  --memory-swap 256m \
  --pids-limit 64 \
  --cap-drop ALL \
  --security-opt no-new-privileges \
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  -v /var/run/codeskill/jobs/<id>:/app:ro \
  codeskill-judge:1.0 <command>
```

---

## 🛡️ Security Architecture & Hardening Matrix

Following the **End-to-End Technical & Security Audit**, all 18 discovered system vulnerabilities and edge cases have been completely remediated:

| Audit ID | Category | Threat / Vulnerability | Engineering Remediation |
| :--- | :--- | :--- | :--- |
| **AUD-001** | Reliability | `SubmissionRateLimitGuard` blocked job polling | Moved guard from controller class to `@Post('run')` only; polling endpoint is unrestricted for authenticated job owners. |
| **AUD-002** | Correctness | Multi-choice, `CODE_OUTPUT`, and DSA test case misgrading | Rebuilt grading logic in `AssessmentsService`; added multi-select array states and text answer validation. |
| **AUD-003** | Deployment | Missing Docker engine on EC2 instances | Added Docker provisioning scripts, `Dockerfile.judge`, and container pre-pulls in Terraform user-data. |
| **AUD-004** | Reliability | Redis Cluster vs Standalone mismatch | Synchronized BullMQ Redis configuration with `REDIS_CLUSTER_MODE` environment flags. |
| **AUD-005** | Security | Global IP login lockout behind Nginx & `ILIKE` wildcard injection | Enabled `trust proxy`, forwarded `X-Forwarded-For` in Nginx, and replaced `ILIKE` with parameterized exact equality. |
| **AUD-006** | DevSecOps | Hardcoded JWT fallback secret in Terraform | Added fallback keys to `FORBIDDEN_SECRETS`, deleted legacy passwords, and enforced SSM parameter resolution. |
| **AUD-007** | Database | Unexecuted `auth-tokens-schema` migration | Exported and integrated automated migration script ensuring `tokenVersion` and `refresh_tokens` exist on boot. |
| **AUD-008** | Compute | Undersized `t3.micro` vs PM2 memory footprint | Upgraded production ASG to `t3.large` (8 GB RAM) and tuned worker concurrency. |
| **AUD-009** | Security | Contest WebSocket handshake rejected unauthenticated connections | Added authenticated token passing (`auth: { token }`) in `useAntiCheatMaster.ts`. |
| **AUD-010** | Correctness | Route shadowing (`@Get(':id')` vs `@Get(':username')`) & cross-tenant IDOR | Disambiguated routes, added UUID format checks, and enforced tenant verification guards. |
| **AUD-011** | Integrity | Client-spoofable Safe Exam Browser flag | Validated `x-safeexambrowser-requesthash` / `configkeyhash` cryptographic headers. |
| **AUD-012** | Security | Unrestricted HTTP CORS (`origin: true`) | Replaced wildcard CORS with strict domain allowlists in `main.ts`. |
| **AUD-013** | Reliability | Active submission counter drift across retries | Implemented clamped Redis Lua decrement scripts to prevent negative counter states. |
| **AUD-014** | Execution | TypeScript runner failed under `--network none` | Preinstalled `tsx` inside `codeskill-judge:1.0` for offline container runs. |
| **AUD-015** | Disaster Recovery | Ephemeral database backups without S3 upload | Added `set -euo pipefail`, automated S3 push, and enabled RDS `deletion_protection = true`. |
| **AUD-016** | Security | Disabled TLS certificate verification (`rejectUnauthorized: false`) | Mounted AWS RDS CA bundle (`rds-global-bundle.pem`) and enforced TLS validation. |
| **AUD-017** | Integrity | Unbounded memory growth & AI Pet availability in exams | Bounded rate-limit maps and blocked students with active exam attempts from querying the AI tutor. |
| **AUD-018** | Maintainability | Untyped discussion controllers & stale deploy scripts | Added DTOs with `class-validator` decorators and updated shell scripts. |

---

## 📊 66-Column Bulk Question Ingestion

CodeSkill features a high-throughput question ingestion engine capable of parsing, validating, deduplicating, and importing algorithmic coding questions via CSV or JSON formats.

```
question_id, title, slug, question_type, topic, subtopic, difficulty, marks, negative_marks,
language, supported_languages, constraints, problem_statement, input_format, output_format,
sample_input, sample_output, explanation, hints, approach, expected_time_complexity,
expected_space_complexity, starter_code_c, starter_code_cpp, starter_code_java,
starter_code_python, starter_code_javascript, starter_code_go, starter_code_rust,
solution_code_c, solution_code_cpp, solution_code_java, solution_code_python,
solution_code_javascript, solution_code_go, solution_code_rust, test_input_1, test_output_1,
test_visibility_1, test_input_2, test_output_2, test_visibility_2, test_input_3, test_output_3,
test_visibility_3, test_input_4, test_output_4, test_visibility_4, test_input_5, test_output_5,
test_visibility_5, time_limit_ms, memory_limit_mb, execution_mode, entry_point, function_name,
return_type, input_type, output_type, allow_custom_input, compare_mode, partial_scoring,
is_active, tags, created_by, version
```

### Key Ingestion Capabilities:
- **Automatic Content Fingerprinting**: Computes deterministic SHA-256 digests on normalized text to detect and flag duplicate questions across batches.
- **Dynamic Language Splitting**: Ingests individual starter templates and reference solutions for 7 programming languages in a single row.
- **Multi-Tier Test Case Visibility**: Maps test cases 1 through 5 as `sample` (visible in problem description), `hidden` (evaluated during submission), or `locked` (used for final contest scoring).
- **Subject & Semester Scoping**: Tags imported questions with University Academic Subject IDs, Semester levels, and Year cohorts.

---

## 🗂️ Repository Structure

```
codeskill/
├── backend-nestjs/                    # Core Backend API & Judge Worker Service
│   ├── docker/
│   │   └── Dockerfile.judge           # Multi-language sandbox Docker container
│   ├── src/
│   │   ├── admin/                     # University & administrative management
│   │   ├── assessments/               # Proctored tests, attempts, grading logic
│   │   ├── auth/                      # JWT auth, token rotation, rate limiters
│   │   ├── campus/                    # University tenant management & portals
│   │   ├── common/                    # Filters, guards, interceptors, pipes
│   │   ├── companies/                 # Corporate recruiter assessment portals
│   │   ├── config/                    # JWT, database, Redis, S3, and AWS configs
│   │   ├── contests/                  # Coding contests, leaderboards, reattempts
│   │   ├── database/                  # TypeORM entities, migrations, and sharding
│   │   │   ├── entities/              # 29 PostgreSQL TypeORM Domain Entities
│   │   │   └── migrations/            # Idempotent DDL schema migration scripts
│   │   ├── discussions/               # Forum threads and discussion replies
│   │   ├── exam-security/             # SEB validation and violation telemetry
│   │   ├── execution/                 # JudgeProcessor, BullMQ, Docker sandboxing
│   │   ├── gateway/                   # WebSockets gateway for real-time events
│   │   ├── pet/                       # AI coding tutor companion ("Byte")
│   │   ├── problems/                  # Public practice catalogue & CTE queries
│   │   ├── questions/                 # Question bank & 66-column parser engine
│   │   ├── reports/                   # Automated PDF scorecard generators
│   │   ├── students/                  # Batch student enrollment & CSV import
│   │   ├── subjects/                  # Academic subject curriculum management
│   │   ├── submissions/               # Code submission tracking and metrics
│   │   ├── main.ts                    # HTTP API Server Entrypoint (:5001)
│   │   └── worker.ts                  # Dedicated Judge Worker Entrypoint
│   └── package.json
│
├── frontend-v2/                       # Next.js 16 App Router Web Application
│   ├── src/
│   │   ├── app/                       # App Router Pages & Layouts
│   │   │   ├── (auth)/login/          # Student credential login portal
│   │   │   ├── admin/                 # Administration dashboards & tools
│   │   │   ├── assessments/           # Proctored examination workspace
│   │   │   ├── contests/              # Live contest lobbies & attempt rooms
│   │   │   ├── problems/              # LeetCode-style practice workspace
│   │   │   └── leaderboard/           # Global rankings and contest scorecards
│   │   ├── components/                # Modular React 19 UI components
│   │   │   ├── admin/                 # Admin data tables, uploaders, navigations
│   │   │   ├── assessments/           # MCQ, Multi-Select, Output, and DSA widgets
│   │   │   ├── landing/               # High-contrast hero & feature displays
│   │   │   ├── problems/              # Monaco editor, test case runner, console
│   │   │   └── ui/                    # Reusable design tokens, tables, modals
│   │   ├── hooks/                     # Custom React hooks (anti-cheat, timers)
│   │   └── lib/                       # API clients, axios interceptors, stores
│   └── package.json
│
├── terraform/                         # Production AWS Infrastructure as Code
│   ├── environments/production/       # Production environment definitions
│   └── modules/                       # Reusable modules (VPC, ASG, ALB, RDS, Redis)
│
├── scripts/                           # Maintenance, admin creation, and backup scripts
├── docker-compose.yml                 # Local PostgreSQL 15 & Redis 7 stack
└── ecosystem.config.js                # PM2 cluster configuration for EC2
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js**: `20.x` or higher
- **Docker Engine**: Installed and running
- **PostgreSQL**: `15.x` (or via Docker Compose)
- **Redis**: `7.x` (or via Docker Compose)

### 1. Clone & Setup Infrastructure Containers
```bash
git clone https://github.com/sazamansari/codeskill.git
cd codeskill

# Start local PostgreSQL 15 and Redis 7
docker-compose up -d postgres redis
```

### 2. Build the Multi-Language Sandbox Image
```bash
docker build -t codeskill-judge:1.0 -f backend-nestjs/docker/Dockerfile.judge backend-nestjs
```

### 3. Backend Setup & Database Migration
```bash
cd backend-nestjs
npm install

# Setup environment variables
cp .env.example .env

# Run database synchronization / migrations
npm run build
node dist/database/run-practice-submission-source.js

# Start NestJS in Development Mode (Port 5001)
npm run start:dev
```

### 4. Background Judge Worker Setup (Optional for execution testing)
```bash
# In a separate terminal tab:
cd backend-nestjs
PROCESS_ROLE=judge npm run start:dev
```

### 5. Frontend Setup
```bash
cd ../frontend-v2
npm install

# Start Next.js Development Server (Port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access CodeSkill.

---

## 🧪 Test Suite & Verification

The platform is fortified with end-to-end integration and unit tests across every module.

### Run Backend Test Suite (NestJS / Jest)
```bash
cd backend-nestjs
npm test
```
```
Test Suites: 34 passed, 34 total
Tests:       349 passed, 349 total
Snapshots:   0 total
Time:        19.71 s
```

### Run Frontend Test Suite (Next.js / Jest)
```bash
cd frontend-v2
npm test
```
```
Test Suites: 28 passed, 28 total
Tests:       231 passed, 231 total
Snapshots:   0 total
Time:        6.24 s
```

### Static Type Check
```bash
# Backend TypeScript Check
cd backend-nestjs && npx tsc --noEmit

# Frontend TypeScript Check
cd frontend-v2 && npx tsc --noEmit
```

---

## ☁️ Production Deployment (AWS)

CodeSkill is automated via **Terraform** and **GitHub Actions** for resilient, zero-downtime blue/green deployments:

```bash
# Initialize Terraform Production Environment
cd terraform/environments/production
terraform init
terraform plan
terraform apply
```

### Architecture Specifications:
- **Compute**: AWS Auto Scaling Group with `t3.large` instances running PM2 cluster (Next.js SSR + NestJS API + Judge Worker).
- **Database**: AWS RDS PostgreSQL 15 Multi-AZ with automated snapshots, `deletion_protection = true`, and SSL CA verification.
- **Cache & Queue**: AWS ElastiCache Redis 7 managing BullMQ job distribution.
- **Load Balancer**: AWS Application Load Balancer with HTTPS termination, rate limiting, and sticky sessions.

---

## 📄 License & Academic Attribution

Developed for **Chandigarh University** Official Technical Assessment & Examination Infrastructure.  
Maintained by the CodeSkill Core Engineering & Security Team.
