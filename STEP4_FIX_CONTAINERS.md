# Step 4: Fix CN Terminal Containers Not Running

## ❌ Issue Found

1. **CN Terminal containers are not running** - `docker-compose ps` shows no containers
2. **Environment variables not set** - Warnings about missing variables
3. **502 Bad Gateway** - host-nginx can't reach cn_terminal-nginx (container doesn't exist)

---

## 🔧 Fix: Create .env.production and Start Containers

### Step 4.1: Check if .env.production exists

```bash
# On your server
cd ~/cn_terminal

# Check if .env.production exists
ls -la .env.production

# If it doesn't exist, we need to create it
```

### Step 4.2: Create .env.production from GitHub Secrets

**The GitHub Actions deployment should have created this, but let's check:**

```bash
# Check if .env.production exists
cat .env.production

# If it doesn't exist or is empty, we need to create it manually
```

### Step 4.3: Create .env.production Manually

**If .env.production doesn't exist, create it:**

```bash
# Create .env.production file
nano .env.production
```

**Add these values (use your actual values from GitHub Secrets):**

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
- `YOUR_DB_PASSWORD` - Your database password
- `YOUR_JWT_SECRET` - Your JWT secret (from GitHub Secrets)
- `YOUR_SENDGRID_API_KEY` - Your SendGrid API key
- `noreply@yourdomain.com` - Your email sender address

### Step 4.4: Load Environment Variables and Start Containers

```bash
# Load environment variables
source .env.production

# Start containers
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Step 4.5: Connect nginx to host-network

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
- [ ] CN Terminal containers are running
- [ ] cn_terminal-nginx connected to host-network
- [ ] No warnings about missing variables

---

## 🆘 Quick Fix Commands

**If .env.production exists but containers aren't starting:**

```bash
cd ~/cn_terminal
source .env.production
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml ps
```

---

## 🎯 Next: Step 5

Once containers are running, we'll test again!

---

**Let's fix the containers first, then test again!** ✅


