#!/usr/bin/env bash
# Runs only inside the dedicated local ARM VM; never runs AWS deployment steps.
set -euo pipefail
umask 077
cd /opt/codeskill-judges
[[ $(uname -m) == aarch64 ]]
test -f /sys/fs/cgroup/cgroup.controllers
if ! python3 -c 'import yaml' 2>/dev/null; then
  if command -v apk >/dev/null; then
    apk add --no-cache python3 py3-yaml
  else
    apt-get update
    DEBIAN_FRONTEND=noninteractive apt-get install -y python3 python3-yaml
  fi
fi
if ! docker compose version >/dev/null 2>&1; then
  if command -v apk >/dev/null; then apk add --no-cache docker-cli-compose;
  else DEBIAN_FRONTEND=noninteractive apt-get install -y docker-compose-plugin; fi
fi
fingerprint=$({
  find sources -type f -exec sha256sum {} +
  for file in ./*.Dockerfile ./*.sh ./*.py; do
    [[ $file != *.local.sh ]] || continue
    sha256sum "$file"
  done
  sha256sum manifest.json
} | sort | sha256sum | awk '{print $1}')
for image in runtime judge0 piston; do
  tag="codeskill-${image}:arm64"
  [[ $image != runtime ]] || tag=codeskill-native-runtime:arm64
  installed=$(docker image inspect --format '{{index .Config.Labels "codeskill.local.source"}}' "$tag" 2>/dev/null || true)
  if [[ $installed != "$fingerprint" ]]; then
    docker build --platform linux/arm64 --label "codeskill.local.source=$fingerprint" -f "$image.Dockerfile" -t "$tag" .
  fi
done
python3 configure.py
# Keep native and previous emulated stacks on different loopback ports while
# validating. No application source, DB credentials, or host folders are mounted.
python3 - <<'PY'
import json,pathlib,yaml
root=pathlib.Path.cwd()
doc=yaml.safe_load((root/'compose.yaml').read_text())
doc['services']['gateway']['ports']=['127.0.0.1:2359:2358','127.0.0.1:2002:2001']
# Rails leaves its PID file behind when the VM stops. It must be removed before
# booting a new API process, without touching the judge database or its volume.
entry=root/'judge0-entrypoint.local.sh'
entry.write_text((root/'judge0-entrypoint.sh').read_text().replace(
  'if [[ ${1:-api} == api ]]; then',
  'if [[ ${1:-api} == api ]]; then\n  rm -f /api/tmp/pids/server.pid'))
entry.chmod(0o755)
api=doc['services']['judge0-api']
api['volumes']=api.get('volumes',[])+['./judge0-entrypoint.local.sh:/usr/local/bin/codeskill-judge0:ro']
(root/'compose.runtime.json').write_text(json.dumps(doc))
(root/'.env').write_text('JUDGE_BIND_IP=127.0.0.1\nCOMPOSE_FILE=compose.runtime.json\n')
(root/'config/providers').write_text('judge0,piston\n')
nginx=root/'config/nginx.conf'
# Two parallel tests polling every 250ms need more than five requests/sec.
nginx.write_text(nginx.read_text().replace('rate=5r/s','rate=25r/s'))
verify=root/'verify.py'
verify.write_text(verify.read_text().replace("f'http://{ip}:2358'", "f'http://{ip}:2359'")
  .replace("f'http://{ip}:2001/api/v2'", "f'http://{ip}:2002/api/v2'"))
PY
docker compose up -d --scale judge0-worker=2
python3 verify.py
python3 - <<'PY'
import json,pathlib
root=pathlib.Path.cwd()
report=json.loads((root/'verification.json').read_text())
versions={('cpp' if k=='c++' else k):v for k,v in report['piston_versions'].items()}
token=(root/'config/auth-token').read_text().strip()
settings=dict(CODE_EXECUTION_PROVIDER='judge0', JUDGE0_BASE_URL='http://127.0.0.1:2359',
  PISTON_BASE_URL='http://127.0.0.1:2002/api/v2', JUDGE0_AUTH_TOKEN=token, PISTON_API_KEY=token,
  PISTON_RUNTIME_VERSIONS=json.dumps(versions,separators=(',',':')), JUDGE_DISCOVERY_TIMEOUT_MS=2000,
  JUDGE0_REQUEST_TIMEOUT_MS=3000,JUDGE0_SUBMISSION_TIMEOUT_MS=20000,JUDGE0_POLL_INTERVAL_MS=250,
  JUDGE0_MAX_MEMORY_MB=256,JUDGE_TIME_LIMIT_MULTIPLIER=1,JUDGE_TEST_CASE_CONCURRENCY=2,
  JUDGE0_MAX_CONCURRENT_EXECUTIONS=2,JUDGE0_GLOBAL_MAX_CONCURRENT=2,JUDGE0_NODE_MAX_CONCURRENT=2,
  PISTON_REQUEST_TIMEOUT_MS=18000,PISTON_DEFAULT_RUN_TIMEOUT_MS=5000,PISTON_DEFAULT_COMPILE_TIMEOUT_MS=10000,
  PISTON_MAX_CONCURRENT_EXECUTIONS=1,PISTON_GLOBAL_MAX_CONCURRENT=1,PISTON_NODE_MAX_CONCURRENT=1,
  PISTON_TEST_CASE_CONCURRENCY=1,PISTON_COMPILE_MEMORY_LIMIT_BYTES=268435456)
target=root/'backend.local.env'
target.write_text(''.join(f'{k}={v}\n' for k,v in settings.items()))
target.chmod(0o600)
PY
