const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
test('backs up primary and shards from a different working directory', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeskill-backup-'));
  try {
    const bin = path.join(dir, 'pg_dump');
    fs.writeFileSync(bin, '#!/bin/sh\nprintf "test backup" > "$3"\n');
    fs.chmodSync(bin, 0o700);
    const output = path.join(dir, 'backups');
    const result = spawnSync(process.execPath, [path.join(__dirname, 'backup-databases.cjs')], {
      cwd: os.tmpdir(), encoding: 'utf8', env: { ...process.env,
        PATH: dir + path.delimiter + process.env.PATH,
        BACKEND_ENV_FILE: path.join(dir, 'absent.env'), BACKUP_DIR: output,
        DATABASE_URL: 'postgresql://localhost/main',
        SUBMISSION_SHARDS: JSON.stringify([{ id: 'shard_a', url: 'postgresql://localhost/a', ssl: false }, { id: 'shard_b', url: 'postgresql://localhost/b', ssl: false }]),
      },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.readdirSync(output).length, 3);
    for (const file of fs.readdirSync(output)) assert.equal(fs.statSync(path.join(output, file)).mode & 0o777, 0o600);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
