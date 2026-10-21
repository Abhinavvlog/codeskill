# CodeSkill Learning Module — Progress Tracker

**Branch:** `feat/learning-paths-practice-certification`  
**Current Milestone:** Batch 0 Completed -> Ready for Batch 1  
**Last Updated:** October 21, 2026  

---

## Batch Status Overview

- [x] **Batch 0 — Repository Audit & Design**
  - [x] Baseline test verification (75/75 backend suites passed, 49/49 frontend suites passed).
  - [x] `LEARNING_MODULE_AUDIT.md` produced.
  - [x] `LEARNING_MODULE_ARCHITECTURE.md` produced.
  - [x] `LEARNING_MODULE_ENTITY_REUSE_MAP.md` produced.
  - [x] `LEARNING_MODULE_API_CONTRACTS.md` produced.
  - [x] `LEARNING_MODULE_IMPLEMENTATION_PLAN.md` produced.
  - [x] `LEARNING_MODULE_RISK_REGISTER.md` produced.
  - [x] Created dedicated feature branch `feat/learning-paths-practice-certification`.

- [ ] **Batch 1 — Database & Backend Foundation**
  - [ ] TypeORM entities for Learning Paths, Courses, Modules, Lessons, Exercises, Enrollments, Progress, XP Ledger, Badges, Certificates.
  - [ ] Database migration script with reversible rollback.
  - [ ] NestJS `LearningModule`, `GamificationModule`, `CertificationModule`.
  - [ ] DTO validation and CRUD endpoints.

- [ ] **Batch 2 — Admin Studio**
  - [ ] Path & Course management UI.
  - [ ] Lesson editor (Markdown, code blocks, exercise configuration).
  - [ ] Quiz authoring interface.
  - [ ] Publishing workflow (`draft` -> `review` -> `publish`).

- [ ] **Batch 3 — Student Learning Experience**
  - [ ] Learning path catalog (`/learning`).
  - [ ] Course curriculum view & reading reader (NO VIDEO).
  - [ ] Interactive coding workspace integrated with Monaco and sandbox execution.
  - [ ] Next-lesson navigation and resume learning state.

- [ ] **Batch 4 — Progress & Mastery Engine**
  - [ ] Server-authoritative completion verification.
  - [ ] Idempotent progress tracking and aggregation.

- [ ] **Batch 5 — XP, Skills & Badges**
  - [ ] Append-only `XPLedger` with idempotency key enforcement.
  - [ ] Badge rules engine and student profile showcase.

- [ ] **Batch 6 — Certification Engine**
  - [ ] Server-side eligibility evaluator.
  - [ ] Credential generator (`CS-YYYY-XXXXXX`).
  - [ ] PDF rendering and S3 upload.
  - [ ] Public verification portal (`/verify/:credentialId`).

- [ ] **Batch 7 — Analytics & Curriculum Population**
  - [ ] Admin reporting dashboard.
  - [ ] Seed starter curriculum.

- [ ] **Batch 8 — QA, Performance & Production Rollout**
  - [ ] End-to-end integration tests.
  - [ ] Regression validation on contests and assessments.
  - [ ] Production runbook and documentation.
