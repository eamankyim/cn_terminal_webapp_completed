# 🚀 GitHub Automated Deployment Setup

This guide will help you set up automated deployment so that when you push to GitHub, your server automatically deploys.

## 📋 Overview

**How it works:**
1. You push code to `main` branch
2. Run `./deploy-production.sh` (merges main → production, pushes to GitHub)
3. GitHub Actions detects push to `production` branch
4. GitHub Actions connects to your server via SSH
5. Server pulls latest code, builds, and restarts containers
6. ✅ Deployment complete!

---

## 🔧 Step 1: Set Up GitHub Secrets

Go to your GitHub repository → **Settings → Secrets and variables → Actions**

Click **"New repository secret"** and add these secrets:

### Server Connection Secrets:

**1. PROD_SERVER_IP**
```
Name: PROD_SERVER_IP
Value: your-server-ip (e.g., 81.0.247.14)
```

**2. PROD_SERVER_USER**
```
Name: PROD_SERVER_USER
Value: your-ssh-username (e.g., root)
```

**3. PROD_SERVER_SSH_KEY**
```
Name: PROD_SERVER_SSH_KEY
Value: (your private SSH key - see below)
```

### How to Get Your SSH Key:

**If you already have an SSH key:**

```bash
# On your local machine
cat ~/.ssh/id_rsa
# Copy the ENTIRE output including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ... (all the content) ...
# -----END OPENSSH PRIVATE KEY-----
```

**If you don't have an SSH key:**

```bash
# Generate SSH key
ssh-keygen -t rsa -b 4096 -C "github-deploy@cnterminal"
# Press Enter to accept default location
# Press Enter twice for no passphrase (or set one if you prefer)

# Add public key to server
ssh-copy-id user@your-server-ip
# OR manually copy:
cat ~/.ssh/id_rsa.pub
# Then add to server: ~/.ssh/authorized_keys

# Copy private key to GitHub secret
cat ~/.ssh/id_rsa
# Copy entire output to PROD_SERVER_SSH_KEY secret
```

### Application Environment Secrets:

**4. DATABASE_URL** (Optional - if not provided, will be constructed from DB_PASSWORD)
```
Name: DATABASE_URL
Value: postgresql://cn_terminal_user:password@postgres:5432/cn_terminal_db?schema=public
```
**OR** if using existing PostgreSQL:
```
Value: postgresql://username:password@localhost:5432/cn_terminal_db?schema=public
```

**5. DB_PASSWORD** (Required if DATABASE_URL not provided)
```
Name: DB_PASSWORD
Value: your_secure_database_password
```

**6. JWT_SECRET**
```
Name: JWT_SECRET
Value: (generate with: openssl rand -base64 32)
```

**7. REACT_APP_API_URL**
```
Name: REACT_APP_API_URL
Value: https://app.cnterminalghana.com/api
```

**8. FRONTEND_URL**
```
Name: FRONTEND_URL
Value: https://app.cnterminalghana.com
```

**9. PRODUCTION_URL**
```
Name: PRODUCTION_URL
Value: https://app.cnterminalghana.com
```

**10. APP_BASE_URL**
```
Name: APP_BASE_URL
Value: https://app.cnterminalghana.com
```

**11. CORS_ORIGIN**
```
Name: CORS_ORIGIN
Value: https://app.cnterminalghana.com
```

**12. REACT_APP_SENDGRID_API_KEY**
```
Name: REACT_APP_SENDGRID_API_KEY
Value: your_sendgrid_api_key
```

**13. REACT_APP_FROM_EMAIL**
```
Name: REACT_APP_FROM_EMAIL
Value: noreply@yourdomain.com
```

**14. REACT_APP_FROM_NAME**
```
Name: REACT_APP_FROM_NAME
Value: CN Terminal
```

---

## 📤 Step 2: Push Code to GitHub

### First Time Setup:

```bash
# Make sure you're on main branch
git checkout main

# Add all files
git add .

# Commit changes
git commit -m "Add automated deployment setup"

# Push to GitHub
git push origin main
```

### Create Production Branch:

```bash
# Run the deployment script (creates production branch)
chmod +x deploy-production.sh
./deploy-production.sh
```

This script will:
1. ✅ Create `production` branch
2. ✅ Merge `main` into `production`
3. ✅ Clean development files
4. ✅ Push to GitHub
5. ✅ Trigger GitHub Actions deployment

---

## 🚀 Step 3: Deploy Automatically

**From now on, deploying is simple:**

```bash
# 1. Make your changes on main branch
git checkout main
# ... make changes ...
git add .
git commit -m "Your changes"
git push origin main

# 2. Deploy to production
./deploy-production.sh
```

**That's it!** GitHub Actions will automatically:
1. ✅ Connect to your server
2. ✅ Pull latest code
3. ✅ Create/update .env.production
4. ✅ Build Docker images
5. ✅ Start containers
6. ✅ Set up database
7. ✅ Connect to host-network

---

## 📊 Step 4: Monitor Deployment

### Check GitHub Actions:

1. Go to your GitHub repository
2. Click **"Actions"** tab
3. Click on **"Deploy to Production"** workflow
4. Watch the deployment in real-time

### Check Server Status:

```bash
# SSH to your server
ssh user@your-server-ip

# Check containers
cd ~/cn_terminal
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## ✅ Step 5: First-Time Manual Setup

After first deployment, you need to:

**1. Create Admin User:**
```bash
ssh user@your-server-ip
cd ~/cn_terminal
docker exec -it cn_terminal_backend node scripts/create-admin.js
```

**2. Configure Nginx (if using host-nginx):**
```bash
# Add routing rules to host-nginx
nano ~/host-nginx/conf.d/router.conf
# Add CN Terminal routing (see CN_TERMINAL_NGINX_SETUP.md)
docker exec host-nginx nginx -s reload
```

---

## 🔍 Troubleshooting

### GitHub Actions Fails

**Error: "Connection refused"**
- Check `PROD_SERVER_IP` is correct
- Check `PROD_SERVER_USER` is correct
- Verify SSH key is correct
- Test SSH connection manually: `ssh user@server-ip`

**Error: "Permission denied"**
- Verify SSH key is in server's `~/.ssh/authorized_keys`
- Check SSH key has correct permissions: `chmod 600 ~/.ssh/id_rsa`

**Error: "Repository not found"**
- Check repository is public or has GitHub Actions enabled
- Verify repository URL is correct

### Deployment Fails on Server

**Check logs:**
```bash
# On server
cd ~/cn_terminal
docker-compose -f docker-compose.prod.yml logs -f
```

**Check container status:**
```bash
docker-compose -f docker-compose.prod.yml ps
docker ps -a
```

**Manual deployment:**
```bash
cd ~/cn_terminal
source .env.production
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📝 Workflow Summary

```
Local Machine          GitHub           Server
     │                    │                │
     │─── push main ──────>│                │
     │                    │                │
     │─── deploy-prod.sh ─>│                │
     │                    │                │
     │                    │─── push prod ───>│
     │                    │                │
     │                    │─── trigger ────>│
     │                    │   GitHub Actions │
     │                    │                │
     │                    │                │─── SSH & Deploy
     │                    │                │
     │                    │                │─── ✅ Complete
```

---

## 🎯 Quick Reference

**Deploy:**
```bash
./deploy-production.sh
```

**Check deployment:**
- GitHub: Repository → Actions → "Deploy to Production"
- Server: `docker-compose -f docker-compose.prod.yml ps`

**Manual deploy:**
```bash
ssh user@server-ip
cd ~/cn_terminal
./auto-deploy.sh
```

**View logs:**
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

---

## ✅ Setup Checklist

- [ ] GitHub Secrets configured (13 secrets)
- [ ] SSH key added to server
- [ ] Code pushed to GitHub
- [ ] Production branch created
- [ ] First deployment successful
- [ ] Admin user created
- [ ] Nginx routing configured (if needed)
- [ ] Application accessible

---

**Ready to deploy?** Follow the steps above and you'll have automated deployment in minutes! 🚀

