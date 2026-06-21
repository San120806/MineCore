# ─────────────────────────────────────────────────────────────────────────────
# MineCore — Terraform Outputs
# File: terraform/outputs.tf
# ─────────────────────────────────────────────────────────────────────────────

output "production_namespace_name" {
  description = "The name of the generated production namespace"
  value       = kubernetes_namespace.minecore_prod.metadata[0].name
}

output "production_quota_limits" {
  description = "The CPU and memory limits enforced in production"
  value       = kubernetes_resource_quota.production_quota.spec[0].hard
}
