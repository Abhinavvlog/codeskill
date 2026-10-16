const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true });
fs.rmSync(path.join(root, 'tsconfig.build.tsbuildinfo'), { force: true });

const compiler = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');
const result = spawnSync(process.execPath, [compiler, '-p', 'tsconfig.build.json'], {
  cwd: root,
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}