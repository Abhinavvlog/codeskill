output "endpoint" {
  value = aws_elasticache_replication_group.main.configuration_endpoint_address
}
output "redis_cluster_id" {
  value = aws_elasticache_replication_group.main.id
}


output "security_group_id" {
  value = aws_security_group.redis.id
}
