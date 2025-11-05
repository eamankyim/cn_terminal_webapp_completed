# Check Server Deployment Status

## 🚀 Deployment Complete! Let's Verify

### Step 1: SSH to Server

```bash
ssh user@your-server-ip
# Or if you have a specific user
ssh root@your-server-ip
```

### Step 2: Navigate to CN Terminal Directory

```bash
cd ~/cn_terminal
# Or if it's in a different location
cd /path/to/cn_terminal
```

### Step 3: Check Container Status

```bash
# Check if containers are running
docker-compose -f docker-compose.prod.yml ps

# Or use docker ps
docker ps | grep cn_terminal
```

**Expected output:**
```
NAME                    STATUS              PORTS
cn_terminal_postgres    Up                 0.0.0.0:5434->5432/tcp
cn_terminal_backend     Up                 0.0.0.0:5001->5000/tcp
cn_terminal_frontend    Up                 0.0.0.0:3004->3000/tcp
cn_terminal-nginx       Up                 
```

### Step 4: Check Logs

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs --tail 50

# View specific service logs
docker logs cn_terminal_backend --tail 50
docker logs cn_terminal_frontend --tail 50
docker logs cn_terminal_postgres --tail 50
docker logs cn_terminal-nginx --tail 50

# Follow logs in real-time
docker-compose -f docker-compose.prod.yml logs -f
```

### Step 5: Check Environment File

```bash
# Check if .env.production exists
ls -la .env.production

# View environment file (be careful - contains secrets)
cat .env.production | grep -v PASSWORD | grep -v SECRET
```

### Step 6: Test API Health

```bash
# Test backend API
curl http://localhost:5001/api/health

# Expected response:
# {"status":"OK","message":"CN Terminal API is running","timestamp":"..."}
```

### Step 7: Test Frontend

```bash
# Test frontend
curl http://localhost:3004

# Should return HTML content
```

### Step 8: Check Database Connection

```bash
# Test database connection
docker exec -it cn_terminal_backend npx prisma db pull

# Or check if database exists
docker exec -it cn_terminal_postgres psql -U cn_terminal_user -d cn_terminal_db -c "\dt"
```

### Step 9: Check Network Connections

```bash
# Check if nginx is connected to host-network
docker network inspect host-network | grep cn_terminal

# Check all networks
docker network ls
```

### Step 10: Check File Structure

```bash
# Check project structure
ls -la

# Check if key files exist
ls -la docker-compose.prod.yml
ls -la .env.production
ls -la backend/
ls -la frontend/
```

---

## 📊 Quick Status Check

**Run this command for a quick overview:**

```bash
cd ~/cn_terminal && \
echo "=== Container Status ===" && \
docker-compose -f docker-compose.prod.yml ps && \
echo "" && \
echo "=== API Health ===" && \
curl -s http://localhost:5001/api/health && \
echo "" && \
echo "=== Recent Logs ===" && \
docker-compose -f docker-compose.prod.yml logs --tail 10
```

---

## ✅ What to Check

### 1. Containers Running
- [ ] `cn_terminal_postgres` - Up
- [ ] `cn_terminal_backend` - Up
- [ ] `cn_terminal_frontend` - Up
- [ ] `cn_terminal-nginx` - Up (if configured)

### 2. Ports Listening
- [ ] Port 5434 (PostgreSQL)
- [ ] Port 5001 (Backend API)
- [ ] Port 3004 (Frontend)

### 3. API Working
- [ ] Health endpoint returns 200
- [ ] No errors in logs

### 4. Database
- [ ] Database connection works
- [ ] Tables exist (if schema was pushed)

### 5. Environment
- [ ] `.env.production` file exists
- [ ] All required variables are set

---

## 🆘 Troubleshooting

### Containers Not Running

```bash
# Check what happened
docker-compose -f docker-compose.prod.yml ps -a

# Check logs for errors
docker-compose -f docker-compose.prod.yml logs

# Restart containers
docker-compose -f docker-compose.prod.yml restart
```

### API Not Responding

```bash
# Check backend logs
docker logs cn_terminal_backend --tail 50

# Check if backend is running
docker ps | grep backend

# Test connection
curl -v http://localhost:5001/api/health
```

### Database Connection Failed

```bash
# Check PostgreSQL logs
docker logs cn_terminal_postgres --tail 50

# Check if PostgreSQL is running
docker ps | grep postgres

# Test database connection
docker exec -it cn_terminal_postgres psql -U cn_terminal_user -d cn_terminal_db
```

---

## 🎯 Next Steps After Verification

### 1. Create Admin User (First Time)

```bash
docker exec -it cn_terminal_backend node scripts/create-admin.js
```

**Follow prompts:**
- Name: (e.g., "Super Admin")
- Email: (e.g., "admin@cnterminal.com")
- Password: (choose secure password)

### 2. Set Up Database Schema (If Not Done)

```bash
# Generate Prisma client
docker exec -it cn_terminal_backend npx prisma generate

# Push database schema
docker exec -it cn_terminal_backend npx prisma db push
```

### 3. Configure Nginx (If Using host-nginx)

```bash
# Add routing rules to host-nginx
nano ~/host-nginx/conf.d/router.conf
# Add CN Terminal routing (see CN_TERMINAL_NGINX_SETUP.md)

# Reload nginx
docker exec host-nginx nginx -t
docker exec host-nginx nginx -s reload
```

---

## 📋 Quick Command Reference

```bash
# Status
docker-compose -f docker-compose.prod.yml ps

# Logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart
docker-compose -f docker-compose.prod.yml restart

# Stop
docker-compose -f docker-compose.prod.yml down

# Start
docker-compose -f docker-compose.prod.yml up -d

# Rebuild
docker-compose -f docker-compose.prod.yml up -d --build
```

---

**Ready to check?** SSH to your server and run the commands above! 🚀


