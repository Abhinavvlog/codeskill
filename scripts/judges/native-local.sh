#!/usr/bin/env bash
set -euo pipefail
umask 077
if [[ $(uname -s) != Darwin || $(uname -m) != arm64 ]]; then
  echo 'This local setup requires an Apple Silicon Mac and Colima.' >&2
  exit 1
fi
root=$(cd "$(dirname "$0")/../.." && pwd)
profile=${CODESKILL_NATIVE_PROFILE:-codeskill-native}
state="$root/.local-dev/native-judges"
case ${1:-start} in
  stop) exec colima stop "$profile" ;;
  status) colima status "$profile"; exec colima ssh --profile "$profile" -- sudo docker ps --format '{{.Names}} {{.Status}}' ;;
  start) ;;
  *) echo 'Usage: bash scripts/judges/native-local.sh start|status|stop' >&2; exit 1 ;;
esac
mkdir -p "$state"
disk="${COLIMA_HOME:-$HOME/.colima}/_lima/_disks/colima-$profile/datadisk"
if [[ -L $disk && ! -e $disk ]]; then
  echo 'The native judge disk is missing. Reconnect its external drive before starting.' >&2
  exit 1
fi
start_vm() {
  colima start "$profile" --arch aarch64 --vm-type vz --cpus 4 --memory 3 --disk 20 --root-disk 10 \
    --mount none --activate=false --ssh-agent=false --ssh-config=false --binfmt=false
}
start_vm
if [[ -n ${CODESKILL_NATIVE_DISK_DIR:-} && ! -L $disk ]]; then
  [[ $CODESKILL_NATIVE_DISK_DIR == /* ]] || { echo 'Use an absolute external disk directory.' >&2; exit 1; }
  mkdir -p "$CODESKILL_NATIVE_DISK_DIR"
  target="$CODESKILL_NATIVE_DISK_DIR/docker.raw"
  [[ ! -e $target ]] || { echo 'External disk file already exists; refusing to overwrite it.' >&2; exit 1; }
  colima stop "$profile"
  mv "$disk" "$target"
  ln -s "$target" "$disk"
  start_vm
fi
bash "$root/deployment/judges/shared/package.sh" "$state/source.tgz"
colima ssh --profile "$profile" -- sudo mkdir -p /opt/codeskill-judges
colima ssh --profile "$profile" -- sudo tar -xzf - -C /opt/codeskill-judges < "$state/source.tgz"
colima ssh --profile "$profile" -- sudo bash -s < "$root/scripts/judges/native-local-guest.sh"
colima ssh --profile "$profile" -- sudo cat /opt/codeskill-judges/backend.local.env > "$state/backend.local.env"
# Preserve unrelated local settings. A first-run backup supports rollback.
node - "$root" "$state" <<'JS'
const fs = require('node:fs');
const { createRequire } = require('node:module');
const [root,state] = process.argv.slice(2);
const req = createRequire(root+'/backend-nestjs/package.json');
const dotenv = req('dotenv');
const file=root+'/backend-nestjs/.env';
const previous=fs.readFileSync(file,'utf8');
const backup=state+'/backend.env.before-native';
if (!fs.existsSync(backup)) fs.writeFileSync(backup,previous,{mode:0o600});
const settings=dotenv.parse(fs.readFileSync(state+'/backend.local.env'));
let lines=previous.split(/\r?\n/).filter(line=>!/^\s*(JUDGE0_BASE_URLS|PISTON_BASE_URLS)\s*=/.test(line));
for(const [key,value] of Object.entries(settings)) {
  const pattern=new RegExp('^\\s*'+key+'\\s*=');
  const index=lines.findIndex(line=>pattern.test(line));
  if(index<0) lines.push(key+'='+value); else lines[index]=key+'='+value;
}
fs.writeFileSync(file,lines.join('\n'),{mode:0o600});
fs.chmodSync(file,0o600);
console.log('Native ARM judges verified. Local backend settings updated; restart the backend to use them.');
JS
