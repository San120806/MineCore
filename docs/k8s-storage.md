# MineCore — Kubernetes Persistent Storage
> **Objective 3.4 — Persistent Storage for PostgreSQL**
> Status: `COMPLETE` | Version: `1.0.0` | Date: `2026-06-15`

---

## Storage Strategy: Dynamic Provisioning

### Why No Manual PersistentVolume?

Your cluster has the `standard` StorageClass with `rancher.io/local-path` provisioner:

```
NAME                 PROVISIONER             VOLUMEBINDINGMODE      
standard (default)   rancher.io/local-path   WaitForFirstConsumer
```

**Dynamic provisioning** means:
- You declare a PVC (what you *want*)
- Kubernetes automatically creates a PV (what satisfies it)
- No manual PV YAML is needed
- The PV is created the moment the postgres pod is first scheduled to a node

**`WaitForFirstConsumer`** means the PV isn't created at `kubectl apply -f pvc` time — it waits until the postgres pod is actually scheduled. This is why after applying the PVC, its STATUS will show `Pending` until postgres starts. **This is correct and expected behaviour.**

---

## Architecture — How Storage Flows Through MineCore

```
                    APPLY TIME
                        │
                        ▼
         kubectl apply -f postgres-pvc.yaml
                        │
                        │   Creates PVC in 'minecore' namespace
                        │   STATUS: Pending  ← Normal! WaitForFirstConsumer
                        │
                        ▼
         kubectl apply -f postgres/deployment.yaml   (Objective 3.5)
                        │
                        │   StatefulSet schedules postgres pod to node:
                        │   desktop-control-plane (172.19.0.4)
                        │
                        ▼
         rancher.io/local-path provisioner automatically:
           1. Creates PersistentVolume (minecore-postgres-pvc-xxx)
           2. Binds PVC ← → PV
           3. Mounts volume into postgres pod at /var/lib/postgresql/data
                        │
                        ▼
         PVC STATUS: Bound ✅
         Data persists across pod restarts!

┌─────────────────────────────────────────────────────┐
│              Namespace: minecore                    │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  postgres StatefulSet Pod                   │   │
│  │  image: postgres:15-alpine                  │   │
│  │                                             │   │
│  │  Volume mount:                              │   │
│  │  /var/lib/postgresql/data ◄── PVC bound ───┼───┤
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  PersistentVolumeClaim                      │   │
│  │  name: minecore-postgres-pvc               │   │
│  │  storage: 2Gi                               │   │
│  │  storageClass: standard                     │   │
│  │  accessMode: ReadWriteOnce                  │   │
│  └──────────────────┬──────────────────────────┘   │
│                     │ auto-bound                    │
│  ┌──────────────────▼──────────────────────────┐   │
│  │  PersistentVolume (auto-created by kind)    │   │
│  │  provisioner: rancher.io/local-path         │   │
│  │  hostPath: /var/local-path-provisioner/...  │   │
│  │  (on node: desktop-control-plane)           │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## The Manifest

**File:** [`k8s/storage/postgres-pvc.yaml`](file:///Users/saniyakapure/Desktop/mining-core/k8s/storage/postgres-pvc.yaml)

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: minecore-postgres-pvc
  namespace: minecore
  labels:
    app.kubernetes.io/name: postgres
    app.kubernetes.io/component: database
    app.kubernetes.io/part-of: minecore
    app.kubernetes.io/managed-by: kubectl
    environment: development
  annotations:
    description: "PostgreSQL data volume for MineCore mining operations platform"
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: standard
  resources:
    requests:
      storage: 2Gi
```

### Field-by-Field Explanation

| Field | Value | Why |
|---|---|---|
| `name` | `minecore-postgres-pvc` | Follows `minecore-<service>-pvc` convention |
| `namespace` | `minecore` | Scoped to MineCore namespace |
| `accessModes` | `ReadWriteOnce` | One node reads/writes at a time — correct for PostgreSQL |
| `storageClassName` | `standard` | Targets the default kind StorageClass with dynamic provisioner |
| `storage` | `2Gi` | Appropriate for academic PostgreSQL (seed data ~50MB, generous headroom) |

### Why `ReadWriteOnce` (Not `ReadWriteMany`)?
PostgreSQL requires exclusive write access to its data directory. `ReadWriteMany` is for distributed filesystems (NFS, CephFS). A single-primary PostgreSQL always uses `ReadWriteOnce`.

### Why 2Gi?
| Component | Estimated Size |
|---|---|
| PostgreSQL base installation | ~50 MB |
| MineCore seed data (all tables) | ~5–20 MB |
| Transaction logs (WAL) | ~100–500 MB |
| Growth headroom for dev/testing | ~1.4 GB |
| **Total** | **2Gi is comfortable** |

---

## Manual Execution Commands

```bash
# Apply the PVC
kubectl apply -f k8s/storage/postgres-pvc.yaml
```

> ⚠️ **Expected after apply:** The PVC will show STATUS `Pending`. This is **NOT an error**. The `WaitForFirstConsumer` binding mode means the PV won't be created until the postgres pod is scheduled in Objective 3.5.

---

## Verification Commands

### Immediately After Apply (Pending is OK)

```bash
# Check PVC status
kubectl get pvc -n minecore

# Full details
kubectl describe pvc minecore-postgres-pvc -n minecore
```

### After Postgres Pod is Running (Objective 3.5)

```bash
# Confirm PVC is now Bound
kubectl get pvc -n minecore

# See the auto-created PV
kubectl get pv

# Full PV details (shows actual host path on node)
kubectl describe pv $(kubectl get pvc minecore-postgres-pvc -n minecore -o jsonpath='{.spec.volumeName}')
```

---

## Expected Outputs

### Right After `kubectl apply -f k8s/storage/postgres-pvc.yaml`

```
$ kubectl get pvc -n minecore
NAME                   STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
minecore-postgres-pvc  Pending                                       standard       5s
```

`STATUS: Pending` — **This is correct.** `WaitForFirstConsumer` holds provisioning until a pod claims the PVC.

---

### After Postgres StatefulSet Is Running (Objective 3.5)

```
$ kubectl get pvc -n minecore
NAME                   STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
minecore-postgres-pvc  Bound    pvc-a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx   2Gi        RWO            standard       2m
```

```
$ kubectl get pv
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                          STORAGECLASS   AGE
pvc-a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx   2Gi        RWO            Delete           Bound    minecore/minecore-postgres-pvc  standard       90s
```

Key fields to verify:
- `STATUS: Bound` ✅
- `CAPACITY: 2Gi` ✅
- `ACCESS MODES: RWO` ✅
- `CLAIM: minecore/minecore-postgres-pvc` ✅

---

## Data Persistence Rules

| Scenario | Data Preserved? | Why |
|---|---|---|
| Postgres pod crashes and restarts | ✅ Yes | Pod restarts, PVC remains bound |
| `kubectl rollout restart` postgres | ✅ Yes | New pod re-mounts the same PVC |
| Postgres pod deleted + StatefulSet recreates | ✅ Yes | PVC survives independently of pods |
| Node rebooted | ✅ Yes | hostPath data survives node reboot |
| `kubectl delete pod <postgres-pod>` | ✅ Yes | StatefulSet recreates pod, remounts PVC |
| `kubectl delete pvc minecore-postgres-pvc` | ❌ **Data LOST** | Deletes PVC + PV (ReclaimPolicy: Delete) |
| `kubectl delete namespace minecore` | ❌ **Data LOST** | Deletes everything including PVC |

> ⚠️ **Backup before deleting namespace:**
> ```bash
> kubectl exec -it <postgres-pod-name> -n minecore -- \
>   pg_dump -U minecore_user minecore_db > minecore_backup_$(date +%Y%m%d).sql
> ```

---

## Troubleshooting Guide

### Problem 1 — PVC stays `Pending` forever (even after postgres pod starts)

**Cause A:** Wrong StorageClass name.

```bash
# Check what StorageClasses exist
kubectl get storageclass

# Check what StorageClass the PVC is requesting
kubectl describe pvc minecore-postgres-pvc -n minecore | grep StorageClass
```

**Fix:** Ensure `storageClassName: standard` matches exactly (case-sensitive).

---

**Cause B:** The postgres pod itself hasn't started yet.

```bash
# Check if postgres pod exists
kubectl get pods -n minecore

# Check postgres StatefulSet events
kubectl describe statefulset minecore-postgres -n minecore
```

**Fix:** Apply `k8s/postgres/deployment.yaml` (Objective 3.5) first.

---

### Problem 2 — PVC `Bound` but postgres pod is in `CrashLoopBackOff`

**Cause:** PostgreSQL data directory permission issue.

```bash
# Check postgres pod logs
kubectl logs <postgres-pod-name> -n minecore
```

**Fix:** This is handled by PostgreSQL's Docker image automatically. If it persists, delete the PVC and recreate (wipes data):

```bash
kubectl delete pvc minecore-postgres-pvc -n minecore
kubectl apply -f k8s/storage/postgres-pvc.yaml
```

---

### Problem 3 — `namespaces "minecore" not found`

**Cause:** Namespace not applied yet.

**Fix:**
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/storage/postgres-pvc.yaml
```

---

### Problem 4 — `no persistent volumes available for this claim`

**Cause:** The `standard` StorageClass dynamic provisioner isn't working.

```bash
# Check provisioner pod
kubectl get pods -n local-path-storage

# Check provisioner logs
kubectl logs -n local-path-storage -l app=local-path-provisioner
```

**Fix:** Restart Docker Desktop and re-check:
```bash
kubectl get storageclass
```

---

### Problem 5 — Need to resize storage later

Dynamic provisioning with `rancher.io/local-path` doesn't support online resize. To resize:

```bash
# 1. Backup data first!
kubectl exec -it <postgres-pod> -n minecore -- pg_dump -U minecore_user minecore_db > backup.sql

# 2. Scale down postgres
kubectl scale statefulset minecore-postgres -n minecore --replicas=0

# 3. Delete PVC (data is in backup)
kubectl delete pvc minecore-postgres-pvc -n minecore

# 4. Edit postgres-pvc.yaml: change storage: 2Gi → storage: 5Gi

# 5. Re-apply
kubectl apply -f k8s/storage/postgres-pvc.yaml

# 6. Scale postgres back up
kubectl scale statefulset minecore-postgres -n minecore --replicas=1

# 7. Restore data
kubectl exec -it <postgres-pod> -n minecore -- psql -U minecore_user minecore_db < backup.sql
```

---

## Complete State After Objective 3.4

```bash
$ kubectl get namespace minecore
NAME       STATUS   AGE
minecore   Active   Xm ✅

$ kubectl get configmaps -n minecore
NAME                       DATA   AGE
kube-root-ca.crt           1      Xm
minecore-backend-config    8      Xm ✅
minecore-frontend-config   4      Xm ✅

$ kubectl get secrets -n minecore
NAME                  TYPE     DATA   AGE
minecore-app-secret   Opaque   6      Xm ✅

$ kubectl get pvc -n minecore
NAME                   STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
minecore-postgres-pvc  Pending                                       standard       Xs ✅ (Pending is correct)
```

---

## What Comes Next — Objective 3.5: PostgreSQL Deployment

With the PVC ready, Objective 3.5 creates:

```
k8s/postgres/
├── deployment.yaml    ← StatefulSet that mounts minecore-postgres-pvc
└── service.yaml       ← ClusterIP service (minecore-postgres-svc:5432)
```

When the StatefulSet is applied, the PVC will automatically transition:
`Pending` → `Bound` ✅

---

*Document authored for MineCore — Smart Mining Operations Platform*
*Kubernetes Persistent Storage | Objective 3.4*
