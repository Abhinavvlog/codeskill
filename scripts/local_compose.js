const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const args = [
  'compose',
  '--project-name',
  'codeskill-local',
  '--env-file',
  '.local-dev/compose.env',
  '--file',
  'docker-compose.local.yml',
  ...process.argv.slice(2),
];

const result = spawnSync('docker', args, { cwd: root, stdio: 'inherit' });
if (result.error) {
  console.error(`Unable to run Docker Compose: ${result.error.message}`);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}