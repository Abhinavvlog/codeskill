# Infrastructure, Cloud Architecture & Site Reliability Engineering (SRE) Audit (Commit `b846d107`)

**Audit Date:** October 18, 2026  
**Audited Target:** CodeSkill Infrastructure (Terraform, AWS, PM2, Docker)  
**Commit Inspected:** `b846d107`  
**Auditor:** Site Reliability Engineer (SRE) & Cloud DevOps Principal  
**Output Location:** `engineering-audit/`  

---

## 1. Cloud Topology & Infrastructure Definition

The production infrastructure is defined in Terraform (`terraform/environments/production/` and reusable modules in `terraform/modules/`):
- **Networking:** Multi-AZ AWS VPC with public and private subnets, NAT Gateways, and security groups.
- **Compute:** Auto Scaling Groups (ASG) running EC2 instances or ECS tasks for API and Frontend services.
- **Load Balancing:** AWS Application Load Balancer (ALB) routing `/api/*` to NestJS and `/*` to Next.js.
- **Relational Storage:** AWS RDS PostgreSQL (`db.t4g.micro` with 1 GiB RAM).
- **In-Memory Broker:** AWS ElastiCache Redis 7.x (`cache.t4g.micro`).
- **Object Storage:** AWS S3 (`app_storage` bucket) for avatars, submissions, and proctoring snapshots.

---

## 2. Re-Assessment of Recent Infrastructure Changes (PR #95)

### 2.1 Deduplicated Health Routing (Remediated)
- **Previous Finding:** Competing health controllers in `src/health/health.controller.ts` and `src/observability/health/health.controller.ts` shadowed each other on `/api/health/live` and `/api/health/ready`.
- **Status: REMEDIATED**
  - In `HealthAndTelemetryController`, duplicate `@Get('health/live')` and `@Get('health/ready')` annotations were removed, leaving only `@Get('health/deep')`.
  - ALB probes now route deterministically to the primary health module without router conflicts.

### 2.2 Client Telemetry Route Corrected (Remediated)
- **Previous Finding:** In `HealthAndTelemetryController`, `@Post('api/telemetry/client-events')` mounted at `/api/api/telemetry/client-events`, causing client beacons to 404.
- **Status: REMEDIATED**
  - Route annotation was changed to `@Post('telemetry/client-events')`.
  - With NestJS global prefix `'api'`, client beacons to `/api/telemetry/client-events` return HTTP 204 No Content as expected.

---

## 3. Critical Infrastructure & Reliability Risks Remaining

### 3.1 RDS PostgreSQL Memory Saturation under `max_connections = 200` (NEW HIGH RISK)
- **Module:** `terraform/modules/rds/main.tf` (Line 58)
- **Configuration:** `max_connections = "200"` on `instance_class = "db.t4g.micro"` (1 GiB RAM).
- **SRE Risk:**
  - Raising the connection limit without increasing RAM introduces severe stability risks.
  - When connection demand spikes, PostgreSQL backend worker processes will allocate up to 1.8 GiB of RAM.
  - The Linux kernel Out-Of-Memory (OOM) killer will terminate `postmaster`, crashing the database and causing immediate 500 errors across all active candidate sessions.
- **Remediation:** 
  - Upgrade the RDS instance class to `db.t4g.small` (2 GiB RAM) or `db.t4g.medium` (4 GiB RAM).
  - Deploy **AWS RDS Proxy** to decouple application connection pools from physical database connections.

---

### 3.2 Shared Redis Memory Exhaustion & Cascade Lockup (ISSUE-INFRA-001)
- **Module:** `terraform/modules/redis/main.tf` (Lines 44–60)
- **Configuration:**
  ```hcl
  parameter {
    name  = "maxmemory-policy"
    value = "noeviction"
  }
  ```
- **SRE Risk:**
  - Single shared Redis instance handles BullMQ queues, login rate limiters, session caches, and Socket.IO adapters.
  - When memory reaches capacity, `noeviction` rejects all write commands with `OOM command not allowed`.
  - This halts user logins, OTP verifications, job enqueuing, and live updates simultaneously.
- **Remediation:** Separate BullMQ into a persistent Redis cluster, and use a separate Redis instance with `volatile-lru` for caching and rate limiting.

---

### 3.3 Broken S3 Presigner Deployment (ISSUE-BUILD-001)
- **Module:** `backend-nestjs/src/s3/s3.service.ts`
- **Issue:** The code now invokes `getSignedUrl` from `@aws-sdk/s3-request-presigner`, but the dependency was not installed in `node_modules`.
- **SRE Impact:** Automated CI/CD deployments and Docker container launches fail during build/startup, preventing deployments to production.

---

### 3.4 Decoupled Worker Socket.IO Emission (ISSUE-OBS-001)
- **Module:** `backend-nestjs/src/worker.ts` & `src/gateway/events.gateway.ts`
- **Issue:** When running `PROCESS_ROLE=judge` as a standalone daemon, the worker lacks an attached HTTP server listener. Real-time verdict emissions depend entirely on the Redis adapter. If the adapter encounters network blips, push events are lost silently.
- **Remediation:** Implement explicit fallback polling on the client and ensure workers publish verdicts to dedicated Redis pub/sub topics consumed by the API server.

---

## 4. SRE Recommendations

1. **Deploy AWS RDS Proxy:** Interpose a managed connection pooler between the API and RDS PostgreSQL.
2. **Upgrade Database Instance Class:** Upgrade `db.t4g.micro` to `db.t4g.small` or higher.
3. **Partition Redis Instances:** Decouple BullMQ persistent queues from rate-limiting/cache instances.
4. **Automate Dependency Installation in CI:** Enforce `npm ci --legacy-peer-deps` in build containers to catch missing dependency imports before deployment.
