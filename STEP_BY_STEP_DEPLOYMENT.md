# 🚀 CN Terminal - Step-by-Step Deployment Guide

Follow these steps one by one to deploy CN Terminal to your server with existing services.

---

## 📋 Step 1: Check Existing Services on Server

**Goal:** Identify what's already running and find potential conflicts.

### Action:

1. **Connect to your server:**
   ```bash
   ssh user@your-server-ip
   ```

2. **Run the analysis script:**
   ```bash
   # Upload the script to your server, or create it manually
   chmod +x STEP1_CHECK_EXISTING_SERVICES.sh
   ./STEP1_CHECK_EXISTING_SERVICES.sh
   ```

   **OR manually check:**
   ```bash
   # Check ports
   sudo ss -tulpn | grep LISTEN
   
   # Check Docker containers
   docker ps
   
   # Check Docker networks
   docker network ls
   
   # Check Docker volumes
   docker volume ls
   ```

3. **Document what you find:**
   - Which ports are in use?
   - Which container names exist?
   - Does `host-network` exist?
   - Are there PostgreSQL services running?

### Expected Output:

You should see:
- ✅ Available ports (can use)
- ⚠️  Ports in use (need to change)
- ✅ Available container names
- ⚠️  Container name conflicts (need to change)
- ✅ Network status (host-network exists or not)

---

## 📋 Step 2: Update Docker Compose Configuration

**Goal:** Configure docker-compose.prod.yml to avoid conflicts.

### Action:

1. **Open docker-compose.prod.yml:**
   ```bash
   nano docker-compose.prod.yml
   ```

2. **Update ports if conflicts exist:**

   **If PostgreSQL port 5434 is in use:**
   ```yaml
   postgres:
     ports:
       - "5435:5432"  # Change from 5434 to 5435
   ```

   **If Backend port 5001 is in use:**
   ```yaml
   backend:
     ports:
       - "5002:5000"  # Change from 5001 to 5002
   ```

   **If Frontend port 3004 is in use:**
   ```yaml
   frontend:
     ports:
       - "3005:3000"  # Change from 3004 to 3005
   ```

3. **Update container names if conflicts exist:**

   **If names conflict:**
   ```yaml
   postgres:
     container_name: cn_terminal_db_v2  # Add suffix
   
   backend:
     container_name: cn_terminal_api_v2  # Add suffix
   
   frontend:
     container_name: cn_terminal_web_v2  # Add suffix
   ```

4. **Update network configuration if host-network exists:**

   ```yaml
   networks:
     cn_terminal_network:
       driver: bridge
     host-network:
       external: true  # Add this if host-network exists
   ```

5. **Save the file**

---

## 📋 Step 3: Configure Database

**Goal:** Decide whether to use existing PostgreSQL or separate container.

### Option A: Use Existing PostgreSQL (Recommended if available)

**If you have an existing PostgreSQL service:**

1. **Comment out PostgreSQL service in docker-compose.prod.yml:**
   ```yaml
   # postgres:
   #   image: postgres:15-alpine
   #   ...
   ```

2. **Update DATABASE_URL in .env.production:**
   ```env
   DATABASE_URL=postgresql://existing-user:password@existing-host:5432/cn_terminal_db?schema=public
   ```

3. **Create database on existing PostgreSQL:**
   ```bash
   # Connect to existing PostgreSQL
   psql -h existing-host -U username -d postgres
   
   # Create database and user
   CREATE DATABASE cn_terminal_db;
   CREATE USER cn_terminal_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE cn_terminal_db TO cn_terminal_user;
   \q
   ```

### Option B: Use Separate PostgreSQL Container

**If you want a separate PostgreSQL container:**

1. **Keep PostgreSQL service in docker-compose.prod.yml**
2. **Use different port (see Step 2)**
3. **DATABASE_URL will use 'postgres' as hostname (internal Docker network)**

---

## 📋 Step 4: Create Environment Variables File

**Goal:** Set up all required environment variables.

### Action:

1. **Copy the template:**
   ```bash
   cp env.production.template .env.production
   ```

2. **Edit .env.production:**
   ```bash
   nano .env.production
   ```

3. **Fill in required values:**

   ```env
   # Database Configuration
   DATABASE_URL=postgresql://cn_terminal_user:your_password@postgres:5432/cn_terminal_db?schema=public
   # OR if using existing PostgreSQL:
   # DATABASE_URL=postgresql://existing-user:password@existing-host:5432/cn_terminal_db?schema=public
   
   # Server Configuration
   PORT=5000
   
   # JWT Authentication (generate: openssl rand -base64 32)
   JWT_SECRET=your_generated_jwt_secret_here
   
   # URLs (update with your domain)
   FRONTEND_URL=https://app.cnterminalghana.com
   PRODUCTION_URL=https://app.cnterminalghana.com
   APP_BASE_URL=https://app.cnterminalghana.com
   CORS_ORIGIN=https://app.cnterminalghana.com
   
   # Frontend Build Configuration
   REACT_APP_API_URL=https://app.cnterminalghana.com/api
   
   # Email Configuration (SendGrid)
   REACT_APP_SENDGRID_API_KEY=your_sendgrid_api_key
   REACT_APP_FROM_EMAIL=noreply@yourdomain.com
   REACT_APP_FROM_NAME=CN Terminal
   REACT_APP_EMAIL_DEV_MODE=false
   
   # Docker Configuration
   DB_PASSWORD=your_secure_database_password
   ```

4. **Generate JWT Secret:**
   ```bash
   openssl rand -base64 32
   # Copy the output to JWT_SECRET in .env.production
   ```

5. **Save the file**

---

## 📋 Step 5: Build and Start Services

**Goal:** Build Docker images and start containers.

### Action:

1. **Load environment variables:**
   ```bash
   source .env.production
   ```

2. **Build Docker images:**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

3. **Start services:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Check status:**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

5. **View logs (if needed):**
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f
   ```

---

## 📋 Step 6: Set Up Database Schema

**Goal:** Create database tables and initialize database.

### Action:

1. **Push Prisma schema:**
   ```bash
   docker exec -it cn_terminal_backend npx prisma db push
   ```

2. **Generate Prisma client:**
   ```bash
   docker exec -it cn_terminal_backend npx prisma generate
   ```

3. **Create super admin user:**
   ```bash
   docker exec -it cn_terminal_backend node scripts/create-admin.js
   ```
   
   **Follow prompts to create admin user:**
   - Name: (e.g., "Super Admin")
   - Email: (e.g., "admin@cnterminal.com")
   - Password: (choose secure password)

---

## 📋 Step 7: Connect to Existing Network (If Needed)

**Goal:** Connect CN Terminal nginx to existing host-network.

### Action:

**Only if you have existing host-network and using nginx:**

1. **Connect nginx container to host-network:**
   ```bash
   docker network connect host-network cn_terminal-nginx
   ```

2. **Verify connection:**
   ```bash
   docker network inspect host-network | grep cn_terminal
   ```

---

## 📋 Step 8: Configure Nginx Routing (If Using host-nginx)

**Goal:** Set up routing from host-nginx to CN Terminal.

### Action:

**Only if you have existing host-nginx router:**

1. **Add routing rules to host-nginx:**
   ```bash
   nano ~/host-nginx/conf.d/router.conf
   ```

2. **Add CN Terminal routing configuration:**
   ```nginx
   # CN Terminal - app.cnterminalghana.com
   server {
       listen 443 ssl http2;
       server_name app.cnterminalghana.com;
       
       location / {
           set $cn_terminal_upstream cn_terminal-nginx:443;
           proxy_pass https://$cn_terminal_upstream;
           # ... (see full config in CN_TERMINAL_NGINX_SETUP.md)
       }
   }
   ```

3. **Test configuration:**
   ```bash
   docker exec host-nginx nginx -t
   ```

4. **Reload nginx:**
   ```bash
   docker exec host-nginx nginx -s reload
   ```

---

## 📋 Step 9: Verify Deployment

**Goal:** Ensure everything is working correctly.

### Action:

1. **Check containers are running:**
   ```bash
   docker ps | grep cn_terminal
   ```

2. **Check logs for errors:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs --tail 50
   ```

3. **Test API health endpoint:**
   ```bash
   curl http://localhost:5001/api/health
   # OR use your backend port if different
   ```

4. **Test frontend:**
   ```bash
   curl http://localhost:3004
   # OR use your frontend port if different
   ```

5. **Test database connection:**
   ```bash
   docker exec -it cn_terminal_backend npx prisma db pull
   ```

6. **Test domain access (if configured):**
   ```bash
   curl https://app.cnterminalghana.com/api/health
   ```

---

## 📋 Step 10: Final Verification Checklist

**Goal:** Confirm deployment is complete and working.

### Checklist:

- [ ] All containers are running
- [ ] No port conflicts
- [ ] Database connection works
- [ ] API health check returns 200
- [ ] Frontend serves correctly
- [ ] Nginx routing works (if configured)
- [ ] SSL certificates configured (if using HTTPS)
- [ ] Super admin user created
- [ ] Logs show no errors
- [ ] Application accessible via domain

---

## 🎯 Quick Command Reference

```bash
# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop services
docker-compose -f docker-compose.prod.yml down

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🆘 Troubleshooting

If something fails:

1. **Check logs:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f
   ```

2. **Check container status:**
   ```bash
   docker ps -a
   ```

3. **Check ports:**
   ```bash
   sudo ss -tulpn | grep LISTEN
   ```

4. **Review DEPLOYMENT_TO_EXISTING_SERVER.md troubleshooting section**

---

**Ready to start?** Let's begin with **Step 1**!

