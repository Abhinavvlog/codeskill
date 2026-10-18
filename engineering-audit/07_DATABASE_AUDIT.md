# Database Architecture, Performance & Schema Audit (Commit `b846d107`)

**Audit Date:** October 18, 2026  
**Audited Target:** CodeSkill Persistence Layer (PostgreSQL & Sharding Topology)  
**Commit Inspected:** `b846d107`  
**Auditor:** Database Architect & Performance Engineer  
**Output Location:** `engineering-audit/`  

---

## 1. Database Architecture & Technology Overview

The persistence architecture consists of:
1. **Primary Relational Store:** PostgreSQL 15+ hosted on AWS RDS or local Docker.
2. **Object-Relational Mapping:** TypeORM 0.3.x managing 35 domain entities.
3. **Partitioning Framework:** Native PostgreSQL range partitioning implemented via `declarative-partitioning.ts`.
4. **Sharding Framework:** Multi-shard user-partitioned topology orchestrated via `SubmissionStore`.

---

## 2. Re-Assessment of Recent Database Changes (PR #95)

### 2.1 Declarative Partitioning Horizon Extended (Remediated)
- **File:** `backend-nestjs/src/database/migrations/declarative-partitioning.ts` (lines 92–125)
- **Previous Finding:** Hardcoded partition definitions expired on December 31, 2027.
- **Current Status: REMEDIATED**
  - PR #95 implemented `generateDynamicPartitionsSql(tableName, baseYear, futureYearsCount)`, dynamically generating:
    - 12 monthly partitions for base year 2026 (`${tableName}_y2026m01` ... `m12`).
    - 4 yearly partitions for future years 2027 through 2030 (`${tableName}_y2027` ... `y2030`).
    - A resilient default partition (`CREATE TABLE IF NOT EXISTS "${tableName}_default" PARTITION OF "${tableName}" DEFAULT;`).
  - This guarantees that any insert with unexpected or future timestamps will safely land in the default partition rather than throwing a PostgreSQL partition violation error.

### 2.2 TypeORM Safe Mode Applied (Remediated)
- **File:** `backend-nestjs/src/database/database.module.ts` (lines 121–123, 139–141)
- **Previous Finding:** `null: 'ignore'` silently stripped `userId` filters from WHERE clauses when variables were undefined.
- **Current Status: REMEDIATED**
  - The configuration was updated to `invalidWhereValuesBehavior: { null: 'throw' }`.
  - TypeORM will now throw an exception if an undefined or null filter key is passed to repository lookup methods, closing the BOLA vulnerability.

---

## 3. Critical Database Risks Remaining

### 3.1 RDS PostgreSQL Memory Exhaustion under `max_connections = 200` (NEW HIGH RISK)
- **Configuration:** `terraform/modules/rds/main.tf` (line 58): `max_connections = "200"`.
- **Instance Sizing:** `instance_class = "db.t4g.micro"` (1 GiB RAM).
- **Technical Risk:**
  - In PostgreSQL, each client connection spawns a dedicated backend OS process.
  - Baseline memory per connection is 5–10 MB, plus `work_mem` (default 4 MB per sort/hash operation).
  - 200 active connections consume up to $200 \times 9\text{ MB} = 1.8\text{ GB}$ of RAM.
  - Adding PostgreSQL's `shared_buffers` (256 MB) and OS kernel memory brings total RAM demand to $> 2.1\text{ GB}$, exceeding the physical 1 GiB capacity of `db.t4g.micro` by over 100%.
  - When connection counts surge during an assessment rush, the host OS kernel will invoke the OOM killer to terminate the PostgreSQL daemon (`postmaster`).
- **Remediation:** 
  1. Upgrade the RDS instance class to at least `db.t4g.small` (2 GiB RAM) or `db.t4g.medium` (4 GiB RAM).
  2. Implement **AWS RDS Proxy** to multiplex application connections so physical database connections remain capped below 30.

---

### 3.2 Overloaded Entity Contention on `AssessmentAttempt`
- **Entity:** `backend-nestjs/src/database/entities/assessment-attempt.entity.ts`
- **Columns:** `responses` (JSONB), `captures` (JSONB array), `violations` (JSONB array).
- **Issue:** 
  - Every 15-second webcam capture rewrites the entire attempt row and its associated JSONB TOAST pointers in PostgreSQL.
  - In a 1,000-candidate exam, this generates 4,000 full-row updates per minute on `assessment_attempts`.
  - This leads to excessive WAL generation, write amplification, and vacuum contention.
- **Remediation:** Decompose proctoring telemetry into dedicated child tables (`assessment_proctor_captures`, `assessment_proctor_violations`).

---

### 3.3 Contest Finalization Sharding Bypass (ISSUE-DATA-001)
- **File:** `backend-nestjs/src/contests/contests.service.ts` (lines 520–560)
- **Issue:** 
  - The contest finalization pipeline executes direct TypeORM queries on the primary `submissions` table:
    `this.submissionRepo.find({ where: { contestId } })`.
  - When submission sharding is enabled (`SUBMISSION_SHARDS`), candidate submissions are written to shard instances via `SubmissionStore`.
  - As a result, contest finalization evaluates only legacy or un-sharded submissions, calculating corrupted leaderboards and inaccurate final ranks.
- **Remediation:** Direct all submission read and write queries through `SubmissionStore`.

---

## 4. Query Performance & Indexing Opportunities

### Missing Composite Indexes
1. **Submissions by Contest & Problem:**
   - Queries frequently filter by `WHERE "contestId" = $1 AND "problemId" = $2 ORDER BY "createdAt" DESC`.
   - Existing indexes cover `contestId` and `problemId` separately, forcing PostgreSQL to perform bitmap index scans and in-memory sort operations.
   - Recommended Index:
     ```sql
     CREATE INDEX "IDX_submissions_contest_problem_created" 
     ON "submissions" ("contestId", "problemId", "createdAt" DESC);
     ```
2. **Assessment Attempts by Assessment & Student:**
   - Lookups filter by `WHERE "assessmentId" = $1 AND "studentId" = $2 AND "status" = $3`.
   - Recommended Index:
     ```sql
     CREATE INDEX "IDX_assessment_attempts_lookup" 
     ON "assessment_attempts" ("assessmentId", "studentId", "status");
     ```
