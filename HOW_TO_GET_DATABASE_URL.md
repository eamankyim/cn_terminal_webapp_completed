# How to Get DATABASE_URL

The DATABASE_URL depends on which PostgreSQL setup you're using.

## 📋 Option 1: Using Separate PostgreSQL Container (Recommended)

If you're using the PostgreSQL container we configured in `docker-compose.prod.yml`, the DATABASE_URL format is:

### Format:
```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=public
```

### For Docker Compose:
```env
DATABASE_URL=postgresql://cn_terminal_user:${DB_PASSWORD}@postgres:5432/cn_terminal_db?schema=public
```

**Explanation:**
- `cn_terminal_user` - Database user (from docker-compose.prod.yml)
- `${DB_PASSWORD}` - Password from .env.production (or replace with actual password)
- `postgres` - Hostname (Docker service name, not server IP)
- `5432` - Internal PostgreSQL port (always 5432 inside Docker network)
- `cn_terminal_db` - Database name (from docker-compose.prod.yml)
- `schema=public` - PostgreSQL schema

**Note:** Inside Docker network, use `postgres` as hostname (not `localhost` or server IP)

---

## 📋 Option 2: Using Existing PostgreSQL Service

If you want to use an existing PostgreSQL service (like sabito or bestdeal), you need:

### Steps to Get the URL:

**1. Find PostgreSQL Connection Details:**

```bash
# Check what PostgreSQL services are running
docker ps | grep postgres

# Check what ports they use
sudo ss -tulpn | grep postgres
```

**2. Get Connection Details:**

You'll need:
- **Host:** Server IP or Docker service name
- **Port:** External port (e.g., 5432, 5433)
- **Username:** Database username
- **Password:** Database password
- **Database:** Database name (or create new one)

**3. Format the URL:**

```env
# If PostgreSQL is on same server (different port):
DATABASE_URL=postgresql://username:password@localhost:5433/cn_terminal_db?schema=public

# If PostgreSQL is on different server:
DATABASE_URL=postgresql://username:password@postgres-host:5432/cn_terminal_db?schema=public

# If using Docker service name:
DATABASE_URL=postgresql://username:password@sabito-postgres:5432/cn_terminal_db?schema=public
```

---

## 🔍 How to Check Existing PostgreSQL Services

### On Your Server:

```bash
# 1. Check running PostgreSQL containers
docker ps | grep postgres

# 2. Check PostgreSQL ports
sudo ss -tulpn | grep -E ":(5432|5433|5434)"

# 3. Check Docker Compose files (if available)
find ~ -name "docker-compose*.yml" -exec grep -l "postgres" {} \;

# 4. Check environment variables (if containers have env files)
docker inspect <postgres-container-name> | grep -A 20 "Env"
```

### Get Connection Info from Existing Container:

```bash
# If you see a postgres container, inspect it:
docker inspect <container-name> | grep -A 10 "POSTGRES"

# Or check environment variables:
docker exec <container-name> env | grep POSTGRES
```

---

## 🎯 Recommended: Use Separate PostgreSQL Container

**For your setup, I recommend using the separate PostgreSQL container we configured:**

### In `.env.production`:

```env
DATABASE_URL=postgresql://cn_terminal_user:${DB_PASSWORD}@postgres:5432/cn_terminal_db?schema=public
```

**Why?**
- ✅ Isolated database (doesn't affect other services)
- ✅ Uses port 5434 externally (no conflicts)
- ✅ Easy to manage
- ✅ Already configured in docker-compose.prod.yml

### What You Need:

1. **Set DB_PASSWORD in .env.production:**
   ```env
   DB_PASSWORD=your_secure_password_here
   ```

2. **The DATABASE_URL will automatically use this password:**
   ```env
   DATABASE_URL=postgresql://cn_terminal_user:${DB_PASSWORD}@postgres:5432/cn_terminal_db?schema=public
   ```

---

## 📝 Complete .env.production Example

```env
# Database Configuration
DB_PASSWORD=mySecurePassword123!

# DATABASE_URL (uses DB_PASSWORD variable)
DATABASE_URL=postgresql://cn_terminal_user:${DB_PASSWORD}@postgres:5432/cn_terminal_db?schema=public
```

**Or if you want to hardcode the password:**

```env
DATABASE_URL=postgresql://cn_terminal_user:mySecurePassword123!@postgres:5432/cn_terminal_db?schema=public
```

---

## 🔧 If Using Existing PostgreSQL

### Step 1: Connect to Existing PostgreSQL

```bash
# Connect to existing PostgreSQL (use correct port)
psql -h localhost -p 5432 -U postgres -d postgres
# OR
psql -h localhost -p 5433 -U postgres -d postgres
```

### Step 2: Create Database and User

```sql
-- Create database
CREATE DATABASE cn_terminal_db;

-- Create user
CREATE USER cn_terminal_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE cn_terminal_db TO cn_terminal_user;

-- Connect to new database
\c cn_terminal_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO cn_terminal_user;
```

### Step 3: Update DATABASE_URL

```env
# If using existing PostgreSQL on port 5432:
DATABASE_URL=postgresql://cn_terminal_user:your_secure_password@localhost:5432/cn_terminal_db?schema=public

# If using existing PostgreSQL on port 5433:
DATABASE_URL=postgresql://cn_terminal_user:your_secure_password@localhost:5433/cn_terminal_db?schema=public
```

---

## ✅ Quick Reference

### For Docker Compose (Recommended):
```env
DATABASE_URL=postgresql://cn_terminal_user:${DB_PASSWORD}@postgres:5432/cn_terminal_db?schema=public
```

### For Existing PostgreSQL on Same Server:
```env
DATABASE_URL=postgresql://username:password@localhost:PORT/cn_terminal_db?schema=public
```

### For Existing PostgreSQL on Different Server:
```env
DATABASE_URL=postgresql://username:password@SERVER_IP:PORT/cn_terminal_db?schema=public
```

---

## 🎯 For Your Setup

**Based on your server configuration, use this in `.env.production`:**

```env
# Option 1: Separate PostgreSQL Container (Recommended)
DB_PASSWORD=your_secure_password_here
DATABASE_URL=postgresql://cn_terminal_user:${DB_PASSWORD}@postgres:5432/cn_terminal_db?schema=public

# Option 2: Use Existing PostgreSQL (if you want to share)
# First, check which PostgreSQL service you want to use:
# docker ps | grep postgres
# Then use:
# DATABASE_URL=postgresql://username:password@localhost:5432/cn_terminal_db?schema=public
```

---

## 🔍 Verify DATABASE_URL

After setting up, test the connection:

```bash
# From backend container
docker exec -it cn_terminal_backend npx prisma db pull

# Or test connection
docker exec -it cn_terminal_backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect().then(() => {
  console.log('✅ Database connection successful!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
  process.exit(1);
});
"
```

---

**TL;DR:** For your setup, use:
```env
DATABASE_URL=postgresql://cn_terminal_user:${DB_PASSWORD}@postgres:5432/cn_terminal_db?schema=public
```

Just set `DB_PASSWORD` in `.env.production` and the DATABASE_URL will work automatically! ✅

