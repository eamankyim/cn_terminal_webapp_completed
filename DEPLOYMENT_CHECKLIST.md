# 🚀 CN Terminal Deployment Checklist - Server with Existing Services

## ⚠️ Before You Start

### 1. Gather Information About Existing Services

```bash
# On your server, run these commands:
sudo ss -tulpn | grep LISTEN  # Check ports in use
docker ps                      # Check running containers
docker network ls             # Check Docker networks
docker volume ls              # Check Docker volumes
```

**Document what you find:**
- [ ] Ports in use: _______________
- [ ] Container names: _______________
- [ ] Networks: _______________
- [ ] Volumes: _______________

### 2. Identify Potential Conflicts

**Check these ports:**
- [ ] PostgreSQL (5432, 5433, 5434, etc.)
- [ ] Backend API (5000, 5001, 5002, etc.)
- [ ] Frontend (3000, 3004, 3005, etc.)
- [ ] HTTP/HTTPS (80, 443)

**Check these container names:**
- [ ] `postgres` or `cn_terminal_postgres`
- [ ] `backend` or `cn_terminal_backend`
- [ ] `frontend` or `cn_terminal_frontend`
- [ ] `nginx` or `cn_terminal-nginx`

**Check these networks:**
- [ ] `host-network` (if you want to use existing)
- [ ] `cn_terminal_network` (if conflicts exist)

---

## 📝 Required Changes

### Change 1: Port Configuration ✅

**File:** `docker-compose.prod.yml`

**Current ports:**
- PostgreSQL: `5434:5432`
- Backend: `5001:5000`
- Frontend: `3004:3000`

**If conflicts exist, change to:**
- PostgreSQL: `5435:5432` (or next available)
- Backend: `5002:5000` (or next available)
- Frontend: `3005:3000` (or next available)

**Action:**
- [ ] Open `docker-compose.prod.yml`
- [ ] Update port mappings if needed
- [ ] Save file

---

### Change 2: Container Names ✅

**File:** `docker-compose.prod.yml`

**Current names:**
- `cn_terminal_postgres`
- `cn_terminal_backend`
- `cn_terminal_frontend`

**If conflicts exist, change to:**
- `cn_terminal_db_v2`
- `cn_terminal_api_v2`
- `cn_terminal_web_v2`

**Action:**
- [ ] Check if container names conflict
- [ ] Update `container_name` in docker-compose if needed
- [ ] Save file

---

### Change 3: Network Configuration ✅

**File:** `docker-compose.prod.yml`

**If you have existing `host-network`:**

```yaml
networks:
  cn_terminal_network:
    driver: bridge
  host-network:
    external: true  # Add this
```

**If conflicts exist, create new network:**
```yaml
networks:
  cn_terminal_network:
    driver: bridge
    name: cn_terminal_network_v2  # Unique name
```

**Action:**
- [ ] Check if `host-network` exists
- [ ] Update network configuration in docker-compose
- [ ] If using nginx, add `host-network` to nginx service networks
- [ ] Save file

---

### Change 4: Database Configuration ✅

**Option A: Use Existing PostgreSQL (Recommended)**

**If you have existing PostgreSQL:**

1. **Remove PostgreSQL service** from docker-compose (comment out)
2. **Update `.env.production`:**
   ```env
   DATABASE_URL=postgresql://username:password@existing-host:5432/cn_terminal_db?schema=public
   ```
3. **Create database** on existing PostgreSQL:
   ```bash
   psql -h existing-host -U username -d postgres
   CREATE DATABASE cn_terminal_db;
   CREATE USER cn_terminal_user WITH PASSWORD 'password';
   GRANT ALL PRIVILEGES ON DATABASE cn_terminal_db TO cn_terminal_user;
   ```

**Option B: Use Separate PostgreSQL Container**

Keep PostgreSQL service but use different port (see Change 1).

**Action:**
- [ ] Decide: Use existing PostgreSQL or separate container?
- [ ] If using existing: Update `DATABASE_URL` in `.env.production`
- [ ] If using existing: Create database and user
- [ ] If using separate: Update port in docker-compose

---

### Change 5: Environment Variables ✅

**File:** `.env.production`

**Required values to set:**

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - Generate: `openssl rand -base64 32`
- [ ] `DB_PASSWORD` - Secure database password
- [ ] `FRONTEND_URL` - Your production domain (e.g., `https://app.cnterminalghana.com`)
- [ ] `PRODUCTION_URL` - Your production domain
- [ ] `APP_BASE_URL` - Your production domain
- [ ] `CORS_ORIGIN` - Your production domain
- [ ] `REACT_APP_API_URL` - Your API URL (e.g., `https://app.cnterminalghana.com/api`)
- [ ] `REACT_APP_SENDGRID_API_KEY` - SendGrid API key
- [ ] `REACT_APP_FROM_EMAIL` - Email sender address
- [ ] `REACT_APP_FROM_NAME` - Email sender name
- [ ] `REACT_APP_EMAIL_DEV_MODE` - Set to `false` for production

**Action:**
- [ ] Copy `env.production.template` to `.env.production`
- [ ] Fill in all values
- [ ] Verify all values are correct

---

### Change 6: Nginx Configuration (If Using Existing host-nginx) ✅

**File:** `~/host-nginx/conf.d/router.conf`

**If you have existing `host-nginx` router:**

- [ ] Add CN Terminal routing rules to `host-nginx/conf.d/router.conf`
- [ ] Copy SSL certificates to `host-nginx/ssl/`
- [ ] Test configuration: `docker exec host-nginx nginx -t`
- [ ] Reload nginx: `docker exec host-nginx nginx -s reload`

**Action:**
- [ ] Check if `host-nginx` exists
- [ ] Add routing configuration (see DEPLOYMENT_TO_EXISTING_SERVER.md)
- [ ] Obtain SSL certificates if needed
- [ ] Configure routing

---

## 🚀 Deployment Steps

### Step 1: Upload Files to Server ✅

- [ ] Connect to server: `ssh user@your-server-ip`
- [ ] Create directory: `mkdir -p ~/cn_terminal && cd ~/cn_terminal`
- [ ] Upload files (via git clone or scp)
- [ ] Verify files are present

---

### Step 2: Configure Files ✅

- [ ] Update `docker-compose.prod.yml` (ports, names, networks)
- [ ] Create `.env.production` from template
- [ ] Fill in all environment variables
- [ ] Verify configuration files

---

### Step 3: Build and Start ✅

- [ ] Load environment: `source .env.production`
- [ ] Build images: `docker-compose -f docker-compose.prod.yml build`
- [ ] Start services: `docker-compose -f docker-compose.prod.yml up -d`
- [ ] Check status: `docker-compose -f docker-compose.prod.yml ps`

---

### Step 4: Connect to Existing Network (If Needed) ✅

- [ ] Connect nginx to host-network: `docker network connect host-network cn_terminal-nginx`
- [ ] Verify connection: `docker network inspect host-network | grep cn_terminal`

---

### Step 5: Set Up Database ✅

- [ ] Push Prisma schema: `docker exec -it cn_terminal_backend npx prisma db push`
- [ ] Generate Prisma client: `docker exec -it cn_terminal_backend npx prisma generate`
- [ ] Create super admin: `docker exec -it cn_terminal_backend node scripts/create-admin.js`

---

### Step 6: Configure Nginx Routing (If Using host-nginx) ✅

- [ ] Add routing rules to `host-nginx/conf.d/router.conf`
- [ ] Test configuration: `docker exec host-nginx nginx -t`
- [ ] Reload nginx: `docker exec host-nginx nginx -s reload`

---

### Step 7: Verify Deployment ✅

- [ ] Check containers: `docker ps | grep cn_terminal`
- [ ] Check logs: `docker-compose -f docker-compose.prod.yml logs`
- [ ] Test API: `curl http://localhost:PORT/api/health`
- [ ] Test frontend: `curl http://localhost:PORT`
- [ ] Test database: `docker exec -it cn_terminal_backend npx prisma db pull`
- [ ] Test domain access (if configured)

---

## ✅ Final Verification

- [ ] All containers running
- [ ] No port conflicts
- [ ] Database connected
- [ ] API health check returns 200
- [ ] Frontend serves correctly
- [ ] Nginx routing works (if using nginx)
- [ ] SSL certificates configured (if using HTTPS)
- [ ] Super admin user created
- [ ] Logs show no errors
- [ ] Application accessible via domain

---

## 🆘 Troubleshooting

**If something fails:**

1. Check logs: `docker-compose -f docker-compose.prod.yml logs -f`
2. Check container status: `docker ps -a`
3. Check ports: `sudo ss -tulpn | grep LISTEN`
4. Check network: `docker network inspect host-network`
5. Review DEPLOYMENT_TO_EXISTING_SERVER.md troubleshooting section

---

## 📚 Reference Documents

- **Full Guide:** `DEPLOYMENT_TO_EXISTING_SERVER.md`
- **Environment Setup:** `ENV_SETUP_GUIDE.md`
- **Quick Start:** `PRODUCTION_ENV_QUICKSTART.md`
- **Nginx Setup:** `CN_TERMINAL_NGINX_SETUP.md`

---

## 🎯 Quick Command Reference

```bash
# Check ports in use
sudo ss -tulpn | grep LISTEN

# Check Docker containers
docker ps

# Check Docker networks
docker network ls

# Build and start
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop services
docker-compose -f docker-compose.prod.yml down

# Connect to network
docker network connect host-network cn_terminal-nginx
```

---

**Ready to deploy?** Follow the checklist above step by step! ✅

