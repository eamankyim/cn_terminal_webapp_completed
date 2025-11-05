# GitHub Actions Troubleshooting

## 🔍 How to Check Workflow Logs

### Step 1: View Workflow Logs

1. Go to your GitHub repository
2. Click **"Actions"** tab
3. Click on the failed workflow run (the one that says "Failure")
4. Click on the **"Deploy to Server"** job (or the job name)
5. Expand the steps to see error messages

### Step 2: Common Issues

---

## ❌ Issue 1: Workflow Triggered on Wrong Branch

**Symptom:** Workflow runs on `main` branch but should only run on `production`

**Solution:** The workflow is configured to trigger on `production` branch only. You need to:

1. **Option A: Create production branch first**
   ```bash
   # Run this on your local machine
   ./deploy-production.sh
   ```
   This creates production branch and triggers deployment

2. **Option B: Update workflow to also trigger on main (for testing)**
   Edit `.github/workflows/deploy.yml`:
   ```yaml
   on:
     push:
       branches:
         - production
         - main  # Add this for testing
   ```

---

## ❌ Issue 2: SSH Connection Failed

**Symptom:** Error like "Connection refused" or "Permission denied"

**Check:**
- `PROD_SERVER_IP` is correct
- `PROD_SERVER_USER` is correct
- `PROD_SERVER_SSH_KEY` is correct
- SSH key is in server's `~/.ssh/authorized_keys`

**Fix:**
```bash
# Test SSH connection manually
ssh -i ~/.ssh/id_rsa user@your-server-ip

# If fails, check:
# 1. Server is accessible
# 2. SSH key is correct
# 3. User has permissions
```

---

## ❌ Issue 3: Secrets Not Found

**Symptom:** Error like "Secret not found" or empty values

**Check:**
- All 14 secrets are set in GitHub
- Secret names match exactly (case-sensitive)
- Secrets have values

**Required Secrets:**
1. PROD_SERVER_IP
2. PROD_SERVER_USER
3. PROD_SERVER_SSH_KEY
4. DATABASE_URL
5. DB_PASSWORD
6. JWT_SECRET
7. REACT_APP_API_URL
8. FRONTEND_URL
9. PRODUCTION_URL
10. APP_BASE_URL
11. CORS_ORIGIN
12. REACT_APP_SENDGRID_API_KEY
13. REACT_APP_FROM_EMAIL
14. REACT_APP_FROM_NAME

---

## ❌ Issue 4: Docker Commands Failed

**Symptom:** Error like "docker-compose: command not found" or container errors

**Check:**
- Docker is installed on server
- Docker Compose is installed
- User has permissions to run Docker

**Fix on server:**
```bash
# Check Docker
docker --version
docker-compose --version

# Add user to docker group (if needed)
sudo usermod -aG docker $USER
```

---

## ❌ Issue 5: Git Clone Failed

**Symptom:** Error like "Repository not found" or "Permission denied"

**Check:**
- Repository is public OR
- GitHub Actions has access to repository
- Repository URL is correct

**Fix:**
- Make repository public (if testing)
- Or ensure GitHub Actions has proper permissions
- Check repository URL in workflow

---

## 🔍 Step-by-Step Debugging

### 1. Check Workflow Logs

Go to: Repository → Actions → Failed Workflow → Click on job → Check error messages

### 2. Check Which Step Failed

Look for the step that failed (it will be marked with ❌)

### 3. Read Error Message

The error message will tell you what went wrong

### 4. Common Error Messages

**"Connection refused"**
- SSH connection issue
- Check server IP and SSH key

**"Permission denied"**
- SSH key issue
- Check authorized_keys on server

**"Secret not found"**
- Missing GitHub secret
- Check all secrets are set

**"command not found"**
- Docker/command not installed
- Check server setup

**"Repository not found"**
- Git access issue
- Check repository permissions

---

## ✅ Quick Fixes

### Test SSH Connection

```bash
# From your local machine
ssh -i ~/.ssh/id_rsa user@your-server-ip

# If this works, SSH key is correct
# If not, fix SSH key issue
```

### Check Server Setup

```bash
# SSH to server
ssh user@your-server-ip

# Check Docker
docker --version
docker-compose --version

# Check if directory exists
ls -la ~/cn_terminal
```

### Verify Secrets

```bash
# Check secrets in GitHub:
# Repository → Settings → Secrets and variables → Actions
# Verify all 14 secrets are present
```

---

## 📋 Debugging Checklist

- [ ] Workflow triggered on correct branch (production)
- [ ] All 14 GitHub secrets are set
- [ ] SSH connection works manually
- [ ] Server has Docker installed
- [ ] Server has Docker Compose installed
- [ ] User has Docker permissions
- [ ] Repository is accessible
- [ ] Check workflow logs for specific error

---

## 🆘 Need More Help?

**Share the error message from GitHub Actions logs:**
1. Go to Actions → Failed workflow
2. Click on the job
3. Expand the failed step
4. Copy the error message
5. Share it here

This will help identify the exact issue!


