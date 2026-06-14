# MineCore — Kubernetes Repository Structure
> **Objective 3.2 — Repository Structure Design**
> Status: `APPROVED` | Version: `1.0.0` | Date: `2026-06-15`

---

## 1. Complete Folder Structure

```
mining-core/
└── k8s/
    │
    ├── namespace.yaml                      ← Apply Order #1
    │
    ├── secrets/
    │   └── app-secret.yaml                 ← Apply Order #2  ⚠️ .gitignored
    │
    ├── configmaps/
    │   └── app-config.yaml                 ← Apply Order #3
    │
    ├── storage/
    │   ├── postgres-pv.yaml                ← Apply Order #4
    │   └── postgres-pvc.yaml               ← Apply Order #5
    │
    ├── postgres/
    │   ├── deployment.yaml                 ← Apply Order #6
    │   └── service.yaml                    ← Apply Order #7
    │
    ├── backend/
    │   ├── deployment.yaml                 ← Apply Order #8
    │   └── backend-service.yaml            ← Apply Order #9
    │
    ├── frontend/
    │   ├── deployment.yaml                 ← Apply Order #10
    │   └── service.yaml                    ← Apply Order #11
    │
    └── ingress/
        └── ingress.yaml                    ← Apply Order #12
```

**Total:** 12 YAML files across 7 directories.

---

## 2. Purpose of Every File

### `namespace.yaml`
| Property | Value |
|---|---|
| **K8s Kind** | `Namespace` |
| **Name** | `minecore` |
| **Purpose** | Creates the isolated namespace that contains every MineCore workload. All subsequent files are scoped to this namespace via `namespace: minecore`. |
| **Why needed** | Without a dedicated namespace, all resources land in `default` — making cleanup, RBAC, and resource scoping difficult. |

---

### `secrets/app-secret.yaml`
| Property | Value |
|---|---|
| **K8s Kind** | `Secret` (type: `Opaque`) |
| **Name** | `minecore-app-secret` |
| **Purpose** | Stores all sensitive runtime credentials as base64-encoded key-value pairs |
| **Keys stored** | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` |
| **Consumed by** | `postgres/deployment.yaml` (DB init vars), `backend/deployment.yaml` (DB URL + JWT keys) |
| **⚠️ Git** | Added to `.gitignore` — never committed with real values |

---

### `configmaps/app-config.yaml`
| Property | Value |
|---|---|
| **K8s Kind** | `ConfigMap` |
| **Name** | `minecore-app-config` |
| **Purpose** | Stores all non-sensitive configuration that is safe to commit to Git |
| **Backend keys** | `NODE_ENV`, `PORT=4000`, `API_VERSION=v1`, `CORS_ORIGIN`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `JWT_ACCESS_EXPIRES_IN=24h`, `JWT_REFRESH_EXPIRES_IN=7d` |
| **Frontend keys** | `NEXT_PUBLIC_API_URL=http://minecore-backend-svc:4000`, `PORT=3000`, `HOSTNAME=0.0.0.0` |
| **Consumed by** | `backend/deployment.yaml`, `frontend/deployment.yaml` |

---

### `storage/postgres-pv.yaml`
| Property | Value |
|---|---|
| **K8s Kind** | `PersistentVolume` |
| **Name** | `minecore-postgres-pv` |
| **Capacity** | `5Gi` |
| **Access Mode** | `ReadWriteOnce` |
| **StorageClass** | `standard` (kind default, hostPath provisioner) |
| **Host Path** | `/mnt/data/minecore-postgres` (on the kind node) |
| **Purpose** | Declares the physical storage location. PVC must claim this before postgres can start. |

---

### `storage/postgres-pvc.yaml`
| Property | Value |
|---|---|
| **K8s Kind** | `PersistentVolumeClaim` |
| **Name** | `minecore-postgres-pvc` |
| **Namespace** | `minecore` |
| **Requests** | `5Gi` |
| **Access Mode** | `ReadWriteOnce` |
| **Binds to** | `minecore-postgres-pv` |
| **Mount path** | `/var/lib/postgresql/data` inside postgres pod |
| **Purpose** | Claims storage from the PV. Postgres pod won't start until this claim is bound. |

---

### `postgres/deployment.yaml`
| Property | Value |
|---|---|
| **K8s Kind** | `StatefulSet` |
| **Name** | `minecore-postgres` |
| **Image** | `postgres:15-alpine` |
| **Replicas** | `1` |
| **Port** | `5432` |
| **Env from** | `app-secret` (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB) |
| **Volume mount** | PVC `minecore-postgres-pvc` → `/var/lib/postgresql/data` |
| **Resources** | CPU: 250m–1000m, Memory: 512Mi–1Gi |
| **Purpose** | Runs the PostgreSQL database. Uses StatefulSet (not Deployment) to guarantee stable pod identity and persistent storage binding. |

---

### `postgres/service.yaml`
| Property | Value |
|---|---|
| **K8s Kind** | `Service` |
| **Name** | `minecore-postgres-svc` |
| **Type** | `ClusterIP` |
| **Port** | `5432` |
| **DNS** | `minecore-postgres-svc.minecore.svc.cluster.local` |
| **Selector** | `app.kubernetes.io/name: postgres` |
| **Purpose** | Creates a stable internal DNS name for postgres. Backend's `DATABASE_URL` points here. Never exposed externally. |

---

### `backend/deployment.yaml`
| Property | Value |
|---|---|
| **K8s Kind** | `Deployment` |
| **Name** | `minecore-backend` |
| **Image** | `minecore-backend:latest` |
| **Replicas** | `1` |
| **Port** | `4000` |
| **Env from** | `app-secret` (DATABASE_URL, JWT keys) + `app-config` (NODE_ENV, PORT, etc.) |
| **Start command** | `npx prisma migrate deploy && node dist/server.js` |
| **Resources** | CPU: 100m–500m, Memory: 256Mi–512Mi |
| **Probes** | Liveness + Readiness → `GET /api/v1/health` |
| **Purpose** | Runs the Express.js REST API. Stateless — can be scaled horizontally. Runs migrations on every startup. |

---

### `backend/service.yaml`
| Property | Value |
|---|---|
| **K8s Kind** | `Service` |
| **Name** | `minecore-backend-svc` |
| **Type** | `ClusterIP` |
| **Port** | `4000` |
| **DNS** | `minecore-backend-svc.minecore.svc.cluster.local` |
| **Selector** | `app.kubernetes.io/name: backend` |
| **Purpose** | Creates stable internal DNS for the backend API. Frontend's `NEXT_PUBLIC_API_URL` and Ingress `/api/*` route point here. |

---

### `frontend/deployment.yaml`
| Property | Value |
|---|---|
| **K8s Kind** | `Deployment` |
| **Name** | `minecore-frontend` |
| **Image** | `minecore-frontend:latest` |
| **Replicas** | `1` |
| **Port** | `3000` |
| **Env from** | `app-config` (NEXT_PUBLIC_API_URL, PORT, HOSTNAME) |
| **Resources** | CPU: 100m–500m, Memory: 256Mi–512Mi |
| **Probes** | Liveness + Readiness → `GET /` |
| **Purpose** | Runs Next.js standalone server. Stateless — connects to backend via ClusterIP DNS. |

---

### `frontend/service.yaml`
| Property | Value |
|---|---|
| **K8s Kind** | `Service` |
| **Name** | `minecore-frontend-svc` |
| **Type** | `NodePort` |
| **Port** | `3000` (container) → `30000` (node) |
| **Selector** | `app.kubernetes.io/name: frontend` |
| **Purpose** | Exposes the Next.js app to the browser at `http://localhost:30000`. Also acts as Ingress backend target for `/`. |

---

### `ingress/ingress.yaml`
| Property | Value |
|---|---|
| **K8s Kind** | `Ingress` |
| **Name** | `minecore-ingress` |
| **Class** | `nginx` |
| **Host** | `localhost` |
| **Rules** | `/api/*` → `minecore-backend-svc:4000`  /  `/*` → `minecore-frontend-svc:3000` |
| **Prerequisite** | nginx IngressController must be installed in cluster first |
| **Purpose** | Unified entry point on port 80. Routes browser requests to the correct service based on URL path. Optional for dev (NodePort works), required for production-like setup. |

---

## 3. Deployment Order

### Apply in This Exact Sequence

```
#  Step    File                              Why This Order
─────────────────────────────────────────────────────────────────────────
#1        namespace.yaml                    All other resources need namespace first
#2        secrets/app-secret.yaml           Postgres + backend read this at startup
#3        configmaps/app-config.yaml        Backend + frontend read this at startup
#4        storage/postgres-pv.yaml          PVC cannot bind until PV exists
#5        storage/postgres-pvc.yaml         StatefulSet won't schedule until PVC binds
#6        postgres/deployment.yaml          DB must be running before backend starts
#7        postgres/service.yaml             Backend DNS lookup needs this service
#8        backend/deployment.yaml           Migrations run against postgres at startup
#9        backend/service.yaml              Frontend DNS lookup needs this service
#10       frontend/deployment.yaml          Connects to backend via its service
#11       frontend/service.yaml             Exposes app to browser (NodePort 30000)
#12       ingress/ingress.yaml              Last — needs all services to exist first
─────────────────────────────────────────────────────────────────────────
```

### Apply Commands (Folder by Folder)

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/storage/
kubectl apply -f k8s/postgres/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/ingress/
```

---

## 4. Dependency Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       APPLY DEPENDENCY GRAPH                                │
│                                                                             │
│   namespace.yaml                                                            │
│        │                                                                    │
│        ▼  (all below live inside 'minecore' namespace)                      │
│                                                                             │
│   ┌─────────────────────────────────────────────┐                          │
│   │  secrets/app-secret.yaml                    │                          │
│   │  configmaps/app-config.yaml                 │                          │
│   └──────────────┬──────────────────────────────┘                          │
│                  │                                                          │
│                  ▼                                                          │
│   storage/postgres-pv.yaml                                                  │
│        │                                                                    │
│        ▼                                                                    │
│   storage/postgres-pvc.yaml                                                 │
│        │                                                                    │
│        ▼                                                                    │
│   postgres/deployment.yaml ────────── (reads: app-secret, PVC)             │
│        │                                                                    │
│        ▼                                                                    │
│   postgres/service.yaml                                                     │
│        │  (DNS: minecore-postgres-svc:5432)                                 │
│        │                                                                    │
│        ▼                                                                    │
│   backend/deployment.yaml ─────────── (reads: app-secret, app-config)      │
│        │                              (connects to: minecore-postgres-svc)  │
│        │                              (runs: prisma migrate deploy)         │
│        ▼                                                                    │
│   backend/service.yaml                                                      │
│        │  (DNS: minecore-backend-svc:4000)                                  │
│        │                                                                    │
│        ▼                                                                    │
│   frontend/deployment.yaml ────────── (reads: app-config)                  │
│        │                              (connects to: minecore-backend-svc)   │
│        ▼                                                                    │
│   frontend/service.yaml                                                     │
│        │  (NodePort 30000 → browser)                                        │
│        │                                                                    │
│        ▼                                                                    │
│   ingress/ingress.yaml ─────────────── (routes to: frontend + backend svc) │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Runtime Communication Diagram

```
Browser
  │
  │  http://localhost:30000  (NodePort) or http://localhost (Ingress)
  │
  ▼
┌────────────────────────────────────────────────────────────────────┐
│                    Namespace: minecore                             │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  frontend-deployment (Next.js :3000)                         │  │
│  │  ← reads: app-config (NEXT_PUBLIC_API_URL)                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                          │                                         │
│                          │  HTTP → minecore-backend-svc:4000       │
│                          ▼                                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  backend-deployment (Express :4000)                          │  │
│  │  ← reads: app-secret (DATABASE_URL, JWT_*)                   │  │
│  │  ← reads: app-config (NODE_ENV, PORT, CORS_ORIGIN, etc.)    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                          │                                         │
│                          │  TCP → minecore-postgres-svc:5432       │
│                          ▼                                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  postgres-statefulset (PostgreSQL :5432)                     │  │
│  │  ← reads: app-secret (POSTGRES_USER, PASSWORD, DB)           │  │
│  │  ← mounts: minecore-postgres-pvc → /var/lib/postgresql/data  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                          │                                         │
│                          │  hostPath volume                        │
│                          ▼                                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  PersistentVolumeClaim: minecore-postgres-pvc (5Gi)          │  │
│  │  ← bound to: minecore-postgres-pv                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 5. .gitignore Addition

Add this to the root `.gitignore` to prevent secrets from being committed:

```gitignore
# Kubernetes Secrets — NEVER commit
k8s/secrets/app-secret.yaml
```

---

## 6. What's Next — Objective 3.3

Once this structure is approved, Objective 3.3 will fill in the actual YAML content for all 12 files in this exact order:

| Priority | File | Complexity |
|---|---|---|
| 1 | `namespace.yaml` | Simple |
| 2 | `secrets/app-secret.yaml` | Simple (base64 values) |
| 3 | `configmaps/app-config.yaml` | Simple |
| 4 | `storage/postgres-pv.yaml` | Medium |
| 5 | `storage/postgres-pvc.yaml` | Simple |
| 6 | `postgres/deployment.yaml` | Medium (StatefulSet) |
| 7 | `postgres/service.yaml` | Simple |
| 8 | `backend/deployment.yaml` | Complex (probes, initContainer) |
| 9 | `backend/service.yaml` | Simple |
| 10 | `frontend/deployment.yaml` | Medium (probes) |
| 11 | `frontend/service.yaml` | Simple |
| 12 | `ingress/ingress.yaml` | Medium (path rules) |

---

*Document authored for MineCore — Smart Mining Operations Platform*
*Kubernetes Repository Structure | Objective 3.2*
