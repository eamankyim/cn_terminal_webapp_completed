# Step 4: Push Code to GitHub and Deploy

## ✅ What You've Completed

- [x] GitHub Secrets configured (14 secrets)
- [x] SSH key setup complete
- [x] GitHub Actions workflow created

## 🚀 Next Steps: Push and Deploy

### Step 1: Check Current Status

```bash
# Make sure you're on main branch
git status
git branch
```

### Step 2: Add All Files

```bash
# Add all files including .github/workflows/deploy.yml
git add .

# Check what will be committed
git status
```

### Step 3: Commit Changes

```bash
# Commit all changes
git commit -m "Add automated deployment setup with GitHub Actions"
```

**What's being committed:**
- ✅ `.github/workflows/deploy.yml` - GitHub Actions workflow
- ✅ `docker-compose.prod.yml` - Updated with correct ports
- ✅ All deployment documentation
- ✅ Environment templates
- ✅ All application code

### Step 4: Push to GitHub

```bash
# Push main branch to GitHub
git push origin main
```

### Step 5: Create Production Branch and Deploy

```bash
# Make deployment script executable (if not already)
chmod +x deploy-production.sh

# Run deployment script
./deploy-production.sh
```

**What this script does:**
1. ✅ Checks you're on main branch
2. ✅ Creates `production` branch (if doesn't exist)
3. ✅ Merges main into production
4. ✅ Cleans development files
5. ✅ Pushes to GitHub
6. ✅ **Triggers GitHub Actions deployment!**

---

## 📊 Monitor Deployment

### 1. Watch GitHub Actions

1. Go to your GitHub repository
2. Click **"Actions"** tab
3. You should see **"Deploy to Production"** workflow running
4. Click on it to see real-time logs

### 2. What to Expect

The workflow will:
- ✅ Connect to your server via SSH
- ✅ Pull latest code from production branch
- ✅ Create/update `.env.production` from GitHub secrets
- ✅ Build Docker images
- ✅ Start containers
- ✅ Connect nginx to host-network
- ✅ Set up database schema
- ✅ Show container status

### 3. Check Deployment Status

**On GitHub:**
- Go to Actions tab
- Click on the latest workflow run
- Watch the logs

**On Server (SSH):**
```bash
ssh user@your-server-ip
cd ~/cn_terminal
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

---

## ✅ After Deployment Completes

### Step 1: Verify Containers Are Running

```bash
ssh user@your-server-ip
cd ~/cn_terminal
docker-compose -f docker-compose.prod.yml ps
```

**Expected output:**
```
NAME                    STATUS
cn_terminal_postgres    Up
cn_terminal_backend     Up
cn_terminal_frontend    Up
cn_terminal-nginx       Up
```

### Step 2: Check Logs

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker logs cn_terminal_backend --tail 50
docker logs cn_terminal_frontend --tail 50
```

### Step 3: Create Admin User (First Time Only)

```bash
docker exec -it cn_terminal_backend node scripts/create-admin.js
```

**Follow prompts:**
- Name: (e.g., "Super Admin")
- Email: (e.g., "admin@cnterminal.com")
- Password: (choose secure password)

### Step 4: Test API

```bash
# Test health endpoint
curl http://localhost:5001/api/health

# Should return:
# {"status":"OK","message":"CN Terminal API is running","timestamp":"..."}
```

### Step 5: Configure Nginx (If Using host-nginx)

If you have existing host-nginx, add routing:

```bash
# Add routing rules to host-nginx
nano ~/host-nginx/conf.d/router.conf
```

**Add this configuration (see CN_TERMINAL_NGINX_SETUP.md for full config):**
```nginx
# CN Terminal - app.cnterminalghana.com
server {
    listen 443 ssl http2;
    server_name app.cnterminalghana.com;
    
    location / {
        set $cn_terminal_upstream cn_terminal-nginx:443;
        proxy_pass https://$cn_terminal_upstream;
        # ... (see full config)
    }
}
```

**Then reload:**
```bash
docker exec host-nginx nginx -t
docker exec host-nginx nginx -s reload
```

---

## 🎯 Quick Commands Summary

```bash
# 1. Push to GitHub
git add .
git commit -m "Add automated deployment"
git push origin main

# 2. Deploy to production
./deploy-production.sh

# 3. Monitor deployment
# - Check GitHub Actions tab
# - Or SSH to server and check logs

# 4. After deployment
ssh user@server-ip
cd ~/cn_terminal
docker-compose -f docker-compose.prod.yml ps
docker exec -it cn_terminal_backend node scripts/create-admin.js
```

---

## 🆘 Troubleshooting

### GitHub Actions Fails

**Check:**
- All 14 secrets are set correctly
- SSH key is correct
- Server is accessible

**Fix:**
- Check GitHub Actions logs
- Verify secrets in repository settings
- Test SSH connection manually

### Deployment Fails on Server

**Check logs:**
```bash
ssh user@server-ip
cd ~/cn_terminal
docker-compose -f docker-compose.prod.yml logs -f
```

**Common issues:**
- Port conflicts → Check ports are available
- Database connection → Check DATABASE_URL
- Environment variables → Check .env.production

### Containers Not Starting

```bash
# Check container status
docker ps -a

# Check specific container logs
docker logs cn_terminal_backend
docker logs cn_terminal_frontend

# Restart containers
docker-compose -f docker-compose.prod.yml restart
```

---

## ✅ Deployment Checklist

After deployment:

- [ ] GitHub Actions workflow completed successfully
- [ ] All containers are running
- [ ] Database connection works
- [ ] API health check returns 200
- [ ] Admin user created
- [ ] Nginx routing configured (if using host-nginx)
- [ ] Application accessible via domain

---

## 🚀 Future Deployments

**From now on, deploying is simple:**

```bash
# 1. Make changes on main
git checkout main
# ... make changes ...
git add .
git commit -m "Your changes"
git push origin main

# 2. Deploy to production
./deploy-production.sh
```

**That's it!** GitHub Actions will automatically deploy to your server. ✅

---

**Ready to deploy?** Run the commands above! 🚀

