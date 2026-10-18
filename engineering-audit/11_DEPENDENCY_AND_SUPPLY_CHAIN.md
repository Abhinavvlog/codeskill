# Software Supply Chain, Dependencies & Third-Party Risk Audit (Commit `b846d107`)

**Audit Date:** October 18, 2026  
**Audited Target:** CodeSkill Platform Dependency Ecosystem  
**Commit Inspected:** `b846d107`  
**Auditor:** Software Supply Chain & Dependency Security Engineer  
**Output Location:** `engineering-audit/`  

---

## 1. Dependency Inventory & Package Manifest Analysis

The repository maintains two independent npm packages without a workspace manager:
- `backend-nestjs/package.json`: 49 production dependencies, 31 dev dependencies.
- `frontend-v2/package.json`: 42 production dependencies, 24 dev dependencies.

---

## 2. Critical Supply Chain Breakdown: The Missing Presigner Module

### Issue Analysis (ISSUE-BUILD-001)
In PR #95, line 42 was added to `backend-nestjs/package.json`:
```json
"@aws-sdk/s3-request-presigner": "^3.1152.0",
```
And in `package-lock.json`, the package and its sub-dependencies were recorded.
However, **the package was never populated into `backend-nestjs/node_modules/`**.

### Operational Consequences
1. **Broken Builds:** `tsc` and Jest throw `Cannot find module '@aws-sdk/s3-request-presigner'` upon inspecting `s3.service.ts`.
2. **Offline / Sandboxed Installation Failure:** In environments without direct access to `registry.npmjs.org` (e.g., secure sandboxes, air-gapped CI runners), running `npm ci --legacy-peer-deps` fails with HTTP 403 Forbidden.
3. **Release Blocker:** Any deployment pipeline that relies on pre-installed node_modules or runs offline package verification will fail immediately.

---

## 3. Persistent Supply Chain Risks

### 3.1 Unresolved Peer Dependencies (`--legacy-peer-deps`)
Both applications fail to install cleanly under standard `npm install` without the `--legacy-peer-deps` flag:
- In `frontend-v2`, React 19 dependencies conflict with packages declaring peer dependencies on `react@^18.0.0`.
- In `backend-nestjs`, dependencies on TypeORM, NestJS, and AWS SDK modules declare conflicting peer requirements.
- **Risk:** Bypassing peer dependency verification can introduce subtle runtime errors where different packages load incompatible duplicate versions of shared libraries into memory.

### 3.2 Floating Version Ranges (`^`)
Over 85% of dependencies in both `package.json` manifests use caret (`^`) version ranges (e.g., `"@nestjs/core": "^11.0.1"`, `"typeorm": "^1.1.1"`).
- **Risk:** Unless strict `npm ci` is enforced in all deployment scripts, builds risk pulling unexpected minor or patch releases that introduce breaking changes or supply-chain compromises.

---

## 4. Third-Party Integration Risk Matrix

| Dependency | Purpose | Scope / Permissions | Supply Chain Risk Evaluation |
| :--- | :--- | :--- | :--- |
| **`@aws-sdk/s3-request-presigner`** | S3 URL presigning | Missing from `node_modules` | **CRITICAL:** Breaks backend compilation and tests. |
| **`piston-client` / Piston HTTP** | Remote code execution | HTTP access to execution cluster | **HIGH:** Untrusted code execution host. |
| **`argon2`** | Password hashing | Native C++ bindings (node-gyp) | **MEDIUM:** Requires C++ build tools during install. |
| **`@monaco-editor/react`** | In-browser IDE | Client-side web workers | **MEDIUM:** Web worker bundle loading impact on LCP. |

---

## 5. Supply Chain Recommendations

1. **Vendor or Install Missing Dependencies:** Ensure `@aws-sdk/s3-request-presigner` is fully installed into `node_modules` and verified via `tsc`.
2. **Pin Dependency Versions:** Pin exact package versions in `package.json` to eliminate floating minor-version hazards.
3. **Eliminate `--legacy-peer-deps`:** Audit outdated React 18 packages in `frontend-v2` and upgrade them to React 19-compatible releases.
