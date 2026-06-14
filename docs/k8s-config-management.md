# MineCore — Kubernetes Configuration Management
> **Objective 3.3 — Configuration Management**
> Status: `COMPLETE` | Version: `1.0.0` | Date: `2026-06-15`

---

## What Was Created

| File | K8s Kind | Purpose |
|---|---|---|
| `k8s/namespace.yaml` | `Namespace` | Isolates all MineCore resources |
| `k8s/configmaps/app-config.yaml` | `ConfigMap` × 2 | Non-sensitive env vars for backend + frontend |
| `k8s/secrets/app-secret.yaml` | `Secret` | DB credentials + JWT signing keys |

---

## Resource 1 — namespace.yaml

### Purpose
Creates the `minecore` Kubernetes namespace. A namespace is a logical boundary inside the cluster — it isolates MineCore's workloads from anything else running in the cluster (like system services).

### How It Fits the Architecture
Every other resource in `k8s/` declares `namespace: minecore`. Without this namespace existing first, all other `kubectl apply` commands will fail with `namespaces "minecore" not found`.

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: minecore
  labels:
    app.kubernetes.io/name: minecore
    app.kubernetes.io/instance: minecore
    app.kubernetes.io/part-of: minecore
    app.kubernetes.io/managed-by: kubectl
    environment: development
```

### Manual Execution

```bash
kubectl apply -f k8s/namespace.yaml
```

### Verification

```bash
kubectl get namespace minecore
kubectl describe namespace minecore
```

### Expected Output

```
NAME       STATUS   AGE
minecore   Active   5s
```

`describe` output:
```
Name:         minecore
Labels:       app.kubernetes.io/instance=minecore
              app.kubernetes.io/managed-by=kubectl
              app.kubernetes.io/name=minecore
              app.kubernetes.io/part-of=minecore
              environment=development
Status:       Active
```

---

## Resource 2 — configmaps/app-config.yaml

### Purpose
Stores **non-sensitive** configuration as key-value pairs that pods read as environment variables. Two ConfigMaps are defined in one file, separated by `---`:

1. `minecore-backend-config` — all Express.js server settings
2. `minecore-frontend-config` — Next.js connection settings

### How It Fits the Architecture
When `backend/deployment.yaml` is applied later, it will reference `minecore-backend-config` via `envFrom`. Kubernetes injects every key in the ConfigMap as an environment variable into the backend container. The frontend Deployment does the same with `minecore-frontend-config`.

```
backend pod environment:
  NODE_ENV=production
  PORT=4000
  API_VERSION=v1
  CORS_ORIGIN=http://localhost:30000
  RATE_LIMIT_WINDOW_MS=900000
  RATE_LIMIT_MAX=100
  JWT_ACCESS_EXPIRES_IN=24h
  JWT_REFRESH_EXPIRES_IN=7d
  + (DATABASE_URL and JWT secrets injected from Secret separately)

frontend pod environment:
  PORT=3000
  HOSTNAME=0.0.0.0
  NODE_ENV=production
  NEXT_PUBLIC_API_URL=http://minecore-backend-svc:4000
```

> **Key Design Decision:** `NEXT_PUBLIC_API_URL` points to `minecore-backend-svc:4000` — the Kubernetes internal DNS name for the backend ClusterIP service. This replaces Docker Compose's `http://localhost:4000`.

### How Deployments Will Consume This ConfigMap

```yaml
# Preview of how backend/deployment.yaml will reference this ConfigMap
spec:
  containers:
    - name: backend
      envFrom:
        - configMapRef:
            name: minecore-backend-config   # ← injects ALL keys as env vars
        - secretRef:
            name: minecore-app-secret       # ← injects secrets alongside
```

### Manual Execution

```bash
kubectl apply -f k8s/configmaps/app-config.yaml
```

### Verification

```bash
# List both ConfigMaps
kubectl get configmaps -n minecore

# Inspect backend config
kubectl describe configmap minecore-backend-config -n minecore

# Inspect frontend config
kubectl describe configmap minecore-frontend-config -n minecore

# View raw data (shows all key-value pairs)
kubectl get configmap minecore-backend-config -n minecore -o yaml
kubectl get configmap minecore-frontend-config -n minecore -o yaml
```

### Expected Output

```bash
$ kubectl get configmaps -n minecore
NAME                      DATA   AGE
minecore-backend-config   8      10s
minecore-frontend-config  4      10s
```

`describe` for backend config:
```
Name:         minecore-backend-config
Namespace:    minecore
Labels:       app.kubernetes.io/component=backend ...
Data
====
API_VERSION:             v1
CORS_ORIGIN:             http://localhost:30000
JWT_ACCESS_EXPIRES_IN:   24h
JWT_REFRESH_EXPIRES_IN:  7d
NODE_ENV:                production
PORT:                    4000
RATE_LIMIT_MAX:          100
RATE_LIMIT_WINDOW_MS:    900000
```

---

## Resource 3 — secrets/app-secret.yaml

### Purpose
Stores **sensitive credentials** as a Kubernetes `Secret`. Unlike ConfigMaps, Secret data is base64-encoded when stored in etcd and can be restricted via RBAC. This file uses `stringData` (plain text input) — Kubernetes handles the base64 encoding automatically.

### How It Fits the Architecture

```
minecore-app-secret provides:
  ┌──────────────────────────────┬────────────────────────────┐
  │ Key                          │ Consumed By                │
  ├──────────────────────────────┼────────────────────────────┤
  │ POSTGRES_USER                │ postgres/deployment.yaml   │
  │ POSTGRES_PASSWORD            │ postgres/deployment.yaml   │
  │ POSTGRES_DB                  │ postgres/deployment.yaml   │
  │ DATABASE_URL                 │ backend/deployment.yaml    │
  │ JWT_ACCESS_SECRET            │ backend/deployment.yaml    │
  │ JWT_REFRESH_SECRET           │ backend/deployment.yaml    │
  └──────────────────────────────┴────────────────────────────┘
```

> **Critical Note on DATABASE_URL:** In Docker Compose, the hostname was `postgres` (the Docker service name). In Kubernetes, it is `minecore-postgres-svc` — the ClusterIP Service name. The URL in the Secret reflects this Kubernetes-specific hostname.

### Why `stringData` Not `data`
- `data:` requires manually base64-encoded values (error-prone)
- `stringData:` accepts plain text — Kubernetes encodes it on apply
- On retrieval (`kubectl get secret -o yaml`), values appear as `data:` (base64)

### How Deployments Will Consume This Secret

```yaml
# Preview of how backend/deployment.yaml will reference this Secret
spec:
  containers:
    - name: backend
      envFrom:
        - secretRef:
            name: minecore-app-secret       # ← injects ALL keys as env vars

# OR — selective injection of specific keys:
      env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: minecore-app-secret
              key: DATABASE_URL
```

```yaml
# Preview of how postgres/deployment.yaml will reference this Secret
spec:
  containers:
    - name: postgres
      env:
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: minecore-app-secret
              key: POSTGRES_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: minecore-app-secret
              key: POSTGRES_PASSWORD
        - name: POSTGRES_DB
          valueFrom:
            secretKeyRef:
              name: minecore-app-secret
              key: POSTGRES_DB
```

### Manual Execution

```bash
kubectl apply -f k8s/secrets/app-secret.yaml
```

### Verification

```bash
# List secrets in minecore namespace
kubectl get secrets -n minecore

# Describe the secret (shows keys, NOT values — values are redacted)
kubectl describe secret minecore-app-secret -n minecore

# Decode a specific value to verify it was stored correctly
# (safe to run locally — do not run in CI pipelines)
kubectl get secret minecore-app-secret -n minecore \
  -o jsonpath='{.data.POSTGRES_USER}' | base64 --decode
# Expected: minecore_user

kubectl get secret minecore-app-secret -n minecore \
  -o jsonpath='{.data.POSTGRES_DB}' | base64 --decode
# Expected: minecore_db

kubectl get secret minecore-app-secret -n minecore \
  -o jsonpath='{.data.DATABASE_URL}' | base64 --decode
# Expected: postgresql://minecore_user:minecore_password@minecore-postgres-svc:5432/minecore_db?schema=public
```

### Expected Output

```bash
$ kubectl get secrets -n minecore
NAME                  TYPE     DATA   AGE
minecore-app-secret   Opaque   6      8s
```

`describe` output (values are always hidden):
```
Name:         minecore-app-secret
Namespace:    minecore
Type:         Opaque

Data
====
DATABASE_URL:        99 bytes
JWT_ACCESS_SECRET:   38 bytes
JWT_REFRESH_SECRET:  39 bytes
POSTGRES_DB:         11 bytes
POSTGRES_PASSWORD:   17 bytes
POSTGRES_USER:       13 bytes
```

---

## Complete Deployment Order — Objective 3.3

Apply in this exact sequence (Objective 3.3 covers steps 1–3):

```bash
# ── STEP 1: Namespace (always first) ─────────────────────────────────────────
kubectl apply -f k8s/namespace.yaml

# Verify:
kubectl get namespace minecore

# ── STEP 2: ConfigMaps (before Deployments need them) ────────────────────────
kubectl apply -f k8s/configmaps/app-config.yaml

# Verify:
kubectl get configmaps -n minecore

# ── STEP 3: Secrets (before Deployments need them) ───────────────────────────
kubectl apply -f k8s/secrets/app-secret.yaml

# Verify:
kubectl get secrets -n minecore

# ── Confirm all 3.3 resources are healthy ────────────────────────────────────
kubectl get all -n minecore
kubectl get configmaps -n minecore
kubectl get secrets -n minecore
```

### Full State After Objective 3.3 (Expected)

```bash
$ kubectl get namespace minecore
NAME       STATUS   AGE
minecore   Active   Xm

$ kubectl get configmaps -n minecore
NAME                      DATA   AGE
minecore-backend-config   8      Xm
minecore-frontend-config  4      Xm

$ kubectl get secrets -n minecore
NAME                  TYPE     DATA   AGE
minecore-app-secret   Opaque   6      Xm
```

---

## Troubleshooting Guide

### Problem 1 — `namespaces "minecore" not found`

**Cause:** ConfigMap or Secret applied before namespace was created.

**Fix:**
```bash
kubectl apply -f k8s/namespace.yaml
# Wait 2 seconds, then re-apply
kubectl apply -f k8s/configmaps/app-config.yaml
kubectl apply -f k8s/secrets/app-secret.yaml
```

---

### Problem 2 — `Error from server (AlreadyExists)`

**Cause:** Resource was already applied previously.

**Fix:** Use `apply` (not `create`) — `apply` is idempotent and will update the existing resource safely. If you see this with `apply`, the resource is already at the desired state.

```bash
# Force update if needed
kubectl replace -f k8s/namespace.yaml
kubectl replace -f k8s/configmaps/app-config.yaml
kubectl replace -f k8s/secrets/app-secret.yaml
```

---

### Problem 3 — Secret values look wrong after apply

**Cause:** Typo in `stringData` values.

**Fix:** Decode and verify each value:
```bash
# Check DATABASE_URL
kubectl get secret minecore-app-secret -n minecore \
  -o jsonpath='{.data.DATABASE_URL}' | base64 --decode && echo

# Check JWT_ACCESS_SECRET
kubectl get secret minecore-app-secret -n minecore \
  -o jsonpath='{.data.JWT_ACCESS_SECRET}' | base64 --decode && echo
```

If wrong, edit and re-apply:
```bash
# Edit directly in cluster
kubectl edit secret minecore-app-secret -n minecore

# OR re-apply the file after fixing it
kubectl apply -f k8s/secrets/app-secret.yaml
```

---

### Problem 4 — ConfigMap not reflecting updated values in future pods

**Cause:** ConfigMap changes don't automatically restart pods.

**Fix:** After changing a ConfigMap, restart the relevant deployment:
```bash
kubectl rollout restart deployment/minecore-backend -n minecore
kubectl rollout restart deployment/minecore-frontend -n minecore
```

---

### Problem 5 — Wrong context (applying to wrong cluster)

**Cause:** `kubectl` context pointing to a different cluster.

**Fix:**
```bash
# Check current context
kubectl config current-context
# Should be: kind-kind

# Switch to kind cluster if needed
kubectl config use-context kind-kind

# Then re-apply
kubectl apply -f k8s/namespace.yaml
```

---

## What Comes Next — Objective 3.4: Storage

With namespace + config + secrets in place, the next objective creates:

```
k8s/storage/
├── postgres-pv.yaml    ← PersistentVolume (5Gi hostPath on kind node)
└── postgres-pvc.yaml   ← PersistentVolumeClaim (binds to PV)
```

These must exist before the PostgreSQL StatefulSet can be deployed.

---

*Document authored for MineCore — Smart Mining Operations Platform*
*Kubernetes Configuration Management | Objective 3.3*
