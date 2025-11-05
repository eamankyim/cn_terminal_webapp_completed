# Setup CN Terminal Certificate - Following Existing Pattern

## 📋 Based on Your Existing Setup

You have:
- Certificates in `~/host-nginx/ssl/` (e.g., `sabito.crt`, `bestdealshippingapp.com.crt`)
- Certificates copied from Let's Encrypt
- Each service has its own certificate
- Pattern: `service-name.crt` and `service-name.key`

---

## 🔧 Step 1: Get Certificate for CN Terminal

### Option A: Get New Certificate (Recommended)

**On your server:**

```bash
# Install Certbot (if not already installed)
sudo apt update
sudo apt install certbot -y

# Stop host-nginx temporarily (if needed)
docker stop host-nginx

# Get certificate for app.cnterminalghana.com
sudo certbot certonly --standalone -d app.cnterminalghana.com

# If you want www subdomain too:
sudo certbot certonly --standalone -d app.cnterminalghana.com -d www.app.cnterminalghana.com

# Start host-nginx again
docker start host-nginx
```

**Certificate will be at:**
- `/etc/letsencrypt/live/app.cnterminalghana.com/fullchain.pem`
- `/etc/letsencrypt/live/app.cnterminalghana.com/privkey.pem`

### Option B: Add to Existing Certificate (If Using Wildcard)

If you have a wildcard certificate for `*.cnterminalghana.com`, you can use that instead.

---

## 📁 Step 2: Copy Certificates to host-nginx (Following Your Pattern)

```bash
# Copy certificates to host-nginx SSL directory (same pattern as sabito/bestdeal)
sudo cp /etc/letsencrypt/live/app.cnterminalghana.com/fullchain.pem ~/host-nginx/ssl/app.cnterminalghana.com.crt
sudo cp /etc/letsencrypt/live/app.cnterminalghana.com/privkey.pem ~/host-nginx/ssl/app.cnterminalghana.com.key

# Set proper permissions (matching your existing files)
sudo chown root:root ~/host-nginx/ssl/app.cnterminalghana.com.crt
sudo chown root:root ~/host-nginx/ssl/app.cnterminalghana.com.key
chmod 644 ~/host-nginx/ssl/app.cnterminalghana.com.crt
chmod 600 ~/host-nginx/ssl/app.cnterminalghana.com.key

# Verify
ls -la ~/host-nginx/ssl/app.cnterminalghana.com.*
```

---

## 📁 Step 3: Copy Certificates to CN Terminal nginx

```bash
# Create SSL directory in CN Terminal
mkdir -p ~/cn_terminal/nginx/ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/app.cnterminalghana.com/fullchain.pem ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.crt
sudo cp /etc/letsencrypt/live/app.cnterminalghana.com/privkey.pem ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.key

# Set permissions
sudo chown $USER:$USER ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.*
chmod 644 ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.crt
chmod 600 ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.key
```

---

## ⚙️ Step 4: Add Routing to host-nginx (Following Your Pattern)

```bash
# Edit host-nginx configuration
nano ~/host-nginx/conf.d/router.conf
```

**Add this configuration (following the same pattern as sabito/bestdeal):**

```nginx
# CN Terminal - app.cnterminalghana.com
# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.cnterminalghana.com www.app.cnterminalghana.com;
    
    ssl_certificate /etc/nginx/ssl/app.cnterminalghana.com.crt;
    ssl_certificate_key /etc/nginx/ssl/app.cnterminalghana.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Frontend
    location / {
        set $cn_terminal_upstream cn_terminal-nginx:443;
        proxy_pass https://$cn_terminal_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_buffering off;
    }
    
    # Backend API
    location /api {
        set $cn_terminal_upstream cn_terminal-nginx:443;
        proxy_pass https://$cn_terminal_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_buffering off;
    }
    
    # API Documentation
    location /api-docs {
        set $cn_terminal_upstream cn_terminal-nginx:443;
        proxy_pass https://$cn_terminal_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Socket.IO support
    location /socket.io {
        set $cn_terminal_upstream cn_terminal-nginx:443;
        proxy_pass https://$cn_terminal_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # File uploads
    location /uploads {
        set $cn_terminal_upstream cn_terminal-nginx:443;
        proxy_pass https://$cn_terminal_upstream;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name app.cnterminalghana.com www.app.cnterminalghana.com;
    return 301 https://$host$request_uri;
}
```

---

## ✅ Step 5: Test and Reload host-nginx

```bash
# Test configuration
docker exec host-nginx nginx -t

# Should show: nginx: the configuration file /etc/nginx/nginx.conf test is successful

# Reload nginx
docker exec host-nginx nginx -s reload
```

---

## 🔄 Step 6: Update Certificate Renewal Script

**If you have a renewal script, add CN Terminal to it:**

```bash
# Check if you have a renewal script
ls -la ~/host-nginx/*.sh
# OR
crontab -l

# Add CN Terminal to renewal (if you have one)
# Or create a renewal entry in crontab
```

**Add to renewal script or crontab:**

```bash
# After renewing certificates, copy CN Terminal certificates
cp /etc/letsencrypt/live/app.cnterminalghana.com/fullchain.pem ~/host-nginx/ssl/app.cnterminalghana.com.crt
cp /etc/letsencrypt/live/app.cnterminalghana.com/privkey.pem ~/host-nginx/ssl/app.cnterminalghana.com.key
cp /etc/letsencrypt/live/app.cnterminalghana.com/fullchain.pem ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.crt
cp /etc/letsencrypt/live/app.cnterminalghana.com/privkey.pem ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.key

# Reload nginx
docker exec host-nginx nginx -s reload
docker exec cn_terminal-nginx nginx -s reload
```

---

## ✅ Step 7: Verify

```bash
# Test HTTPS
curl -I https://app.cnterminalghana.com

# Test API
curl https://app.cnterminalghana.com/api/health

# Check certificate
openssl s_client -connect app.cnterminalghana.com:443 -servername app.cnterminalghana.com < /dev/null 2>/dev/null | openssl x509 -noout -dates
```

---

## 📋 Quick Commands Summary

```bash
# 1. Get certificate
sudo certbot certonly --standalone -d app.cnterminalghana.com

# 2. Copy to host-nginx (following your pattern)
sudo cp /etc/letsencrypt/live/app.cnterminalghana.com/fullchain.pem ~/host-nginx/ssl/app.cnterminalghana.com.crt
sudo cp /etc/letsencrypt/live/app.cnterminalghana.com/privkey.pem ~/host-nginx/ssl/app.cnterminalghana.com.key
chmod 644 ~/host-nginx/ssl/app.cnterminalghana.com.crt
chmod 600 ~/host-nginx/ssl/app.cnterminalghana.com.key

# 3. Copy to CN Terminal
sudo cp /etc/letsencrypt/live/app.cnterminalghana.com/fullchain.pem ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.crt
sudo cp /etc/letsencrypt/live/app.cnterminalghana.com/privkey.pem ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.key
chmod 644 ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.crt
chmod 600 ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.key

# 4. Add routing to host-nginx/router.conf (see above)

# 5. Test and reload
docker exec host-nginx nginx -t
docker exec host-nginx nginx -s reload
```

---

**Ready to set up?** Follow the steps above following your existing pattern! 🚀


