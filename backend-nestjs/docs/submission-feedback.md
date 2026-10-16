# Run and submission feedback

Practice **Run** executes public samples. **Submit** creates one queued submission and polls its persisted verdict, including all hidden cases. Passed cases retain summary fields only; failed cases include input, expected output, actual output and diagnostics. The practice submission panel lists only failures, while its pass count includes every test.

Assessment **Run Code** executes public samples or custom stdin. **Submit Solution** calls the authenticated assessment evaluation endpoint. It checks assignment, active-attempt ownership, the deadline, question membership and enabled languages before reserving execution capacity. Tests and limits come from the question record, and execution uses the existing judge queue. Hidden results expose only ID, status, pass/fail and measurements; stdout, expected output, input and diagnostics are excluded from both job responses and socket events. Saving a solution does not trust client scores; final assessment grading still runs on the server.

Practice runtime and memory comparisons use each other student's best accepted measurements for the same problem source, language aliases and test count. Counts aggregate across submission shards; ties are not beaten. Assessment pass-count comparisons use each other candidate's latest graded attempt on the same assessment question and test count. No peer identities or code are returned. Missing measurements or peer data show as unavailable, and comparison-query failures do not hide a verdict. These are historical comparisons, not controlled hardware benchmarks; a changed test suite with the same test count is not versioned by the current schema.

Validation commands:

```bash
cd backend-nestjs
npm test -- --runInBand --watchman=false
npm run build
npm run test:startup
npm run test:feedback:integration

cd ../frontend-v2
npm test -- --runInBand --watchman=false
npx tsc --noEmit
npm run build
```

The PostgreSQL integration check requires a local database configured in `backend-nestjs/.env`. It uses temporary tables on one connection and drops them on disconnect; it never changes application records. Component tests cover actual practice and assessment button interactions, pending states, full-verdict polling, metrics and hidden-case visibility. A local development-runner smoke test does not certify deployed Judge0/Piston sandbox behavior or performance.
