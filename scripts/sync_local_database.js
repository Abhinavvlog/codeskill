const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const backendDir = path.join(root, 'backend-nestjs');
const dotenv = require(path.join(backendDir, 'node_modules', 'dotenv'));

function assertLocalTarget() {
  const envPath = path.join(backendDir, '.env');
  if (!fs.existsSync(envPath)) throw new Error('Missing backend-nestjs/.env; run npm run local:init first.');
  const env = dotenv.parse(fs.readFileSync(envPath));
  const database = new URL(env.DATABASE_URL || '');
  if (
    env.NODE_ENV !== 'development' ||
    database.hostname !== '127.0.0.1' ||
    database.port !== '55432' ||
    database.pathname !== '/codeskill_local' ||
    env.DATABASE_SSL === 'true'
  ) {
    throw new Error('Refusing schema synchronization: the configured target is not the isolated local database.');
  }
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

try {
  assertLocalTarget();
  run(process.execPath, [path.join(backendDir, 'node_modules', 'typescript', 'bin', 'tsc'), '-p', 'tsconfig.build.json'], backendDir);
  run(process.execPath, ['dist/sync-db.js'], backendDir);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}