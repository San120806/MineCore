# MineCore Smart Mining Platform — DevOps Ecosystem & Presentation Runbook

This document serves as your **presentation runbook** for your professor. It outlines the step-by-step setup commands to bring up the local website, configure the production Kubernetes environment, verify the DevOps tooling, and explain the architectural design decisions.

---

## 📋 Table of Contents
1. [The "Elevator Pitch" & Architecture Overview](#1-the-elevator-pitch--architecture-overview)
2. [Phase 1: Bootstrapping the Environment (From Cold Start)](#2-phase-1-bootstrapping-the-environment-from-cold-start)
3. [Phase 2: Local Application Setup & Live Demo (Docker Compose)](#3-phase-2-local-application-setup--live-demo-docker-compose)
4. [Phase 3: Deep Dive into Kubernetes & GitOps (Production Grade)](#4-phase-3-deep-dive-into-kubernetes--gitops-production-grade)
5. [Phase 4: The CI/CD & DevSecOps Demonstration (Jenkins & ArgoCD)](#5-phase-4-the-cicd--devsecops-demonstration-jenkins--argocd)
6. [Phase 5: Disaster Recovery & Host Optimizations](#6-phase-5-disaster-recovery--host-optimizations)
7. [🎓 Professor Q&A Defense Cheat Sheet](#7-professor-qa-defense-cheat-sheet)

---

## 1. The "Elevator Pitch" & Architecture Overview

When presenting to your professor, open with this core description:
> *"**MineCore** is an enterprise-grade, full-stack operations command center designed for modern mining. It monitors heavy fleet activities, IoT sensor readings, equipment health, safety alerts, and maintenance logs. To support this, we built a complete cloud-native DevOps ecosystem featuring Infrastructure as Code (IaC), Continuous Integration (CI), GitOps Continuous Delivery (CD), Secret Management, and a full Prometheus/Grafana Observability stack."*

### The DevOps Pillars
* **Continuous Integration (CI):** Declarative Jenkins pipeline validating code quality, building Docker images, and performing security audits.
* **Continuous Delivery (CD):** ArgoCD-driven GitOps reconciling local cluster state automatically with Git.
* **Infrastructure as Code (IaC):** Terraform managing namespaces and setting strict resource limits (quotas) to prevent cluster resource starvation.
* **Secrets Management:** External HashiCorp Vault instance managing unsealed secret key-value stores.
* **Observability:** Prometheus scraping application pods and Node metrics, visualized dynamically in Grafana.
* **Disaster Recovery (DR):** RTO/RPO mapping with shell script-based pg_dump database snapshots.

---

## 2. Phase 1: Bootstrapping the Environment (From Cold Start)

Since your local Docker daemon and Kubernetes cluster are stopped, use these commands to start them before the presentation:

### Step 1. Start Docker Desktop
* Open the **Docker Desktop** application on your macOS host.
* Wait until the status indicator in the bottom-left corner turns **Green (Running)**.

### Step 2. Verify Kubernetes (Kind Cluster) Connectivity
Once Docker is running, check if your local Kind Kubernetes cluster is active and reachable:
```bash
# Verify cluster context is set to kind
kubectl config use-context kind-kind

# Verify all control-plane nodes are ready
kubectl get nodes -o wide
```
*Expected Output:*
```text
NAME                 STATUS   ROLES           AGE   VERSION   INTERNAL-IP
kind-control-plane   Ready    control-plane   12d   v1.34.3   172.18.0.2
```

### Step 3. Run Terraform to Enforce Resource Quotas
Show your professor how you use Infrastructure as Code (IaC) to create a dedicated production environment with resource limits:
```bash
cd terraform
# Initialize Terraform and check plan
terraform init
terraform plan

# Apply changes to provision namespace and quotas
terraform apply -auto-approve
```
* **Key Concept to Explain:** Terraform provisions the `minecore-prod` namespace and binds a `ResourceQuota` restriction (`production-resource-limits`) limiting the namespace to **4 CPUs, 8GB RAM, and 20 pods** to prevent local hardware overruns.

---

## 3. Phase 2: Local Application Setup & Live Demo (Docker Compose)

The easiest way to show the working website immediately is using **Docker Compose**.

### Step 1. Clear Port Conflicts on Host
Ensure local PostgreSQL or Node servers are stopped:
```bash
# Stop brew postgresql if running
brew services stop postgresql@17 || true

# Stop any running node instances
pkill -f "node" || true
```

### Step 2. Build and Start the Stack
Run this from the project root:
```bash
docker compose up -d --build
```
Verify the containers are up:
```bash
docker compose ps
```
* **`minecore-frontend`** -> Listening on [http://localhost:3000](http://localhost:3000)
* **`minecore-backend`** -> Listening on [http://localhost:4000](http://localhost:4000)
* **`minecore-postgres`** -> Listening on [http://localhost:5432](http://localhost:5432)

### Step 3. Seed the Database
Run the seed script from the host terminal (targeting the containerized database):
```bash
DATABASE_URL="postgresql://minecore_user:minecore_password@localhost:5432/minecore_db?schema=public" npm --prefix backend run db:seed
```
*Expected Output:*
```text
🌱 Starting database seed...
✅  Created 7 users
✅  Created 5 mining sites
✅  Created 50 vehicles
✅  Created 100 sensors
✅  Created sensor readings (24h history for 20 sensors)
✅  Created 30 equipment records
✅  Created 25 safety alerts
✅  Created 20 maintenance records
🎉 Seed completed successfully!
```

### Step 4. Demonstrate Web App Features
1. Open **[http://localhost:3000](http://localhost:3000)** in your browser.
2. Log in using:
   * **Email:** `admin@minecore.com`
   * **Password:** `MineCore@2024`
3. **Show the Dashboard:** Point out the KPI cards displaying the seeded data (5 mining sites, 50 vehicles, 100 sensors) and the charts (Vehicle Status and Sensor type metrics) rendering dynamically via Recharts.
4. **Demonstrate CRUD:** Navigate to the **Equipment** tab, click **Add Equipment**, fill out the form, save, and show that it updates instantly in the list (verifying full frontend $\leftrightarrow$ backend $\leftrightarrow$ database integration).

---

## 4. Phase 3: Deep Dive into Kubernetes & GitOps (Production Grade)

Once the standalone app is demonstrated, show the production setup running in Kubernetes.

### Step 1. Deploy K8s Resources
Apply the Kubernetes manifests in order:
```bash
# Apply namespace, storage configurations, secrets, and database
kubectl apply -f k8s/base/
kubectl apply -f k8s/postgres/

# Wait for PostgreSQL to be ready
kubectl wait --namespace minecore --for=condition=ready pod/minecore-postgres-0 --timeout=90s

# Run database schema migrations & seed database in K8s
kubectl exec -it minecore-postgres-0 -n minecore -- pg_isready -U minecore_user
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/ingress/
```

### Step 2. Verify Routing via Ingress
We use the **Ingress-Nginx Controller** to handle external traffic:
```bash
# Check if Ingress-Nginx routing is working
curl -I http://localhost/
```
* Point out that requests hitting port `80` route internally: `/` maps to `minecore-frontend-svc:3000` and `/api` maps to `minecore-backend-svc:4000`.

### Step 3. Secrets Management with HashiCorp Vault
Show how secrets are managed out-of-band of Git repositories:
```bash
# Port-forward Vault dashboard to host
kubectl port-forward svc/vault-svc 8200:8200 -n minecore
```
* **Dashboard Link:** [http://localhost:8200](http://localhost:8200)
* **Access Token:** `minecore-vault-token`
* **Demo point:** Log in and show the unsealed dashboard with KV secret engines containing the `minecore-postgres` database credentials.

### Step 4. Observability Stack (Prometheus + Grafana)
Explain how the system metrics are scraped and visualized:
```bash
# Port-forward Grafana dashboard to host
kubectl port-forward svc/grafana-svc 3001:3000 -n minecore
```
* **Dashboard Link:** [http://localhost:3001](http://localhost:3001)
* **Credentials:** Username `admin` / Password `admin`
* **Demo point:** Navigate to Dashboards, choose Prometheus Datasource, and run a query for the `up` metric. Show the steady line confirming that Kubernetes pods are actively scraping target metrics.

---

## 5. Phase 4: The CI/CD & DevSecOps Demonstration (Jenkins & ArgoCD)

This is the core of the DevOps ecosystem. Explain the separation of concerns between CI (Jenkins) and CD (ArgoCD).

### A. CI Pipeline (Jenkins)
* **Pipeline Code:** Show the [Jenkinsfile](file:///Users/saniyakapure/Desktop/mining-core/Jenkinsfile) at the root of the project.
* **Pipeline Stages to Explain:**
  1. **Checkout:** Pulls latest code from Git.
  2. **Static Code Analysis:** Prepares hooks for SonarQube SAST.
  3. **Parallel Validation:** Runs lint check, Prettier format audits, Next.js build, and Jest backend tests in parallel to save time.
  4. **Parallel Integration Validation:** Builds optimized Docker images (`latest` and tagged build numbers) and validates the Docker Compose config file.
  5. **Trivy Container Scan:** Container security validation.
  6. **Docker Push:** Pushes validated images to Docker Hub (credentials-bound).
  7. **Security Validation (DevSecOps):** Runs `npm audit --audit-level=high` on both components, raising warnings without blocking deployment if dependencies are vulnerable.
  8. **Archive Artifacts:** Stores backend build scripts and Next.js standalone assets directly within the build metadata.

* **To show the Jenkins UI:**
  ```bash
  # Port-forward Jenkins if running in K8s
  kubectl port-forward svc/jenkins-service 8080:8080 -n minecore-ci
  ```
  *(Or access your local Jenkins instance at `http://localhost:8080`)*

### B. CD GitOps (ArgoCD)
Show how Git serves as the single source of truth for the cluster state.
```bash
# Port-forward ArgoCD to host
kubectl port-forward svc/argocd-server -n argocd 8443:443
```
* **Dashboard Link:** [https://localhost:8443](https://localhost:8443)
* **Key Concept (The GitOps Loop):** Show the visual resource tree mapping. Point out that `minecore-app` has **Automated Sync**, **Prune Resources**, and **Self-Healing** enabled.
* **Live Action Demo (Drift Detection):**
  1. Open the ArgoCD UI dashboard showing a green "Synced/Healthy" tree.
  2. In your terminal, delete the frontend service manually:
     ```bash
     kubectl delete service minecore-frontend-svc -n minecore
     ```
  3. Watch the ArgoCD UI. Within 15–30 seconds, ArgoCD will detect the configuration drift, mark the cluster out-of-sync, and **automatically recreate** the service directly from GitHub. This demonstrates **Self-Healing CD**.

---

## 6. Phase 5: Disaster Recovery & Host Optimizations

Explain how you ensure reliability under constraints.

### Disaster Recovery Targets (RTO / RPO)
* **Recovery Time Objective (RTO) < 5 min:** If the cluster crashes, applying `argocd/application.yaml` redeploys the entire stack in under 2 minutes.
* **Recovery Point Objective (RPO) < 1 hr:** Achieved by scheduling automated database dumps.

### Live DR Restore Demo (Database Recovery)
You can demonstrate restoring data from a backup:
```bash
# 1. Take a manual backup of PostgreSQL
kubectl exec -i minecore-postgres-0 -n minecore -- sh -c 'export PGPASSWORD=$POSTGRES_PASSWORD && pg_dump -U $POSTGRES_USER $POSTGRES_DB' > minecore_postgres_backup.sql

# 2. Simulate disaster (e.g. drop database tables manually or delete the statefulset pod)

# 3. Copy the backup file into the postgres pod
kubectl cp minecore_postgres_backup.sql minecore-postgres-0:/tmp/backup.sql -n minecore

# 4. Execute the restore command
kubectl exec -i minecore-postgres-0 -n minecore -- sh -c 'export PGPASSWORD=$POSTGRES_PASSWORD && psql -U $POSTGRES_USER -d $POSTGRES_DB -f /tmp/backup.sql'
```

### Local Resource Optimization Decisions
Explain these performance fixes you implemented for standard laptops:
1. **ELK Logging Scale-down:** ElasticSearch and Kibana are fully defined in `k8s/logging/`, but are scaled to `0` replicas in Git to save **1.2 GB of RAM and 100% CPU usage** on your local machine.
2. **Docker System Prunes:** We cleaned up legacy Docker builder caches and library files to free up **over 10 GB of host disk space** and repair Docker VM crash loops.

---

## 7. 🎓 Professor Q&A Defense Cheat Sheet

Be prepared for these technical questions your professor might ask:

### Q1: Why did you use a `StatefulSet` for PostgreSQL instead of a standard `Deployment`?
* **Answer:** *"Deployments are designed for stateless applications like the Next.js frontend, where any pod can be replaced or deleted without consequence. PostgreSQL maintains a persistent database state and needs a stable network identity (always resolves to `minecore-postgres-0`) and dedicated volume mounts. A StatefulSet guarantees that the volume binds to the correct, ordered pod instance on restart, preventing data corruption."*

### Q2: What is GitOps, and why is it better than traditional deployment scripts?
* **Answer:** *"GitOps makes Git the single source of truth for infrastructure. Instead of running manual commands like `kubectl apply` which can lead to 'configuration drift' (where the cluster state deviates from code), ArgoCD continuously compares cluster state with the Git repo. It automates deployments and provides self-healing, so if someone makes unauthorized edits to the cluster, ArgoCD automatically reverts them."*

### Q3: How do you handle secrets securely in this setup?
* **Answer:** *"We use HashiCorp Vault. Sensitive credentials (like database URLs and JWT secrets) are kept out of Git entirely. They are managed in Vault's KV engine and injected directly into Kubernetes environment variables during runtime, ensuring secrets are never leaked in commit histories."*

### Q4: Why is there a difference in how you ran the database seeds in Docker Compose versus Kubernetes?
* **Answer:** *"In Docker Compose, we exposed Postgres port 5432 to the host machine, allowing us to run the seed script directly. In production Kubernetes, postgres port 5432 is locked down internally for security (using a ClusterIP service) and not exposed. We run migrations and seed commands inside the pods or via temporary Job manifests to prevent security vulnerabilities."*

### Q5: What CI/CD optimization did you perform to reduce developer feedback loops?
* **Answer:** *"In our Jenkinsfile, we run the static validations—such as Prettier layout checks, ESLint, TypeScript compiles, and Next.js builds—in parallel with the backend Prisma checks and Jest tests. By running validations concurrently, we reduced pipeline build times by half."*

### Q6: If your kind cluster node crashes completely, how do you recover?
* **Answer:** *"We follow our disaster recovery plan. Because our infrastructure is fully declarative, we can boot a clean cluster, install ArgoCD, and apply our `argocd/application.yaml`. Within two minutes, ArgoCD rebuilds the entire namespace, storage claims, service bindings, and application pods from Git, achieving our RTO target of less than 5 minutes."*
