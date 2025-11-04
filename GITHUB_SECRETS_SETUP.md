# GitHub Secrets Setup Guide

## Overview

All environment variables are stored as **GitHub Secrets** for security. When you push to the `production` branch, GitHub Actions automatically creates the `.env` file on your server using these secrets.

## Required Secrets

Go to your repository → **Settings → Secrets and variables → Actions → New repository secret**

### 1. Server Connection Secrets

#### `PROD_SERVER_IP`
**Value:** `81.0.247.14`  
**Purpose:** Server IP address for SSH connection

#### `PROD_SERVER_USER`
**Value:** Your SSH username (e.g., `root`, `ubuntu`, `admin`)  
**Purpose:** SSH username for server login

#### `PROD_SERVER_SSH_KEY`
**Value:** Your private SSH key (entire contents)  
**Purpose:** Private key for SSH authentication

**How to get:**
```bash
# Display private key
cat ~/.ssh/id_rsa

# If you don't have one:
ssh-keygen -t rsa -b 4096 -C "github-deploy@cnterminal"
cat ~/.ssh/id_rsa.pub  # Add this to server's ~/.ssh/authorized_keys
cat ~/.ssh/id_rsa      # Copy this entire output to GitHub secret
```

### 2. Application Environment Secrets

#### `DB_PASSWORD`
**Value:** A secure database password (at least 24 characters)  
**Purpose:** PostgreSQL database password  
**Generate:**
```bash
openssl rand -base64 24 | tr -d '=+\/'
# or
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### `JWT_SECRET`
**Value:** A strong random secret (64+ characters)  
**Purpose:** JWT token signing secret  
**Generate:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# or
openssl rand -hex 64
```

#### `REACT_APP_API_URL`
**Value:** `https://app.cnterminalghana.com/api`  
**Purpose:** Backend API URL for frontend

#### `FRONTEND_URL`
**Value:** `https://app.cnterminalghana.com`  
**Purpose:** Frontend URL for Socket.IO connection

#### `PRODUCTION_URL`
**Value:** `https://app.cnterminalghana.com`  
**Purpose:** Production URL for Swagger/API docs

#### `CORS_ORIGIN`
**Value:** `https://app.cnterminalghana.com`  
**Purpose:** Allowed CORS origins (comma-separated if multiple)

#### `APP_BASE_URL`
**Value:** `https://app.cnterminalghana.com`  
**Purpose:** Application base URL for invitation links

## Setup Instructions

### Step 1: Generate Secrets

```bash
# Generate database password
echo "DB_PASSWORD: $(openssl rand -base64 24 | tr -d '=+\/')"

# Generate JWT secret
echo "JWT_SECRET: $(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
```

### Step 2: Add to GitHub Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret one by one:

```
Name: PROD_SERVER_IP
Value: 81.0.247.14

Name: PROD_SERVER_USER
Value: your-ssh-username

Name: PROD_SERVER_SSH_KEY
Value: -----BEGIN OPENSSH PRIVATE KEY-----
[your entire private key]
-----END OPENSSH PRIVATE KEY-----

Name: DB_PASSWORD
Value: your-generated-password

Name: JWT_SECRET
Value: your-generated-jwt-secret

Name: REACT_APP_API_URL
Value: https://app.cnterminalghana.com/api

Name: FRONTEND_URL
Value: https://app.cnterminalghana.com

Name: PRODUCTION_URL
Value: https://app.cnterminalghana.com

Name: CORS_ORIGIN
Value: https://app.cnterminalghana.com

Name: APP_BASE_URL
Value: https://app.cnterminalghana.com
```

### Step 3: Verify Secrets

After adding all secrets, you should see 10 secrets in your **Actions secrets** list:
- ✅ PROD_SERVER_IP
- ✅ PROD_SERVER_USER
- ✅ PROD_SERVER_SSH_KEY
- ✅ DB_PASSWORD
- ✅ JWT_SECRET
- ✅ REACT_APP_API_URL
- ✅ FRONTEND_URL
- ✅ PRODUCTION_URL
- ✅ CORS_ORIGIN
- ✅ APP_BASE_URL

## Security Best Practices

1. ✅ **Never commit secrets** - They only exist in GitHub Secrets
2. ✅ **Use strong random passwords** - Generate with OpenSSL or Node.js
3. ✅ **Rotate secrets periodically** - Change every 90 days
4. ✅ **Limit access** - Only admins can view/modify secrets
5. ✅ **Don't share secrets** - Use encrypted channels if needed
6. ✅ **Monitor secret usage** - Check GitHub Actions logs

## Troubleshooting

### Secrets not being used

Check GitHub Actions logs:
```bash
# Go to: Your Repo → Actions → Select latest run → Check logs
```

Look for: `📝 Creating .env file from GitHub secrets...`

### SSH connection failing

1. Verify `PROD_SERVER_SSH_KEY` is complete (includes BEGIN/END lines)
2. Test SSH manually:
   ```bash
   ssh -i ~/.ssh/id_rsa your-username@81.0.247.14
   ```
3. Check server's `~/.ssh/authorized_keys` has your public key

### Environment variables not set

1. Check `.env` file on server:
   ```bash
   ssh your-username@81.0.247.14
   cd ~/cn_terminal
   cat .env
   ```
2. Verify all secrets are added in GitHub
3. Check for typos in secret names (must match exactly)

## Updating Secrets

**To update a secret:**
1. Go to Settings → Secrets and variables → Actions
2. Find the secret
3. Click **Update**
4. Enter new value
5. Click **Update secret**

**Next deployment will use the new value automatically!**

## Production vs Development

### Development (Local)
- Uses `.env` file in project root
- Never committed to Git
- Contains local configuration

### Production (Server)
- `.env` created automatically from GitHub Secrets
- Managed by GitHub Actions
- Never manually edited on server
- Persists across deployments

## Summary

✅ All secrets stored securely in GitHub  
✅ Automatically deployed to server  
✅ No manual `.env` file editing needed  
✅ Secrets isolated from code repository  
✅ Easy to rotate/update secrets  

