# ⚡ Quick Deployment Reference - Server with Existing Services

## 🎯 What to Change

### 1. **Ports** (if conflicts exist)
```yaml
# docker-compose.prod.yml
postgres:
  ports: ["5434:5432"]  # → Change to ["5435:5432"] if 5434 in use

backend:
  ports: ["5001:5000"]  # → Change to ["5002:5000"] if 5001 in use

frontend:
  ports: ["3004:3000"]  # → Change to ["3005:3000"] if 3004 in use
```

### 2. **Container Names** (if conflicts exist)
```yaml
# docker-compose.prod.yml
postgres:
  container_name: cn_terminal_postgres  # → Change to cn_terminal_db_v2

backend:
  container_name: cn_terminal_backend  # → Change to cn_terminal_api_v2

frontend:
  container_name: cn_terminal_frontend  # → Change to cn_terminal_web_v2
```

### 3. **Network** (if using existing host-network)
```yaml
# docker-compose.prod.yml
networks:
  cn_terminal_network:
    driver: bridge
  host-network:
    external: true  # ← Add this if host-network exists
```

### 4. **Environment Variables**
```bash
# Create .env.production
cp env.production.template .env.production

# Required values:
DATABASE_URL=postgresql://user:pass@host:port/db?schema=public
JWT_SECRET=<generate: openssl rand -base64 32>
DB_PASSWORD=<secure password>
FRONTEND_URL=https://app.cnterminalghana.com
PRODUCTION_URL=https://app.cnterminalghana.com
APP_BASE_URL=https://app.cnterminalghana.com
CORS_ORIGIN=https://app.cnterminalghana.com
REACT_APP_API_URL=https://app.cnterminalghana.com/api
REACT_APP_SENDGRID_API_KEY=<your key>
REACT_APP_FROM_EMAIL=noreply@yourdomain.com
REACT_APP_FROM_NAME=CN Terminal
REACT_APP_EMAIL_DEV_MODE=false
```

### 5. **Database** (if using existing PostgreSQL)
```yaml
# docker-compose.prod.yml
# Comment out or remove postgres service

# Then update .env.production:
DATABASE_URL=postgresql://existing-user:pass@existing-host:5432/cn_terminal_db?schema=public
```

### 6. **Nginx Routing** (if using existing host-nginx)
```nginx
# Add to ~/host-nginx/conf.d/router.conf
server {
    listen 443 ssl http2;
    server_name app.cnterminalghana.com;
    
    location / {
        set $cn_terminal_upstream cn_terminal-nginx:443;
        proxy_pass https://$cn_terminal_upstream;
        # ... headers ...
    }
}
```

---

## 🚀 Quick Deploy Commands

```bash
# 1. Check existing services
sudo ss -tulpn | grep LISTEN
docker ps

# 2. Update docker-compose.prod.yml (ports, names, networks)
nano docker-compose.prod.yml

# 3. Create .env.production
cp env.production.template .env.production
nano .env.production

# 4. Build and start
source .env.production
docker-compose -f docker-compose.prod.yml up -d --build

# 5. Set up database
docker exec -it cn_terminal_backend npx prisma db push
docker exec -it cn_terminal_backend node scripts/create-admin.js

# 6. Connect to existing network (if needed)
docker network connect host-network cn_terminal-nginx

# 7. Configure nginx (if using host-nginx)
# Add routing rules to ~/host-nginx/conf.d/router.conf
docker exec host-nginx nginx -s reload
```

---

## ✅ Verification

```bash
# Check containers
docker ps | grep cn_terminal

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Test API
curl http://localhost:PORT/api/health

# Test frontend
curl http://localhost:PORT
```

---

## 📚 Full Guides

- **Complete Guide:** `DEPLOYMENT_TO_EXISTING_SERVER.md`
- **Checklist:** `DEPLOYMENT_CHECKLIST.md`
- **Summary:** `DEPLOYMENT_SUMMARY.md`

---

**Need help?** Check the full guides above for detailed instructions and troubleshooting.

