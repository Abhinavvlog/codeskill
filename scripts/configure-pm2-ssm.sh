#!/usr/bin/env bash
# Provision monitoring credentials without putting key values in shell history or Terraform state.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PM2_INPUT_FILE="${PM2_INPUT_FILE:-$SCRIPT_DIR/../.env.pm2-ssm.json}"
if [ ! -f "$PM2_INPUT_FILE" ]; then
  echo 'Missing PM2 SSM input JSON. See terraform/PM2_MONITORING.md.' >&2
  exit 1
fi
aws ssm put-parameter --region "${AWS_REGION:-ap-south-1}" \
  --cli-input-json "file://$PM2_INPUT_FILE" >/dev/null
echo 'PM2.io credentials saved to SSM SecureString.'
