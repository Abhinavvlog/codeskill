#!/usr/bin/env bash
set -euo pipefail
script_dir=$(cd "$(dirname "$0")" && pwd)
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT

check() {
  local expected=$1
  shift
  : > "$scratch/output"
  if env -i PATH="$PATH" GITHUB_OUTPUT="$scratch/output" "$@" bash "$script_dir/check-aws-deployment-config.sh" > "$scratch/log" 2>&1; then
    [[ $expected != failure ]]
    [[ $(cat "$scratch/output") == "auth_mode=$expected" ]]
  else
    [[ $expected == failure ]]
    [[ ! -s "$scratch/output" ]]
    grep -q '^::error::' "$scratch/log"
  fi
  if grep -Eq 'fixture-access|fixture-secret|fixture-session' "$scratch/log" "$scratch/output"; then
    echo 'Credential fixture leaked into validator output' >&2
    exit 1
  fi
}

check failure
check failure AWS_ACCESS_KEY_ID=fixture-access
check failure AWS_SECRET_ACCESS_KEY=fixture-secret
check failure AWS_DEPLOY_ROLE_ARN=not-an-arn
check access_keys AWS_ACCESS_KEY_ID=fixture-access AWS_SECRET_ACCESS_KEY=fixture-secret
check access_keys AWS_ACCESS_KEY_ID=fixture-access AWS_SECRET_ACCESS_KEY=fixture-secret AWS_SESSION_TOKEN=fixture-session
check oidc AWS_DEPLOY_ROLE_ARN=arn:aws:iam::000000000000:role/example-deploy
check oidc AWS_DEPLOY_ROLE_ARN=arn:aws:iam::000000000000:role/example-deploy AWS_ACCESS_KEY_ID=fixture-access AWS_SECRET_ACCESS_KEY=fixture-secret
echo 'PASS AWS deployment configuration: 8 cases; credential values stay private'
