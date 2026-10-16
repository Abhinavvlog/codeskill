output "alb_id" {
  description = "The ARN of the load balancer"
  value       = aws_lb.main.id
}

output "alb_arn" {
  description = "The ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "The DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "The canonical hosted zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "target_group_arn" {
  description = "The ARN of the frontend target group (for backward compatibility)"
  value       = aws_lb_target_group.app.arn
}

output "frontend_target_group_arn" {
  description = "The ARN of the frontend target group (port 3000)"
  value       = aws_lb_target_group.app.arn
}

output "backend_target_group_arn" {
  description = "The ARN of the backend target group (port 5001)"
  value       = aws_lb_target_group.backend.arn
}

output "frontend_target_group_name" {
  description = "The name of the frontend target group"
  value       = aws_lb_target_group.app.name
}

output "backend_target_group_name" {
  description = "The name of the backend target group"
  value       = aws_lb_target_group.backend.name
}

output "http_listener_arn" {
  description = "The ARN of the HTTP listener"
  value       = aws_lb_listener.http.arn
}

output "https_listener_arn" {
  description = "The ARN of the HTTPS listener if created"
  value       = length(aws_lb_listener.https) > 0 ? aws_lb_listener.https[0].arn : null
}
