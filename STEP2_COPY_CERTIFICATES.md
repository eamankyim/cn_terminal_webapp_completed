# Step 2: Copy Certificates - Fix Directory Issue

## ✅ Good News!
You already have the certificate for `app.cnterminalghana.com`! 

## ❌ Issue
The directory `~/cn_terminal/nginx/ssl/` doesn't exist yet.

---

## 🔧 Fix: Create Directory and Copy Certificates

**Run these commands on your server:**

```bash
# 1. Create the SSL directory for CN Terminal
mkdir -p ~/cn_terminal/nginx/ssl

# 2. Copy certificates to host-nginx (if not already done)
sudo cp /etc/letsencrypt/live/app.cnterminalghana.com/fullchain.pem ~/host-nginx/ssl/app.cnterminalghana.com.crt
sudo cp /etc/letsencrypt/live/app.cnterminalghana.com/privkey.pem ~/host-nginx/ssl/app.cnterminalghana.com.key
chmod 644 ~/host-nginx/ssl/app.cnterminalghana.com.crt
chmod 600 ~/host-nginx/ssl/app.cnterminalghana.com.key

# 3. Copy certificates to CN Terminal nginx
sudo cp /etc/letsencrypt/live/app.cnterminalghana.com/fullchain.pem ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.crt
sudo cp /etc/letsencrypt/live/app.cnterminalghana.com/privkey.pem ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.key

# 4. Set proper permissions
chmod 644 ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.crt
chmod 600 ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.key

# 5. Verify files exist
ls -la ~/host-nginx/ssl/app.cnterminalghana.com.*
ls -la ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.*
```

---

## ✅ Step 2 Complete Checklist

- [ ] Created `~/cn_terminal/nginx/ssl/` directory
- [ ] Copied certificate to `~/host-nginx/ssl/app.cnterminalghana.com.crt`
- [ ] Copied key to `~/host-nginx/ssl/app.cnterminalghana.com.key`
- [ ] Copied certificate to `~/cn_terminal/nginx/ssl/app.cnterminalghana.com.crt`
- [ ] Copied key to `~/cn_terminal/nginx/ssl/app.cnterminalghana.com.key`
- [ ] Set correct permissions (644 for crt, 600 for key)
- [ ] Verified files exist

---

## 🎯 Next: Step 3

Once Step 2 is complete, we'll move to **Step 3: Add Routing to host-nginx**

---

**Run the commands above and let me know when done!** ✅


