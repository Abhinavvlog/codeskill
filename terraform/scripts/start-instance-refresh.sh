#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <auto-scaling-group-name> <aws-region>" >&2
  exit 2
fi

asg_name="$1"
aws_region="$2"

# Reuse an active refresh rather than starting a second one for the same ASG.
existing_refresh_id=$(aws autoscaling describe-instance-refreshes \
  --auto-scaling-group-name "$asg_name" \
  --region "$aws_region" \
  --query 'InstanceRefreshes[?Status==`Pending` || Status==`InProgress`].InstanceRefreshId | [0]' \
  --output text)
if [ -n "$existing_refresh_id" ] && [ "$existing_refresh_id" != "None" ]; then
  echo "$existing_refresh_id"
  exit 0
fi

asg_json=$(aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names "$asg_name" \
  --region "$aws_region" \
  --output json)

# This deployment stack uses a single launch template. Stop before changing
# anything if the live group has a different configuration shape.
launch_template_id=$(jq -r '.AutoScalingGroups[0].LaunchTemplate.LaunchTemplateId // empty' <<< "$asg_json")
configured_version=$(jq -r '.AutoScalingGroups[0].LaunchTemplate.Version // empty' <<< "$asg_json")
if [ -z "$launch_template_id" ] || [ -z "$configured_version" ]; then
  echo "Cannot safely refresh $asg_name: expected a single launch template, but none was found." >&2
  exit 1
fi

case "$configured_version" in
  '$Latest'|'$Default')
    launch_template_version=$(aws ec2 describe-launch-template-versions \
      --launch-template-id "$launch_template_id" \
      --versions "$configured_version" \
      --region "$aws_region" \
      --query 'LaunchTemplateVersions[0].VersionNumber' \
      --output text)
    ;;
  *[!0-9]*|'')
    echo "Cannot safely refresh $asg_name: unsupported launch template version '$configured_version'." >&2
    exit 1
    ;;
  *)
    launch_template_version="$configured_version"
    ;;
esac

if ! [[ "$launch_template_version" =~ ^[0-9]+$ ]]; then
  echo "Cannot safely refresh $asg_name: AWS did not return a numeric launch template version." >&2
  exit 1
fi

# Resolve aliases such as $Latest to a numeric version first. AWS requires a
# concrete desired configuration when AutoRollback is enabled, and rollback
# cannot use launch template aliases.
if [ "$configured_version" != "$launch_template_version" ]; then
  aws autoscaling update-auto-scaling-group \
    --auto-scaling-group-name "$asg_name" \
    --launch-template "LaunchTemplateId=$launch_template_id,Version=$launch_template_version" \
    --region "$aws_region"
fi

desired_configuration=$(jq -cn \
  --arg id "$launch_template_id" \
  --arg version "$launch_template_version" \
  '{LaunchTemplate:{LaunchTemplateId:$id,Version:$version}}')

aws autoscaling start-instance-refresh \
  --auto-scaling-group-name "$asg_name" \
  --desired-configuration "$desired_configuration" \
  --preferences '{"MinHealthyPercentage":75,"MaxHealthyPercentage":125,"InstanceWarmup":180,"SkipMatching":false,"AutoRollback":true}' \
  --region "$aws_region" \
  --query 'InstanceRefreshId' \
  --output text
