export interface MigrationQueryRunner {
  query(sql: string, parameters?: unknown[]): Promise<unknown>;
}

export async function applyAuthTokensSchemaMigration(
  queryRunner: MigrationQueryRunner,
): Promise<void> {
  await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "refresh_tokens" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "userId" uuid NOT NULL,
      "tokenHash" character varying(64) NOT NULL,
      "familyId" uuid NOT NULL,
      "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
      "revokedAt" TIMESTAMP WITH TIME ZONE,
      "replacedById" uuid,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id")
    )
  `);
  await queryRunner.query(
    'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_refresh_tokens_tokenHash" ON "refresh_tokens" ("tokenHash")',
  );
  await queryRunner.query(
    'CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_familyId" ON "refresh_tokens" ("familyId")',
  );
  await queryRunner.query(
    'CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_userId" ON "refresh_tokens" ("userId")',
  );
  await queryRunner.query(
    'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tokenVersion" integer NOT NULL DEFAULT 0',
  );
}
