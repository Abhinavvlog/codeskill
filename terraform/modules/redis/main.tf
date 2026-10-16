terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.name_prefix}-redis-subnet-group"
  subnet_ids = var.private_db_subnet_ids
}

resource "aws_security_group" "redis" {
  name   = "${var.name_prefix}-redis-sg"
  vpc_id = var.vpc_id

  ingress {
    description     = "Allow Redis 6379 from backend application"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = distinct(concat(var.authorized_security_group_ids, var.app_security_group_id != "" ? [var.app_security_group_id] : []))
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-redis-sg"
    }
  )
}

# Parameter group enforcing noeviction for BullMQ queue reliability
resource "aws_elasticache_parameter_group" "noeviction" {
  name        = "${var.name_prefix}-redis7-noeviction"
  family      = "redis7"
  description = "Redis 7 parameter group with noeviction policy for BullMQ job queue integrity"

  parameter {
    name  = "cluster-enabled"
    value = "yes"
  }

  parameter {
    name  = "maxmemory-policy"
    value = "noeviction"
  }

  tags = var.tags
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "${var.name_prefix}-redis"
  description                = "Redis OSS cluster for ${var.name_prefix} (BullMQ & Cache)"
  node_type                  = var.node_type
  port                       = 6379
  engine                     = "redis"
  parameter_group_name       = aws_elasticache_parameter_group.noeviction.name
  automatic_failover_enabled = true

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  num_node_groups         = 1
  replicas_per_node_group = 1

  transit_encryption_enabled = var.transit_encryption_enabled
  at_rest_encryption_enabled = var.at_rest_encryption_enabled
  auth_token                 = var.transit_encryption_enabled && var.auth_token != "" ? var.auth_token : null

  tags = merge(
    var.tags,
    {
      Name   = "${var.name_prefix}-redis"
      Engine = "redis-oss"
    }
  )

  lifecycle {
    ignore_changes = [num_node_groups]
  }
}
