# Database Architecture, Performance & Schema Audit

**Audit Date:** October 18, 2026  
**Audited Target:** CodeSkill Platform (PostgreSQL & Sharding Architecture)  
**Commit:** `2d89bd45`  
**Auditor:** Database Architect & Performance Engineer  

---

## 1. Database Architecture & Technology Overview

The persistence tier consists of:
1. **Primary Relational Store:** PostgreSQL 15+ managed via AWS RDS or local Docker containers.
2. **Object-Relational Mapping:** TypeORM 0.3.x with 35 active entities.
3. **Submission Sharding Architecture:** An optional multi-shard PostgreSQL topology managed via `SubmissionStore` (`backend-nestjs/src/database/sharding/submission-store.ts`).
4. **Declarative Partitioning:** Native PostgreSQL range partitioning implemented on large event tables (`declarative-partitioning.ts`).

---

## 2. Critical Database Defects & Schema Deficiencies

### 2.1 Overloaded Entity Anti-Pattern: `AssessmentAttempt`
- **Entity:** `backend-nestjs/src/database/entities/assessment-attempt.entity.ts`
- **Schema Columns:**
  - `responses`: JSONB containing all question answers and draft code.
  - `captures`: JSONB array of base64/URL proctoring snapshots.
  - `violations`: JSONB array of security violation logs.
- **Problem:** Storing high-frequency append-only proctoring logs and student answers in a single row creates massive write contention and TOAST table overhead in PostgreSQL. Every 15-second webcam capture rewrites the entire row and updates the JSONB TOAST pointers, triggering aggressive WAL generation and table bloat.

### 2.2 Hardcoded Partitioning Horizon (ISSUE-DB-002)
- **File:** `backend-nestjs/src/database/declarative-partitioning.ts` (Lines 58–85)
- **Code:**
  ```sql
  CREATE TABLE IF NOT EXISTS submissions_y2025 PARTITION OF submissions
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

  CREATE TABLE IF NOT EXISTS submissions_y2026 PARTITION OF submissions
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

  CREATE TABLE IF NOT EXISTS submissions_y2027 PARTITION OF submissions
  FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
  ```
- **Finding:** The partitioning script defines static yearly tables terminating on December 31, 2027. There is no automated routine (`pg_partman` or scheduled cron) to generate partitions for 2028 onward. On January 1, 2028, all submission writes will fail with:
  `ERROR: no partition of relation "submissions" found for row`.

### 2.3 Hazardous Query Behavior: TypeORM `null: 'ignore'` (ISSUE-DB-001)
- **File:** `backend-nestjs/src/database/database.module.ts` (Lines 121–123, 139–141)
- **Configuration:**
  ```typescript
  invalidWhereValuesBehavior: {
    null: 'ignore',
  }
  ```
- **Finding:** If an application query passes `undefined` or `null` for a filter key (e.g., `userId`), TypeORM removes that clause entirely instead of matching `IS NULL` or throwing an exception. This exposes the database to accidental table scans and Broken Object Level Authorization (BOLA).

---

## 3. Connection Pool Sizing & Resource Allocation Mismatch

```mermaid
flowchart LR
    subgraph AppServers["Application Tier (Autoscaling ASG)"]
        API1["API Server 1 (DB_POOL_MAX=50)"]
        API2["API Server 2 (DB_POOL_MAX=50)"]
        Worker1["Judge Worker (DB_POOL_MAX=50)"]
    end

    subgraph DatabaseTier["RDS PostgreSQL (db.t4g.micro)"]
        PG["PostgreSQL Instance<br/><b>max_connections = 50</b><br/>1 GiB RAM"]
    end

    API1 -->|Up to 50 connections| PG
    API2 -.->|Connection Rejected! (Slots Exhausted)| PG
    Worker1 -.->|Connection Rejected! (Slots Exhausted)| PG
```

- **Terraform Configuration (`terraform/modules/rds/main.tf` L56-60):**
  `max_connections = 50`
- **Backend Configuration (`database.module.ts` L88):**
  `DB_POOL_MAX = 50`
- **Analysis:**
  With 1 API instance and 1 Worker instance running, peak connection demand is 100 connections. When traffic increases and autoscaling launches a second API instance, total potential demand reaches 150. PostgreSQL hard-rejects connections beyond 50, resulting in catastrophic database connection dropouts across the cluster.

---

## 4. Query Analysis & N+1 Performance Risks

### 4.1 Reports Aggregation N+1 Querying
- **Location:** `backend-nestjs/src/reports/reports.controller.ts` & `reports.service.ts`
- **Pattern:** Fetching batches of students or assessments, followed by looped calls to fetch individual submission counts or performance scores for each student.
- **Impact:** Generating an institution-level performance report for 500 students executes 501 distinct SQL queries, taking $> 4.5\text{ seconds}$ and locking database worker threads.
- **Solution:** Rewrite report aggregations using PostgreSQL Common Table Expressions (CTEs) or window functions (`COUNT(*) OVER (PARTITION BY student_id)`).

### 4.2 Missing Composite Indexes
- Queries on `submissions` frequently filter by:
  `WHERE user_id = $1 AND problem_id = $2 ORDER BY created_at DESC`
  Existing indexes cover `user_id` and `problem_id` separately. A composite B-tree index on `(user_id, problem_id, created_at DESC)` is required to prevent costly index bitmap scans and sorting steps.

---

## 5. Submission Sharding Architecture Review

### Architecture Mechanics
The `SubmissionStore` coordinates writes across:
- **Primary Database:** Holds users, problems, contests, and metadata.
- **Shard Instances:** Multiple independent PostgreSQL nodes storing partitions of the `submissions` table, keyed by `userId`.

### Shard Consistency Findings
1. **Contest Bypass:** When completing a contest, certain operations bypass the `SubmissionStore` and query the primary database's legacy `submissions` table directly, resulting in missing submissions if sharding is enabled.
2. **Distributed Transaction Absence:** Writes to primary metadata and shard databases are not coordinated under a Two-Phase Commit (2PC) or Saga pattern. A network failure during submission creation leaves orphaned submission records in the shard without corresponding events in BullMQ or Redis.
3. **Cutover Vulnerability:** The shard cutover script (`npm run db:shards:migrate`) requires all writers to be stopped (`--writers-stopped`). If writers remain active during cutover, data divergence is irreversible.

---

## 6. Database Remediation Roadmap

1. **Deploy Connection Pooling Layer:** Deploy AWS RDS Proxy or PgBouncer configured with `pool_mode = transaction`. Reduce backend `DB_POOL_MAX` to `10`.
2. **Decompose `AssessmentAttempt`:** Create `assessment_proctor_captures` and `assessment_proctor_violations` tables to isolate proctoring append operations.
3. **Automate Partition Management:** Integrate `pg_partman` into PostgreSQL or add automated TypeORM migration tasks to generate partitions 12 months in advance.
4. **Harden TypeORM Settings:** Replace `null: 'ignore'` with `null: 'throw'` in `database.module.ts`.
5. **Add Composite Indexes:** Deploy migration adding `(user_id, problem_id, created_at DESC)` and `(attempt_id, status)`.
