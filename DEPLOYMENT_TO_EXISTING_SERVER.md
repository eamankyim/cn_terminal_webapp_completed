# 🚀 Deployment Guide: CN Terminal to Server with Existing Services

This guide walks you through deploying CN Terminal to a server that already has two other services running.

## 📋 Pre-Deployment Checklist

Before starting, you need to gather information about your existing services:

### 1. Check Existing Services

```bash
# Connect to your server
ssh user@your-server-ip

# Check what ports are in use
sudo netstat -tulpn | grep LISTEN
# OR
sudo ss -tulpn | grep LISTEN

# Check existing Docker containers
docker ps

# Check existing Docker networks
docker network ls

# Check existing Docker volumes
docker volume ls
```

### 2. Identify Conflicts

**Look for:**
- **Port conflicts**: 
  - PostgreSQL (usually 5432)
  - Frontend ports (usually 3000, 3004, 80, 443)
  - Backend ports (usually 5000, 5001)
  - Other services using common ports

- **Container name conflicts**:
  - `postgres`, `backend`, `frontend`
  - Any service with "cn_terminal" prefix

- **Network conflicts**:
  - Networks named `host-network`, `cn_terminal_network`

- **Volume conflicts**:
  - PostgreSQL data volumes
  - Upload volumes

## 🔧 Required Changes

### Change 1: Port Configuration

**Current default ports:**
- PostgreSQL: `5434:5432` (external:internal)
- Backend: `5001:5000`
- Frontend: `3004:3000`

**If ports are in use, change them in `docker-compose.prod.yml`:**

```yaml
services:
  postgres:
    ports:
      - "5435:5432"  # Change 5434 to 5435 if 5434 is in use
      
  backend:
    ports:
      - "5002:5000"  # Change 5001 to 5002 if 5001 is in use
      
  frontend:
    ports:
      - "3005:3000"  # Change 3004 to 3005 if 3004 is in use
```

**To find available ports:**
```bash
# Find next available port (example for PostgreSQL)
for port in {5434..5450}; do
  if ! sudo netstat -tuln | grep -q ":$port "; then
    echo "Port $port is available"
    break
  fi
done
```

### Change 2: Container Names

**Current container names:**
- `cn_terminal_postgres`
- `cn_terminal_backend`
- `cn_terminal_frontend`

**If conflicts exist, update `docker-compose.prod.yml`:**

```yaml
services:
  postgres:
    container_name: cn_terminal_db_2  # Add suffix if needed
    
  backend:
    container_name: cn_terminal_api_2  # Add suffix if needed
    
  frontend:
    container_name: cn_terminal_web_2  # Add suffix if needed
```

### Change 3: Network Configuration

**Option A: Use Existing Network (Recommended)**

If you have an existing `host-network`:

```yaml
networks:
  cn_terminal_network:
    driver: bridge
  host-network:
    external: true  # Use existing network
```

**Option B: Create New Network**

If you want isolation:

```yaml
networks:
  cn_terminal_network:
    driver: bridge
    name: cn_terminal_network_v2  # Unique name
```

### Change 4: Database Configuration

**Option A: Use Existing PostgreSQL (Recommended if Available)**

If you have an existing PostgreSQL service:

1. **Skip PostgreSQL service** in docker-compose:
   ```yaml
   # Comment out or remove postgres service
   # postgres:
   #   ...
   ```

2. **Update DATABASE_URL** in `.env.production`:
   ```env
   # Use existing PostgreSQL connection
   DATABASE_URL=postgresql://username:password@existing-postgres-host:5432/cn_terminal_db?schema=public
   ```

3. **Create database**:
   ```bash
   # Connect to existing PostgreSQL
   psql -h existing-postgres-host -U username -d postgres
   
   # Create database
   CREATE DATABASE cn_terminal_db;
   CREATE USER cn_terminal_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE cn_terminal_db TO cn_terminal_user;
   ```

**Option B: Use Separate PostgreSQL Container**

Keep the PostgreSQL service but use different ports (see Change 1).

### Change 5: Volume Names

**Current volumes:**
- `postgres_data`

**If conflicts exist, update `docker-compose.prod.yml`:**

```yaml
volumes:
  postgres_data:
    name: cn_terminal_postgres_data_v2  # Unique name
```

### Change 6: Environment Variables

**Update `.env.production` with production values:**

```env
# Database (use new port if changed)
DATABASE_URL=postgresql://cn_terminal_user:${DB_PASSWORD}@postgres:5432/cn_terminal_db?schema=public

# Server Configuration
PORT=5000

# URLs (update with your domain)
FRONTEND_URL=https://app.cnterminalghana.com
PRODUCTION_URL=https://app.cnterminalghana.com
APP_BASE_URL=https://app.cnterminalghana.com
CORS_ORIGIN=https://app.cnterminalghana.com

# API URL for frontend build
REACT_APP_API_URL=https://app.cnterminalghana.com/api

# Email Configuration
REACT_APP_SENDGRID_API_KEY=your_sendgrid_api_key
REACT_APP_FROM_EMAIL=noreply@yourdomain.com
REACT_APP_FROM_NAME=CN Terminal
REACT_APP_EMAIL_DEV_MODE=false

# Docker (use new port if changed)
DB_PASSWORD=your_secure_password

# JWT Secret (generate: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_here
```

## 📝 Step-by-Step Deployment

### Step 1: Prepare Server

```bash
# Connect to server
ssh user@your-server-ip

# Create application directory
mkdir -p ~/cn_terminal
cd ~/cn_terminal
```

### Step 2: Upload Application Files

**Option A: Git Clone**
```bash
git clone <your-repo-url> .
git checkout production  # or main
```

**Option B: SCP Upload**
```bash
# From your local machine
scp -r ./cn_terminal_webapp_completed/* user@your-server-ip:~/cn_terminal/
```

### Step 3: Check Existing Services

```bash
# Check ports
sudo ss -tulpn | grep LISTEN

# Check Docker containers
docker ps -a

# Check Docker networks
docker network ls

# Check Docker volumes
docker volume ls
```

### Step 4: Configure Ports

Edit `docker-compose.prod.yml` and change ports if needed:

```bash
nano docker-compose.prod.yml
```

**Update these sections:**
- `postgres.ports` - Change `5434:5432` if needed
- `backend.ports` - Change `5001:5000` if needed  
- `frontend.ports` - Change `3004:3000` if needed

### Step 5: Configure Environment Variables

```bash
# Copy template
cp env.production.template .env.production

# Edit with your values
nano .env.production
```

**Required values:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Generate with: `openssl rand -base64 32`
- `DB_PASSWORD` - Secure database password
- `FRONTEND_URL` - Your production domain
- `PRODUCTION_URL` - Your production domain
- `APP_BASE_URL` - Your production domain
- `CORS_ORIGIN` - Your production domain
- `REACT_APP_API_URL` - Your API URL
- `REACT_APP_SENDGRID_API_KEY` - SendGrid API key
- `REACT_APP_FROM_EMAIL` - Email sender address

### Step 6: Update Docker Compose for Existing Network

If using existing `host-network`, update `docker-compose.prod.yml`:

```yaml
services:
  # ... other services ...
  
  nginx:  # If using nginx
    networks:
      - cn_terminal_network
      - host-network  # Add existing network

networks:
  cn_terminal_network:
    driver: bridge
  host-network:
    external: true  # Use existing network
```

### Step 7: Build and Start Services

```bash
# Load environment variables
source .env.production

# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Step 8: Connect to Existing Network (if needed)

```bash
# Connect nginx container to existing host-network
docker network connect host-network cn_terminal-nginx

# Verify connection
docker network inspect host-network | grep cn_terminal
```

### Step 9: Set Up Database

```bash
# Push Prisma schema
docker exec -it cn_terminal_backend npx prisma db push

# Generate Prisma client
docker exec -it cn_terminal_backend npx prisma generate

# Create super admin
docker exec -it cn_terminal_backend node scripts/create-admin.js
```

### Step 10: Configure Nginx (if using existing host-nginx)

If you have an existing `host-nginx` router:

1. **Add routing rules** to `~/host-nginx/conf.d/router.conf`:

```nginx
# CN Terminal - app.cnterminalghana.com
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.cnterminalghana.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/app.cnterminalghana.com.crt;
    ssl_certificate_key /etc/nginx/ssl/app.cnterminalghana.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy to CN Terminal nginx
    location / {
        set $cn_terminal_upstream cn_terminal-nginx:443;
        proxy_pass https://$cn_terminal_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
    }

    location /api {
        set $cn_terminal_upstream cn_terminal-nginx:443;
        proxy_pass https://$cn_terminal_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api-docs {
        set $cn_terminal_upstream cn_terminal-nginx:443;
        proxy_pass https://$cn_terminal_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io {
        set $cn_terminal_upstream cn_terminal-nginx:443;
        proxy_pass https://$cn_terminal_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads {
        set $cn_terminal_upstream cn_terminal-nginx:443;
        proxy_pass https://$cn_terminal_upstream;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name app.cnterminalghana.com;
    return 301 https://$host$request_uri;
}
```

2. **Reload host-nginx**:
```bash
docker exec host-nginx nginx -t
docker exec host-nginx nginx -s reload
```

### Step 11: Verify Deployment

```bash
# Check containers are running
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Test API health
curl http://localhost:5001/api/health  # Use your backend port

# Test frontend
curl http://localhost:3004  # Use your frontend port

# Check database connection
docker exec -it cn_terminal_backend npx prisma db pull
```

## 🔍 Verification Checklist

- [ ] All containers are running (`docker ps`)
- [ ] No port conflicts (`sudo ss -tulpn`)
- [ ] Database connection works (`docker exec cn_terminal_backend npx prisma db pull`)
- [ ] API health check returns 200 (`curl http://localhost:PORT/api/health`)
- [ ] Frontend serves correctly (`curl http://localhost:PORT`)
- [ ] Nginx routing works (if using nginx)
- [ ] SSL certificates configured (if using HTTPS)
- [ ] Environment variables loaded correctly
- [ ] Super admin user created
- [ ] Logs show no errors

## 🛠️ Troubleshooting

### Issue: Port Already in Use

**Error:** `Bind for 0.0.0.0:5434 failed: port is already allocated`

**Solution:**
1. Find what's using the port: `sudo lsof -i :5434`
2. Change port in `docker-compose.prod.yml`
3. Update `DATABASE_URL` in `.env.production` if using external PostgreSQL

### Issue: Container Name Already Exists

**Error:** `Error response from daemon: Conflict. The container name "cn_terminal_postgres" is already in use`

**Solution:**
1. Remove old container: `docker rm cn_terminal_postgres`
2. Or change container name in `docker-compose.prod.yml`

### Issue: Network Not Found

**Error:** `Network host-network not found`

**Solution:**
1. Create network: `docker network create host-network`
2. Or remove `host-network` from docker-compose if not needed

### Issue: Database Connection Failed

**Error:** `Can't reach database server`

**Solution:**
1. Check PostgreSQL is running: `docker ps | grep postgres`
2. Verify `DATABASE_URL` in `.env.production`
3. Check database exists: `docker exec -it cn_terminal_postgres psql -U cn_terminal_user -d cn_terminal_db`

### Issue: Frontend Can't Connect to Backend

**Error:** `Network request failed`

**Solution:**
1. Verify `REACT_APP_API_URL` in `.env.production`
2. Check backend is running: `docker ps | grep backend`
3. Test API directly: `curl http://localhost:5001/api/health`

## 📊 Quick Reference

### Check Running Services
```bash
docker-compose -f docker-compose.prod.yml ps
docker ps
sudo ss -tulpn | grep LISTEN
```

### View Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
docker logs cn_terminal_backend --tail 50
docker logs cn_terminal_frontend --tail 50
```

### Restart Services
```bash
docker-compose -f docker-compose.prod.yml restart
docker-compose -f docker-compose.prod.yml restart backend
```

### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### Rebuild and Restart
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## 📝 Summary of Changes Needed

1. **Ports** - Update if conflicts exist
2. **Container names** - Update if conflicts exist
3. **Network** - Connect to existing `host-network` if available
4. **Database** - Use existing PostgreSQL or separate container with different port
5. **Environment variables** - Set production values in `.env.production`
6. **Nginx** - Configure routing in existing `host-nginx` if available
7. **SSL certificates** - Obtain and configure for your domain

## 🎯 Next Steps

After successful deployment:

1. ✅ Set up SSL certificates (if using HTTPS)
2. ✅ Configure DNS (point domain to server IP)
3. ✅ Test all features
4. ✅ Set up monitoring
5. ✅ Configure backups
6. ✅ Set up auto-renewal for SSL certificates

---

**Need help?** Check the logs first, then review the troubleshooting section above.

