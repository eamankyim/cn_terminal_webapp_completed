# Step 4.3: Fix Both Issues and Start Containers

## ✅ Issues Found:
1. **docker-compose** needs `.env` file (not `.env.production`)
2. **Frontend Dockerfile** runs `npm ci` which triggers build before `public/` is copied

---

## 🔧 Fix 1: Create .env file for docker-compose

```bash
# On your server
cd ~/cn_terminal

# Copy .env.production to .env (docker-compose reads .env automatically)
cp .env.production .env

# Verify it was created
cat .env
```

---

## 🔧 Fix 2: Frontend Dockerfile Updated

I've updated the Dockerfile to skip the postinstall script during `npm ci`, then build manually after copying all files.

**The fix:** Use `npm ci --ignore-scripts` to skip postinstall, then build after copying source code.

---

## 📋 Commands to Run

### Step 1: Create .env file
```bash
cd ~/cn_terminal
cp .env.production .env
```

### Step 2: Pull latest code (to get fixed Dockerfile)
```bash
cd ~/cn_terminal
git pull origin production
# Or if you need to pull from main:
git fetch origin
git checkout production
git pull origin production
```

### Step 3: Start containers
```bash
cd ~/cn_terminal
docker-compose -f docker-compose.prod.yml up -d --build
```

### Step 4: Check status
```bash
docker-compose -f docker-compose.prod.yml ps
```

---

## ✅ Expected Output

After starting, you should see:
```
NAME                    STATUS              PORTS
cn_terminal_postgres    Up                 0.0.0.0:5434->5432/tcp
cn_terminal_backend     Up                 0.0.0.0:5001->5000/tcp
cn_terminal_frontend    Up                 0.0.0.0:3004->3000/tcp
cn_terminal-nginx       Up
```

---

## ✅ Step 4.3 Complete Checklist

- [ ] Created `.env` file from `.env.production`
- [ ] Pulled latest code (with fixed Dockerfile)
- [ ] Started containers (`docker-compose up -d --build`)
- [ ] All containers are running
- [ ] No warnings about missing variables

---

## 🎯 Next: Step 4.4

Once containers are running, we'll connect nginx to host-network!

---

**Run the commands above and let me know when containers are running!** ✅

