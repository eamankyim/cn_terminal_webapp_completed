# Step 4.3: Load Environment Variables and Start Containers

## ✅ Step 4.2 Complete!
`.env.production` file exists with correct values.

## ❌ Issue
docker-compose isn't reading `.env.production` automatically - it reads `.env` by default.

---

## 🔧 Solution: Load Environment Variables

### Option 1: Source .env.production (Recommended)

```bash
# On your server
cd ~/cn_terminal

# Load environment variables from .env.production
source .env.production

# Now start containers (they will use the loaded variables)
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Option 2: Create .env file (Alternative)

```bash
# Copy .env.production to .env (docker-compose reads .env automatically)
cp .env.production .env

# Then start containers
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📋 Step 4.3: Commands to Run

```bash
# 1. Navigate to directory
cd ~/cn_terminal

# 2. Load environment variables
source .env.production

# 3. Verify variables are loaded
echo $DB_PASSWORD
echo $JWT_SECRET
# Should show the values (not empty)

# 4. Start containers
docker-compose -f docker-compose.prod.yml up -d

# 5. Check status
docker-compose -f docker-compose.prod.yml ps
```

---

## ✅ Expected Output After Starting

```
NAME                    STATUS              PORTS
cn_terminal_postgres    Up                 0.0.0.0:5434->5432/tcp
cn_terminal_backend     Up                 0.0.0.0:5001->5000/tcp
cn_terminal_frontend    Up                 0.0.0.0:3004->3000/tcp
cn_terminal-nginx       Up
```

---

## ✅ Step 4.3 Complete Checklist

- [ ] Loaded environment variables (`source .env.production`)
- [ ] Verified variables are set (not empty)
- [ ] Started containers (`docker-compose up -d`)
- [ ] All containers are running
- [ ] No warnings about missing variables

---

## 🎯 Next: Step 4.4

Once containers are running, we'll connect nginx to host-network!

---

**Run the commands above and let me know when containers are running!** ✅

