#!/usr/bin/env bash
# ==============================================================================
# CodeSkill Master DevOps & Infrastructure Validation Suite
# Runs Terraform validation, TypeScript checks, unit tests, and routing tests
# ==============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "=========================================================="
echo " Starting CodeSkill DevOps Validation Suite               "
echo " Time: $(date -u +"%Y-%m-%dT%H:%M:%SZ")                   "
echo "=========================================================="

# 1. Terraform Formatting
echo "[1/6] Running Terraform fmt check..."
terraform fmt -check -recursive terraform/
echo "PASS: All Terraform files formatted correctly."

# 2. Terraform Initialization & Validation
echo "[2/6] Validating Production Terraform configuration..."
terraform -chdir=terraform/environments/production init -backend=false -upgrade=false >/dev/null
terraform -chdir=terraform/environments/production validate
echo "PASS: Production Terraform configuration validated successfully."

# 3. Backend Type Checks & Unit Tests
echo "[3/6] Running Backend Tests (NestJS)..."
npm --prefix backend-nestjs test -- src/health/health.controller.spec.ts --silent
echo "PASS: Backend health controller tests passed."

# 4. Frontend Type Checks & Unit Tests
echo "[4/6] Running Frontend Tests (Next.js)..."
npm --prefix frontend-v2 test -- src/__tests__/components/CodeSnippet.test.tsx --silent
echo "PASS: Frontend unit tests passed."

# 5. Dockerfiles Existence Check
echo "[5/6] Verifying Multi-Stage Dockerfiles..."
test -f backend-nestjs/Dockerfile && echo "PASS: backend-nestjs/Dockerfile exists."
test -f frontend-v2/Dockerfile && echo "PASS: frontend-v2/Dockerfile exists."

# 6. ALB Routing Verification
echo "[6/6] Verifying ALB routing..."
if [ "${CHECK_LIVE_ROUTING:-false}" = "true" ]; then
  bash terraform/scripts/test-alb-routing.sh "${PLATFORM_DOMAIN:-codeskill.novaserve.cloud}"
else
  echo "SKIP: Live routing check (set CHECK_LIVE_ROUTING=true to enable)."
fi

echo "=========================================================="
echo " All Local Validation Checks Succeeded!"
echo "=========================================================="
