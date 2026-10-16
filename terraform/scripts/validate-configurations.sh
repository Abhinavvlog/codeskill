#!/usr/bin/env bash
# Validate local configuration only. No plan, apply, destroy, or AWS API calls.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
terraform fmt -check -recursive "$TF_DIR"
LOG_DIR=$(mktemp -d)
trap 'rm -rf "$LOG_DIR"' EXIT
failures=0
for directory in "$TF_DIR" "$TF_DIR"/environments/* "$TF_DIR"/modules/*; do
  [ -d "$directory" ] || continue
  label="${directory#"$TF_DIR"}"
  if terraform -chdir="$directory" init -backend=false -input=false -no-color > "$LOG_DIR/init.log" 2>&1 && \
     terraform -chdir="$directory" validate -no-color > "$LOG_DIR/validate.log" 2>&1; then
    echo "PASS terraform$label"
  else
    cat "$LOG_DIR/init.log"
    [ ! -f "$LOG_DIR/validate.log" ] || cat "$LOG_DIR/validate.log"
    failures=$((failures + 1))
  fi
  rm -f "$LOG_DIR/init.log" "$LOG_DIR/validate.log"
done
python3 "$TF_DIR/tests/test_bootstrap.py"
if [ "$failures" -ne 0 ]; then
  echo "$failures Terraform configurations failed validation" >&2
  exit 1
fi
echo 'All Terraform configurations and bootstrap regression checks passed.'
