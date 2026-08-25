# Run Locally (without Docker)

This is the manual setup — run each service directly with Node and connect to a local Postgres. Use this first to confirm the code works on your machine before we add Docker.

> **Windows users:** the easiest path is to use **Git Bash** (installed with Git for Windows) for all the commands below. It supports the same syntax as macOS/Linux. If you prefer PowerShell, watch for the **Windows (PowerShell)** notes in each step.

## Step 0 — Install prerequisites (one time)

### macOS
```bash
brew install node@20 postgresql@15
brew services start postgresql@15
```

### Ubuntu / WSL2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql-15
sudo service postgresql start
```

### Windows (native, not WSL)

Install each of these from their official installer:

1. **Node.js 20 LTS** — https://nodejs.org/en/download/  (download the Windows Installer `.msi`, accept all defaults, including "Add to PATH")
2. **PostgreSQL 15** — https://www.postgresql.org/download/windows/  (use the EDB installer; **write down the password you set for the `postgres` superuser** — you'll need it in Step 1; install pgAdmin too when prompted, it's useful)
3. **Git for Windows** — https://git-scm.com/download/win  (this also installs **Git Bash** which lets you run the macOS/Linux-style commands)

After installing PostgreSQL, the service starts automatically. Confirm in **Services** (`services.msc`) — look for `postgresql-x64-15` set to `Running` and `Automatic`.

Add PostgreSQL's `bin` folder to PATH so `psql` works from any terminal:
- Open **System Properties → Environment Variables → Path → Edit → New**
- Add: `C:\Program Files\PostgreSQL\15\bin`
- Click OK, restart your terminal

### Verify (all platforms)
```bash
node --version    # v20.x
psql --version    # psql 15.x
git --version
```

## Step 1 — Create the database (one time)

### macOS / Linux / Git Bash on Windows
```bash
psql postgres <<'EOF'
CREATE USER ecommerce WITH PASSWORD 'devpassword' SUPERUSER;
CREATE DATABASE ecommerce OWNER ecommerce;
EOF
```

### Windows (PowerShell)
```powershell
# When prompted, enter the postgres superuser password you set during install
psql -U postgres -c "CREATE USER ecommerce WITH PASSWORD 'devpassword' SUPERUSER;"
psql -U postgres -c "CREATE DATABASE ecommerce OWNER ecommerce;"
```

### Windows (pgAdmin alternative)
If `psql` isn't on your PATH, you can also open **pgAdmin** (installed with PostgreSQL):
1. Connect to your local server
2. Right-click **Login/Group Roles → Create → Login/Group Role**
   - General: Name `ecommerce`
   - Definition: Password `devpassword`
   - Privileges: enable **Superuser**
3. Right-click **Databases → Create → Database**
   - Database: `ecommerce`
   - Owner: `ecommerce`

### Verify the connection works (all platforms)
```bash
psql -U ecommerce -d ecommerce -c "SELECT 1;"
# Should print:  ?column?
#                ----------
#                        1
```

## Step 2 — Clone the project

### macOS / Linux / Git Bash on Windows
```bash
cd ~/Desktop
git clone <your-repo-url> DevOps_Microservices
cd DevOps_Microservices
```

### Windows (PowerShell)
```powershell
cd $env:USERPROFILE\Desktop
git clone <your-repo-url> DevOps_Microservices
cd DevOps_Microservices
```

## Step 3 — Install dependencies (one time, ~3 minutes)

### macOS / Linux / Git Bash on Windows
```bash
cd ~/Desktop/DevOps_Microservices

for s in auth-service product-service order-service notification-service; do
  (cd services/$s && npm install)
done

(cd frontend && npm install)
```

### Windows (PowerShell)
```powershell
cd $env:USERPROFILE\Desktop\DevOps_Microservices

foreach ($s in "auth-service","product-service","order-service","notification-service") {
  Push-Location "services\$s"
  npm install
  Pop-Location
}

Push-Location frontend
npm install
Pop-Location
```

## Step 4 — Start the 5 services

Open **5 separate terminal tabs/windows** (Cmd+T on Mac, Ctrl+Shift+T on Linux, Ctrl+Shift+T or new Windows Terminal tab on Windows). Each tab runs one process. Keep all five tabs open and running.

### macOS / Linux / Git Bash on Windows

#### Tab 1 — auth-service (port 3001)
```bash
cd ~/Desktop/DevOps_Microservices/services/auth-service && \
DB_HOST=localhost DB_USER=ecommerce DB_PASSWORD=devpassword DB_NAME=ecommerce \
JWT_SECRET=dev-secret PORT=3001 \
npm start
```

#### Tab 2 — product-service (port 3002)
```bash
cd ~/Desktop/DevOps_Microservices/services/product-service && \
DB_HOST=localhost DB_USER=ecommerce DB_PASSWORD=devpassword DB_NAME=ecommerce \
JWT_SECRET=dev-secret PORT=3002 SEED_ON_BOOT=true \
npm start
```

#### Tab 3 — order-service (port 3003)
```bash
cd ~/Desktop/DevOps_Microservices/services/order-service && \
DB_HOST=localhost DB_USER=ecommerce DB_PASSWORD=devpassword DB_NAME=ecommerce \
JWT_SECRET=dev-secret PORT=3003 \
PRODUCT_SERVICE_URL=http://localhost:3002 \
NOTIFICATION_SERVICE_URL=http://localhost:3004 \
npm start
```

#### Tab 4 — notification-service (port 3004)
```bash
cd ~/Desktop/DevOps_Microservices/services/notification-service && \
DB_HOST=localhost DB_USER=ecommerce DB_PASSWORD=devpassword DB_NAME=ecommerce \
JWT_SECRET=dev-secret PORT=3004 \
npm start
```

#### Tab 5 — frontend (port 5173)
```bash
cd ~/Desktop/DevOps_Microservices/frontend && npm run dev
```

### Windows (PowerShell)

PowerShell uses different syntax for setting environment variables. Use these commands instead:

#### Tab 1 — auth-service (port 3001)
```powershell
cd $env:USERPROFILE\Desktop\DevOps_Microservices\services\auth-service
$env:DB_HOST="localhost"; $env:DB_USER="ecommerce"; $env:DB_PASSWORD="devpassword"; $env:DB_NAME="ecommerce"; $env:JWT_SECRET="dev-secret"; $env:PORT="3001"
npm start
```

#### Tab 2 — product-service (port 3002)
```powershell
cd $env:USERPROFILE\Desktop\DevOps_Microservices\services\product-service
$env:DB_HOST="localhost"; $env:DB_USER="ecommerce"; $env:DB_PASSWORD="devpassword"; $env:DB_NAME="ecommerce"; $env:JWT_SECRET="dev-secret"; $env:PORT="3002"; $env:SEED_ON_BOOT="true"
npm start
```

#### Tab 3 — order-service (port 3003)
```powershell
cd $env:USERPROFILE\Desktop\DevOps_Microservices\services\order-service
$env:DB_HOST="localhost"; $env:DB_USER="ecommerce"; $env:DB_PASSWORD="devpassword"; $env:DB_NAME="ecommerce"; $env:JWT_SECRET="dev-secret"; $env:PORT="3003"; $env:PRODUCT_SERVICE_URL="http://localhost:3002"; $env:NOTIFICATION_SERVICE_URL="http://localhost:3004"
npm start
```

#### Tab 4 — notification-service (port 3004)
```powershell
cd $env:USERPROFILE\Desktop\DevOps_Microservices\services\notification-service
$env:DB_HOST="localhost"; $env:DB_USER="ecommerce"; $env:DB_PASSWORD="devpassword"; $env:DB_NAME="ecommerce"; $env:JWT_SECRET="dev-secret"; $env:PORT="3004"
npm start
```

#### Tab 5 — frontend (port 5173)
```powershell
cd $env:USERPROFILE\Desktop\DevOps_Microservices\frontend
npm run dev
```

## Step 5 — Verify everything is running

Open a 6th tab and run:

```bash
curl http://localhost:3001/health/live
curl http://localhost:3002/health/live
curl http://localhost:3003/health/live
curl http://localhost:3004/health/live
```

All four should print `{"status":"ok"}`.

Then open **http://localhost:5173** in the browser:
1. Click **Sign up**, register a user (password must be at least 8 characters)
2. Browse the 9 seeded products
3. Click a product, add 1 to cart
4. Go to **Cart** → **Checkout**, fill in the shipping form, place the order
5. Go to **Orders** to see the order
6. Check Tab 4 (notification-service) — you'll see a `[MAIL LOG]` line proving the order event fired

If you can complete that full flow, your local setup is working.

## Step 6 — Stop everything when done

In each of the 5 terminal tabs: **Ctrl + C**.

Postgres can keep running (it's harmless) or stop it:
```bash
# macOS
brew services stop postgresql@15

# Linux
sudo service postgresql stop
```

```powershell
# Windows (PowerShell, as Administrator)
net stop postgresql-x64-15
# Or from the Services app: stop "postgresql-x64-15"
```

## Step 7 — Reset the database (if needed)

If anything goes wrong (migrations got corrupted, want a clean slate, etc.):

```bash
psql postgres <<'EOF'
DROP DATABASE IF EXISTS ecommerce;
CREATE DATABASE ecommerce OWNER ecommerce;
EOF
```

Then restart the 5 services. Migrations and product seeding run on boot.

## Troubleshooting

| Problem                                       | macOS Fix                                                                                       | Linux Fix                                                                                       | Windows Fix                                                                                     |                                            |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `psql: command not found`                     | `echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc` | Install Postgres client: `sudo apt install postgresql-client` then verify with `psql --version` | Add PostgreSQL `bin` folder to PATH. Example: `C:\Program Files\PostgreSQL\15\bin`              |                                            |
| `ECONNREFUSED 127.0.0.1:5432`                 | Postgres not running: `brew services start postgresql@15`                                       | `sudo service postgresql start` or `sudo systemctl start postgresql`                            | Start PostgreSQL service from **Services** or run: `net start postgresql-x64-15`                |                                            |
| `password authentication failed`              | Wrong DB username/password. Re-run Step 1                                                       | Wrong DB username/password. Re-run Step 1                                                       | Wrong DB username/password. Re-run Step 1                                                       |                                            |
| `Port 3001 already in use`                    | `lsof -i :3001` then `kill -9 <PID>`                                                            | `sudo lsof -i :3001` then `kill -9 <PID>`                                                       | `netstat -ano                                                                                   | findstr :3001`then`taskkill /PID <PID> /F` |
| `relation "schema_migrations" does not exist` | Run Step 7 to reset the DB                                                                      | Run Step 7 to reset the DB                                                                      | Run Step 7 to reset the DB                                                                      |                                            |
| Sign up returns `"Register failed"`           | Open browser DevTools → Network → inspect the API response for the actual error                 | Open browser DevTools → Network → inspect the API response for the actual error                 | Open browser DevTools → Network → inspect the API response for the actual error                 |                                            |
| Products page is empty                        | Tab 2 didn’t run with `SEED_ON_BOOT=true`. Reset DB (Step 7) and restart Tab 2 with the env var | Tab 2 didn’t run with `SEED_ON_BOOT=true`. Reset DB (Step 7) and restart Tab 2 with the env var | Tab 2 didn’t run with `SEED_ON_BOOT=true`. Reset DB (Step 7) and restart Tab 2 with the env var |                                            |


## What's next

Once this manual flow works, you're ready for the next step — packaging the same services with Docker. See `02-DOCKER-SETUP.md`.
