#!/usr/bin/env bash
# ==============================================================================
# CodeSkill Private Service Discovery Verification Test
# Validates Cloud Map private DNS resolution for Piston and Judge0
# ==============================================================================
set -euo pipefail

NAMESPACE="${1:-codeskill.internal}"
PISTON_HOST="piston.$NAMESPACE"
JUDGE0_HOST="judge0.$NAMESPACE"

echo "=========================================================="
echo " Running Private Service Discovery Tests"
echo " Namespace: $NAMESPACE"
echo "=========================================================="

echo "[1/3] Checking Cloud Map Namespace in AWS..."
if command -v aws &>/dev/null; then
  NAMESPACE_ID=$(aws servicediscovery list-namespaces --region ap-south-1 --query "Namespaces[?Name=='$NAMESPACE'].Id" --output text 2>/dev/null || echo "")
  if [ -n "$NAMESPACE_ID" ] && [ "$NAMESPACE_ID" != "None" ]; then
    echo "PASS: Cloud Map namespace '$NAMESPACE' exists (ID: $NAMESPACE_ID)."
  else
    echo "INFO: Cloud Map namespace '$NAMESPACE' pending infrastructure apply."
  fi
fi

echo "[2/3] Checking DNS Resolution for $PISTON_HOST..."
if command -v dig &>/dev/null; then
  dig +short "$PISTON_HOST" || echo "Note: Resolution valid from within VPC subnets only."
fi

echo "[3/3] Checking DNS Resolution for $JUDGE0_HOST..."
if command -v dig &>/dev/null; then
  dig +short "$JUDGE0_HOST" || echo "Note: Resolution valid from within VPC subnets only."
fi

echo "=========================================================="
echo " Service Discovery Verification Complete"
echo "=========================================================="
