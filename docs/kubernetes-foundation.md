# MineCore — Kubernetes Foundation Strategy
> **Objective 3.1 — Kubernetes Foundation**
> Status: `PLANNING` | Version: `1.0.0` | Date: `2026-06-15`

---

## Table of Contents

1. [Pre-Flight Checks (Manual Steps)](#1-pre-flight-checks-manual-steps)
2. [Cluster Architecture](#2-cluster-architecture)
3. [Namespace Strategy](#3-namespace-strategy)
4. [Naming Conventions](#4-naming-conventions)
5. [Labels & Selectors Strategy](#5-labels--selectors-strategy)
6. [Resource Organisation Strategy](#6-resource-organisation-strategy)
7. [Deployment Order](#7-deployment-order)
8. [Service Communication Plan](#8-service-communication-plan)
9. [Secrets Strategy](#9-secrets-strategy)
10. [ConfigMap Strategy](#10-configmap-strategy)
11. [Storage Strategy](#11-storage-strategy)
12. [Repository Layout (k8s/)](#12-repository-layout-k8s)

---

## 1. Pre-Flight Checks (Manual Steps)

Run each command in your terminal **before any YAML is applied**. These verify your cluster is reachable and correctly configured.

### Step 1.1 — Verify kubectl is installed and configured

```bash
kubectl version --client
```

**Expected output:** Client Version showing `v1.x.x` — confirms kubectl is installed.

---

### Step 1.2 — Verify cluster connectivity

```bash
kubectl cluster-info
```

**Expected output:**
```
Kubernetes control plane is running at https://127.0.0.1:<port>
CoreDNS is running at https://127.0.0.1:<port>/api/v1/...
```
If you see this → your kind cluster is reachable. ✅

---

### Step 1.3 — Verify active context

```bash
kubectl config current-context
```

**Expected output:** `kind-kind` (Docker Desktop kind cluster)

If the output is different (e.g., pointing to a remote cluster), switch to the correct context:
```bash
kubectl config use-context kind-kind
```

---

### Step 1.4 — Verify cluster nodes

```bash
kubectl get nodes -o wide
```

**Expected output:**
```
NAME                 STATUS   ROLES           AGE   VERSION   INTERNAL-IP   ...
kind-control-plane   Ready    control-plane   Xm    v1.34.3   172.18.0.2    ...
```
Confirm `STATUS = Ready`. ✅

---

### Step 1.5 — Verify Docker images exist locally

```bash
docker images | grep minecore
```

If no images appear, you'll build them in Objective 3.2. For now, just confirm Docker is running.

---

### Step 1.6 — Verify kind CLI (needed to load images)

```bash
kind version
```

**Expected output:** `kind v0.x.x go...`

If not installed:
```bash
brew install kind
```

---

### Step 1.7 — Record your cluster config

```bash
kubectl config view --minify
```

Note the `server:` URL — you'll use it later for Ingress configuration.

---

## 2. Cluster Architecture

### Overview

MineCore runs as a **3-tier web application** on a single-node kind cluster (local dev/staging). The architecture maps directly from the Docker Compose setup to Kubernetes primitives.

```
┌─────────────────────────────────────────────────────────────────┐
│                    kind Cluster (Docker Desktop)                 │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Namespace: minecore                           │ │
│  │                                                            │ │
│  │  ┌──────────────┐   ┌──────────────┐   ┌───────────────┐  │ │
│  │  │   frontend   │   │   backend    │   │   postgres    │  │ │
│  │  │  Deployment  │──▶│  Deployment  │──▶│  StatefulSet  │  │ │
│  │  │  (Next.js)   │   │  (Express)   │   │  (PostgreSQL) │  │ │
│  │  │  Port: 3000  │   │  Port: 4000  │   │  Port: 5432   │  │ │
│  │  └──────┬───────┘   └──────┬───────┘   └──────┬────────┘  │ │
│  │         │                  │                   │           │ │
│  │  ┌──────▼───────┐   ┌──────▼───────┐   ┌──────▼────────┐  │ │
│  │  │  frontend-   │   │  backend-    │   │  postgres-    │  │ │
│  │  │  service     │   │  service     │   │  service      │  │ │
│  │  │  NodePort    │   │  ClusterIP   │   │  ClusterIP    │  │ │
│  │  └──────┬───────┘   └──────────────┘   └───────────────┘  │ │
│  │         │                                                   │ │
│  │  ┌──────▼───────┐   ┌──────────────────────────────────┐   │ │
│  │  │   Ingress    │   │  PersistentVolumeClaim (postgres) │   │ │
│  │  │  (nginx)     │   │  /var/lib/postgresql/data         │   │ │
│  │  └──────────────┘   └──────────────────────────────────┘   │ │
│  │                                                            │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │  Secrets: postgres-secret, jwt-secret              │   │ │
│  │  │  ConfigMaps: backend-config, frontend-config       │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Workload Types

| Workload | K8s Resource | Reason |
|---|---|---|
| Frontend (Next.js) | `Deployment` | Stateless, horizontally scalable |
| Backend (Express) | `Deployment` | Stateless, horizontally scalable |
| PostgreSQL | `StatefulSet` | Stateful — needs stable network identity + persistent storage |

### Replica Plan

| Service | Dev Replicas | Reason |
|---|---|---|
| frontend | 1 | Single node kind cluster |
| backend | 1 | Single node kind cluster |
| postgres | 1 | StatefulSet — single primary for dev |

---

## 3. Namespace Strategy

### Namespaces to Create

MineCore uses **2 namespaces** — keeping concerns separated cleanly:

| Namespace | Purpose |
|---|---|
| `minecore` | All production application workloads (frontend, backend, postgres) |
| `minecore-monitoring` | Reserved for future observability stack (Prometheus, Grafana) |

> **Why not use `default`?**
> The `default` namespace is used by kind's own system components. Isolating MineCore in its own namespace makes resource management, RBAC, and cleanup easier — `kubectl delete namespace minecore` removes everything cleanly.

### Namespace Definition (planned)

```
k8s/base/namespace.yaml       → creates minecore namespace
k8s/monitoring/namespace.yaml → creates minecore-monitoring namespace (future)
```

---

## 4. Naming Conventions

All Kubernetes resource names follow a consistent pattern to avoid ambiguity.

### Pattern

```
minecore-<service>[-<resource-type>]
```

### Full Name Reference Table

| Resource | Name |
|---|---|
| Namespace | `minecore` |
| Frontend Deployment | `minecore-frontend` |
| Backend Deployment | `minecore-backend` |
| Postgres StatefulSet | `minecore-postgres` |
| Frontend Service | `minecore-frontend-svc` |
| Backend Service | `minecore-backend-svc` |
| Postgres Service | `minecore-postgres-svc` |
| Postgres Headless Service | `minecore-postgres-headless` |
| Postgres PVC | `minecore-postgres-pvc` |
| Postgres PV | `minecore-postgres-pv` |
| Postgres Secret | `minecore-postgres-secret` |
| JWT Secret | `minecore-jwt-secret` |
| Backend ConfigMap | `minecore-backend-config` |
| Frontend ConfigMap | `minecore-frontend-config` |
| Ingress | `minecore-ingress` |
| ServiceAccount | `minecore-sa` |

### Image Naming Convention

```
minecore-backend:v<major>.<minor>.<patch>    e.g.  minecore-backend:v1.0.0
minecore-frontend:v<major>.<minor>.<patch>   e.g.  minecore-frontend:v1.0.0
```

For local kind loading, use `latest` tag during development.

---

## 5. Labels & Selectors Strategy

Labels are the backbone of Kubernetes — they connect Deployments to Services, enable monitoring scraping, and allow targeted commands.

### Standard Label Schema

Every MineCore resource carries this consistent label set:

```yaml
labels:
  app.kubernetes.io/name: <service-name>       # e.g. frontend, backend, postgres
  app.kubernetes.io/instance: minecore         # identifies this MineCore installation
  app.kubernetes.io/version: "1.0.0"           # image/app version
  app.kubernetes.io/component: <tier>          # frontend | backend | database
  app.kubernetes.io/part-of: minecore          # top-level app group
  app.kubernetes.io/managed-by: kubectl        # kubectl | helm (future)
  environment: development                     # development | staging | production
```

### Per-Resource Labels

#### Frontend

```yaml
app.kubernetes.io/name: frontend
app.kubernetes.io/component: frontend
app.kubernetes.io/part-of: minecore
environment: development
```

#### Backend

```yaml
app.kubernetes.io/name: backend
app.kubernetes.io/component: backend
app.kubernetes.io/part-of: minecore
environment: development
```

#### PostgreSQL

```yaml
app.kubernetes.io/name: postgres
app.kubernetes.io/component: database
app.kubernetes.io/part-of: minecore
environment: development
```

### Selectors

Services use `selector` to route traffic to the correct pods. The selector matches **pod template labels** on the Deployment/StatefulSet.

| Service | Selector |
|---|---|
| `minecore-frontend-svc` | `app.kubernetes.io/name: frontend` |
| `minecore-backend-svc` | `app.kubernetes.io/name: backend` |
| `minecore-postgres-svc` | `app.kubernetes.io/name: postgres` |

### Useful Label Queries (Manual Steps)

Once deployed, you can filter resources by label:

```bash
# Get all MineCore pods
kubectl get pods -n minecore -l app.kubernetes.io/part-of=minecore

# Get only backend pods
kubectl get pods -n minecore -l app.kubernetes.io/name=backend

# Get all database resources
kubectl get all -n minecore -l app.kubernetes.io/component=database

# Watch only frontend pods
kubectl get pods -n minecore -l app.kubernetes.io/name=frontend -w
```

---

## 6. Resource Organisation Strategy

### Directory Structure

All Kubernetes YAML files live in `k8s/` at the project root, organised by tier:

```
mining-core/
└── k8s/
    ├── base/
    │   └── namespace.yaml                  ← Create namespace first
    │
    ├── postgres/
    │   ├── postgres-secret.yaml            ← DB credentials (base64)
    │   ├── postgres-pv.yaml                ← PersistentVolume
    │   ├── postgres-pvc.yaml               ← PersistentVolumeClaim
    │   ├── postgres-statefulset.yaml       ← StatefulSet for postgres
    │   ├── postgres-service.yaml           ← ClusterIP service
    │   └── postgres-headless-service.yaml  ← Headless service for StatefulSet
    │
    ├── backend/
    │   ├── backend-configmap.yaml          ← Non-secret env vars
    │   ├── backend-deployment.yaml         ← Express.js Deployment
    │   └── backend-service.yaml            ← ClusterIP service
    │
    ├── frontend/
    │   ├── frontend-configmap.yaml         ← NEXT_PUBLIC_* vars
    │   ├── frontend-deployment.yaml        ← Next.js Deployment
    │   └── frontend-service.yaml           ← NodePort service
    │
    └── ingress/
        └── ingress.yaml                    ← nginx Ingress routing (optional)
```

### Resource Budgets (Dev)

| Workload | CPU Request | CPU Limit | Memory Request | Memory Limit |
|---|---|---|---|---|
| frontend | 100m | 500m | 256Mi | 512Mi |
| backend | 100m | 500m | 256Mi | 512Mi |
| postgres | 250m | 1000m | 512Mi | 1Gi |

---

## 7. Deployment Order

Kubernetes resources must be applied in dependency order to avoid pod `CrashLoopBackOff` errors.

### Phase A — Foundation (apply first)

```
1. k8s/base/namespace.yaml
   └── Creates the minecore namespace that everything lives in
```

### Phase B — Storage & Secrets (apply second)

```
2. k8s/postgres/postgres-secret.yaml
   └── DB credentials — backend needs this before starting

3. k8s/backend/         (jwt-secret is part of postgres-secret or separate)
   └── JWT secrets — backend reads on startup

4. k8s/postgres/postgres-pv.yaml
   └── PersistentVolume — must exist before PVC

5. k8s/postgres/postgres-pvc.yaml
   └── PersistentVolumeClaim — must bind before StatefulSet starts
```

### Phase C — Database (apply third)

```
6. k8s/postgres/postgres-statefulset.yaml
   └── Starts PostgreSQL pod (waits for PVC to bind)

7. k8s/postgres/postgres-headless-service.yaml
   └── Headless service for StatefulSet DNS

8. k8s/postgres/postgres-service.yaml
   └── ClusterIP so backend can reach postgres at minecore-postgres-svc:5432
```

### Phase D — Backend (apply fourth)

```
9.  k8s/backend/backend-configmap.yaml
    └── Env vars: PORT, NODE_ENV, CORS_ORIGIN, etc.

10. k8s/backend/backend-deployment.yaml
    └── Express API — connects to postgres (waits for DB to be ready via initContainer or retry logic)

11. k8s/backend/backend-service.yaml
    └── ClusterIP so frontend can reach backend at minecore-backend-svc:4000
```

### Phase E — Frontend (apply fifth)

```
12. k8s/frontend/frontend-configmap.yaml
    └── NEXT_PUBLIC_API_URL=http://minecore-backend-svc:4000

13. k8s/frontend/frontend-deployment.yaml
    └── Next.js server — connects to backend service

14. k8s/frontend/frontend-service.yaml
    └── NodePort (port 30000) or port-forward for browser access
```

### Phase F — Ingress (optional, apply last)

```
15. k8s/ingress/ingress.yaml
    └── Routes / → frontend, /api → backend
```

### Apply Commands (Manual Steps)

```bash
# Option A — Apply folder by folder (recommended, gives you control)
kubectl apply -f k8s/base/
kubectl apply -f k8s/postgres/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/

# Option B — Apply everything at once
kubectl apply -f k8s/ --recursive

# Check deployment progress
kubectl get all -n minecore
kubectl get pods -n minecore -w    # watch pods come up in real time
```

### Post-Deploy: Run Prisma Migrations (Manual Step)

After all pods are Running:

```bash
# Get the backend pod name
kubectl get pods -n minecore

# Run migrations inside the pod
kubectl exec -it <minecore-backend-xxxxx> -n minecore -- \
  npx prisma migrate deploy

# Run seed (only once, for dev data)
kubectl exec -it <minecore-backend-xxxxx> -n minecore -- \
  node dist/prisma/seed.js
```

---

## 8. Service Communication Plan

### Internal DNS (Pod-to-Pod)

Kubernetes assigns each Service a DNS name inside the cluster:

```
<service-name>.<namespace>.svc.cluster.local
```

For MineCore:

| From | To | DNS Name | Port |
|---|---|---|---|
| backend pod | postgres | `minecore-postgres-svc.minecore.svc.cluster.local` | `5432` |
| frontend pod | backend | `minecore-backend-svc.minecore.svc.cluster.local` | `4000` |
| browser | frontend | `localhost:30000` (NodePort) | `30000` |

### Short DNS (within same namespace)

Within the `minecore` namespace, you can use the short form:

```
minecore-postgres-svc   → resolves to postgres ClusterIP
minecore-backend-svc    → resolves to backend ClusterIP
```

### Environment Variable Configuration

| Variable | Value in K8s |
|---|---|
| `DATABASE_URL` | `postgresql://minecore_user:<pass>@minecore-postgres-svc:5432/minecore_db?schema=public` |
| `NEXT_PUBLIC_API_URL` | `http://minecore-backend-svc:4000` (server-side) |
| `CORS_ORIGIN` | `http://localhost:30000` |

### Service Types Used

| Service | Type | Why |
|---|---|---|
| `minecore-postgres-svc` | `ClusterIP` | Only internal — never exposed outside cluster |
| `minecore-backend-svc` | `ClusterIP` | Only internal — accessed by frontend and Ingress |
| `minecore-frontend-svc` | `NodePort` | Exposed to browser via `localhost:30000` |

---

## 9. Secrets Strategy

### What Goes in Secrets

Kubernetes `Secret` resources store sensitive values **base64-encoded** (not encrypted at rest by default in kind — acceptable for dev).

### Secret: `minecore-postgres-secret`

Stores database credentials consumed by **both** postgres and backend:

| Key | Value |
|---|---|
| `POSTGRES_USER` | `minecore_user` |
| `POSTGRES_PASSWORD` | `minecore_password` |
| `POSTGRES_DB` | `minecore_db` |
| `DATABASE_URL` | Full connection string |

### Secret: `minecore-jwt-secret`

Stores JWT signing secrets consumed by **backend only**:

| Key | Value |
|---|---|
| `JWT_ACCESS_SECRET` | `minecore_access_secret_production_ready` |
| `JWT_REFRESH_SECRET` | `minecore_refresh_secret_production_ready` |

### How Secrets Are Injected

Secrets are injected as environment variables via `envFrom` and `valueFrom` in Deployment specs — **never hardcoded in YAML**.

### How to Create Secrets (Manual Steps)

Base64-encode values before putting them in YAML:

```bash
# Encode a value
echo -n "minecore_user" | base64
# Output: bWluZWNvcmVfdXNlcg==

echo -n "minecore_password" | base64
# Output: bWluZWNvcmVfcGFzc3dvcmQ=

echo -n "minecore_db" | base64
# Output: bWluZWNvcmVfZGI=
```

You'll paste these base64 values directly into `postgres-secret.yaml`.

> **⚠️ IMPORTANT:** Never commit `Secret` YAML files with real credentials to Git.
> Add `k8s/postgres/postgres-secret.yaml` and `k8s/backend/jwt-secret.yaml` to `.gitignore`.

---

## 10. ConfigMap Strategy

### What Goes in ConfigMaps

`ConfigMap` resources store **non-sensitive** configuration — environment variables that are safe to commit to Git.

### ConfigMap: `minecore-backend-config`

Consumed by the backend Deployment:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `API_VERSION` | `v1` |
| `CORS_ORIGIN` | `http://localhost:30000` |
| `RATE_LIMIT_WINDOW_MS` | `900000` |
| `RATE_LIMIT_MAX` | `100` |
| `JWT_ACCESS_EXPIRES_IN` | `24h` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |

> `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` go in **Secrets** — not here.

### ConfigMap: `minecore-frontend-config`

Consumed by the frontend Deployment:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://minecore-backend-svc:4000` |
| `PORT` | `3000` |
| `HOSTNAME` | `0.0.0.0` |
| `NODE_ENV` | `production` |

---

## 11. Storage Strategy

### Why PostgreSQL Needs Persistent Storage

Kubernetes pods are ephemeral — if the postgres pod restarts, all data is lost unless a `PersistentVolume` is used.

### Storage Architecture

```
PersistentVolume (PV)
└── minecore-postgres-pv
    ├── Capacity: 5Gi
    ├── Access: ReadWriteOnce
    ├── StorageClass: standard (kind default)
    └── Host Path: /mnt/data/minecore-postgres   (on kind node)
         │
         └── Bound to ▼

PersistentVolumeClaim (PVC)
└── minecore-postgres-pvc
    ├── Requests: 5Gi
    ├── Access: ReadWriteOnce
    └── Mounted into StatefulSet at:
         /var/lib/postgresql/data
```

### Storage Class

kind includes a `standard` StorageClass backed by `hostPath`. For dev this is sufficient.

```bash
# Verify StorageClass is available (Manual Step)
kubectl get storageclass
```

**Expected output:**
```
NAME                 PROVISIONER             RECLAIMPOLICY   ...
standard (default)   rancher.io/local-path   Delete          ...
```

### Data Persistence Rules

| Scenario | Data Preserved? |
|---|---|
| Pod restarts | ✅ Yes (PVC survives) |
| `kubectl rollout restart` | ✅ Yes |
| Pod deleted + recreated | ✅ Yes (PVC still bound) |
| `kubectl delete pvc minecore-postgres-pvc` | ❌ No — wipes data |
| `kubectl delete namespace minecore` | ❌ No — deletes everything |

> **⚠️ Backup Reminder:** Before running `kubectl delete namespace minecore`, always pg_dump your data:
> ```bash
> kubectl exec -it <postgres-pod> -n minecore -- \
>   pg_dump -U minecore_user minecore_db > backup.sql
> ```

---

## 12. Repository Layout (k8s/)

Final file tree that will be created in **Objective 3.2**:

```
mining-core/
├── backend/                 ← DO NOT MODIFY
├── frontend/                ← DO NOT MODIFY
├── database/                ← DO NOT MODIFY
├── docker/                  ← DO NOT MODIFY
├── docker-compose.yml       ← DO NOT MODIFY
├── docs/
│   ├── docker_architecture.md
│   ├── git_strategy.md
│   ├── verification.md
│   └── kubernetes-foundation.md   ← THIS FILE
│
└── k8s/                     ← TO BE CREATED IN 3.2
    ├── base/
    │   └── namespace.yaml
    ├── postgres/
    │   ├── postgres-secret.yaml
    │   ├── postgres-pv.yaml
    │   ├── postgres-pvc.yaml
    │   ├── postgres-statefulset.yaml
    │   ├── postgres-service.yaml
    │   └── postgres-headless-service.yaml
    ├── backend/
    │   ├── backend-configmap.yaml
    │   ├── backend-deployment.yaml
    │   └── backend-service.yaml
    ├── frontend/
    │   ├── frontend-configmap.yaml
    │   ├── frontend-deployment.yaml
    │   └── frontend-service.yaml
    └── ingress/
        └── ingress.yaml
```

---

## Appendix — Quick Reference: Manual Steps Checklist

Before proceeding to **Objective 3.2 (YAML Generation)**:

```bash
# ✅ Step 1 — Check kubectl client
kubectl version --client

# ✅ Step 2 — Check cluster info
kubectl cluster-info

# ✅ Step 3 — Check current context
kubectl config current-context

# ✅ Step 4 — Check nodes
kubectl get nodes -o wide

# ✅ Step 5 — Check storage classes
kubectl get storageclass

# ✅ Step 6 — Check kind version
kind version

# ✅ Step 7 — Confirm Docker is running
docker info | grep "Server Version"
```

Once all 7 steps return expected output → **Objective 3.1 is complete**.
Proceed to **Objective 3.2: Generate Kubernetes YAML Manifests**.

---

*Document authored for MineCore — Smart Mining Operations Platform*
*Kubernetes Foundation | Objective 3.1*
