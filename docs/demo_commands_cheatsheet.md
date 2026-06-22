# MineCore Live Demonstration Cheat Sheet

Copy-paste these commands in sequence during your presentation to demonstrate the entire stack and DevOps ecosystem.

---

## 🚀 Step 1: Pre-Flight & Bootstrapping

Ensure **Docker Desktop** is open, then run these setup checks:

```bash
# 1. Verify your active Kubernetes cluster context is Kind
kubectl config use-context kind-kind

# 2. Check cluster node status
kubectl get nodes -o wide

# 3. Clean up host port conflicts (Brew PostgreSQL & Node)
brew services stop postgresql@17 || true
pkill -f "node" || true
```

---

## 🐳 Step 2: The Core Website Demo (Docker Compose)

Demonstrate the application running cleanly via Docker Compose:

```bash
# 1. Build and launch the stack in the background
docker compose up -d --build

# 2. Confirm all containers are running
docker compose ps

# 3. Seed the PostgreSQL database from the host terminal
DATABASE_URL="postgresql://minecore_user:minecore_password@localhost:5432/minecore_db?schema=public" npm --prefix backend run db:seed
```
* **Demo URL:** Open **[http://localhost:3000](http://localhost:3000)** (Login: `admin@minecore.com` / `MineCore@2024`). Show dashboard analytics and perform a CRUD operation under **Equipment**.
* **Shutdown Compose:** Once done, bring down Compose to free up local ports:
  ```bash
  docker compose down -v
  ```

---

## 🛠️ Step 3: Infrastructure as Code (Terraform)

Demonstrate namespace and quota limit provisioning:

```bash
# 1. Navigate to the terraform folder
cd terraform

# 2. Initialize and verify planned resources
terraform init
terraform plan

# 3. Apply the infrastructure configurations
terraform apply -auto-approve

# 4. View provisioned namespace and limits
kubectl get namespaces
kubectl describe quota production-resource-limits -n minecore-prod

# 5. Return to the root folder
cd ..
```

---

## ☸️ Step 4: Production Deployment in Kubernetes

Apply your manifests and launch the Kubernetes cluster resources:

```bash
# 1. Apply namespace, persistent storage, secrets, and DB StatefulSet
kubectl apply -f k8s/base/
kubectl apply -f k8s/postgres/

# 2. Monitor PostgreSQL database pod initialization (Wait for Running state)
kubectl get pods -n minecore -w

# 3. Apply Backend, Frontend, and Ingress routing rules
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/ingress/

# 4. Verify all pods are running and healthy
kubectl get pods -n minecore

# 5. Run migrations check in the Kubernetes backend container
kubectl exec -it $(kubectl get pods -n minecore -l app.kubernetes.io/name=backend -o jsonpath='{.items[0].metadata.name}') -n minecore -- npx prisma migrate status
```
* **Demo URL:** Open **[http://localhost/](http://localhost/)** to access the site routed through the Ingress controller.

---

## 📊 Step 5: DevOps Tooling & Port-Forwards

Start port-forwards in separate terminal tabs to demonstrate the ecosystem dashboard UIs:

### Tab A: GitOps (ArgoCD)
```bash
# Port-forward ArgoCD API Server
kubectl port-forward svc/argocd-server -n argocd 8443:443
```
* **URL:** [https://localhost:8443](https://localhost:8443) (Show the sync tree for `minecore-app`)

### Tab B: Secrets Management (HashiCorp Vault)
```bash
# Port-forward Vault service
kubectl port-forward svc/vault-svc 8200:8200 -n minecore
```
* **URL:** [http://localhost:8200](http://localhost:8200) (Token: `minecore-vault-token`)

### Tab C: Metrics Observability (Grafana)
```bash
# Port-forward Grafana service
kubectl port-forward svc/grafana-svc 3001:3000 -n minecore
```
* **URL:** [http://localhost:3001](http://localhost:3001) (Credentials: `admin`/`admin`)

---

## 🔄 Step 6: GitOps Drift Detection & Self-Healing (Live Action)

Demonstrate self-healing in ArgoCD live:

```bash
# 1. Manually delete the frontend service from Kubernetes
kubectl delete service minecore-frontend-svc -n minecore

# 2. Watch ArgoCD detect the deletion, sync drift, and recreate the service
# (Or look at the ArgoCD dashboard at https://localhost:8443)
kubectl get svc -n minecore -w
```

---

## 💾 Step 7: Disaster Recovery (Postgres Backup & Restore)

Demonstrate data resilience and pg_dump/psql restoration:

```bash
# 1. Take a logical SQL backup dump of the database state
kubectl exec -i minecore-postgres-0 -n minecore -- sh -c 'export PGPASSWORD=$POSTGRES_PASSWORD && pg_dump -U $POSTGRES_USER $POSTGRES_DB' > minecore_postgres_backup.sql

# 2. Drop the tables or clear the database (Simulating corruption)
kubectl exec -it minecore-postgres-0 -n minecore -- psql -U minecore_user -d minecore_db -c "DROP TABLE IF EXISTS \"User\", \"Equipment\", \"Vehicle\", \"Sensor\", \"SensorReading\", \"SafetyAlert\", \"MaintenanceRecord\", \"_PrismaMigrations\" CASCADE;"

# 3. Confirm tables are gone (Should output zero relations)
kubectl exec -it minecore-postgres-0 -n minecore -- psql -U minecore_user -d minecore_db -c "\dt"

# 4. Copy the SQL backup into the PostgreSQL container
kubectl cp minecore_postgres_backup.sql minecore-postgres-0:/tmp/backup.sql -n minecore

# 5. Restore the database from the backup file
kubectl exec -i minecore-postgres-0 -n minecore -- sh -c 'export PGPASSWORD=$POSTGRES_PASSWORD && psql -U $POSTGRES_USER -d $POSTGRES_DB -f /tmp/backup.sql'

# 6. Verify relations are successfully restored
kubectl exec -it minecore-postgres-0 -n minecore -- psql -U minecore_user -d minecore_db -c "\dt"
```
