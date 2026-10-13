# Practice submission source migration

Published practice problems now reuse `problem_metadata` and explicitly published coding `questions` records alongside legacy `problems` records. Submissions retain their existing UUID `problemId` and add a `problemSource` value of `problem`, `metadata`, or `question`. Existing submissions default to `problem`.

The existing foreign key from `submissions.problemId` to `problems.id` must be removed before metadata-backed and Question Bank submissions can be saved. The updated application validates the source record and its publication/access rules before accepting a submission. The entity disables creation of that legacy FK and declares the matching source check.

Build the updated backend, then run this targeted migration against the running backend's database before starting the updated backend and judge workers. Take a database backup through the existing deployment process first.

From `backend-nestjs`, with the production service's database environment inherited:

```sh
npm run build
NODE_ENV=production node dist/database/run-practice-submission-source.js
```

The runner uses the existing `DATABASE_URL` or `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`, and `DATABASE_SSL` settings. It does not load a dotenv file automatically. Execute it in the same environment that supplies those settings to the backend.

The runner applies one transaction, releases its connection, and returns a nonzero exit status on failure. It can be rerun safely. It only:

- Adds/backfills `problemSource` with the legacy default `problem`, and sets it nonnullable.
- Adds/upgrades/validates `CHK_submissions_problem_source`, allowing `problem`, `metadata`, and `question`.
- Discovers and drops only single-column FKs from `submissions.problemId` to the current `problems.id` relation.

Existing submission IDs, `problemId` values, submission history, the user FK, and indexes are preserved. No problem/question records are copied, and no tables or unrelated columns are synchronized. A fresh development database created from the updated entities already has the new source column/check; the runner is also safe there.

Question Bank publication is explicit: only coding types with `metadata.visibility` set to `Published` or `Public`, an eligible approval status, and `metadata.contestOnly` not true can appear publicly. Existing approved-only records are not automatically published. The previous admin label inferred publication incorrectly; open the existing question, choose Publish Immediately, and save if it is intended for public practice. Stable `question-<uuid>` URLs support explicitly published older questions with no slug without changing their records.
