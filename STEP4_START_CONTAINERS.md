# Step 4: Start CN Terminal Containers

## ❌ Current Status
CN Terminal containers are NOT running - they need to be started.

---

## 🔧 Step 4.1: Check .env.production File

```bash
# On your server
cd ~/cn_terminal

# Check if .env.production exists
ls -la .env.production

# If it exists, check its contents
cat .env.production
```

---

## 🔧 Step 4.2: Create .env.production (If Missing)

**If .env.production doesn't exist or is empty, create it:**

```bash
# Create .env.production file
nano .env.production
```

**Paste this (replace with your actual values from GitHub Secrets):**

```env
NODE_ENV=production
DATABASE_URL=postgresql://cn_terminal_user:YOUR_DB_PASSWORD@postgres:5432/cn_terminal_db?schema=public
PORT=5000
JWT_SECRET=YOUR_JWT_SECRET
FRONTEND_URL=https://app.cnterminalghana.com
PRODUCTION_URL=https://app.cnterminalghana.com
APP_BASE_URL=https://app.cnterminalghana.com
CORS_ORIGIN=https://app.cnterminalghana.com
REACT_APP_API_URL=https://app.cnterminalghana.com/api
REACT_APP_SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY
REACT_APP_FROM_EMAIL=noreply@yourdomain.com
REACT_APP_FROM_NAME=CN Terminal
REACT_APP_EMAIL_DEV_MODE=false
DB_PASSWORD=YOUR_DB_PASSWORD
```

**Replace:**
- `YOUR_DB_PASSWORD` - From GitHub Secrets
- `YOUR_JWT_SECRET` - From GitHub Secrets
- `YOUR_SENDGRID_API_KEY` - From GitHub Secrets

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

---

## 🔧 Step 4.3: Start CN Terminal Containers

```bash
# Make sure you're in the right directory
cd ~/cn_terminal

# Load environment variables
source .env.production

# Start containers
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

**Expected output:**
```
NAME                    STATUS              PORTS
cn_terminal_postgres    Up                 0.0.0.0:5434->5432/tcp
cn_terminal_backend     Up                 0.0.0.0:5001->5000/tcp
cn_terminal_frontend    Up                 0.0.0.0:3004->3000/tcp
cn_terminal-nginx       Up
```

---

## 🔧 Step 4.4: Connect nginx to host-network

```bash
# Connect cn_terminal-nginx to host-network
docker network connect host-network cn_terminal-nginx

# Verify connection
docker network inspect host-network | grep cn_terminal
```

---

## ✅ Step 4 Complete Checklist

- [ ] .env.production file exists
- [ ] All environment variables are set
- [ ] CN Terminal containers started
- [ ] All containers are running
- [ ] cn_terminal-nginx connected to host-network

---

**Run these commands and let me know when containers are running!** ✅

