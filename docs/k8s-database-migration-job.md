# MineCore — Kubernetes Database Migration Job
> **Objective 3.7 — Database Migration Job**
> Status: `READY FOR DEPLOYMENT` | Version: `1.0.0` | Date: `2026-06-15`

---

## Resource 1 — backend/migration-job.yaml (Job)

### Purpose
Executes Prisma schema migrations against the PostgreSQL database as a one-off Kubernetes **Job** before the application backend starts.

### Why a Job (and not in Backend Pod Startup)?
While running migrations directly inside the backend pod startup command is easy for development, it presents operational issues in production:
1. **Concurrency Hazards:** If the backend has 2+ replicas running, multiple pods starting up concurrently will attempt to run `npx prisma migrate deploy` at the same time. Although Prisma handles database locking, this can cause transaction contention and startup delay.
2. **Pod Boot Times:** A database migration block extends the startup duration of the backend pod. This can interfere with the readiness probe, causing pods to be restarted prematurely by the kubelet.
3. **Application Release decoupling:** Isolating migrations as a Job ensures that the schema updates succeed *before* the new application code rolls out. If the migration fails, the Job fails, halting the CD pipeline and preventing the deployment of broken/incompatible backend code.

---

### Key Design Decisions

#### 1. `restartPolicy: OnFailure`
If the migration fails (e.g. because PostgreSQL is starting up and not accepting connections yet), the pod will exit. The Kubernetes Job controller will automatically recreate the pod and retry the migration.

#### 2. `backoffLimit: 4`
Limits the number of failed retries to 4. If the pod fails 4 times consecutively, the entire Job is marked as failed. This prevents the Job from looping indefinitely and consuming resource slots.

#### 3. `activeDeadlineSeconds: 300`
A hard timeout of 5 minutes. If the migration job runs longer than 300 seconds, the cluster terminates the job and marks it as failed.

---

### How It Fits the Architecture

```
                       [1. Developer / CI Pipeline]
                                    │
                                    ▼  (kubectl apply)
                       minecore-migration-job
                                    │
                                    ▼  (runs container pod)
                        minecore-backend image
             (Runs: npx prisma migrate deploy against DB)
                                    │
                                    ├── Reads ConfigMap: minecore-backend-config
                                    ├── Reads Secret: minecore-app-secret (DATABASE_URL)
                                    │
                                    ▼
                        minecore-postgres-svc:5432
```

---

## Manual Execution Commands

### Prerequisites
1. Ensure the PostgreSQL StatefulSet is healthy and accepting connections.
2. Ensure the backend image is built and loaded:
   ```bash
   docker build -t minecore-backend:latest ./backend
   kind load docker-image minecore-backend:latest
   ```

### Running the Job
Jobs are immutable in Kubernetes. If you need to re-run the migration job, you must delete the existing one first.

```bash
# 1. Clean up any existing migration job
kubectl delete job minecore-migration-job -n minecore --ignore-not-found

# 2. Apply the migration job
kubectl apply -f k8s/backend/migration-job.yaml
```

---

## Verification Commands

### Check Job and Pod Status
```bash
# Get the migration job status
kubectl get jobs -n minecore

# Get the pod created by the job (will end in a random suffix)
kubectl get pods -n minecore -l app.kubernetes.io/name=migration
```

### Inspect Migration Logs
```bash
# View the migration logs (substitute the correct pod suffix)
kubectl logs -n minecore jobs/minecore-migration-job
```

### Verify Tables in PostgreSQL
To confirm migrations executed successfully, log into the PostgreSQL pod and check the tables:
```bash
# List all generated tables in the database
kubectl exec -it minecore-postgres-0 -n minecore -- \
  psql -U minecore_user -d minecore_db -c "\dt"
```

---

## Expected Outputs

### Job Status
```bash
$ kubectl get jobs -n minecore
NAME                     COMPLETIONS   DURATION   AGE
minecore-migration-job   1/1           18s        22s
```
*`COMPLETIONS: 1/1` indicates the migration ran and exited with status 0 (Success) ✅.*

### Pod Status
```bash
$ kubectl get pods -n minecore -l app.kubernetes.io/name=migration
NAME                           READY   STATUS      RESTARTS   AGE
minecore-migration-job-xxxxx   0/1     Completed   0          25s
```
*Note that the container status becomes `Completed` and readiness is `0/1` because the container has finished its task and exited successfully.*

### Migration Logs (Healthy)
```bash
$ kubectl logs -n minecore jobs/minecore-migration-job

Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "minecore_db" at "minecore-postgres-svc:5432"

Applying migration "20260609120000_init"
...
The database is now in sync with the migrations.
```

### PostgreSQL Table Verification
```bash
$ kubectl exec -it minecore-postgres-0 -n minecore -- psql -U minecore_user -d minecore_db -c "\dt"

             List of relations
 Schema |       Name        | Type  |     Owner     
--------+-------------------+-------+---------------
 public | _prisma_migrations | table | minecore_user
 public | Alert             | table | minecore_user
 public | Equipment         | table | minecore_user
 public | FleetActivity     | table | minecore_user
 public | MaintenanceLog    | table | minecore_user
 public | SensorReading     | table | minecore_user
 public | Shift             | table | minecore_user
 public | User              | table | minecore_user
(8 rows)
```

---

## Failure Recovery Instructions

### Scenario 1 — Job remains in `0/1` completions, pod in `Error` or `CrashLoopBackOff`
- **Cause:** Database connection issue or invalid schema.
- **Fix Checklist:**
  1. Inspect logs: `kubectl logs -n minecore -l app.kubernetes.io/name=migration --tail=50`.
  2. Verify if it says: `Can't reach database server at 'minecore-postgres-svc:5432'`. If so, verify that PostgreSQL is running (`kubectl get pods -n minecore`) and reachable.
  3. Verify that the credentials in `minecore-app-secret` are correct.
  4. Once corrected, delete and recreate the job:
     ```bash
     kubectl delete job minecore-migration-job -n minecore
     kubectl apply -f k8s/backend/migration-job.yaml
     ```

### Scenario 2 — Job fails with `DeadlineExceeded`
- **Cause:** The migration was stuck (e.g., waiting on a lock) and exceeded 5 minutes.
- **Fix:**
  1. Check if there are active locks on PostgreSQL:
     ```bash
     kubectl exec -it minecore-postgres-0 -n minecore -- \
       psql -U minecore_user -d minecore_db -c "SELECT pid, query, state FROM pg_stat_activity WHERE state != 'idle';"
     ```
  2. If a migration lock is stuck, terminate the blocking backend process or delete/restart PostgreSQL.
  3. Delete the migration job, clean up the lock table if needed, and re-run.

---

## Complete State After Objective 3.7
```bash
$ kubectl get all -n minecore
NAME                               READY   STATUS      RESTARTS   AGE
pod/minecore-postgres-0            1/1     Running     0          15m
pod/minecore-migration-job-xxxxx   0/1     Completed   0          2m

NAME                            TYPE        CLUSTER-IP    PORT(S)    AGE
service/minecore-postgres-svc   ClusterIP   10.96.12.34   5432/TCP   15m

NAME                                 READY   AGE
statefulset.apps/minecore-postgres   1/1     15m

NAME                             COMPLETIONS   DURATION   AGE
job.batch/minecore-migration-job 1/1           18s        2m
```

---

*Document authored for MineCore — Smart Mining Operations Platform*
*Kubernetes Database Migration Job | Objective 3.7*
