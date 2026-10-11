# CodeSkill — Technical Assessment & Coding Examination Platform
### Official Platform for Chandigarh University

An enterprise-grade examination, algorithmic assessment, and technical skill-building platform engineered with Next.js, NestJS, and TypeORM with PostgreSQL / AWS RDS.

---

## Architecture Overview

```
codeskill/
├── backend-nestjs/             # Enterprise NestJS API Gateway & Execution Engine
│   ├── src/
│   │   ├── config/             # Environment, Database, and AWS configuration
│   │   ├── database/           # TypeORM entities, repositories, and migrations
│   │   │   └── entities/       # PostgreSQL Entities (27 domain models)
│   │   ├── admin/              # Comprehensive University & Admin management API
│   │   ├── assessments/        # Proctored test lifecycle, questions, attempts
│   │   ├── execution/          # Sandboxed code judge (Python, C++, Java, JS) & BullMQ
│   │   ├── auth/               # JWT authentication, RBAC, password policies
│   │   ├── students/           # Student cohort onboarding, bulk CSV import
│   │   └── exam-security/      # Real-time proctoring, fullscreen violation audits
│   └── package.json            # NestJS + TypeORM + pg + BullMQ + Redis
│
├── frontend-v2/                # Next.js App Router (React 19, Tailwind CSS v4)
│   ├── src/
│   │   ├── app/                # App router routes (admin, assessments, exams)
│   │   ├── components/         # Premium UI components, Monaco editor, dashboards
│   │   └── lib/                # API client, auth stores, and utility hooks
│   └── package.json
│
├── terraform/                  # Production AWS Infrastructure (IaC)
│   ├── modules/
│   │   ├── rds/                # AWS RDS PostgreSQL Multi-AZ Database
│   │   ├── vpc/                # Virtual Private Cloud, subnets, NAT gateways
│   │   ├── asg/                # Auto Scaling Group & Launch Templates
│   │   ├── alb/                # Application Load Balancer
│   │   └── redis/              # AWS ElastiCache Redis Cluster
│   └── environments/dev/       # Dev environment deployment
│
└── docker-compose.yml          # Local containerization (PostgreSQL 15, Redis 7)
```

---

## Database Architecture: PostgreSQL & AWS RDS

CodeSkill utilizes **PostgreSQL / AWS RDS** exclusively across all environments through TypeORM.

### Core PostgreSQL Domain Models (TypeORM Entities):
- **User & Roles**: `User` (`users`), `University` (`universities`), `Company` (`companies`), `Batch` (`batches`)
- **Assessments & Exams**: `Assessment` (`assessments`), `AssessmentAttempt` (`assessment_attempts`), `Question` (`questions`), `ExamSession` (`exam_sessions`), `ExamSecurityEvent` (`exam_security_events`)
- **Coding Problems & Submissions**: `Problem` (`problems`), `ProblemMetadata` (`problem_metadata`), `ProblemStatement` (`problem_statements`), `ProblemConfig` (`problem_configs`), `ProblemTestCase` (`problem_test_cases`), `Submission` (`submissions`)
- **Competitions & Social**: `Contest` (`contests`), `ContestAttempt` (`contest_attempts`), `Discussion` (`discussions`), `DiscussionReply` (`discussion_replies`)
- **Security & Audits**: `AuditLog` (`audit_logs`), `EmailJob` (`email_jobs`)

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- PostgreSQL 14+ (Local or via Docker Compose)
- Redis 7+

### 1. Start Database & Redis Services

```bash
# Start PostgreSQL 15 and Redis 7 containers locally:
docker-compose up -d postgres redis
```

### 2. Configure Environment

In `backend-nestjs/.env`:
```env
PORT=5001
DATABASE_URL=postgres://postgres:password123@127.0.0.1:5432/codeskill
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
JWT_SECRET=your-secure-jwt-secret-key-32chars
```

### 3. Initialize & Seed Database

```bash
cd backend-nestjs
npm install
npm run build
npm run typeorm:sync

# Seed default administrator accounts into PostgreSQL
node ../scripts/create_admin.js
```

### 4. Run Development Servers

```bash
# Terminal 1 — NestJS Backend API (Port 5001)
cd backend-nestjs
npm run start:dev

# Terminal 2 — Next.js Frontend (Port 3000)
cd frontend-v2
npm run dev
```

Visit `http://localhost:3000` to access the platform.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4, Monaco Editor, Lucide Icons |
| **Backend API** | NestJS 11, Express, WebSocket (Socket.IO), BullMQ |
| **Database** | PostgreSQL 15 / AWS RDS PostgreSQL 14 (TypeORM ORM) |
| **Caching & Queues** | Redis 7 / AWS ElastiCache Redis |
| **Infrastructure** | Terraform, AWS RDS, AWS EC2 Auto Scaling, AWS ALB, S3, SES |
| **Code Execution** | Isolated Worker Sandbox (Python 3, C++17, Java 21, JavaScript Node.js) |

Built for **Chandigarh University** Official Technical Assessment & Examination Infrastructure.
