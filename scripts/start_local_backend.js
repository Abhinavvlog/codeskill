const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const backendDir = path.join(root, 'backend-nestjs');
const compose = [
  'compose',
  '--project-name',
  'codeskill-local',
  '--env-file',
  '.local-dev/compose.env',
  '--file',
  'docker-compose.local.yml',
];

const services = spawnSync('docker', [...compose, 'up', '--detach', '--wait'], {
  cwd: root,
  stdio: 'inherit',
});
if (services.error) {
  console.error(`Unable to start local dependencies: ${services.error.message}`);
  process.exit(1);
}
if (services.status !== 0) process.exit(services.status ?? 1);

const nest = path.join(backendDir, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js');
const backend = spawn(process.execPath, [nest, 'start', '--watch'], {
  cwd: backendDir,
  stdio: 'inherit',
});

backend.on('error', (error) => {
  console.error(`Unable to start NestJS: ${error.message}`);
  process.exitCode = 1;
});
backend.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});