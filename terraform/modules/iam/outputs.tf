output "instance_profile_name" {
  description = "The name of the legacy application instance profile"
  value       = aws_iam_instance_profile.app.name
}

output "instance_profile_arn" {
  description = "The ARN of the legacy application instance profile"
  value       = aws_iam_instance_profile.app.arn
}

output "frontend_instance_profile_name" {
  description = "Frontend IAM instance profile name"
  value       = aws_iam_instance_profile.frontend.name
}

output "backend_instance_profile_name" {
  description = "Backend IAM instance profile name"
  value       = aws_iam_instance_profile.backend.name
}

output "piston_instance_profile_name" {
  description = "Piston IAM instance profile name"
  value       = aws_iam_instance_profile.piston.name
}

output "judge0_instance_profile_name" {
  description = "Judge0 IAM instance profile name"
  value       = aws_iam_instance_profile.judge0.name
}

output "app_role_arn" {
  description = "ARN of the application IAM role"
  value       = aws_iam_role.app.arn
}

output "judge0_role_arn" {
  description = "ARN of the judge0 IAM role"
  value       = aws_iam_role.judge0.arn
}
