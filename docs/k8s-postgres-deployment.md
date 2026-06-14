# MineCore — Kubernetes PostgreSQL Deployment
> **Objective 3.5 — PostgreSQL Deployment**
> Status: `COMPLETE` | Version: `1.0.0` | Date: `2026-06-15`

---

## Resource 1 — postgres/deployment.yaml (StatefulSet)

### Purpose
Runs the PostgreSQL 15 database as a Kubernetes **StatefulSet** with 1 replica.

### Why StatefulSet, Not Deployment?
| | Deployment | StatefulSet |
|---|---|---|
| Pod naming | Random suffix (`-abc12`) | Stable index (`-0`) |
| Storage | Shared or ephemeral | Dedicated per-pod PVC |
| Startup order | Parallel | Ordered |
| Best for | Stateless apps | **Databases ✅** |

### Critical Design Decisions

#### 1. `PGDATA` Subdirectory
```yaml
- name: PGDATA
  value: /var/lib/postgresql/data/pgdata
```
The `rancher.io/local-path` provisioner creates volumes that may contain a `lost+found` directory. PostgreSQL **refuses to initialise into a non-empty directory**. Setting `PGDATA` to a subdirectory solves this permanently.

#### 2. Individual `secretKeyRef` (Not `envFrom`)
```yaml
env:
  - name: POSTGRES_USER
    valueFrom:
      secretKeyRef:
        name: minecore-app-secret
        key: POSTGRES_USER
```
PostgreSQL only needs 3 of the 6 secret keys (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`). Injecting them individually — not with `envFrom` — follows the **principle of least privilege**.

#### 3. `pg_isready` Probes via Shell
```yaml
livenessProbe:
  exec:
    command:
      - /bin/sh
      - -c
      - exec pg_isready --host 127.0.0.1 --port 5432 --username "$POSTGRES_USER"
```
Using shell expands the `$POSTGRES_USER` environment variable, keeping the probe DRY (no hardcoded username).

#### 4. `terminationGracePeriodSeconds: 60`
Gives PostgreSQL 60 seconds to flush its Write-Ahead Log (WAL) to disk before the pod is forcefully terminated. Prevents data corruption on pod shutdown.

---

### How It Fits the Architecture

```
minecore-app-secret
  ├── POSTGRES_USER     ──┐
  ├── POSTGRES_PASSWORD ──┼── injected into postgres pod at startup
  └── POSTGRES_DB       ──┘
                            │
                            ▼
              postgres:15-alpine container
              $PGDATA = /var/lib/postgresql/data/pgdata
                            │
                            ▼
              minecore-postgres-pvc (2Gi, Bound after this step)
              /var/lib/postgresql/data/ ← mount point
                /pgdata/               ← actual postgres data dir
```

---

## Resource 2 — postgres/service.yaml (ClusterIP)

### Purpose
Creates an internal-only Kubernetes Service that gives the postgres pod a **stable DNS name** inside the cluster.

### Why This Name Matters
The service is named `minecore-postgres-svc`. This **must** exactly match the hostname in `DATABASE_URL` inside the secret:

```
postgresql://minecore_user:minecore_password@minecore-postgres-svc:5432/minecore_db?schema=public
                                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                              This is the service name
```

If these don't match → backend cannot connect → `CrashLoopBackOff`.

### DNS Resolution Chain
```
backend pod
  └── resolves: minecore-postgres-svc
      └── K8s DNS expands to: minecore-postgres-svc.minecore.svc.cluster.local
          └── ClusterIP routes to: postgres pod on port 5432
```

---

## Manual Execution Commands

Apply in this order:

```bash
# Step 1 — Apply the StatefulSet
kubectl apply -f k8s/postgres/deployment.yaml

# Step 2 — Apply the Service
kubectl apply -f k8s/postgres/service.yaml
```

> ⚠️ Apply the StatefulSet **before** the service. The StatefulSet needs `serviceName: minecore-postgres-svc` to exist, but Kubernetes will accept it either way. Apply service immediately after.

---

## Verification Commands

### Immediately After Apply

```bash
# Watch the postgres pod come up (Ctrl+C to stop watching)
kubectl get pods -n minecore -w

# Check StatefulSet status
kubectl get statefulset -n minecore

# Check the service
kubectl get service -n minecore

# Check PVC is now Bound (was Pending before this step)
kubectl get pvc -n minecore
```

### Deep Inspection

```bash
# Full StatefulSet details
kubectl describe statefulset minecore-postgres -n minecore

# Full pod details (check events if pod not starting)
kubectl describe pod minecore-postgres-0 -n minecore

# Live pod logs
kubectl logs -f minecore-postgres-0 -n minecore

# Check the auto-created PersistentVolume
kubectl get pv
```

### Confirm PostgreSQL is Accepting Connections

```bash
# Run pg_isready directly inside the pod
kubectl exec minecore-postgres-0 -n minecore -- \
  pg_isready -U minecore_user -d minecore_db -h 127.0.0.1

# Connect to psql and verify the database exists
kubectl exec -it minecore-postgres-0 -n minecore -- \
  psql -U minecore_user -d minecore_db -c "\l"

# Check that the database is empty (no tables yet — migrations run via backend)
kubectl exec -it minecore-postgres-0 -n minecore -- \
  psql -U minecore_user -d minecore_db -c "\dt"
```

---

## Expected Outputs

### During Pod Startup (first 30 seconds)

```bash
$ kubectl get pods -n minecore -w
NAME                   READY   STATUS              RESTARTS   AGE
minecore-postgres-0    0/1     ContainerCreating   0          3s
minecore-postgres-0    0/1     Running             0          8s
minecore-postgres-0    1/1     Running             0          35s   ← Ready ✅
```

> The pod transitions: `ContainerCreating` → `Running (0/1)` → `Running (1/1)`
> The jump from `0/1` to `1/1` happens when the **readiness probe first passes** (~5–30 seconds).

---

### StatefulSet Status

```bash
$ kubectl get statefulset -n minecore
NAME               READY   AGE
minecore-postgres  1/1     60s
```

---

### Service Status

```bash
$ kubectl get service -n minecore
NAME                    TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
minecore-postgres-svc   ClusterIP   10.96.x.x       <none>        5432/TCP   45s
```

---

### PVC Now Bound

```bash
$ kubectl get pvc -n minecore
NAME                   STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
minecore-postgres-pvc  Bound    pvc-a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx   2Gi        RWO            standard       5m
```

`STATUS` changed from `Pending` → `Bound` ✅ — the dynamic provisioner created the PV.

---

### Auto-Created PersistentVolume

```bash
$ kubectl get pv
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                          STORAGECLASS
pvc-a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx   2Gi        RWO            Delete           Bound    minecore/minecore-postgres-pvc  standard
```

---

### PostgreSQL Ready Check

```bash
$ kubectl exec minecore-postgres-0 -n minecore -- \
    pg_isready -U minecore_user -d minecore_db -h 127.0.0.1

127.0.0.1:5432 - accepting connections
```

---

### PostgreSQL Logs (Healthy)

```bash
$ kubectl logs minecore-postgres-0 -n minecore

PostgreSQL init process complete; ready for start up.
...
database system is ready to accept connections
```

---

## Troubleshooting Guide

### Problem 1 — Pod stuck in `ContainerCreating`

```bash
kubectl describe pod minecore-postgres-0 -n minecore
```

**Cause A:** PVC not found / still Pending.

Look for: `Unable to attach or mount volumes: ... persistentvolumeclaim "minecore-postgres-pvc" not found`

**Fix:**
```bash
# Confirm PVC exists
kubectl get pvc -n minecore

# If missing, apply it
kubectl apply -f k8s/storage/postgres-pvc.yaml
```

---

**Cause B:** Secret not found.

Look for: `secret "minecore-app-secret" not found`

**Fix:**
```bash
kubectl apply -f k8s/secrets/app-secret.yaml
```

---

### Problem 2 — Pod in `CrashLoopBackOff`

```bash
kubectl logs minecore-postgres-0 -n minecore
```

**Cause A:** `initdb: error: directory "/var/lib/postgresql/data/pgdata" exists but is not empty`

This means `PGDATA` is set but something is in the subdirectory already.

**Fix:** Delete the PVC (wipes data) and recreate:
```bash
kubectl delete statefulset minecore-postgres -n minecore
kubectl delete pvc minecore-postgres-pvc -n minecore
kubectl apply -f k8s/storage/postgres-pvc.yaml
kubectl apply -f k8s/postgres/deployment.yaml
kubectl apply -f k8s/postgres/service.yaml
```

---

**Cause B:** Wrong `POSTGRES_PASSWORD` format.

Look for: `FATAL: password authentication failed`

**Fix:**
```bash
# Decode the password stored in the secret
kubectl get secret minecore-app-secret -n minecore \
  -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 --decode && echo
```

---

### Problem 3 — Liveness probe failing → pod restarting

```bash
kubectl describe pod minecore-postgres-0 -n minecore
# Look for: Liveness probe failed
```

**Cause:** `initialDelaySeconds: 30` — probe starts before PostgreSQL is ready. Occurs on very slow machines.

**Fix:** Temporarily increase `initialDelaySeconds` in `deployment.yaml`:
```yaml
livenessProbe:
  initialDelaySeconds: 60   # increase from 30 → 60
```
Then re-apply:
```bash
kubectl apply -f k8s/postgres/deployment.yaml
```

---

### Problem 4 — Service not routing to postgres pod

```bash
# Check if service endpoints are populated (should show pod IP:5432)
kubectl get endpoints minecore-postgres-svc -n minecore
```

**Expected:**
```
NAME                    ENDPOINTS          AGE
minecore-postgres-svc   10.244.x.x:5432   30s
```

**If `<none>`:** The service selector doesn't match the pod labels.

**Fix:** Verify the selector matches the pod template labels:
```bash
# View service selector
kubectl get service minecore-postgres-svc -n minecore -o yaml | grep -A5 selector

# View pod labels
kubectl get pod minecore-postgres-0 -n minecore --show-labels
```

Both must have: `app.kubernetes.io/name=postgres` and `app.kubernetes.io/part-of=minecore`

---

### Problem 5 — `FATAL: role "minecore_user" does not exist`

**Cause:** PostgreSQL initialised with wrong credentials (possibly empty secret values).

**Fix:** Check what was actually stored in the secret:
```bash
kubectl get secret minecore-app-secret -n minecore \
  -o jsonpath='{.data.POSTGRES_USER}' | base64 --decode && echo
# Expected: minecore_user
```

If wrong, fix the secret and recreate postgres (data directory must be wiped):
```bash
kubectl apply -f k8s/secrets/app-secret.yaml
kubectl delete statefulset minecore-postgres -n minecore
kubectl delete pvc minecore-postgres-pvc -n minecore
kubectl apply -f k8s/storage/postgres-pvc.yaml
kubectl apply -f k8s/postgres/deployment.yaml
kubectl apply -f k8s/postgres/service.yaml
```

---

## Complete State After Objective 3.5

```bash
$ kubectl get all -n minecore
NAME                    READY   STATUS    RESTARTS   AGE
pod/minecore-postgres-0 1/1     Running   0          2m ✅

NAME                            TYPE        CLUSTER-IP   PORT(S)    AGE
service/minecore-postgres-svc   ClusterIP   10.96.x.x    5432/TCP   90s ✅

NAME                              READY   AGE
statefulset.apps/minecore-postgres 1/1    2m ✅

$ kubectl get pvc -n minecore
NAME                   STATUS   VOLUME                  CAPACITY   ACCESS MODES   STORAGECLASS   AGE
minecore-postgres-pvc  Bound    pvc-xxxxxxxxxxxx         2Gi        RWO            standard       5m ✅

$ kubectl get pv
NAME                    CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                          AGE
pvc-xxxxxxxxxxxx        2Gi        RWO            Delete           Bound    minecore/minecore-postgres-pvc  4m ✅
```

---

## What Comes Next — Objective 3.6: Backend Deployment

With PostgreSQL running, Objective 3.6 deploys:

```
k8s/backend/
├── deployment.yaml    ← Express.js Deployment
│                        - Runs: npx prisma migrate deploy && node dist/server.js
│                        - Connects to: minecore-postgres-svc:5432
│                        - Reads: DATABASE_URL + JWT secrets from app-secret
│                        - Reads: NODE_ENV + PORT etc. from minecore-backend-config
└── service.yaml       ← ClusterIP service (minecore-backend-svc:4000)
```

The backend will run Prisma migrations on startup, creating all 8 database tables automatically.

---

*Document authored for MineCore — Smart Mining Operations Platform*
*Kubernetes PostgreSQL Deployment | Objective 3.5*
