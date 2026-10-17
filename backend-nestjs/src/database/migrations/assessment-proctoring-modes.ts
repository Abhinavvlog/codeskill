interface SchemaQueryRunner {
  query(sql: string): Promise<unknown>;
}

/** Run in a transaction. Backfill only columns introduced by this invocation. */
export async function applyAssessmentProctoringModesMigration(
  runner: SchemaQueryRunner,
): Promise<void> {
  const columns = (await runner.query(`
    SELECT relation.relname AS table_name, attribute.attname AS column_name
    FROM pg_attribute attribute
    JOIN pg_class relation ON relation.oid = attribute.attrelid
    WHERE attribute.attrelid IN (to_regclass('assessments'), to_regclass('assessment_attempts'))
      AND attribute.attnum > 0 AND NOT attribute.attisdropped
  `)) as Array<{ table_name: string; column_name: string }>;
  const existing = new Set(columns.map((c) => `${c.table_name}.${c.column_name}`));
  const additions = [
    {
      table: 'assessments', column: 'mode',
      definition: "varchar(50) NOT NULL DEFAULT 'fully_proctored'",
      backfill: `UPDATE "assessments" SET "mode" = proctoring->>'mode'
        WHERE proctoring->>'mode' IN ('fully_proctored', 'partial_proctored', 'non_proctored')`,
    },
    {
      table: 'assessments', column: 'submissionPolicy',
      definition: "varchar(50) NOT NULL DEFAULT 'auto'",
      backfill: `UPDATE "assessments" SET "submissionPolicy" = 'manual'
        WHERE "mode" IN ('partial_proctored', 'non_proctored')`,
    },
    {
      table: 'assessment_attempts', column: 'rawScore',
      definition: 'double precision NOT NULL DEFAULT 0',
      backfill: 'UPDATE "assessment_attempts" SET "rawScore" = coalesce("score", 0)',
    },
    { table: 'assessment_attempts', column: 'proctoringPenalty', definition: 'double precision NOT NULL DEFAULT 0' },
    { table: 'assessment_attempts', column: 'mode', definition: 'varchar(50)' },
    { table: 'assessment_attempts', column: 'submissionPolicy', definition: 'varchar(50)' },
  ];
  for (const addition of additions) {
    if (existing.has(`${addition.table}.${addition.column}`)) continue;
    await runner.query(`ALTER TABLE "${addition.table}"
      ADD COLUMN IF NOT EXISTS "${addition.column}" ${addition.definition}`);
    if (addition.backfill) await runner.query(addition.backfill);
  }
}
