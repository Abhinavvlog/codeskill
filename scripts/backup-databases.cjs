const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const dotenv = require('../backend-nestjs/node_modules/dotenv');
const root = path.resolve(__dirname, '..');
const envFile = process.env.BACKEND_ENV_FILE || path.join(root, 'backend-nestjs/.env');
const env = { ...(fs.existsSync(envFile) ? dotenv.parse(fs.readFileSync(envFile)) : {}), ...process.env };
const outputDir = env.BACKUP_DIR || path.join(root, 'backups/daily');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const databases = [{ id: 'primary', url: env.DATABASE_URL }];
if (!databases[0].url) {
  const { DATABASE_HOST: host, DATABASE_USER: user, DATABASE_PASSWORD: password, DATABASE_NAME: database } = env;
  if (!host || !user || !database) throw new Error('Primary database configuration is incomplete');
  const url = new URL('postgresql://localhost');
  url.hostname = host;
  url.port = env.DATABASE_PORT || '5432';
  url.username = user;
  url.password = password || '';
  url.pathname = '/' + database;
  if (env.DATABASE_SSL === 'true') url.searchParams.set('sslmode', 'verify-full');
  databases[0].url = url.toString();
}
if (env.SUBMISSION_SHARDS) {
  const shards = JSON.parse(env.SUBMISSION_SHARDS);
  if (!Array.isArray(shards) || !shards.length) throw new Error('Invalid SUBMISSION_SHARDS');
  for (const shard of shards) {
    if (!/^[a-z][a-z0-9_-]{0,31}$/.test(shard.id) || typeof shard.url !== 'string') throw new Error('Invalid submission shard');
    const url = new URL(shard.url);
    if (shard.ssl !== false) url.searchParams.set('sslmode', 'verify-full');
    databases.push({ id: shard.id, url: url.toString() });
  }
}
if (new Set(databases.map(db => db.id)).size !== databases.length) throw new Error('Duplicate backup database IDs');
fs.mkdirSync(outputDir, { recursive: true, mode: 0o700 });
for (const database of databases) {
  const output = path.join(outputDir, `db_backup_${timestamp}_${database.id}.dump`);
  try {
    execFileSync('pg_dump', ['-Fc', '-f', output + '.partial'], {
      env: { ...env, PGDATABASE: database.url }, stdio: ['ignore', 'inherit', 'pipe'],
    });
    fs.chmodSync(output + '.partial', 0o600);
    fs.renameSync(output + '.partial', output);
    console.log(`Backup successful: ${database.id}`);
  } catch {
    fs.rmSync(output + '.partial', { force: true });
    throw new Error(`Backup failed for ${database.id}; previous backups retained`);
  }
}
for (const file of fs.readdirSync(outputDir)) {
  if (!/^db_backup_.*\.dump$/.test(file)) continue;
  const target = path.join(outputDir, file);
  if (Date.now() - fs.statSync(target).mtimeMs > 7 * 86400000) fs.unlinkSync(target);
}
