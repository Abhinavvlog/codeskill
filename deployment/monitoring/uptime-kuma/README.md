# CodeSkill — Uptime Kuma Infrastructure Monitoring

Lightweight, self-hosted availability monitoring and alerting for CodeSkill on AWS, configured with zero Amazon CloudWatch overhead.

---

## 1. Architecture Overview

```
                      +-----------------------------+
                      |   CodeSkill Infrastructure  |
                      +-----------------------------+
                                     |
               +---------------------+---------------------+
               |                     |                     |
        Public ALB HTTPS       Private DB (5432)     Private Cloud Map
    (Frontend & Backend API)  Private Redis (6379)    (Piston & Judge0)
               |                     |                     |
               +---------------------+---------------------+
                                     |
                                     v
                       +-----------------------------+
                       |    Uptime Kuma Container    |
                       |  (louislam/uptime-kuma)     |
                       +-----------------------------+
                                     |
                               Webhook Event
                                     |
                                     v
                       +-----------------------------+
                       |  WhatsApp Relay Container   |
                       | (Node.js + Graph API v19.0) |
                       +-----------------------------+
                                     |
                              HTTPS Outbound
                                     |
                                     v
                       +-----------------------------+
                       |  Meta WhatsApp Cloud API    |
                       |  (SRE / DevOps Alerting)    |
                       +-----------------------------+
```

---

## 2. Quickstart Deployment

### Step 1: Clone Configuration
```bash
cd /opt/codeskill/deployment/monitoring/uptime-kuma
cp .env.example .env
# Edit .env with your WhatsApp API credentials
```

### Step 2: Start Containers via Docker Compose
```bash
docker compose up -d
```

### Step 3: Access Management Dashboard
To prevent exposing the dashboard to the public internet without authentication, access it via secure SSH tunnel:
```bash
ssh -L 3001:localhost:3001 -i ~/.ssh/your-ec2-key.pem ec2-user@<ec2-host>
```
Open your browser at `http://localhost:3001` and create your administrative credentials on first run.

---

## 3. Preconfigured Monitoring Checks

Import or configure the 10 checks from `monitors.json`:

| Service | Check Type | Endpoint / Target | Interval | Description |
| :--- | :--- | :--- | :--- | :--- |
| **CodeSkill Website** | HTTP(s) | `https://codeskill.novaserve.cloud/` | 60s | Public platform availability |
| **NestJS Backend** | HTTP(s) | `https://codeskill.novaserve.cloud/api/health/ready` | 60s | Database & Redis readiness |
| **Next.js Frontend** | HTTP(s) | `https://codeskill.novaserve.cloud/health/ready` | 60s | SSR server readiness |
| **Piston Engine** | HTTP | `http://piston.codeskill.internal:2001/api/v2/runtimes` | 60s | Private execution capacity |
| **Judge0 Engine** | HTTP | `http://judge0.codeskill.internal:2358/about` | 60s | Private judging capacity |
| **RDS PostgreSQL** | Port (TCP) | `codeskill-prod-postgres...:5432` | 60s | PostgreSQL socket connectivity |
| **ElastiCache Redis** | Port (TCP) | `codeskill-prod-redis...:6379` | 60s | Redis OSS socket connectivity |
| **BullMQ Worker** | Push Monitor | Heartbeat URL | 60s | Background worker heartbeats |
| **ALB Routing** | HTTP(s) | `https://codeskill.novaserve.cloud/api/health/live` | 60s | Load balancer responsiveness |
| **SSL Certificate** | Certificate | `codeskill.novaserve.cloud` | 24h | 14-day expiry warning |

---

## 4. WhatsApp Business Platform Notification Setup

1. In Uptime Kuma, navigate to **Settings** > **Notifications** > **Add New Notification**.
2. Select **Webhook**.
3. Set:
   - **Notification Type**: Webhook
   - **Post URL**: `http://whatsapp-relay:3002/webhook` (or `http://127.0.0.1:3002/webhook`)
   - **Request Method**: POST
   - **Content Type**: `application/json`
4. Click **Test**. You will receive a structured message on WhatsApp:
   ```
   🚨 CodeSkill Infrastructure Alert
   ---------------------------------------
   Service: NestJS Backend (Readiness Probe)
   Status: 🟢 UP / RECOVERED
   Environment: Production (ap-south-1)
   Timestamp: 2026-10-15T11:20:00Z
   Details: OK
   ---------------------------------------
   Platform: https://codeskill.novaserve.cloud/
   ```

---

## 5. Backup & Recovery

### Automated Backup
Run the backup script (can be scheduled via root cron `0 2 * * *`):
```bash
./backup-kuma.sh
```

### Restore from Backup
```bash
./restore-kuma.sh /opt/codeskill/backups/uptime-kuma/uptime-kuma-20261015_120000Z.tar.gz
```
