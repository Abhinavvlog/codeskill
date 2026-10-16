# Local Development

The local workflow uses an isolated Docker Compose project, database, Redis service, ports, and named volumes. It does not manage the existing `codeskill` Compose project or its data.

## Initialize and Start

From the repository root in PowerShell:

```powershell
npm run local:init
npm run local:services:up
npm run local:db:sync
npm run local:accounts
npm run local:backend
```

`local:init` creates ignored local configuration and strong test passwords only when those files do not already exist. Keep `backend-nestjs/.env` and `.local-dev/` private. The schema sync wrapper refuses targets other than `127.0.0.1:55432/codeskill_local`; it uses the existing TypeORM synchronization entry point because this repository has no initial schema migration set. Synchronization stays disabled during normal backend startup.

`local:backend` also runs Compose with health-based waiting before it launches Nest, so PostgreSQL and Redis are ready before the API starts. The backend listens at `http://127.0.0.1:5001`; its readiness endpoint is `GET /api/health`. Login uses `POST /api/auth/login`. Redis, Google OAuth, email, and cloud credentials are not required for local password login; external integrations remain unconfigured.

## Test Accounts

The generated local-only passwords are stored in `.local-dev/test-accounts.json`. Seeding is repeatable: a correctly-role-matched existing account is preserved, including its password; a conflicting existing identity causes the seed to stop without changing it. The admin role is `super_admin` with `isAdmin=true`; the student role is `student` with `isAdmin=false`.

## Service Operations

```powershell
npm run local:services:logs
npm run local:test
npm run local:services:down
```

`local:services:down` stops only the `codeskill-local` Compose project and preserves its named volumes. Start again with `npm run local:services:up` to verify that the database and accounts persist. Do not add `--volumes` when stopping local services.

## Local Environment Variables

`backend-nestjs/.env` is generated locally and ignored by Git. It sets `NODE_ENV=development`, the loopback PostgreSQL URL on port `55432`, `DATABASE_NAME=codeskill_local`, `DB_SYNCHRONIZE=false`, a random `JWT_SECRET`, and loopback Redis on port `56379`. `.local-dev/compose.env` contains the local PostgreSQL password. No production URLs, passwords, or credentials belong in these files.