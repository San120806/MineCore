# ─────────────────────────────────────────────────────────────────────────────
# MineCore — Terraform Input Variables
# File: terraform/variables.tf
# ─────────────────────────────────────────────────────────────────────────────

variable "prod_namespace_name" {
  description = "The target namespace name for production deployment"
  type        = string
  default     = "minecore-prod"
}

variable "dev_namespace_name" {
  description = "The target namespace name for development deployment"
  type        = string
  default     = "minecore"
}
