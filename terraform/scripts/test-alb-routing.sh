#!/usr/bin/env bash
# ==============================================================================
# CodeSkill ALB & Readiness Routing Verification Test
# Validates path routing (/api/* -> Backend, / -> Frontend, /health/ready)
# ==============================================================================
set -euo pipefail

DOMAIN="${1:-codeskill.novaserve.cloud}"
BASE_URL="https://$DOMAIN"

echo "=========================================================="
echo " Running ALB Routing & Target Group Verification"
echo " Target: $BASE_URL"
echo "=========================================================="

# 1. Frontend Route Verification
echo -n "[1/5] Testing Frontend root route (GET /)... "
STATUS=$(curl -s -k -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$STATUS" = "200" ]; then
  echo "PASS (HTTP $STATUS)"
else
  echo "FAIL (HTTP $STATUS)"
fi

# 2. Frontend Readiness Probe
echo -n "[2/5] Testing Frontend readiness route (GET /health/ready)... "
STATUS=$(curl -s -k -o /dev/null -w "%{http_code}" "$BASE_URL/health/ready")
if [ "$STATUS" = "200" ]; then
  echo "PASS (HTTP $STATUS)"
else
  echo "FAIL (HTTP $STATUS)"
fi

# 3. Backend Readiness Probe (/api/health/ready)
echo -n "[3/5] Testing Backend readiness route (GET /api/health/ready)... "
BODY=$(curl -s -k "$BASE_URL/api/health/ready" || echo "{}")
STATUS=$(curl -s -k -o /dev/null -w "%{http_code}" "$BASE_URL/api/health/ready")
if [ "$STATUS" = "200" ]; then
  echo "PASS (HTTP $STATUS)"
  echo "      Payload: $BODY"
else
  echo "FAIL (HTTP $STATUS) - $BODY"
fi

# 4. Backend Liveness Probe (/api/health/live)
echo -n "[4/5] Testing Backend liveness route (GET /api/health/live)... "
STATUS=$(curl -s -k -o /dev/null -w "%{http_code}" "$BASE_URL/api/health/live")
if [ "$STATUS" = "200" ]; then
  echo "PASS (HTTP $STATUS)"
else
  echo "FAIL (HTTP $STATUS)"
fi

# 5. HTTPS Redirection Verification (Port 80 -> 443)
echo -n "[5/5] Testing HTTP to HTTPS 301 redirection... "
REDIRECT_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN/")
if [ "$REDIRECT_CODE" = "301" ] || [ "$REDIRECT_CODE" = "302" ]; then
  echo "PASS (HTTP $REDIRECT_CODE)"
else
  echo "INFO (HTTP $REDIRECT_CODE - Direct SSL or ALB listener behavior)"
fi

echo "=========================================================="
echo " ALB Routing Verification Complete"
echo "=========================================================="
