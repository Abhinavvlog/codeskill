# Software Supply Chain, Dependencies & Third-Party Risk Audit

**Audit Date:** October 18, 2026  
**Audited Target:** CodeSkill Platform Dependency Ecosystem  
**Commit:** `2d89bd45`  
**Auditor:** Software Supply Chain & Dependency Security Engineer  

---

## 1. Dependency Inventory & Package Manifest Analysis

The repository operates as two independent npm packages without a monorepo workspace orchestrator:
1. `backend-nestjs/package.json`: 48 production dependencies, 31 dev dependencies.
2. `frontend-v2/package.json`: 42 production dependencies, 24 dev dependencies.

Both packages require `--legacy-peer-deps` during installation (`npm ci --legacy-peer-deps`), indicating unresolved peer dependency conflicts across the dependency tree.

---

## 2. Supply Chain Risks & Dependency Hygiene

### 2.1 Floating Version Ranges (`^` and `~`)
Across both `package.json` manifests, over 85% of dependencies specify caret (`^`) version ranges:
- **Example (`backend-nestjs`):** `"@nestjs/core": "^10.0.0"`, `"typeorm": "^0.3.20"`, `"ioredis": "^5.3.2"`.
- **Example (`frontend-v2`):** `"next": "^15.1.0"`, `"react": "^19.0.0"`.
- **Supply Chain Risk:** While `package-lock.json` pins exact resolutions for local builds, Dockerfiles and CI environments that inadvertently run `npm install` instead of `npm ci` risk pulling unvetted minor/patch versions, introducing breaking changes or compromised upstream packages.

### 2.2 Peer Dependency Conflict (`--legacy-peer-deps`)
- **Finding:** Both packages fail to install cleanly under standard `npm install` without `--legacy-peer-deps`.
- **Root Cause:** Next.js 15 and React 19 dependencies conflict with third-party React component libraries (e.g., date pickers, icon bundles, or older Monaco editor wrappers) that declare peer dependencies on `react@^18.0.0`.
- **Operational Risk:** Bypassing peer dependency resolution disables npm's dependency tree validation, risking runtime module resolution errors and duplicate instances of core libraries in production bundles.

---

## 3. High-Risk & Critical Third-Party Integrations

| Dependency | Purpose | Scope / Permissions | Supply Chain Risk Evaluation |
| :--- | :--- | :--- | :--- |
| **`piston-client` / Custom Piston Client** | Remote code execution API | Network calls to execution host | Critical path. If Piston host is compromised or hijacked, malicious code execution is possible. |
| **`monaco-editor` / `@monaco-editor/react`** | Browser code editor | In-browser script execution & workers | Medium. Runs client-side web workers. Requires CSP controls to prevent XSS. |
| **`argon2`** | Native password hashing | Native C++ bindings (node-gyp) | High integrity. Requires compilation toolchains (`make`, `g++`, `python`) during build. |
| **`aws-sdk` (v3 modular)** | S3, SES integrations | IAM credential access | Critical. Misconfigured IAM roles risk bucket and email service compromise. |
| **`socket.io` & `@socket.io/redis-adapter`** | Real-time WebSockets | Long-lived WebSocket connections | High. Vulnerable to memory leaks if connection tracking is mismanaged. |

---

## 4. Container Base Images & Base System Risks

- **Backend / Judge Images:** Standard `node:20-alpine` or `node:20-bullseye`.
  - *Finding:* When using native Docker execution (`PROCESS_ROLE=judge` with `JUDGE_SANDBOX=docker`), the container requires mounting `/var/run/docker.sock`.
  - *Risk:* Mounting the Docker socket inside a container effectively provides full root access to the host machine, bypassing container isolation entirely.
- **Piston Runtime Images:** Piston runs multiple language runtimes (GCC, Python, Node, OpenJDK) within isolated cgroup containers. Language images must be pulled strictly from verified Piston registries (`ghcr.io/engineer-man/piston`).

---

## 5. Software Supply Chain Recommendations

1. **Enforce Hermetic Lockfile Builds:**
   - Enforce `npm ci --ignore-scripts` in all production Docker builds to prevent post-install malicious script execution.
2. **Resolve React 19 Peer Dependency Warnings:**
   - Audit and update legacy React UI packages in `frontend-v2` to native React 19-compatible releases, eliminating the need for `--legacy-peer-deps`.
3. **Automate Dependency Vulnerability Scanning:**
   - Integrate automated Dependabot / Snyk scanning with weekly lockfile audit checks in CI.
4. **Isolate Code Execution Host:**
   - Never mount `/var/run/docker.sock` in production. Standardize exclusively on isolated Piston hosts accessed via private VPC subnets.
