variable "namespace_name" {
  description = "Name for the private DNS namespace"
  type        = string
  default     = "codeskill.internal"
}

variable "vpc_id" {
  description = "VPC ID where the private DNS namespace will be attached"
  type        = string
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
