# MineCore Docker Deployment & Verification Guide

Follow these steps to launch, seed, and verify the containerized MineCore stack on your local machine.

---

## 1. Prerequisites & Host Port Conflicts

Docker Compose maps containers to host ports `3000` (Frontend), `4000` (Backend), and `5432` (PostgreSQL). To avoid allocation conflicts, ensure any local services running on these ports are stopped:

- **Stop local PostgreSQL**:
  ```bash
  brew services stop postgresql@17
  ```
- **Stop local Node servers**:
  Terminate any running npm/nodemon instances, or forcefully release Node port bindings:
  ```bash
  pkill -f "node"
  ```

---

## 2. Launching the Stack

Run the following command at the root of the workspace to build the custom images and start the services in detached mode:

```bash
docker compose up -d --build
```

### Check Container Status
Verify that all containers are running successfully:
```bash
docker compose ps
```
- `minecore-frontend` -> Listening on `http://localhost:3000`
- `minecore-backend` -> Listening on `http://localhost:4000`
- `minecore-postgres` -> Listening on `http://localhost:5432`

---

## 3. Database Seeding

Because the production backend container runs with optimized, minimal production packages, run the seed script directly from your host machine targeting the containerized database (which exposes port `5432` to the host):

```bash
DATABASE_URL="postgresql://minecore_user:minecore_password@localhost:5432/minecore_db?schema=public" npm --prefix backend run db:seed
```

### Expected Output
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

---

## 4. Validation Checklist

### ✔ Container Connectivity
- Open your web browser and navigate to `http://localhost:3000`.
- Log in using the seeded administrator credentials:
  - **Email**: `admin@minecore.com`
  - **Password**: `MineCore@2024`

### ✔ Metrics & Visualizations
- Verify that the **KPI Cards** load real data (5 mining sites, 50 vehicles, 100 sensors, etc.).
- Confirm that the **Analytics charts** (Vehicle Status distribution, Sensor types, and Alert trends) render data correctly using Recharts.

### ✔ CRUD Functionality
- Go to the **Equipment** page.
- Click **Add Equipment**, fill in the form, and save.
- Confirm the new equipment is successfully written to the database and appears in the table.
