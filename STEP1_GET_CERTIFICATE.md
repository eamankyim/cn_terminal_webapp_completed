# Step 1: Get SSL Certificate for CN Terminal

## 🎯 Goal
Get Let's Encrypt certificate for `app.cnterminalghana.com`

---

## ⚠️ Prerequisites

**Before starting, make sure:**
- [ ] DNS A record is added in GoDaddy (`app` → your server IP)
- [ ] DNS has propagated (wait 5-15 minutes after adding DNS)
- [ ] You can resolve the domain: `nslookup app.cnterminalghana.com` returns your server IP

---

## 📋 Step 1.1: Verify DNS is Working

**On your local machine:**

```bash
# Test DNS resolution
nslookup app.cnterminalghana.com

# Should return your server IP
# If not, wait a few more minutes and try again
```

**Or test on server:**

```bash
# SSH to server
ssh user@your-server-ip

# Test DNS
nslookup app.cnterminalghana.com
dig app.cnterminalghana.com
```

---

## 📋 Step 1.2: Stop host-nginx (Temporarily)

**Certbot needs port 80 to verify domain ownership:**

```bash
# On your server
ssh user@your-server-ip

# Stop host-nginx temporarily
docker stop host-nginx

# Verify it's stopped
docker ps | grep host-nginx
# Should show nothing
```

---

## 📋 Step 1.3: Install Certbot (If Not Installed)

```bash
# Check if certbot is installed
certbot --version

# If not installed:
sudo apt update
sudo apt install certbot -y
```

---

## 📋 Step 1.4: Get Certificate

```bash
# Get certificate for app.cnterminalghana.com
sudo certbot certonly --standalone -d app.cnterminalghana.com
```

**Follow the prompts:**
- **Email address:** Enter your email (for renewal reminders)
- **Agree to terms:** Type `Y` and press Enter
- **Share email:** Your choice (Y or N)

**Expected output:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/app.cnterminalghana.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/app.cnterminalghana.com/privkey.pem
```

---

## 📋 Step 1.5: Verify Certificate

```bash
# Check certificate exists
ls -la /etc/letsencrypt/live/app.cnterminalghana.com/

# Should show:
# - fullchain.pem
# - privkey.pem
# - cert.pem
# - chain.pem

# Check certificate details
sudo certbot certificates | grep app.cnterminalghana.com
```

---

## 📋 Step 1.6: Start host-nginx Again

```bash
# Start host-nginx
docker start host-nginx

# Verify it's running
docker ps | grep host-nginx
```

---

## ✅ Step 1 Complete Checklist

- [ ] DNS A record added in GoDaddy
- [ ] DNS propagated (nslookup works)
- [ ] host-nginx stopped
- [ ] Certbot installed
- [ ] Certificate obtained successfully
- [ ] Certificate files exist in `/etc/letsencrypt/live/app.cnterminalghana.com/`
- [ ] host-nginx started again

---

## 🆘 Troubleshooting

### Error: "Failed to bind to port 80"

**Cause:** Something is using port 80

**Fix:**
```bash
# Check what's using port 80
sudo lsof -i :80
# OR
sudo netstat -tulpn | grep :80

# Stop whatever is using it
# Then try certbot again
```

### Error: "Failed to verify domain ownership"

**Cause:** DNS not propagated or wrong

**Fix:**
- Wait 15-30 minutes for DNS propagation
- Verify DNS: `nslookup app.cnterminalghana.com`
- Check GoDaddy DNS settings

### Error: "Certificate request failed"

**Cause:** Domain not accessible

**Fix:**
- Verify DNS is correct
- Check server firewall allows port 80
- Make sure domain points to correct server IP

---

## 🎯 Next: Step 2

Once Step 1 is complete, we'll move to **Step 2: Copy Certificates**

---

**Ready?** Run the commands above and let me know when Step 1 is complete! ✅


