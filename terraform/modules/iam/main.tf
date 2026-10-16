terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

# Common EC2 Assume Role Policy
data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    effect  = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

# 1. Shared ECR Read/Pull Policy for All EC2 Service Roles
resource "aws_iam_policy" "ecr_pull" {
  name        = "${var.name_prefix}-ecr-pull-policy"
  description = "Allows EC2 instances to authenticate and pull Docker images from Amazon ECR"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ECRAuthToken"
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      },
      {
        Sid    = "ECRImagePull"
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      }
    ]
  })
}

# 2. Cloud Map Service Discovery Registration Policy for Execution Hosts
resource "aws_iam_policy" "cloudmap_register" {
  name        = "${var.name_prefix}-cloudmap-register-policy"
  description = "Allows Piston and Judge0 instances to register private DNS records"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudMapInstanceRegistration"
        Effect = "Allow"
        Action = [
          "servicediscovery:RegisterInstance",
          "servicediscovery:DeregisterInstance",
          "servicediscovery:GetInstance",
          "servicediscovery:GetInstancesHealthStatus",
          "servicediscovery:GetOperation"
        ]
        Resource = "*"
      }
    ]
  })
}

# 3. Application Role & Instance Profile (Preserved for backwards compatibility)
resource "aws_iam_role" "app" {
  name               = "${var.name_prefix}-app-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json
  tags               = merge(var.tags, { Name = "${var.name_prefix}-app-role" })
}

resource "aws_iam_role_policy_attachment" "app_ssm" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "app_ecr" {
  role       = aws_iam_role.app.name
  policy_arn = aws_iam_policy.ecr_pull.arn
}

resource "aws_iam_policy" "app_secrets" {
  name        = "${var.name_prefix}-app-secrets"
  description = "Allows Application instances to retrieve DB credentials and app secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "app_secrets" {
  role       = aws_iam_role.app.name
  policy_arn = aws_iam_policy.app_secrets.arn
}

resource "aws_iam_policy" "app_s3" {
  count       = var.s3_bucket_arn != "" ? 1 : 0
  name        = "${var.name_prefix}-app-s3"
  description = "Allows Application instances to access CodeSkill S3 storage"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          var.s3_bucket_arn,
          "${var.s3_bucket_arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "app_s3" {
  count      = var.s3_bucket_arn != "" ? 1 : 0
  role       = aws_iam_role.app.name
  policy_arn = aws_iam_policy.app_s3[0].arn
}

resource "aws_iam_instance_profile" "app" {
  name = "${var.name_prefix}-app-profile"
  role = aws_iam_role.app.name
}

# 4. Frontend Dedicated IAM Role & Profile
resource "aws_iam_role" "frontend" {
  name               = "${var.name_prefix}-frontend-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json
  tags               = merge(var.tags, { Name = "${var.name_prefix}-frontend-role", Service = "frontend" })
}

resource "aws_iam_role_policy_attachment" "frontend_ssm" {
  role       = aws_iam_role.frontend.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "frontend_ecr" {
  role       = aws_iam_role.frontend.name
  policy_arn = aws_iam_policy.ecr_pull.arn
}

resource "aws_iam_instance_profile" "frontend" {
  name = "${var.name_prefix}-frontend-profile"
  role = aws_iam_role.frontend.name
}

# 5. Backend Dedicated IAM Role & Profile
resource "aws_iam_role" "backend" {
  name               = "${var.name_prefix}-backend-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json
  tags               = merge(var.tags, { Name = "${var.name_prefix}-backend-role", Service = "backend" })
}

resource "aws_iam_role_policy_attachment" "backend_ssm" {
  role       = aws_iam_role.backend.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "backend_ecr" {
  role       = aws_iam_role.backend.name
  policy_arn = aws_iam_policy.ecr_pull.arn
}

resource "aws_iam_role_policy_attachment" "backend_secrets" {
  role       = aws_iam_role.backend.name
  policy_arn = aws_iam_policy.app_secrets.arn
}

resource "aws_iam_role_policy_attachment" "backend_s3" {
  count      = var.s3_bucket_arn != "" ? 1 : 0
  role       = aws_iam_role.backend.name
  policy_arn = aws_iam_policy.app_s3[0].arn
}

resource "aws_iam_instance_profile" "backend" {
  name = "${var.name_prefix}-backend-profile"
  role = aws_iam_role.backend.name
}

# 6. Piston Dedicated IAM Role & Profile
resource "aws_iam_role" "piston" {
  name               = "${var.name_prefix}-piston-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json
  tags               = merge(var.tags, { Name = "${var.name_prefix}-piston-role", Service = "piston" })
}

resource "aws_iam_role_policy_attachment" "piston_ssm" {
  role       = aws_iam_role.piston.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "piston_ecr" {
  role       = aws_iam_role.piston.name
  policy_arn = aws_iam_policy.ecr_pull.arn
}

resource "aws_iam_role_policy_attachment" "piston_cloudmap" {
  role       = aws_iam_role.piston.name
  policy_arn = aws_iam_policy.cloudmap_register.arn
}

resource "aws_iam_instance_profile" "piston" {
  name = "${var.name_prefix}-piston-profile"
  role = aws_iam_role.piston.name
}

# 7. Judge0 Dedicated IAM Role & Profile
resource "aws_iam_role" "judge0" {
  name               = "${var.name_prefix}-judge0-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json
  tags               = merge(var.tags, { Name = "${var.name_prefix}-judge0-role", Service = "judge0" })
}

resource "aws_iam_role_policy_attachment" "judge0_ssm" {
  role       = aws_iam_role.judge0.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "judge0_ecr" {
  role       = aws_iam_role.judge0.name
  policy_arn = aws_iam_policy.ecr_pull.arn
}

resource "aws_iam_role_policy_attachment" "judge0_cloudmap" {
  role       = aws_iam_role.judge0.name
  policy_arn = aws_iam_policy.cloudmap_register.arn
}

resource "aws_iam_instance_profile" "judge0" {
  name = "${var.name_prefix}-judge0-profile"
  role = aws_iam_role.judge0.name
}
