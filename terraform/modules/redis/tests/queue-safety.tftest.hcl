mock_provider "aws" {
  mock_resource "aws_security_group" {
    defaults = { id = "sg-0123456789abcdef0" }
  }
}

variables {
  name_prefix                   = "audit-test"
  vpc_id                        = "vpc-0123456789abcdef0"
  private_db_subnet_ids         = ["subnet-0123456789abcdef0"]
  authorized_security_group_ids = ["sg-0123456789abcdef0"]
}

run "queue_cannot_evict_jobs" {
  command = apply

  assert {
    condition     = aws_elasticache_replication_group.main.parameter_group_name == aws_elasticache_parameter_group.noeviction.name
    error_message = "The queue must use the custom noeviction parameter group."
  }

  assert {
    condition     = anytrue([for setting in aws_elasticache_parameter_group.noeviction.parameter : setting.name == "maxmemory-policy" && setting.value == "noeviction"])
    error_message = "Redis must retain pending BullMQ jobs when memory is exhausted."
  }
}
