output "asg_id" {
  description = "Auto Scaling Group ID"
  value       = aws_autoscaling_group.this.id
}

output "asg_name" {
  description = "Auto Scaling Group Name"
  value       = aws_autoscaling_group.this.name
}

output "asg_arn" {
  description = "Auto Scaling Group ARN"
  value       = aws_autoscaling_group.this.arn
}

output "launch_template_id" {
  description = "Launch Template ID"
  value       = aws_launch_template.this.id
}

output "launch_template_arn" {
  description = "Launch Template ARN"
  value       = aws_launch_template.this.arn
}

output "launch_template_latest_version" {
  description = "Latest version of the launch template"
  value       = aws_launch_template.this.latest_version
}
