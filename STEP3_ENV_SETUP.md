# Step 3: Create .env.production File

## 📝 Required Environment Variables

Create `.env.production` file with the following values:

### 1. Database Configuration

```env
# Using separate PostgreSQL container (port 5434)
DATABASE_URL=postgresql://cn_terminal_user:${DB_PASSWORD}@postgres:5432/cn_terminal_db?schema=public
```

### 2. Server Configuration

```env
PORT=5000
```

### 3. JWT Secret (Generate One)

```bash
# On your server, run:
openssl rand -base64 32
# Copy the output to JWT_SECRET below
```

```env
JWT_SECRET=<paste-generated-secret-here>
```

### 4. URLs (Update with Your Domain)

```env
FRONTEND_URL=https://app.cnterminalghana.com
PRODUCTION_URL=https://app.cnterminalghana.com
APP_BASE_URL=https://app.cnterminalghana.com
CORS_ORIGIN=https://app.cnterminalghana.com
REACT_APP_API_URL=https://app.cnterminalghana.com/api
```

### 5. Email Configuration (SendGrid)

```env
REACT_APP_SENDGRID_API_KEY=your_sendgrid_api_key_here
REACT_APP_FROM_EMAIL=noreply@yourdomain.com
REACT_APP_FROM_NAME=CN Terminal
REACT_APP_EMAIL_DEV_MODE=false
```

### 6. Database Password

```env
DB_PASSWORD=your_secure_database_password_here
```

---

## 🚀 Quick Setup

### On Your Server:

```bash
# 1. Navigate to CN Terminal directory
cd ~/cn_terminal  # or wherever you'll deploy

# 2. Copy template
cp env.production.template .env.production

# 3. Generate JWT Secret
JWT_SECRET=$(openssl rand -base64 32)
echo "Generated JWT Secret: $JWT_SECRET"

# 4. Edit .env.production
nano .env.production
```

### Fill In These Values:

1. **JWT_SECRET** - Paste the generated secret from step 3
2. **DB_PASSWORD** - Choose a secure password
3. **FRONTEND_URL** - Your production domain
4. **PRODUCTION_URL** - Your production domain
5. **APP_BASE_URL** - Your production domain
6. **CORS_ORIGIN** - Your production domain
7. **REACT_APP_API_URL** - Your API URL (domain + /api)
8. **REACT_APP_SENDGRID_API_KEY** - Your SendGrid API key
9. **REACT_APP_FROM_EMAIL** - Email sender address
10. **REACT_APP_FROM_NAME** - Email sender name

---

## 📋 Complete .env.production Template

```env
# ============================================
# CN Terminal - Production Environment Variables
# ============================================

# Node Environment
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://cn_terminal_user:${DB_PASSWORD}@postgres:5432/cn_terminal_db?schema=public

# Server Configuration
PORT=5000

# JWT Authentication (Generate: openssl rand -base64 32)
JWT_SECRET=YOUR_JWT_SECRET_HERE

# Frontend/Backend URLs (Update with your domain)
FRONTEND_URL=https://app.cnterminalghana.com
PRODUCTION_URL=https://app.cnterminalghana.com
APP_BASE_URL=https://app.cnterminalghana.com
CORS_ORIGIN=https://app.cnterminalghana.com

# Frontend Build Configuration
REACT_APP_API_URL=https://app.cnterminalghana.com/api

# Email Configuration (SendGrid)
REACT_APP_SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY_HERE
REACT_APP_FROM_EMAIL=noreply@yourdomain.com
REACT_APP_FROM_NAME=CN Terminal
REACT_APP_EMAIL_DEV_MODE=false

# Docker Configuration
DB_PASSWORD=YOUR_SECURE_DB_PASSWORD_HERE
```

---

## ✅ Verification

After creating `.env.production`, verify:

```bash
# Check file exists
ls -la .env.production

# Verify all variables are set (should show no empty values)
grep -E "^[A-Z_]+=.*" .env.production | grep -v "YOUR_.*_HERE"
```

---

## 🎯 Next: Step 4 - Build and Start Services

Once `.env.production` is created, proceed to building and starting the Docker containers.

