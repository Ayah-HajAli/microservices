# Run with Docker

Once the manual setup works (see `01-LOCAL-SETUP.md`), the next step is packaging the same code in Docker containers. One command brings up the entire stack: Postgres, all 4 services, the frontend, and an nginx reverse proxy.

> **Note:** Docker files (`Dockerfile` for each service + `docker-compose.yml`) are built during the course. If those files are not in your project yet, complete the lectures that add them, then come back here.

## Step 0 — Install Docker Desktop (one time)

Download from https://www.docker.com/products/docker-desktop and install.

Verify:
```bash
docker --version
docker compose version
```

Both should print version numbers.

## Step 1 — Clone the project (if you haven't already)

```bash
cd ~/Desktop
git clone <your-repo-url> DevOps_Microservices
cd DevOps_Microservices
```

## Step 2 — Copy the environment templates (one time)

Each service has a `.env.example` with default values for local development. Copy them to `.env` files:

```bash
cd ~/Desktop/DevOps_Microservices

cp services/auth-service/.env.example         services/auth-service/.env
cp services/product-service/.env.example      services/product-service/.env
cp services/order-service/.env.example        services/order-service/.env
cp services/notification-service/.env.example services/notification-service/.env
cp frontend/.env.example                       frontend/.env
```

## Step 3 — Bring up the full stack

```bash
cd ~/Desktop/DevOps_Microservices
docker compose up --build
```

The first time this runs it builds all 6 images (4 services + frontend + nginx). It takes 3–5 minutes. Subsequent runs are much faster because Docker caches the image layers.

You'll see logs from every container streaming in this terminal. Watch for these lines:
```
ecom-auth          | auth-service listening   port: 3001
ecom-product       | product-service listening   port: 3002
ecom-order         | order-service listening   port: 3003
ecom-notification  | notification-service listening   port: 3004
```

When all 4 services say `listening`, the stack is ready.

## Step 4 — Verify everything is running

Open a second terminal:

```bash
docker compose ps
```

Should show 6 containers — `postgres`, `auth-service`, `product-service`, `order-service`, `notification-service`, `frontend`, `nginx` — all `Up` or `Up (healthy)`.

Health checks through nginx:
```bash
curl http://localhost:8080/healthz
curl http://localhost:8080/api/auth/health/live
curl http://localhost:8080/api/products/health/live
curl http://localhost:8080/api/orders/health/live
curl http://localhost:8080/api/notifications/health/live
```

All should return `{"status":"ok"}` or `ok`.

Then open **http://localhost:8080** in the browser:
1. Click **Sign up**, register a user (password ≥ 8 characters)
2. Browse the 9 seeded products
3. Click a product, add to cart
4. Checkout — fill in the address form, place the order
5. Check `/orders` to see your order
6. In the terminal: `docker compose logs notification-service` should show a `[MAIL LOG]` line for the order event

If that full flow works, the Docker stack is working.

## Step 5 — Daily commands

**Stream logs from one service**
```bash
docker compose logs -f auth-service
```

**Stream all logs**
```bash
docker compose logs -f
```

**Stop the stack (keeps data)**
```bash
docker compose down
```

**Stop and wipe Postgres data (full reset)**
```bash
docker compose down -v
```

**Rebuild after a Dockerfile change**
```bash
docker compose up --build
```

**Get a shell inside a running container**
```bash
docker compose exec auth-service sh
docker compose exec postgres psql -U ecommerce -d ecommerce
```

## Why this is different from the manual setup

| Aspect | Manual (5 tabs) | Docker (1 command) |
|--------|-----------------|---------------------|
| URL in browser | http://localhost:5173 (Vite) | http://localhost:8080 (Nginx) |
| What routes API calls | Vite dev proxy | Nginx reverse proxy (the real thing) |
| How services find each other | `localhost:3002` | `product-service:3002` (Docker DNS) |
| How Postgres is installed | `brew install postgresql` | `image: postgres:15-alpine` in compose |
| Number of terminals to manage | 5 + Postgres | 1 |
| Time to start the stack | ~10 min one-time install + manual starts | 1 command, ~30 seconds on warm cache |
| Reproducible across machines | Depends on host config | Identical on every machine |

The Docker stack is what production will look like. The manual setup is what you used to prove the code works.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `docker: command not found` | Install Docker Desktop |
| `Cannot connect to the Docker daemon` | Start Docker Desktop |
| Port 8080 already in use | `lsof -i :8080` then `kill -9 <PID>` |
| Postgres unhealthy on first up | Wait 20 seconds for the healthcheck, retry. Or `docker compose down -v && docker compose up --build` |
| `relation "schema_migrations" does not exist` | `docker compose down -v && docker compose up --build` for a clean start |
| ECR/network errors building images | Check internet connection. Retry. |
| Containers running but app empty | Postgres may have started before services migrated. `docker compose restart auth-service product-service order-service notification-service` |
