# Infrastructure, Cloud Architecture & Site Reliability Engineering (SRE) Audit

**Audit Date:** October 18, 2026  
**Audited Target:** CodeSkill Platform (Terraform, AWS, PM2, Docker)  
**Commit:** `2d89bd45`  
**Auditor:** Site Reliability Engineer (SRE) & Cloud DevOps Principal  

---

## 1. Infrastructure Topology & Cloud Asset Overview

The production infrastructure is defined in Terraform (`terraform/environments/production/` and `terraform/modules/`):
- **Networking:** Multi-AZ AWS VPC with public and private subnets, NAT Gateways, and security groups.
- **Compute:** Auto Scaling Groups (ASG) running EC2 instances or ECS tasks for API and Frontend services.
- **Load Balancing:** AWS Application Load Balancer (ALB) routing `/api/*` to NestJS and `/*` to Next.js.
- **Relational Storage:** AWS RDS PostgreSQL (`db.t4g.micro` in dev, `db.t4g.small` in prod).
- **In-Memory Cache & Broker:** AWS ElastiCache Redis 7.x (`cache.t4g.micro`).
- **Object Storage:** AWS S3 (`app_storage` bucket) for user avatars, student submission code, and proctoring frames.

---

## 2. Critical Infrastructure Vulnerabilities & SRE Risks

### 2.1 RDS PostgreSQL Connection Starvation (ISSUE-INFRA-002)
- **Module:** `terraform/modules/rds/main.tf` (Lines 56–60)
- **Configuration:**
  ```hcl
  parameter {
    name  = "max_connections"
    value = "50"
  }
  ```
- **SRE Impact:** An ASG scaling policy triggers scale-out when API CPU hits 70%. When a second API instance launches, total application connection pools demand 150 connections (API 1: 50 + API 2: 50 + Worker: 50). The RDS database immediately rejects incoming requests, causing an instant cascading 500 outage across both API instances.
- **Remediation:** 
  1. Remove the restrictive parameter override or set it to dynamic proportional values (`GREATEST({DBInstanceClassMemory/9531392}, 100)`).
  2. Provision **AWS RDS Proxy** to multiplex application connections efficiently.

---

### 2.2 Shared Redis Memory Exhaustion & Cascade Lockup (ISSUE-INFRA-003)
- **Module:** `terraform/modules/redis/main.tf` (Lines 44–60)
- **Configuration:**
  ```hcl
  parameter {
    name  = "maxmemory-policy"
    value = "noeviction"
  }
  ```
- **Failure Cascade:**
  ```mermaid
  flowchart TD
      HighTraffic["Spike in Traffic / Submissions"] --> RedisFull["Redis Memory Exceeds 500MB (cache.t4g.micro)"]
      RedisFull --> NoEvict["'noeviction' Policy Refuses All New Writes"]
      NoEvict --> Fail1["BullMQ: Cannot enqueue new submissions"]
      NoEvict --> Fail2["Throttler: Login rate limiting crashes"]
      NoEvict --> Fail3["Socket.IO: Redis adapter fails to publish messages"]
      NoEvict --> Fail4["Auth: OTP codes cannot be stored"]
      Fail1 --> TotalOutage["Total Application Outage (Read-Only State)"]
      Fail2 --> TotalOutage
      Fail3 --> TotalOutage
      Fail4 --> TotalOutage
  ```
- **Remediation:** Separate BullMQ into a persistent Redis cluster, and configure the caching/rate-limiting Redis with `maxmemory-policy = volatile-lru`.

---

### 2.3 S3 Bucket Policy & Missing Presigned URLs (ISSUE-INFRA-001)
- **Module:** `terraform/modules/s3/main.tf` (Lines 9–34) & `backend-nestjs/src/s3/s3.service.ts`
- **Configuration:** The S3 bucket policy explicitly allows public `s3:GetObject` only for:
  `Resource = "${aws_s3_bucket.app_storage.arn}/avatars/*"`
- **Vulnerability:**
  All other objects, including `proctoring/*` snapshots, are private. `S3Service` returns standard public HTTPS URLs (`https://bucket.s3.amazonaws.com/proctoring/...`) without generating AWS Presigned URLs.
- **SRE Impact:** Administrative proctoring dashboards fail to render violation evidence and webcam captures, returning HTTP 403 Forbidden.

---

## 3. Process Management & Worker Architecture (`ecosystem.config.js`)

In production, the application is orchestrated using PM2:
- **API Monolith (`main.ts`):** Starts with `instances: 'max'` or explicit thread counts.
- **Judge Daemon (`worker.ts`):** Starts with `PROCESS_ROLE=judge`.
- **Finding:** In `backend-nestjs/src/gateway/`, the Socket.IO `EventsGateway` is loaded by NestJS modules. When running in worker mode, there is no HTTP server attached to the gateway. Attempting to emit socket events directly from worker threads fails silently or logs warnings, breaking real-time verdict updates unless the Redis Socket.IO adapter is perfectly synchronized.

---

## 4. Health Probing & Route Shadowing (ISSUE-ROUT-001)

### The Dual Health Controller Conflict
In `AppModule`:
1. `HealthModule` registers `@Get('health/live')` and `@Get('health/ready')` in `src/health/health.controller.ts`.
2. `ObservabilityModule` ALSO registers `@Get('health/live')` and `@Get('health/ready')` in `src/observability/health/health.controller.ts`.

### SRE Failure Mechanism
- NestJS loads both controllers into the Express router. The controller loaded first intercepts all ALB health probe traffic.
- If ALB probes hit Controller 1 (which only tests PostgreSQL), and Redis goes down, the pod reports **Healthy (200 OK)** even though BullMQ and authentication are dead.
- If ALB probes hit Controller 2, probes check both DB and Redis.
- This creates non-deterministic routing and failure detection depending on module load order.

---

## 5. Backup, Disaster Recovery & Shard Coverage Gaps

- **Script:** `scripts/backup.sh`
- **Finding:** The backup script performs a `pg_dump` targeting only the primary database specified in `DATABASE_URL`.
- **Coverage Gap:** If database sharding is active (`SUBMISSION_SHARDS`), shard databases `submission-shard-a`, `submission-shard-b`, etc., are **completely omitted** from backups. A disaster recovery restore will recover user profiles and problem statements but lose 100% of student submission history.

---

## 6. SRE Recommendations & Action Items

1. **Implement AWS RDS Proxy:** Buffer database connections between API servers and PostgreSQL.
2. **Isolate Redis Clusters:** Decouple BullMQ persistent queues from rate-limiting/cache instances.
3. **Canonical Terminus Health Controller:** Delete the redundant health controller and register a single, comprehensive `@nestjs/terminus` health check.
4. **Update Backup Scripts:** Ensure `scripts/backup.sh` iterates through all shard connection strings in `SUBMISSION_SHARDS`.
5. **Implement S3 Presigned URLs:** Update `S3Service` to sign GET requests for private bucket prefixes with 1-hour expiration.
