# Khaja Agro Farm — Safe Production Deployment & Database Migration Guide

This guide details how to safely deploy **Khaja Agro Farm** to [Railway](https://railway.com) and transfer your **existing, live SQLite database** (`data/khaja_agro.db`) onto Railway's persistent storage volume so that 100% of your products, variations, orders, customers, and admin accounts are preserved intact.

---

## 🛡️ Pre-Flight Security & Safety Checklist

- [x] **Zero Secrets in Code:** `.gitignore` and `.dockerignore` prevent all `.env*` files, database files (`*.db`, `*-wal`, `*-shm`), and local backups from ever reaching GitHub or Docker image layers.
- [x] **Current Database Preserved:** Live database contains 8 products, 8 variations, 24 orders, 3 users, 1 admin, 10 settings, and 5 payment methods.
- [x] **Verified Local Backup Created:** Checkpointed and copied to `backups/railway_pre_deployment_20261026_171500.db`.
- [x] **Zero Destructive Actions:** No auto-deployment or unapproved database migrations will be performed.

---

## 🗄️ Database Migration: How to Safely Transfer `data/khaja_agro.db` to Railway

Because SQLite is a file-based relational database, transferring your database without data loss requires three disciplined steps:

### Step 1: WAL Checkpointing & Clean Snapshot on Local Machine
When SQLite runs in WAL (Write-Ahead Logging) mode, recent transactions reside in `khaja_agro.db-wal`. Before copying, a checkpoint flushes all pending WAL writes into the main `.db` file:

```bash
# Execute WAL Checkpoint and create migration file
agy-node -e "const { DatabaseSync } = require('node:sqlite'); const db = new DatabaseSync('./data/khaja_agro.db'); db.exec('PRAGMA wal_checkpoint(TRUNCATE); PRAGMA integrity_check;'); console.log('Database integrity verified and WAL flushed successfully.');"
```

Once executed, `data/khaja_agro.db` is completely self-contained. Copy it to a dedicated migration file:
```bash
# Windows PowerShell:
Copy-Item "data/khaja_agro.db" -Destination "backups/khaja_agro_for_railway.db"
```

### Step 2: Preparing Railway's Persistent Storage
1. In your Railway service, navigate to **Volumes**.
2. Add a persistent volume with **Mount Path** set to:
   `/app/data`
3. This creates an isolated, persistent SSD directory on Railway that survives all redeployments and restarts.

### Step 3: Transferring the Database to Railway
There are two safe methods to upload your `khaja_agro.db` file to Railway's persistent volume:

#### Method A: Using the Railway CLI (Fastest & Safest)
1. Install Railway CLI on your computer:
   ```bash
   npm install -g @railway/cli
   ```
2. Authenticate and link your project:
   ```bash
   railway login
   railway link
   ```
3. Use the Railway CLI to upload your prepared clean database snapshot directly into the persistent volume:
   ```bash
   # Upload to /app/data/khaja_agro.db on Railway
   railway run "mkdir -p /app/data"
   cat backups/khaja_agro_for_railway.db | railway run "cat > /app/data/khaja_agro.db"
   ```
4. Verify the database integrity on Railway:
   ```bash
   railway run "node -e \"const { DatabaseSync } = require('node:sqlite'); const db = new DatabaseSync('/app/data/khaja_agro.db'); const r = db.prepare('SELECT count(*) as count FROM orders').get(); console.log('Orders on Railway:', r.count);\""
   ```
   *(Should output: `Orders on Railway: 24`)*

#### Method B: Temporary Migration Endpoint / SFTP
If you prefer not to use the Railway CLI, you can upload the database file using Railway Volume's Web interface or an authenticated one-time curl upload before opening public traffic.

---

## 🐙 Setting Up Private GitHub Repository (`khaja-agro-farm`)

To ensure complete privacy and security, deploy from a **private** GitHub repository:

1. Go to [GitHub New Repository](https://github.com/new).
2. Set **Repository name** to: `khaja-agro-farm`.
3. Set Visibility to **Private**.
4. Do NOT initialize with a README, .gitignore, or license (these already exist locally).
5. On your computer, open a terminal in `C:\Users\AQSA.COM\.gemini\antigravity\scratch\khaja-agro-farm`:
   ```bash
   # Initialize git
   git init
   git branch -M main

   # Verify that data/*.db and .env are ignored:
   git status
   # (Verify that data/khaja_agro.db and .env do NOT appear in the untracked list)

   # Add all files and make initial commit
   git add .
   git commit -m "feat: production deployment preparation for Khaja Agro Farm"

   # Link to your private GitHub repo
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/khaja-agro-farm.git

   # Push code to GitHub
   git push -u origin main
   ```

---

## 🚂 Railway Project Deployment & Configuration

1. In [Railway Dashboard](https://railway.com/dashboard), click **"+ New Project"**.
2. Select **"Deploy from GitHub repo"** and choose your private `khaja-agro-farm` repository.
3. Railway will read `railway.json` and build the container using `Dockerfile`.
4. **Attach Persistent Volume:**
   - Under your service, click **"Volumes"**.
   - Click **"+ Add Volume"**.
   - Mount Path: `/app/data`
   - Size: 1 GB (or more).
5. **Set Environment Variables:**
   Under **Variables**, add the following (paste your freshly generated secrets into the values):

   | Variable | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `3000` |
   | `HOST` | `0.0.0.0` |
   | `DB_PATH` | `/app/data/khaja_agro.db` |
   | `SESSION_SECRET` | *(Paste generated 64-character hex secret)* |
   | `ADMIN_SETUP_SECRET` | *(Paste generated 48-character hex secret)* |
   | `ADMIN_INITIAL_PASSWORD` | *(Paste your strong custom admin password)* |

6. **Generate Public HTTPS URL:**
   - Go to **Settings** → **Networking** → **Generate Domain**.
   - Railway instantly assigns an HTTPS domain (e.g. `https://khaja-agro-farm.up.railway.app`).

---

## 🧪 Post-Deployment Verification Checklist

Once the database is uploaded and the service is live:

1. **Verify Storefront:**
   - Open your deployed URL.
   - Check the banner, categories, and products.
2. **Verify Existing Orders & Data:**
   - Log into `/admin` using your admin phone `01970271398`.
   - Confirm all 24 existing orders, registered users, and categories appear in the admin dashboard.
3. **Verify Data Persistence Across Restarts:**
   - Place a test order on the storefront.
   - In Railway, click **"Restart"** on the service.
   - Re-open `/admin` and confirm the new test order is still there.
