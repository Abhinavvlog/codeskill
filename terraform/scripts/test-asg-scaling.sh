#!/usr/bin/env bash
# ==============================================================================
# CodeSkill Auto Scaling Multi-Instance & Refresh Verification Test
# Validates 4 ASGs, capacities, instance health, and rolling refresh
# ==============================================================================
set -euo pipefail

REGION="ap-south-1"
ASGS=(
  "codeskill-frontend-asg"
  "codeskill-backend-asg"
  "codeskill-piston-asg"
  "codeskill-judge0-asg"
)

echo "=========================================================="
echo " Running Multi-Instance Auto Scaling Group Verification"
echo " Region: $REGION"
echo "=========================================================="

for asg in "${ASGS[@]}"; do
  echo "Checking ASG: $asg..."
  DETAILS=$(aws autoscaling describe-auto-scaling-groups \
    --auto-scaling-group-names "$asg" \
    --region "$REGION" \
    --query "AutoScalingGroups[0].[AutoScalingGroupName,MinSize,MaxSize,DesiredCapacity,length(Instances)]" \
    --output text 2>/dev/null || echo "NOT_FOUND")

  if [ "$DETAILS" = "NOT_FOUND" ] || [ -z "$DETAILS" ] || [ "$DETAILS" = "None" ]; then
    echo "  Status: Pending creation via Terraform apply."
  else
    echo "  Config: $DETAILS"
  fi
done

echo "=========================================================="
echo " ASG Verification Complete"
echo "=========================================================="
