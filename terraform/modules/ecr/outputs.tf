output "repository_urls" {
  description = "Map of repository URLs for frontend, backend, piston, judge0"
  value = {
    for k, v in aws_ecr_repository.repos : k => v.repository_url
  }
}

output "repository_arns" {
  description = "Map of repository ARNs"
  value = {
    for k, v in aws_ecr_repository.repos : k => v.arn
  }
}

output "frontend_repository_url" {
  description = "Frontend ECR repository URL"
  value       = aws_ecr_repository.repos["frontend"].repository_url
}

output "backend_repository_url" {
  description = "Backend ECR repository URL"
  value       = aws_ecr_repository.repos["backend"].repository_url
}

output "piston_repository_url" {
  description = "Piston ECR repository URL"
  value       = aws_ecr_repository.repos["piston"].repository_url
}

output "judge0_repository_url" {
  description = "Judge0 ECR repository URL"
  value       = aws_ecr_repository.repos["judge0"].repository_url
}
