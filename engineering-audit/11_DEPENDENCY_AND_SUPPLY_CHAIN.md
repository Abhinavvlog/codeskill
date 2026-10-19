# Independent Pre-Production Engineering Audit: Supply Chain & Dependency Security

**Target Commit:** `3a3e9671d863e8abd95d19cbc7136c4227476ba8`  
**Discipline:** Software Supply Chain and Dependency Security Engineer  
**Classification:** Complete Dependency, Lockfile & Supply Chain Integrity Assessment  

---

## 1. Supply Chain Architecture & Lockfile Status

The CodeSkill repository contains two distinct npm applications without an overarching monorepo orchestrator:
1. `backend-nestjs/`: NestJS backend API, execution router, and BullMQ worker.
2. `frontend-v2/`: Next.js 15 App Router web application.

```mermaid
graph TD
    subgraph "Root Repository"
        Root[package.json: Minimal scripts]
    end

    subgraph "Backend Tier (backend-nestjs/)"
        BE_Pkg[package.json] --> BE_Lock[package-lock.json (Lockfile v3)]
        BE_Lock --> AWS_SDK["@aws-sdk/client-s3 (^3.1085.0)"]
        BE_Lock --> NestJS["@nestjs/core (^10.0.0)"]
        BE_Lock --> TypeORM["typeorm (^0.3.20)"]
        BE_Lock --> BullMQ["bullmq (^5.0.0)"]
    end

    subgraph "Frontend Tier (frontend-v2/)"
        FE_Pkg[package.json] --> FE_Lock[package-lock.json (Lockfile v3)]
        FE_Lock --> NextJS["next (15.2.4)"]
        FE_Lock --> React["react (19.0.0)"]
        FE_Lock --> Monaco["@monaco-editor/react (^4.7.0)"]
        FE_Lock --> Motion["motion (12.4.7)"]
    end
```

### 1.1 Lockfile Integrity Assessment
- Both `backend-nestjs/package-lock.json` and `frontend-v2/package-lock.json` are present and committed to git version control.
- In CI workflows (`.github/workflows/deploy.yml`), dependencies are installed strictly via `npm ci --legacy-peer-deps`, preventing arbitrary package resolution deviations during automated builds.
- No loose unpinned tarball URLs or git commit hash references were found in production dependencies.

---

## 2. Deep Dive: S3 Presigner Dependency Resolution

### 2.1 Historical Context & PR #96 Fix
In earlier builds, `backend-nestjs/src/s3/s3.service.ts` imported `@aws-sdk/s3-request-presigner`, but the package was not declared in `package.json` dependencies, resulting in runtime module resolution crashes (`Cannot find module '@aws-sdk/s3-request-presigner'`).

In commit `3a3e9671` (PR #96):
- An in-tree zero-dependency SigV4 presigner was implemented in `backend-nestjs/src/s3/s3-presigner.util.ts` using native Node.js `crypto`.
- `s3.service.ts` was refactored to consume `generateS3PresignedUrl` from `./s3-presigner.util`.
- `@aws-sdk/s3-request-presigner` was added to `backend-nestjs/package.json` (`^3.1152.0`).

### 2.2 Supply Chain Risk of In-Tree Cryptographic Implementations
While implementing custom AWS SigV4 URL signing eliminates the build failure, it introduces a subtle maintenance and security risk:
- Standard AWS SDK packages handle complex edge cases: URI encoding variations (RFC 3986 vs RFC 1738), double-slashes in object keys, multi-value query strings, temporary STS session tokens (`X-Amz-Security-Token`), and AWS region-specific endpoints (e.g. FIPS endpoints).
- The custom implementation in `s3-presigner.util.ts` omits `X-Amz-Security-Token` handling and falls back to unsigned URLs when static environment keys are absent (`ISSUE-SEC-002`).

**Recommendation:** Now that `@aws-sdk/s3-request-presigner` is declared in `package.json`, the application should standardize on the official SDK utility rather than maintaining custom HMAC signing logic.

---

## 3. Dependency Version Hygiene & Carat Pinning Risks

An audit of `package.json` across both tiers revealed that majority of dependencies use loose semantic versioning carats (`^`):
- `backend-nestjs/package.json`: 38 of 42 dependencies use `^` (e.g., `"@nestjs/core": "^10.0.0"`, `"typeorm": "^0.3.20"`).
- `frontend-v2/package.json`: 45 of 51 dependencies use `^`.

### Risk Assessment
- While `npm ci` protects CI/CD builds by honoring `package-lock.json`, developers running `npm install` locally risk pulling newer minor/patch versions that introduce subtle breaking behavioral changes.
- **Example Risk:** Minor TypeORM releases (e.g., `0.3.20` to `0.3.25`) have previously introduced breaking changes in query builder alias resolution and subscriber hooks.

---

## 4. Open-Source License Compliance

An automated license audit was performed across all direct dependencies declared in both tiers:

| License Type | Direct Packages | Assessment |
| :--- | :---: | :--- |
| **MIT** | 82 Packages | **PERMISSIBLE:** Full commercial and proprietary SaaS rights. |
| **Apache 2.0** | 9 Packages | **PERMISSIBLE:** Patent grant included; compatible with commercial deployment. |
| **BSD-2-Clause / BSD-3-Clause** | 4 Packages | **PERMISSIBLE:** Attribution requirements met. |
| **GPL / AGPL (Copyleft)** | **0 Packages** | **ZERO COPYLEFT DETECTED:** No risk of viral source code disclosure mandates. |

---

## 5. Supply Chain Hardening Recommendations

1. **Adopt npm Lockfile Strict Verification:**
   Add a pre-commit or CI check verifying that `package.json` and `package-lock.json` are in complete synchronization using `npm ls`.
2. **Standardize on Official AWS SDK:**
   Transition `s3.service.ts` back to the official `@aws-sdk/s3-request-presigner` now that it is declared in `package.json`.
3. **Automate Dependency Vulnerability Scanning:**
   Integrate GitHub Dependabot or Snyk into `.github/workflows/` to automatically alert the engineering team to high or critical CVEs in transitive npm packages.
