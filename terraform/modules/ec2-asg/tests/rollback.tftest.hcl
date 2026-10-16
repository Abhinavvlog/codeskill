mock_provider "aws" {
  mock_resource "aws_launch_template" {
    defaults = { id = "lt-0123456789abcdef0", latest_version = 3 }
  }
}

variables {
  asg_name           = "audit-test"
  service_tier       = "backend"
  ami_id             = "ami-0123456789abcdef0"
  security_group_ids = ["sg-0123456789abcdef0"]
  subnet_ids         = ["subnet-0123456789abcdef0"]
}

run "rollback_uses_explicit_version" {
  command = apply

  assert {
    condition     = aws_autoscaling_group.this.launch_template[0].version == "3"
    error_message = "Automatic rollback requires an explicit launch-template version, not $Latest."
  }
}
