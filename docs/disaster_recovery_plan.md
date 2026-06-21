# MineCore Platform — Disaster Recovery (DR) & Backup Plan

This document details the backup strategies, Recovery Time/Point Objectives (RTO/RPO), and recovery runbooks for the **MineCore Smart Mining Operations Platform**.

---

## 1. DR Metrics & Targets

For the MineCore platform, we target the following metrics to ensure high availability and minimal data loss:

* **Recovery Time Objective (RTO):** `< 5 Minutes` for application services (achieved by pulling definitions instantly via ArgoCD GitOps).
* **Recovery Point Objective (RPO):** `< 1 Hour` for database transactions (achieved by automated cron-scheduled database snapshot dumps).

---

## 2. Backup Strategy

The platform backup strategy splits state into three distinct layers:

### A. Infrastructure & Deployments (GitOps Layer)
* **Source of Truth:** GitHub Repository `https://github.com/San120806/MineCore`
* **Backup Method:** Distributed Git version control. No local cluster backups of deployment configurations are required because ArgoCD continuously tracks and reconciles state from the remote Git HEAD.

### B. Database Layer (Stateful Layer)
* **Source of Truth:** PostgreSQL Persistent Volume Claim (`minecore-postgres-pvc`)
* **Backup Method:** Logical SQL dump of database state.
* **Local Dump Command:**
  ```bash
  # Execute a pg_dump inside the postgres container and write it to the host
  kubectl exec -i minecore-postgres-0 -n minecore -- sh -c 'export PGPASSWORD=$POSTGRES_PASSWORD && pg_dump -U $POSTGRES_USER $POSTGRES_DB' > minecore_postgres_backup.sql
  ```

### C. CI/CD Pipeline (Jenkins Layer)
* **Source of Truth:** Jenkins Persistent Volume `jenkins_home`
* **Backup Method:** Tar compression of the volume folder.
* **Local Tar Command:**
  ```bash
  # Copy the config folder out of the controller container to your host
  docker cp jenkins-controller:/var/jenkins_home ./jenkins_home_backup
  ```

---

## 3. Disaster Scenarios & Recovery Runbooks

### Scenario A: Complete Local Cluster / Node Failure
* **Trigger:** Kind cluster container crashes or Docker Desktop VM is deleted.
* **Recovery Steps:**
  1. Re-initialize the local Kubernetes cluster.
  2. Install ArgoCD via Server-Side Apply:
     ```bash
     kubectl create namespace argocd
     kubectl apply --server-side --force-conflicts -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
     ```
  3. Apply the ArgoCD Application manifest:
     ```bash
     kubectl apply -f argocd/application.yaml
     ```
  4. **Result:** ArgoCD will immediately pull the manifests for PostgreSQL, Express backend, Next.js frontend, Ingress, and monitoring from Git and redeploy them within **2 minutes** (achieving the `< 5 minutes` RTO).

### Scenario B: Database State Corruption / Data Loss
* **Trigger:** Incorrect migrations or data corruption in the database stateful pod.
* **Recovery Steps:**
  1. Re-deploy the database deployment via ArgoCD.
  2. Copy the database SQL backup file into the running pod:
     ```bash
     kubectl cp minecore_postgres_backup.sql minecore-postgres-0:/tmp/backup.sql -n minecore
     ```
  3. Restore the schema and data:
     ```bash
     kubectl exec -i minecore-postgres-0 -n minecore -- sh -c 'export PGPASSWORD=$POSTGRES_PASSWORD && psql -U $POSTGRES_USER -d $POSTGRES_DB -f /tmp/backup.sql'
     ```
  4. Run migrations check inside the backend container to confirm data parity.

### Scenario C: Configuration Drift / Unauthorized Changes
* **Trigger:** An engineer manually deletes or modifies a Kubernetes resource directly in the cluster using `kubectl` (e.g. deleting a service).
* **Recovery Steps:**
  * **Automatic:** **No action required.** ArgoCD's `selfHeal: true` policy automatically detects the drift within 30 seconds and redeploys the correct manifest configuration directly from GitHub.
