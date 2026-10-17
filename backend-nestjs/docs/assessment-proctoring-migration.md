# Assessment proctoring schema repair

If assessment creation fails with `WITHIN GROUP is required for ordered-set
aggregate mode`, compare the database schema with the assessment entities.
PostgreSQL can resolve the absent `Assessment.mode` field as its built-in
aggregate, so the reported error hides a missing-column migration.

The targeted assessment migration adds `assessments.mode/submissionPolicy`
and `assessment_attempts.rawScore/proctoringPenalty/mode/submissionPolicy`.
When first adding the columns, it retains valid modes from assessment JSON,
sets manual submission for partial/non-proctored assessments, and initializes
legacy raw scores from saved scores. Existing grades and existing proctoring
columns are never overwritten. Historical attempt modes remain nullable
because their past settings cannot be reconstructed reliably.

After building the backend, run from `backend-nestjs/` with the target's normal
database environment (or inside its backend container):

```bash
NODE_ENV=production node dist/database/run-assessment-proctor-captures-migration.js
```

This existing command now applies both capture and mode fields in one
transaction, with a five-second lock timeout and a thirty-second statement
timeout. It does not run the unrelated partition/submission migrations.
Retry if the table is busy. No application restart or schema synchronization
is required. Keep the additive columns when rolling back application code.

Verify with real PostgreSQL using temporary tables on a local database:

```bash
NODE_ENV=test npx --no-install ts-node test/assessment-proctoring-schema.integration.ts
```
