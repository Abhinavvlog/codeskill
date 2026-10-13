resource "aws_db_subnet_group" "main" {
  name       = "${var.name_prefix}-db-subnet-group"
  subnet_ids = var.private_db_subnet_ids
}

resource "aws_security_group" "rds" {
  name        = "${var.name_prefix}-rds-sg"
  description = "Allow PostgreSQL inbound traffic from app"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.app_security_group_id]
  }
}

resource "aws_db_instance" "main" {
  identifier           = "${var.name_prefix}-postgres"
  engine               = "postgres"
  engine_version       = "14"
  instance_class       = var.instance_class
  allocated_storage    = var.allocated_storage
  max_allocated_storage = 100 # Auto-scaling up to 100GB
  storage_type         = "gp3"
  
  db_name              = var.db_name
  username             = var.db_username
  password             = var.db_password
  
  multi_az             = var.multi_az
  db_subnet_group_name = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  
  skip_final_snapshot  = true # Set to false for prod
  deletion_protection  = false # Set to true for prod
  
  performance_insights_enabled = true
}
