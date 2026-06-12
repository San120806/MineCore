# MineCore — Smart Mining Operations Platform

Welcome to the **MineCore** repository! MineCore is an enterprise-grade full-stack operations command center designed for monitoring heavy fleet activities, IoT sensor readings, equipment health, safety alerts, and maintenance logs in mining operations.

---

## 📁 Repository Directory Structure

This repository is organized as a monorepo containing the following components:

```text
minecore/
├── frontend/          # Next.js 16 (App Router) client application
├── backend/           # Node.js + Express.js + Prisma API server
├── database/          # SQL scripts, volume mappings or schema notes
│   └── .gitkeep
├── docker/            # Docker helper and configuration scripts
│   └── .gitkeep
├── docs/              # System architecture & guidelines
│   ├── docker_architecture.md
│   ├── git_strategy.md
│   └── verification.md
├── docker-compose.yml # Docker Compose orchestration file
└── .gitignore         # Root-level ignore configurations
```

---

## 🚀 Getting Started (Quick Start)

To spin up the entire application stack (Next.js client, Express API, PostgreSQL database) running inside Docker containers:

1. **Stop local port bindings** (Postgres/Node) to avoid allocation conflicts.
2. **Start the containers**:
   ```bash
   docker compose up -d --build
   ```
3. **Seed the database** from your host terminal:
   ```bash
   DATABASE_URL="postgresql://minecore_user:minecore_password@localhost:5432/minecore_db?schema=public" npm --prefix backend run db:seed
   ```
4. **Log in**:
   Visit [http://localhost:3000](http://localhost:3000) and use:
   - **Email**: `admin@minecore.com`
   - **Password**: `MineCore@2024`

---

## 📖 System Guides & Documentation

For in-depth details on DevOps workflows and guidelines, refer to the following documents inside the `docs/` folder:

- [Git Branching & Versioning Strategy](file:///Users/saniyakapure/Desktop/mining-core/docs/git_strategy.md) — Git workflows, branch conventions, Conventional Commits, and releases.
- [Container Architecture & Orchestration](file:///Users/saniyakapure/Desktop/mining-core/docs/docker_architecture.md) — Multi-stage Alpine builds, Next.js standalone optimization, networking, and volumes.
- [Deployment & Verification Guide](file:///Users/saniyakapure/Desktop/mining-core/docs/verification.md) — Prerequisites, manual steps, seeding, and verification checklists.
