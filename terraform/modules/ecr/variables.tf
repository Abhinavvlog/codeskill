variable "name_prefix" {
  description = "Prefix for all resources"
  type        = string
  default     = "codeskill"
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
