# Fix GitHub Secrets and Redeploy

## ✅ Good Approach!
Updating GitHub Secrets will ensure values are correct and get deployed automatically.

---

## 🔧 Step 1: Update GitHub Secrets

Go to your GitHub repository → **Settings → Secrets and variables → Actions**

### Secrets to Update/Add:

**1. CORS_ORIGIN** (if missing or empty)
```
Name: CORS_ORIGIN
Value: https://app.cnterminalghana.com
```

**2. REACT_APP_API_URL** (if missing or empty)
```
Name: REACT_APP_API_URL
Value: https://app.cnterminalghana.com/api
```

**3. DATABASE_URL** (if missing or has placeholder)
```
Name: DATABASE_URL
Value: postgresql://cn_terminal_user:Jemima@43457957345757f57df34f98d34f4@postgres:5432/cn_terminal_db?schema=public
```
**Note:** Use your actual `DB_PASSWORD` value in the URL

**4. REACT_APP_SENDGRID_API_KEY** (if incomplete)
```
Name: REACT_APP_SENDGRID_API_KEY
Value: (your complete SendGrid API key)
```

---

## 📋 Complete GitHub Secrets Checklist

Make sure all these are set:

- [ ] `PROD_SERVER_IP`
- [ ] `PROD_SERVER_USER`
- [ ] `PROD_SERVER_SSH_KEY`
- [ ] `DATABASE_URL` ← **Update this**
- [ ] `DB_PASSWORD`
- [ ] `JWT_SECRET`
- [ ] `REACT_APP_API_URL` ← **Update this**
- [ ] `FRONTEND_URL`
- [ ] `PRODUCTION_URL`
- [ ] `APP_BASE_URL`
- [ ] `CORS_ORIGIN` ← **Update this**
- [ ] `REACT_APP_SENDGRID_API_KEY` ← **Check this**
- [ ] `REACT_APP_FROM_EMAIL`
- [ ] `REACT_APP_FROM_NAME`

---

## 🚀 Step 2: Trigger Redeployment

**After updating GitHub Secrets, trigger deployment:**

### Option A: Push to trigger deployment

```bash
# On your local machine
git checkout main

# Make a small change (or just commit)
git commit --allow-empty -m "Trigger deployment after updating secrets"

# Push to main
git push origin main

# Then deploy to production
./deploy-production.sh
```

### Option B: Manual trigger in GitHub

1. Go to GitHub → **Actions** tab
2. Click **"Deploy to Production"** workflow
3. Click **"Run workflow"** button
4. Select branch: `production`
5. Click **"Run workflow"**

---

## ✅ Step 3: Verify Deployment

After deployment completes:

```bash
# On your server
cd ~/cn_terminal

# Check .env.production was updated
cat .env.production

# Check containers are running
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs --tail 20
```

---

## 🎯 What Happens

1. GitHub Actions will:
   - Connect to server
   - Pull latest code
   - Create/update `.env.production` from GitHub Secrets
   - Build and start containers
   - Set up database

2. Your `.env.production` will have:
   - ✅ `CORS_ORIGIN=https://app.cnterminalghana.com`
   - ✅ `REACT_APP_API_URL=https://app.cnterminalghana.com/api`
   - ✅ `DATABASE_URL` with correct password
   - ✅ All other values from GitHub Secrets

---

## 📋 Quick Checklist

- [ ] Updated `CORS_ORIGIN` in GitHub Secrets
- [ ] Updated `REACT_APP_API_URL` in GitHub Secrets
- [ ] Updated `DATABASE_URL` in GitHub Secrets (with correct password)
- [ ] Verified `REACT_APP_SENDGRID_API_KEY` is complete
- [ ] Triggered deployment (push or manual)
- [ ] Deployment completed
- [ ] Containers are running

---

**Update the secrets in GitHub, then trigger redeployment!** 🚀

