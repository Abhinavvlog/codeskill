const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const backendDir = path.join(root, 'backend-nestjs');
const dotenv = require(path.join(backendDir, 'node_modules', 'dotenv'));
const { Client } = require(path.join(backendDir, 'node_modules', 'pg'));
const bcrypt = require(path.join(backendDir, 'node_modules', 'bcryptjs'));

function readLocalConfig() {
  const envPath = path.join(backendDir, '.env');
  const credentialsPath = path.join(root, '.local-dev', 'test-accounts.json');
  if (!fs.existsSync(envPath) || !fs.existsSync(credentialsPath)) {
    throw new Error('Missing local configuration or credentials; run npm run local:init first.');
  }

  const env = dotenv.parse(fs.readFileSync(envPath));
  const database = new URL(env.DATABASE_URL || '');
  if (
    env.NODE_ENV !== 'development' ||
    database.hostname !== '127.0.0.1' ||
    database.port !== '55432' ||
    database.pathname !== '/codeskill_local' ||
    env.DATABASE_SSL === 'true'
  ) {
    throw new Error('Refusing account seeding: the configured target is not the isolated local database.');
  }
  return { databaseUrl: database.toString(), credentials: JSON.parse(fs.readFileSync(credentialsPath, 'utf8')) };
}

async function main() {
  const { databaseUrl, credentials } = readLocalConfig();
  const client = new Client({ connectionString: databaseUrl, ssl: false });
  const definitions = [
    { key: 'admin', email: 'admin.local@codeskill.test', role: 'super_admin', isAdmin: true, uid: 'LOCAL-ADMIN', name: 'Local Administrator' },
    { key: 'student', email: 'student.local@codeskill.test', role: 'student', isAdmin: false, uid: 'LOCAL-STUDENT', name: 'Local Student' },
  ];
  await client.connect();
  try {
    await client.query('BEGIN');
    for (const definition of definitions) {
      const account = credentials[definition.key];
      if (!account || account.email !== definition.email || typeof account.password !== 'string' || account.password.length < 24) {
        throw new Error(`Invalid local ${definition.key} credential file.`);
      }
      const found = await client.query(
        'SELECT "id", "role", "isAdmin" FROM "users" WHERE "email" = $1 LIMIT 1',
        [account.email],
      );
      if (found.rowCount) {
        const user = found.rows[0];
        if (user.role !== definition.role || user.isAdmin !== definition.isAdmin) {
          throw new Error(`Existing ${account.email} has a different role; refusing to modify it.`);
        }
        console.log(`Preserved existing ${definition.key} account without changing its password.`);
        continue;
      }

      const hash = await bcrypt.hash(account.password, 10);
      await client.query(
        `INSERT INTO "users" ("name", "email", "password", "role", "uid", "isAdmin", "isActive", "authProvider", "forcePasswordChange", "isAssessmentStudent", "mfaEnabled")
         VALUES ($1, $2, $3, $4, $5, $6, true, 'local', false, false, false)`,
        [definition.name, account.email, hash, definition.role, definition.uid, definition.isAdmin],
      );
      console.log(`Created local ${definition.key} account (${definition.role}).`);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});