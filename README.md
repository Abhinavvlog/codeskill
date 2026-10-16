<div align="center">

# ⚡ CodeSkill — Technical Assessment & Coding Examination Platform 🚀
### 🏛️ Official Examination, Algorithmic Evaluation & Skill Assessment Platform for **Chandigarh University** 🎓

[![NestJS](https://img.shields.io/badge/Backend-NestJS%2011-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016%20App%20Router-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/UI-React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2015-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Cache%20&%20Queue-Redis%207%20%2B%20BullMQ-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Containers-Docker%20Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![AWS](https://img.shields.io/badge/Cloud-AWS%20RDS%20%7C%20S3%20%7C%20SES-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Monaco Editor](https://img.shields.io/badge/IDE-Monaco%20Editor-1E1E1E?style=for-the-badge&logo=visual-studio-code&logoColor=007ACC)](https://microsoft.github.io/monaco-editor/)
[![Tests](https://img.shields.io/badge/Test%20Suite-401%20Passing-brightgreen?style=for-the-badge&logo=jest&logoColor=white)](https://jestjs.io/)

<br/>

**CodeSkill** is an enterprise-grade technical examination, competitive programming, and automated algorithmic skill evaluation platform engineered specifically for **Chandigarh University**. It scales to tens of thousands of concurrent examinees using horizontal PostgreSQL submission sharding, PM2 process clustering, sandboxed multi-language code execution with strict CPU/memory cgroups, and real-time AI-assisted anti-cheat proctoring.

[🌟 Key Features](#-key-features) •
[🏛️ System Architecture](#-high-level-design-hld--system-architecture) •
[📊 Detailed Workflows](#-deep-dive-workflow-diagrams) •
[🗄️ Database & ERD](#️-database-architecture--erd) •
[🚀 Quickstart](#-quickstart-guide) •
[🔐 Test Credentials](#-pre-seeded-administrator-accounts) •
[⚙️ Configuration](#️-environment-variables-reference)

---

</div>

## 📌 Executive Architecture Snapshot

<div align="center">

### 🗺️ Enterprise 5-Tier High-Level Design (HLD)


*Figure 1: Canonical 5-Tier HLD Topology detailing Client Tier, Ingress & Proxy, PM2 Process Clustering, Sharded Persistence, and Sandboxed Execution.*

<br/>

### 🔄 End-to-End Runtime & Process Workflow
![CodeSkill Process Flow & Runtime Architecture](docs/assets/system-architecture-diagram.jpg)

*Figure 2: Component topology showing Next.js client interactions, NestJS API gateway, BullMQ queueing, sandboxed judge evaluation, and external cloud integrations.*

</div>

---

## 🌟 Key Features

| Domain | Key Capabilities | Sticker |
| :--- | :--- | :---: |
| **Multi-Language Sandboxed Judge** | Isolated execution for **Python 3, C++17, Java 21, and JavaScript (Node.js)** with enforced CPU limits, memory cgroups, network isolation, and Judge0 failover. | ⚡ |
| **Anti-Cheat & AI Proctoring** | MediaPipe client-side facial landmark tracking, multi-face presence detection, active window focus monitoring, fullscreen lock enforcement, and automatic S3 evidence snapshots. | 🛡️ |
| **High-Throughput Examination Engine** | Timed assessments, multi-attempt support, randomized question pools, test case weighting, and immediate score computation. | ⏱️ |
| **Bulk Student Onboarding** | CSV/Excel batch upload with strict validation, duplicate deduplication across database & file, transactional persistence, and automated credential dispatch via AWS SES. | 👥 |
| **Interactive Question Bank** | Multi-topic categorization, difficulty weighting, test case preview, case-insensitive multi-parameter filtering, and duplicate-safe authoring. | 📚 |
| **Competitive Contests** | Real-time live leaderboard rankings with penalty-time scoring, live Socket.IO update broadcasting, and instant submission verdict feeds. | 🏆 |
| **Horizontal Submission Sharding** | Multi-tenant and shard-partitioned PostgreSQL storage topology to eliminate lock contention during massive university-wide examination sessions. | 🗄️ |
| **University Administration** | Role-Based Access Control (**Super Admin, University Admin, Faculty, Student**) with detailed audit logging and real-time exam oversight dashboards. | 🏛️ |

---

## 🏛️ High-Level Design (HLD) & System Architecture

CodeSkill is structured into five distinct, decoupled operational tiers as documented in [High-Level Design Architecture Specification](backend-nestjs/docs/high-level-design-architecture.md):

```
                                  +-------------------------------------------------------+
                                  |                      CLIENT TIER                      |
                                  |                                                       |
                                  |  +---------------------------+  +-------------------+ |
                                  |  |  Admin / Faculty Browser  |  |  Student Browser  | |
                                  |  |  - Exam & Contest Admin   |  |  - Next.js 16 SPA | |
                                  |  |  - Cohort Management      |  |  - Monaco Editor  | |
                                  |  |  - Question Bank Studio   |  |  - MediaPipe AI   | |
                                  |  +---------------------------+  +-------------------+ |
                                  +-------------------------------------------------------+
                                                | HTTPS                        | HTTPS / WSS
                                                +---------------+  +-----------+
                                                                |  |
                                                                v  v
                                  +-------------------------------------------------------+
                                  |                    INGRESS & PROXY                    |
                                  |                                                       |
                                  |  +-------------------------------------------------+  |
                                  |  | Nginx Reverse Proxy / AWS Application Load      |  |
                                  |  | Balancer (ALB)                                  |  |
                                  |  | SSL/TLS Termination, Rate Limiting, CORS Guards |  |
                                  |  +-------------------------------------------------+  |
                                  +-------------------------------------------------------+
                                            |                                    |
                                            | /* (SSR / Static Assets)           | /api/* & /socket.io/* (WSS)
                                            v                                    v
                        +-------------------------+            +------------------------------------+
                        |   FRONTEND WEB APP      |            |         APPLICATION TIER           |
                        |   Next.js 16 (Port 3000)|            |       [PM2 Process Cluster]        |
                        +-------------------------+            |                                    |
                                                               |  +-------------------------------+ |
                                                               |  | NestJS API Server (:5001)     | |
                                                               |  | - REST Endpoints / Swagger    | |
                                                               |  | - Socket.IO Redis Gateway     | |
                                                               |  | - JWT Auth & Role Guards      | |
                                                               |  | - Multi-tenant Assessment Svc | |
                                                               |  +-------------------------------+ |
                                                               |                 |                  |
                                                               |                 | Enqueue Jobs     |
                                                               |                 v                  |
                                                               |  +-------------------------------+ |
                                                               |  | BullMQ Judge Worker           | |
                                                               |  | - PROCESS_ROLE=judge          | |
                                                               |  | - Piston / Docker Adapter     | |
                                                               |  | - Judge0 Failover Client      | |
                                                               |  +-------------------------------+ |
                                                               +------------------------------------+
                                                                    |          |          |
                  +-------------------------------------------------+          |          +-------------------------+
                  |                                                            |                                    |
                  v                                                            v                                    v
+------------------------------------+                    +------------------------------------+      +------------------------------------+
|         EXTERNAL PROVIDERS         |                    |         DATA & QUEUE TIER          |      |          JUDGE EXECUTION           |
|                                    |                    |                                    |      |                                    |
| +--------------------------------+ |                    | +--------------------------------+ |      | +--------------------------------+ |
| | AWS S3                         | |                    | | Primary PostgreSQL 15          | |      | | Piston / Judge0 Host           | |
| | Proctoring Snapshots & Media   | |                    | | Users, Assessments, Contests,  | |      | | Sandboxed Code Execution       | |
| +--------------------------------+ |                    | | Question Banks, Audit Logs     | |      | | Memory & CPU Cgroups           | |
|                                    |                    | +--------------------------------+ |      | +--------------------------------+ |
| +--------------------------------+ |                    |                                    |      +------------------------------------+
| | AWS SES                        | |                    | +--------------------------------+ |
| | Transactional Emails & OTPs    | |                    | | Submission Shards              | |
| +--------------------------------+ |                    | | Horizontal PostgreSQL Shards   | |
|                                    |                    | | Range / User Hash Sharded      | |
|                                    |                    | +--------------------------------+ |
|                                    |                    |                                    |
|                                    |                    | +--------------------------------+ |
|                                    |                    | | Redis 7 Cluster                | |
|                                    |                    | | BullMQ Broker, Socket.IO PubSub| |
|                                    |                    | | OTP Throttles, Route Cache     | |
|                                    |                    | +--------------------------------+ |
+------------------------------------+                    +------------------------------------+
```

### 🧱 Full Architectural Topology (Mermaid)

```mermaid
graph TB
    subgraph Tier1 ["🌐 1. Client Tier"]
        AdminUI["💻 Admin / Faculty Dashboard<br/>(Cohort Admin, Question Bank, Assessments)"]
        StudentUI["🎓 Student Portal<br/>(Next.js 16, Monaco Editor, MediaPipe AI)"]
    end

    subgraph Tier2 ["🛡️ 2. Ingress & Load Balancing"]
        ALB["⚖️ Nginx / AWS ALB<br/>(TLS Termination, Rate Limiting, Sticky Sessions)"]
    end

    subgraph Tier3 ["⚡ 3. Application Tier (PM2 Process Cluster)"]
        NestAPI["🚀 NestJS API Server (:5001)<br/>(REST API, Socket.IO Gateway, RBAC Guards)"]
        JudgeWorker["⚙️ BullMQ Judge Worker<br/>(PROCESS_ROLE=judge, Async Job Dequeue)"]
        EmailWorker["📧 BullMQ Email Worker<br/>(PROCESS_ROLE=api, Credential Dispatch)"]
    end

    subgraph Tier4 ["🗄️ 4. Data & Caching Tier"]
        PostgresPrimary[("🐘 Primary PostgreSQL 15<br/>Users, Assessments, Questions, Audit Logs")]
        PostgresShards[("📦 Submission Shards<br/>Horizontal PostgreSQL Exam Shards")]
        RedisQueue[("🔴 Redis 7 Cluster<br/>BullMQ Broker, Socket.IO State, Session Cache")]
    end

    subgraph Tier5 ["☁️ 5. External Services & Execution"]
        AWSS3["🪣 AWS S3 Bucket<br/>(Proctoring Snapshots & Media Audits)"]
        AWSSES["📨 AWS SES<br/>(Transactional Emails & Password OTPs)"]
        PistonEngine["⚡ Sandboxed Execution Host<br/>(Piston / Judge0 isolated cgroups)"]
    end

    AdminUI -->|HTTPS / REST| ALB
    StudentUI -->|HTTPS & WebSockets| ALB

    ALB -->|"/* (SSR & Static)"| StudentUI
    ALB -->|"/api/* (REST Calls)"| NestAPI
    ALB -->|"/socket.io/* (WSS)"| NestAPI

    NestAPI -->|Domain Queries & Mutations| PostgresPrimary
    NestAPI -->|Enqueue Submissions| RedisQueue
    NestAPI -->|Enqueue Email Jobs| RedisQueue
    NestAPI -->|Upload Anti-Cheat Captures| AWSS3

    EmailWorker -->|Dequeue Email Tasks| RedisQueue
    EmailWorker -->|Send Credentials| AWSSES

    JudgeWorker -->|Dequeue Submission Tasks| RedisQueue
    JudgeWorker -->|Execute Untrusted Code| PistonEngine
    JudgeWorker -->|Persist Verdicts| PostgresShards
    JudgeWorker -->|Emit Completion Events| RedisQueue

    RedisQueue -.->|Socket.IO Pub/Sub Broadcast| NestAPI
    NestAPI -.->|Real-time Verdict & Live Status| StudentUI
```

---

## 📊 Deep-Dive Workflow Diagrams

### 1. ⚡ Real-Time Code Submission & Sandboxed Judge Pipeline

When an examinee tests or submits their code in Monaco Editor, execution is processed asynchronously through a sandboxed pipeline enforcing rigorous resource limits:

```mermaid
sequenceDiagram
    autonumber
    actor Student as 🎓 Student (Monaco Editor)
    participant NextJS as 💻 Next.js Frontend
    participant API as 🚀 NestJS API Server
    participant Redis as 🔴 Redis 7 (BullMQ)
    participant Worker as ⚙️ Judge Worker
    participant Sandbox as 🐳 Piston / Judge0 Sandbox
    participant DB as 🐘 PostgreSQL Submission Shard
    participant Socket as 📡 Socket.IO Gateway

    Student->>NextJS: Clicks "Submit Code"
    NextJS->>API: POST /api/submissions { problemId, code, language }
    API->>DB: Insert Submission (Status: PENDING)
    API->>Redis: Enqueue Job to "judge-queue"
    API-->>NextJS: 201 Created { submissionId, status: "PENDING" }
    NextJS-->>Student: Display "Evaluating Test Cases..."

    Redis->>Worker: Dequeue Job (submissionId)
    Worker->>DB: Fetch Problem Details & Hidden Test Cases
    Worker->>Sandbox: Dispatch Code (CPU: 2s, Mem: 256MB, Network: DISABLED)
    
    activate Sandbox
    Sandbox-->>Worker: Return Output (stdout, stderr, runtime_ms, memory_kb)
    deactivate Sandbox

    Worker->>Worker: Compare with Expected Outputs & Evaluate Verdict
    alt Output Matches All Cases
        Worker->>DB: Update Submission (Status: ACCEPTED, Score: 100)
    else Runtime Exceeded
        Worker->>DB: Update Submission (Status: TIME_LIMIT_EXCEEDED)
    else Memory Exceeded
        Worker->>DB: Update Submission (Status: MEMORY_LIMIT_EXCEEDED)
    else Wrong Output
        Worker->>DB: Update Submission (Status: WRONG_ANSWER)
    end

    Worker->>Redis: Publish Event "submission_evaluated"
    Redis->>Socket: Propagate to WebSocket Gateway
    Socket-->>NextJS: WebSocket Emit { submissionId, verdict, runtime, memory, score }
    NextJS-->>Student: Render Test Case Results & Score Card
```

---

### 2. 🛡️ AI Proctoring & Examination Security Architecture

CodeSkill deploys client-side and server-side defensive monitoring during proctored exams:

```mermaid
flowchart TD
    subgraph ClientSide ["💻 Student Browser (Client-Side Guards)"]
        CamStream["📷 Webcam Stream"] --> MediaPipe["🤖 MediaPipe AI Face Landmark Mesh"]
        MediaPipe --> FaceCheck{"Face Status"}
        FaceCheck -->|"Multiple Faces Detected"| AlertMult["🚨 Multiple Faces Detected"]
        FaceCheck -->|"No Face Visible"| AlertNone["⚠️ Face Missing from Camera"]
        FaceCheck -->|"Looking Away > 5s"| AlertGaze["👀 Suspicious Gaze Anomaly"]

        Screen["🖥️ Window Activity"] --> FSCheck["🔒 Fullscreen Lock API"]
        FSCheck -->|"ESC / Exit Fullscreen"| AlertFS["⚠️ Fullscreen Exit Violation"]
        Screen --> FocusCheck["👁️ Document Visibility & Blur API"]
        FocusCheck -->|"Tab Switch / Alt-Tab"| AlertTab["⚠️ Tab Switching Violation"]
        Screen --> DevtoolsCheck["🔍 DevTools Heuristics"]
        DevtoolsCheck -->|"Console Opened"| AlertDev["⚠️ Developer Tools Opened"]
    end

    subgraph SecurityHub ["🛡️ Security Event Dispatcher"]
        AlertMult --> Beacon["📡 Secure WebSocket Event Beacon"]
        AlertNone --> Beacon
        AlertGaze --> Beacon
        AlertFS --> Beacon
        AlertTab --> Beacon
        AlertDev --> Beacon
        CamSnap["📸 Snapshot Frame Generator"] --> S3Direct["🪣 AWS S3 Direct Upload"]
    end

    subgraph BackendSec ["🚀 CodeSkill Backend & Proctor Studio"]
        Beacon --> SecGateway["📡 Exam Security Gateway (:5001)"]
        SecGateway --> LogDB[("🐘 PostgreSQL exam_security_events")]
        S3Direct --> EvidenceRecord["📝 S3 Media Evidence Record"]
        EvidenceRecord --> LogDB

        LogDB --> ViolationsEngine{"Violation Policy Check"}
        ViolationsEngine -->|"Violations < Max Limit"| WarnStudent["⚠️ Send In-Exam Warning"]
        ViolationsEngine -->|"Violations >= Threshold"| AutoTerminate["🚫 Automatic Exam Termination"]

        LogDB --> ProctorDashboard["🖥️ Real-Time Proctor Monitor View"]
    end

    WarnStudent -.-> StudentUI["🎓 Student Workspace"]
    AutoTerminate -.-> StudentUI
```

---

### 3. 👥 High-Throughput Bulk Student Onboarding & Credential Flow

The bulk student import module allows university administrators to onboard thousands of students with transactional integrity:

```mermaid
flowchart LR
    CSV["📄 Admin CSV / Excel Upload<br/>(Name, Email, UID, Department, Batch)"] --> Parse["🔍 Validation & Format Check<br/>(Email regex, UID length, Cohort exists)"]
    Parse --> Dedupe["🧬 Deduplication Engine<br/>(Check in-file duplicates + PostgreSQL uniqueness)"]
    Dedupe --> Preview["📊 Dry-Run Verification Preview<br/>(Total valid, Duplicates flagged, Errors reported)"]
    Preview --> Confirm["✅ Admin Confirms Import<br/>POST /api/admin/students/import/confirm"]
    
    subgraph Transaction ["💾 Database Transaction"]
        Confirm --> SaveStudents["1. Insert Student Records<br/>Generate UUIDs & Assign Default Password"]
        SaveStudents --> SaveEmailJobs["2. Insert Email Jobs<br/>Foreign Key linked to student_id"]
    end

    SaveEmailJobs --> RedisEmail["🔴 Push to BullMQ credential-email"]
    RedisEmail --> WorkerEmail["📧 Email Worker Process"]
    WorkerEmail --> AWSSES["📨 AWS SES API"]
    AWSSES --> StudentMail["📬 Student Receives Credentials & Exam Link"]
```

---

### 4. 📚 Question Bank Multi-Topic Filtering & Authoring Pipeline

The Question Bank module supports seamless exploration, filtering, and authoring across diverse engineering curricula:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as 👨‍💼 University Admin / Faculty
    participant TopicsPage as 📑 /admin/questions/topics
    participant QuestionsPage as 📋 /admin/questions
    participant Backend as 🚀 NestJS Questions API
    participant DB as 🐘 PostgreSQL (questions)

    Admin->>TopicsPage: Views Subject Topic Grid
    TopicsPage->>Backend: GET /api/admin/questions/topics
    Backend->>DB: Aggregate Question Counts by Topic & Difficulty
    DB-->>Backend: Return Topic Groupings
    Backend-->>TopicsPage: Render Topic Cards with Difficulty Badges

    Admin->>TopicsPage: Clicks "Browse Questions" for "Data Structures"
    TopicsPage->>QuestionsPage: Navigate to /admin/questions?topic=Data%20Structures
    
    Note over QuestionsPage: URL Query Param Synchronized into State
    QuestionsPage->>Backend: GET /api/admin/questions?topic=Data%20Structures
    Backend->>DB: Query WHERE LOWER(topic) = LOWER('Data Structures') OR 'Data Structures' = ANY(categories)
    DB-->>Backend: Return Filtered Question Entities
    Backend-->>QuestionsPage: JSON Response (200 OK)
    
    Note over QuestionsPage: Monaco & Tailwind V-Table 3 render with full opacity (100%) and crisp contrast
    QuestionsPage-->>Admin: Display High-Contrast Filtered Questions Table
```

---

## 🗄️ Database Architecture & ERD

CodeSkill is built entirely on **PostgreSQL 15 / AWS RDS** with TypeORM managing **27 domain entities** organized into cohesive relational modules:

```mermaid
erDiagram
    UNIVERSITIES ||--o{ BATCHES : contains
    UNIVERSITIES ||--o{ USERS : enrolls
    BATCHES ||--o{ USERS : groups

    USERS ||--o{ ASSESSMENTS : authors
    USERS ||--o{ ASSESSMENT_ATTEMPTS : attempts
    USERS ||--o{ SUBMISSIONS : submits
    USERS ||--o{ CONTEST_ATTEMPTS : participates
    USERS ||--o{ EMAIL_JOBS : targets
    USERS ||--o{ AUDIT_LOGS : performs

    ASSESSMENTS ||--o{ QUESTIONS : includes
    ASSESSMENTS ||--o{ ASSESSMENT_ATTEMPTS : tracks
    ASSESSMENTS ||--o{ EXAM_SESSIONS : conducts

    QUESTIONS ||--o{ PROBLEM_TEST_CASES : tests
    QUESTIONS ||--o{ SUBMISSIONS : evaluated_by

    EXAM_SESSIONS ||--o{ EXAM_SECURITY_EVENTS : logs

    CONTESTS ||--o{ QUESTIONS : features
    CONTESTS ||--o{ CONTEST_ATTEMPTS : tracks

    USERS {
        uuid id PK
        string email UK
        string uid UK
        string name
        string role "SUPER_ADMIN | ADMIN | FACULTY | STUDENT"
        string password_hash
        uuid university_id FK
        uuid batch_id FK
        timestamp created_at
    }

    ASSESSMENTS {
        uuid id PK
        string title
        text description
        integer duration_minutes
        integer passing_score
        timestamp start_time
        timestamp end_time
        boolean is_proctored
        uuid university_id FK
    }

    QUESTIONS {
        uuid id PK
        string title
        text description
        string topic
        string subtopic
        string difficulty "EASY | MEDIUM | HARD"
        string type "CODING | MCQ | MULTI_SELECT"
        jsonb test_cases
        jsonb metadata
    }

    SUBMISSIONS {
        uuid id PK
        uuid user_id FK
        uuid question_id FK
        uuid assessment_id FK
        text code
        string language "cpp | python | java | javascript"
        string verdict "ACCEPTED | WRONG_ANSWER | TLE | MLE | ERROR"
        integer execution_time_ms
        integer memory_kb
        integer score
    }

    EXAM_SECURITY_EVENTS {
        uuid id PK
        uuid session_id FK
        uuid user_id FK
        string event_type "TAB_SWITCH | FULLSCREEN_EXIT | MULTIPLE_FACES | LOOK_AWAY"
        string severity "LOW | MEDIUM | HIGH | CRITICAL"
        string evidence_url
        timestamp event_timestamp
    }

    EMAIL_JOBS {
        uuid id PK
        uuid student_id FK
        string recipient_email
        string subject
        string status "PENDING | SENT | FAILED"
        string error_message
        timestamp sent_at
    }
```

---

## 🔐 Pre-Seeded Administrator Accounts

To facilitate immediate testing and evaluation of Chandigarh University features, five administrator accounts have been seeded into the local PostgreSQL database (`codeskill_pg`):

| Name | Role | Email | University UID | Default Password |
| :--- | :---: | :--- | :---: | :---: |
| **Mustakim** | `ADMIN` | `mustakim_admin1@codeskill.com` | `ADM1` | `12345678` |
| **Mustakim** | `ADMIN` | `mustakim_admin2@codeskill.com` | `ADM2` | `12345678` |
| **Mustakim** | `ADMIN` | `mustakim_admin3@codeskill.com` | `ADM3` | `12345678` |
| **Mustakim** | `ADMIN` | `mustakim_admin4@codeskill.com` | `ADM4` | `12345678` |
| **Mustakim** | `ADMIN` | `mustakim_admin5@codeskill.com` | `ADM5` | `12345678` |

> [!TIP]
> Use any of the credentials above at `http://localhost:3000/auth/login` to access the full University Admin Dashboard, Question Bank Studio, and Student Cohort Manager.

---

## 💻 Technology Stack Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CODESKILL TECH STACK                             │
├───────────────────────┬─────────────────────────────────────────────────────┤
│ 🌐 Frontend Layer     │ Next.js 16 (App Router), React 19, Tailwind CSS v4, │
│                       │ Monaco Editor, Lucide Icons, GSAP Micro-animations  │
├───────────────────────┼─────────────────────────────────────────────────────┤
│ 🚀 Backend API Server │ NestJS 11, Express, Socket.IO (RedisIoAdapter),     │
│                       │ TypeORM 0.3, Class Validator, Passport JWT          │
├───────────────────────┼─────────────────────────────────────────────────────┤
│ ⚡ Distributed Queue   │ BullMQ, Redis 7 (In-Memory Pub/Sub & Job Queue)     │
├───────────────────────┼─────────────────────────────────────────────────────┤
│ 🗄️ Database & Sharding│ PostgreSQL 15, Multi-tenant schemas, Horizontal     │
│                       │ Assessment Submission Shards, AWS RDS PostgreSQL    │
├───────────────────────┼─────────────────────────────────────────────────────┤
│ 🐳 Code Sandbox       │ Piston Execution Engine, Judge0 Fallback Client,    │
│                       │ Docker container cgroups (CPU, RAM, Network quota)  │
├───────────────────────┼─────────────────────────────────────────────────────┤
│ ☁️ Cloud & DevOps     │ AWS (RDS, S3, SES, ALB, VPC), Terraform (IaC),      │
│                       │ Docker Compose, PM2 Process Manager, Nginx          │
├───────────────────────┼─────────────────────────────────────────────────────┤
│ 🛡️ Anti-Cheat & Vision│ MediaPipe Face Mesh, Fullscreen API, Tab Visibility │
└───────────────────────┴─────────────────────────────────────────────────────┘
```

---

## 📂 Project Directory Structure

```text
codeskill/
├── backend-nestjs/                    # Enterprise NestJS Application
│   ├── src/
│   │   ├── admin/                     # Admin management & University operations
│   │   ├── assessments/               # Assessment life-cycle, grading & attempts
│   │   ├── auth/                      # JWT authentication, guards & strategies
│   │   ├── config/                    # Config modules (JWT, DB, Redis, AWS, Piston)
│   │   ├── contests/                  # Contest management, leaderboards & attempts
│   │   ├── database/                  # TypeORM config, migrations & 27 entities
│   │   │   └── entities/              # Domain models (User, Question, Submission, etc.)
│   │   ├── exam-security/             # Real-time WebSocket proctoring & audit events
│   │   ├── execution/                 # BullMQ Judge Worker, Piston & Judge0 runners
│   │   ├── questions/                 # Question Bank, test cases & topic filter
│   │   ├── students/                  # Bulk student import & credential dispatch
│   │   └── main.ts                    # NestJS bootstrap & clustering entry point
│   ├── docs/                          # Architecture & High-Level Design documentation
│   │   └── high-level-design-architecture.md  # Canonical 5-Tier HLD Document
│   ├── ecosystem.config.js            # PM2 Cluster definition (API + Judge workers)
│   └── package.json
│
├── frontend-v2/                       # Next.js 16 Responsive Web Application
│   ├── src/
│   │   ├── app/                       # Next.js App Router (pages & server actions)
│   │   │   ├── admin/                 # Admin views (students, questions, topics)
│   │   │   ├── assessments/           # Assessment test taker & proctored screens
│   │   │   ├── contests/              # Live contest arena & leaderboard views
│   │   │   ├── problems/              # Coding problem solver with Monaco Editor
│   │   │   └── auth/                  # Authentication & password management
│   │   ├── components/                # Modular React UI components
│   │   │   ├── ui/                    # Design system (V-Table, dialogs, badges)
│   │   │   ├── editor/                # Monaco code editor integration & theme
│   │   │   └── proctoring/            # MediaPipe camera & screen surveillance
│   │   └── lib/                       # API clients, auth stores, and utility hooks
│   └── package.json
│
├── docs/assets/                       # Architectural diagrams & University branding
│   ├── system-architecture-hld.png    # 5-Tier System Architecture diagram
│   ├── system-architecture-diagram.jpg# Detailed process flow diagram
│   └── cu-logo.png                    # Official Chandigarh University seal
│
├── terraform/                         # AWS Infrastructure as Code (IaC)
│   ├── modules/                       # Reusable modules (VPC, RDS, ALB, Redis, ASG)
│   └── environments/dev/              # Development AWS environment configuration
│
├── docker-compose.yml                 # Local development container definitions
└── README.md                          # Platform Documentation & Engineering Manual
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js**: v18.x or v20.x+
- **Docker & Docker Compose**: For local PostgreSQL and Redis services
- **npm** or **pnpm**

---

### Step 1: Clone Repository & Launch Infrastructure Services

```bash
# Clone repository
git clone https://github.com/thesatellite-ai/codeskill.git
cd codeskill

# Start local PostgreSQL 15 and Redis 7 containers
docker-compose up -d postgres redis
```

---

### Step 2: Configure Environment Variables

```bash
# Configure backend environment
cp backend-nestjs/.env.example backend-nestjs/.env

# Configure frontend environment
cp frontend-v2/.env.example frontend-v2/.env.local
```

*(Refer to [Environment Variables Reference](#️-environment-variables-reference) below for custom setups).*

---

### Step 3: Install Dependencies & Run Database Migrations

```bash
# Setup Backend
cd backend-nestjs
npm install
npm run build
npm run typeorm:sync

# Seed default administrator accounts into PostgreSQL
node seed_users.js

# Setup Frontend
cd ../frontend-v2
npm install
```

---

### Step 4: Run Development Servers

Open two terminal windows:

#### Terminal 1 — NestJS API Server (Port `5001`)
```bash
cd backend-nestjs
npm run start:dev
```

#### Terminal 2 — Next.js Frontend Application (Port `3000`)
```bash
cd frontend-v2
npm run dev
```

Visit **`http://localhost:3000`** in your browser. Access Swagger API documentation at **`http://localhost:5001/api/docs`**.

---

### Step 5: Production Deployment with PM2 Process Clustering

CodeSkill includes a battle-tested PM2 ecosystem definition supporting multi-process role separation:

```bash
cd backend-nestjs
npm run build

# Start both API and Judge Worker instances via PM2:
pm2 start ecosystem.config.js

# Monitor live cluster status:
pm2 status
pm2 logs
```

---

## ⚙️ Environment Variables Reference

### Backend (`backend-nestjs/.env`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | HTTP port for the NestJS API server | `5001` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres:password123@127.0.0.1:5432/codeskill` |
| `REDIS_HOST` | Redis server hostname | `127.0.0.1` |
| `REDIS_PORT` | Redis server port | `6379` |
| `JWT_SECRET` | Secret key for signing JSON Web Tokens (min 32 chars) | `your-secure-jwt-secret-key-at-least-32-chars` |
| `JWT_EXPIRES_IN`| Token validity duration | `7d` |
| `PISTON_URL` | Sandboxed code execution engine endpoint | `http://127.0.0.1:2000/api/v2` |
| `AWS_REGION` | AWS region for S3 and SES | `ap-south-1` |
| `AWS_S3_BUCKET`| S3 bucket for anti-cheat snapshots & media | `codeskill-proctoring-evidence` |
| `AWS_SES_FROM` | Verified sender email for transactional notices | `no-reply@codeskill.cu.edu.in` |

### Frontend (`frontend-v2/.env.local`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Base HTTP endpoint for backend REST services | `http://localhost:5001/api` |
| `NEXT_PUBLIC_SOCKET_URL`| WebSocket endpoint for real-time judge & proctoring | `http://localhost:5001` |

---

## 🧪 Testing & Quality Assurance

CodeSkill enforces comprehensive unit, integration, and end-to-end testing across all modules:

```bash
# Run all NestJS backend test suites (40 test suites, 401+ tests passing):
cd backend-nestjs
npm test

# Run tests in watch mode:
npm run test:watch

# Run code coverage report:
npm run test:cov

# Typecheck frontend codebase without emitting files:
cd ../frontend-v2
npx tsc --noEmit
```

---

## 🛡️ Security, Privacy & Compliance

- **Role-Based Access Control (RBAC)**: Enforced via NestJS `@UseGuards(JwtAuthGuard, RolesGuard)`.
- **Stateless Authentication**: High-entropy JWT tokens with configurable expiration and Redis blacklist validation.
- **Sandboxed Execution Cgroups**: Prevents fork bombs, system call overrides, unauthorized file access, and socket spoofing.
- **Audit Logging**: Every administrative action, question edit, grade override, and security incident is immutably logged into `audit_logs`.

---

## 🏛️ Chandigarh University Acknowledgements

Proudly engineered for the students, faculty, and academic administration of **Chandigarh University**.

<div align="center">

<img src="docs/assets/cu-logo.png" alt="Chandigarh University" width="120" />

<br/>

**CodeSkill Assessment Infrastructure** • Empowering Future Tech Leaders

© 2026 Chandigarh University. All rights reserved.

</div>
