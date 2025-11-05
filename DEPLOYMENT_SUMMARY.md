# 🚀 CN Terminal Deployment Summary - Server with Existing Services

## ⚡ Quick Overview

This document summarizes the key changes needed when deploying CN Terminal to a server that already has two other services running.

## 📋 Main Changes Required

### 1. **Port Configuration** 🔌

**Default ports (may conflict):**
- PostgreSQL: `5434:5432`
- Backend: `5001:5000`
- Frontend: `3004:3000`

**Action:** Check if these ports are in use and change them if needed.

**Check ports:**
```bash
sudo ss -tulpn | grep LISTEN
```

**If conflicts exist, change in `docker-compose.prod.yml`:**
```yaml
postgres:
  ports:
    - "5435:5432"  # Change 5434 to available port

backend:
  ports:
    - "5002:5000"  # Change 5001 to available port

frontend:
  ports:
    - "3005:3000"  # Change 3004 to available port
```

---

### 2. **Container Names** 🏷️

**Default names:**
- `cn_terminal_postgres`
- `cn_terminal_backend`
- `cn_terminal_frontend`

**Action:** Check for conflicts and rename if needed.

**Check existing containers:**
```bash
docker ps -a
```

**If conflicts exist, change in `docker-compose.prod.yml`:**
```yaml
postgres:
  container_name: cn_terminal_db_v2  # Add suffix

backend:
  container_name: cn_terminal_api_v2  # Add suffix

frontend:
  container_name: cn_terminal_web_v2  # Add suffix
```

---

### 3. **Network Configuration** 🌐

**If you have existing `host-network`:**

**Action:** Connect to existing network instead of creating new one.

**Update `docker-compose.prod.yml`:**
```yaml
networks:
  cn_terminal_network:
    driver: bridge
  host-network:
    external: true  # Add this to use existing network
```

**If using nginx, add to nginx service:**
```yaml
nginx:
  networks:
    - cn_terminal_network
    - host-network  # Add this
```

---

### 4. **Database Configuration** 💾

**Option A: Use Existing PostgreSQL (Recommended)**

**If you have existing PostgreSQL:**
1. Comment out PostgreSQL service in docker-compose
2. Update `DATABASE_URL` in `.env.production`:
   ```env
   DATABASE_URL=postgresql://username:password@existing-host:5432/cn_terminal_db?schema=public
   ```
3. Create database on existing PostgreSQL

**Option B: Use Separate Container**

Keep PostgreSQL service but use different port (see Change 1).

---

### 5. **Environment Variables** 🔐

**Required in `.env.production`:**

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT signing secret | Generate: `openssl rand -base64 32` |
| `DB_PASSWORD` | Database password | Your secure password |
| `FRONTEND_URL` | Frontend domain | `https://app.cnterminalghana.com` |
| `PRODUCTION_URL` | Production domain | `https://app.cnterminalghana.com` |
| `APP_BASE_URL` | Base URL | `https://app.cnterminalghana.com` |
| `CORS_ORIGIN` | CORS origins | `https://app.cnterminalghana.com` |
| `REACT_APP_API_URL` | API URL | `https://app.cnterminalghana.com/api` |
| `REACT_APP_SENDGRID_API_KEY` | SendGrid API key | Your API key |
| `REACT_APP_FROM_EMAIL` | Email sender | `noreply@yourdomain.com` |
| `REACT_APP_FROM_NAME` | Email sender name | `CN Terminal` |
| `REACT_APP_EMAIL_DEV_MODE` | Email dev mode | `false` |

**Action:** Copy `env.production.template` to `.env.production` and fill in values.

---

### 6. **Nginx Configuration** (If Using Existing host-nginx) 🔄

**If you have existing `host-nginx` router:**

**Action:** Add routing rules to `~/host-nginx/conf.d/router.conf`

**Add this configuration:**
```nginx
server {
    listen 443 ssl http2;
    server_name app.cnterminalghana.com;
    
    location / {
        set $cn_terminal_upstream cn_terminal-nginx:443;
        proxy_pass https://$cn_terminal_upstream;
        # ... proxy headers ...
    }
    
    location /api {
        set $cn_terminal_upstream cn_terminal-nginx:443;
        proxy_pass https://$cn_terminal_upstream;
        # ... proxy headers ...
    }
}
```

**Then reload:**
```bash
docker exec host-nginx nginx -t
docker exec host-nginx nginx -s reload
```

---

## 🚀 Deployment Steps (Quick)

1. **Check existing services:**
   ```bash
   sudo ss -tulpn | grep LISTEN
   docker ps
   docker network ls
   ```

2. **Update `docker-compose.prod.yml`:**
   - Change ports if conflicts exist
   - Change container names if conflicts exist
   - Add existing network if available

3. **Create `.env.production`:**
   ```bash
   cp env.production.template .env.production
   nano .env.production  # Fill in values
   ```

4. **Build and start:**
   ```bash
   source .env.production
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

5. **Set up database:**
   ```bash
   docker exec -it cn_terminal_backend npx prisma db push
   docker exec -it cn_terminal_backend node scripts/create-admin.js
   ```

6. **Connect to existing network (if needed):**
   ```bash
   docker network connect host-network cn_terminal-nginx
   ```

7. **Configure nginx routing (if using host-nginx):**
   - Add routing rules to `host-nginx/conf.d/router.conf`
   - Reload nginx

---

## 📊 Quick Reference

### Check for Conflicts
```bash
# Ports
sudo ss -tulpn | grep LISTEN

# Containers
docker ps -a

# Networks
docker network ls

# Volumes
docker volume ls
```

### Common Commands
```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check status
docker-compose -f docker-compose.prod.yml ps

# Restart
docker-compose -f docker-compose.prod.yml restart

# Stop
docker-compose -f docker-compose.prod.yml down
```

---

## 📚 Full Documentation

For detailed instructions, see:
- **Full Guide:** `DEPLOYMENT_TO_EXISTING_SERVER.md`
- **Checklist:** `DEPLOYMENT_CHECKLIST.md`
- **Environment Setup:** `ENV_SETUP_GUIDE.md`
- **Nginx Setup:** `CN_TERMINAL_NGINX_SETUP.md`

---

## ✅ Verification Checklist

After deployment, verify:
- [ ] All containers running: `docker ps | grep cn_terminal`
- [ ] No port conflicts: `sudo ss -tulpn | grep LISTEN`
- [ ] Database connected: `docker exec -it cn_terminal_backend npx prisma db pull`
- [ ] API working: `curl http://localhost:PORT/api/health`
- [ ] Frontend serving: `curl http://localhost:PORT`
- [ ] Nginx routing (if configured)
- [ ] SSL certificates (if using HTTPS)
- [ ] Super admin created

---

## 🆘 Troubleshooting

**Port conflict?** Change port in docker-compose.

**Container name conflict?** Change container name in docker-compose.

**Network not found?** Create network or remove external reference.

**Database connection failed?** Check DATABASE_URL and PostgreSQL status.

**Frontend can't connect?** Verify REACT_APP_API_URL in .env.production.

---

**Need more help?** See `DEPLOYMENT_TO_EXISTING_SERVER.md` for detailed troubleshooting.

