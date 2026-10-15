#!/usr/bin/env bash
set -euo pipefail

# Validate presence only. AWS authentication stays immediately before upload.
if [[ -n ${AWS_DEPLOY_ROLE_ARN:-} ]]; then
  if [[ ! $AWS_DEPLOY_ROLE_ARN =~ ^arn:aws[a-z-]*:iam::[0-9]{12}:role/[^[:space:]]+$ ]]; then
    echo '::error::AWS_ROLE_TO_ASSUME must contain an existing IAM role ARN. See deployment/github-actions.md.' >&2
    exit 1
  fi
  mode=oidc
elif [[ -n ${AWS_ACCESS_KEY_ID:-} && -n ${AWS_SECRET_ACCESS_KEY:-} ]]; then
  mode=access_keys
else
  echo '::error::AWS deployment is not configured. Set repository variable AWS_ROLE_TO_ASSUME for an existing GitHub OIDC role, or both repository secrets AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY. See deployment/github-actions.md.' >&2
  exit 1
fi

printf 'auth_mode=%s\n' "$mode" >> "${GITHUB_OUTPUT:?GitHub step output path is required}"
printf 'AWS authentication configuration found: %s\n' "$mode"
