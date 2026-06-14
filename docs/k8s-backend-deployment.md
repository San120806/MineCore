# MineCore — Kubernetes Backend Deployment
> **Objective 3.6 — Backend Deployment**
> Status: `READY FOR DEPLOYMENT` | Version: `1.0.0` | Date: `2026-06-15`

---

## Resource 1 — backend/deployment.yaml (Deployment)

### Purpose
Runs the Express.js API as a Kubernetes **Deployment** with 2 replicas to ensure high availability and horizontal scaling.

### Key Design Decisions

#### 1. Zero-Downtime Rolling Update Strategy
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```
- `maxUnavailable: 0` guarantees that during an update, no existing pods are terminated until new pods are successfully created and have passed their readiness probes.
- `maxSurge: 1` allows the cluster to spin up one extra pod during updates, preventing capacity drop.

#### 2. Automatic Prisma Migrations on Startup
```yaml
command:
  - sh
  - -c
  - "npx prisma migrate deploy && node dist/server.js"
```
The container command is overridden to deploy database migrations before starting the API server. Since Prisma migrations are transaction-safe and use a database-level lock (`_prisma_migrations` table), they are idempotent and safe to run from multiple concurrent pods.

#### 3. Configuration and Secrets Injection
```yaml
envFrom:
  - configMapRef:
      name: minecore-backend-config
  - secretRef:
      name: minecore-app-secret
```
This loads all configuration parameters (e.g., `NODE_ENV`, `PORT`, `CORS_ORIGIN`) and sensitive credentials (e.g., `DATABASE_URL`, `JWT_ACCESS_SECRET`) directly as environment variables.

#### 4. Liveness and Readiness Probes
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 4000
  initialDelaySeconds: 30
  periodSeconds: 15
  timeoutSeconds: 5
  failureThreshold: 5
```
- **Readiness Probe (`GET /health`):** Starts checking after 15 seconds. If the probe fails, the pod is removed from the service endpoints and receives no traffic.
- **Liveness Probe (`GET /health`):** Starts checking after 30 seconds (allowing ample time for migrations to run and the server to boot). If it fails 5 times consecutively, the kubelet restarts the container.

#### 5. Resource Limits and Requests
```yaml
resources:
  requests:
    cpu: "100m"
    memory: "256Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
```
Enforces boundaries on CPU and Memory consumption to protect the cluster from resource exhaustion.

---

### How It Fits the Architecture

```
                       minecore-backend-svc (ClusterIP:4000)
                                        │
                      ┌─────────────────┴─────────────────┐
                      ▼                                   ▼
          minecore-backend-pod-1              minecore-backend-pod-2
          (npx prisma migrate deploy)         (npx prisma migrate deploy)
                      │                                   │
                      └─────────────────┬─────────────────┘
                                        │ (Resolves stable DNS hostname)
                                        ▼
                           minecore-postgres-svc:5432
                                        │
                                        ▼
                             minecore-postgres-0
```

---

## Resource 2 — backend/service.yaml (ClusterIP)

### Purpose
Exposes the backend pods internally within the cluster via a stable virtual IP (ClusterIP).

### Why This Name Matters
The service is named `minecore-backend-svc`. This exactly matches the hostname in `NEXT_PUBLIC_API_URL` within the frontend config:
```
NEXT_PUBLIC_API_URL: "http://minecore-backend-svc:4000"
                      ^^^^^^^^^^^^^^^^^^^^
                      This is the service name
```
If these do not match, the frontend server will fail to resolve the backend service.

---

## Manual Deployment Commands

### Prerequisite: Build and Load Docker Image
Since we are using a local `kind` cluster, you must first build the docker image locally and load it into the cluster:

```bash
# 1. Navigate to the backend directory and build the Docker image
docker build -t minecore-backend:latest ./backend

# 2. Load the image into the kind cluster
kind load docker-image minecore-backend:latest
```

### Apply Manifests

```bash
# 3. Apply the backend deployment
kubectl apply -f k8s/backend/deployment.yaml

# 4. Apply the backend service
kubectl apply -f k8s/backend/service.yaml
```

---

## Verification Commands

### Check Deployment and Pod Status
```bash
# Watch the pods startup (Press Ctrl+C to exit)
kubectl get pods -n minecore -w

# Check deployment status
kubectl get deployments -n minecore

# Check service status
kubectl get service -n minecore

# Check endpoints (should list two backend pod IPs)
kubectl get endpoints minecore-backend-svc -n minecore
```

### Inspect Logs and Details
```bash
# View backend pod logs (substitute with actual pod name)
kubectl logs -n minecore deployment/minecore-backend --tail=100

# View migration logs (shows prisma migration output)
kubectl logs -n minecore deployment/minecore-backend -c backend

# Describe deployment events if startup fails
kubectl describe deployment minecore-backend -n minecore
```

### Test API Internally
```bash
# Forward port 4000 from the backend service to your host
kubectl port-forward svc/minecore-backend-svc -n minecore 4000:4000

# In a separate terminal, test the health check endpoint
curl -i http://localhost:4000/health
```

---

## Expected Outputs

### Pod Startup Sequence
```bash
$ kubectl get pods -n minecore -w
NAME                               READY   STATUS              RESTARTS   AGE
minecore-postgres-0                1/1     Running             0          10m
minecore-backend-7c5fd6d8d-abcde   0/1     ContainerCreating   0          2s
minecore-backend-7c5fd6d8d-fghij   0/1     ContainerCreating   0          2s
minecore-backend-7c5fd6d8d-abcde   0/1     Running             0          5s
minecore-backend-7c5fd6d8d-fghij   0/1     Running             0          5s
minecore-backend-7c5fd6d8d-abcde   1/1     Running             0          18s  ← Ready ✅
minecore-backend-7c5fd6d8d-fghij   1/1     Running             0          20s  ← Ready ✅
```

### Deployment Status
```bash
$ kubectl get deployments -n minecore
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
minecore-backend   2/2     2            2           45s
```

### Service Status
```bash
$ kubectl get service -n minecore
NAME                    TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
minecore-postgres-svc   ClusterIP   10.96.12.34     <none>        5432/TCP   10m
minecore-backend-svc    ClusterIP   10.96.56.78     <none>        4000/TCP   30s
```

### Migration and Boot Logs (Healthy)
```bash
$ kubectl logs -n minecore deployment/minecore-backend --tail=20
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "minecore_db" at "minecore-postgres-svc:5432"

Applying migration "20260609120000_init"
...
The database is now in sync with the migrations.

Server running on port 4000 in production mode
```

---

## Troubleshooting Checklist

### 1. Pods stuck in `ErrImagePull` or `ImagePullBackOff`
- **Cause:** The local kind cluster cannot find the `minecore-backend:latest` image because it was not loaded.
- **Fix:** Run `kind load docker-image minecore-backend:latest` in your host terminal.

### 2. Pods stuck in `CrashLoopBackOff`
- **Cause A: Database connection failure.** Check logs using `kubectl logs deployment/minecore-backend -n minecore`. If you see connection timeout, verify that `minecore-postgres-svc` is running and accepts connections.
- **Cause B: Missing environment variables or secrets.** Verify that the Secret `minecore-app-secret` and ConfigMap `minecore-backend-config` are applied in the `minecore` namespace.

### 3. Health check endpoints failing (Probes failing)
- **Cause A: Port mismatch.** The application listens on port 4000, but probes might be misconfigured. Verify both probes point to port 4000.
- **Cause B: Slow database migrations.** If the migrations take longer than 30 seconds, increase `initialDelaySeconds` on the probes.

---

## Complete State After Objective 3.6
```bash
$ kubectl get all -n minecore
NAME                                   READY   STATUS    RESTARTS   AGE
pod/minecore-postgres-0                1/1     Running   0          12m
pod/minecore-backend-7c5fd6d8d-abcde   1/1     Running   0          3m
pod/minecore-backend-7c5fd6d8d-fghij   1/1     Running   0          3m

NAME                            TYPE        CLUSTER-IP    PORT(S)    AGE
service/minecore-postgres-svc   ClusterIP   10.96.12.34   5432/TCP   12m
service/minecore-backend-svc    ClusterIP   10.96.56.78   4000/TCP   3m

NAME                               READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/minecore-backend   2/2     2            2           3m

NAME                                 READY   AGE
statefulset.apps/minecore-postgres   1/1     12m
```

---

*Document authored for MineCore — Smart Mining Operations Platform*
*Kubernetes Backend Deployment | Objective 3.6*
