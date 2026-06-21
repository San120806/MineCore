# ─────────────────────────────────────────────────────────────────────────────
# MineCore — Infrastructure-as-Code (Terraform)
# File: terraform/main.tf
# ─────────────────────────────────────────────────────────────────────────────

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23.0"
    }
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.0"
    }
  }
}

# 1. Kubernetes Provider configuration
provider "kubernetes" {
  config_path = "~/.kube/config"
}

# 2. Local Docker Provider configuration
provider "docker" {
  host = "unix:///var/run/docker.sock"
}

# 3. Create a production namespace
resource "kubernetes_namespace" "minecore_prod" {
  metadata {
    name = var.prod_namespace_name
    labels = {
      environment = "production"
      managed-by  = "terraform"
      part-of     = "minecore"
    }
  }
}

# 4. Define Resource Quota rules for the production namespace
resource "kubernetes_resource_quota" "production_quota" {
  metadata {
    name      = "production-resource-limits"
    namespace = kubernetes_namespace.minecore_prod.metadata[0].name
  }
  spec {
    hard = {
      cpu    = "4"
      memory = "8Gi"
      pods   = "20"
    }
  }
}
