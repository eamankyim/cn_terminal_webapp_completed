# Setup Subdomain and SSL Certificate - GoDaddy + Global Nginx

## 📋 Overview

You need to:
1. ✅ Add DNS A record in GoDaddy for `app.cnterminalghana.com`
2. ✅ Obtain SSL certificate (Let's Encrypt/Certbot)
3. ✅ Configure host-nginx to route to CN Terminal
4. ✅ Set up SSL certificates

---

## 🔧 Step 1: Add DNS A Record in GoDaddy

### 1.1 Login to GoDaddy

1. Go to [GoDaddy.com](https://godaddy.com)
2. Login to your account
3. Go to **My Products** → **DNS** (or **Manage DNS**)

### 1.2 Add A Record

1. Find your domain `cnterminalghana.com`
2. Click **DNS** or **Manage DNS**
3. Scroll to **Records** section
4. Click **Add** or **+** button
5. Create new record:

**Type:** `A`
**Name:** `app` (or `app.cnterminalghana.com` - depends on GoDaddy interface)
**Value:** `YOUR_SERVER_IP` (e.g., `81.0.247.14`)
**TTL:** `600` (or default)

6. Click **Save**

### 1.3 Verify DNS Propagation

**Wait 5-15 minutes for DNS to propagate, then test:**

```bash
# Test DNS resolution
nslookup app.cnterminalghana.com

# Or use dig
dig app.cnterminalghana.com

# Should return your server IP
```

**From your local machine:**
```bash
ping app.cnterminalghana.com
# Should resolve to your server IP
```

---

## 🔒 Step 2: Obtain SSL Certificate

### Option A: Using Certbot (Recommended)

**On your server:**

```bash
# SSH to server
ssh user@your-server-ip

# Install Certbot (if not already installed)
sudo apt update
sudo apt install certbot -y

# Stop nginx temporarily (if running on port 80/443)
# If using host-nginx, you might need to stop it temporarily
docker stop host-nginx

# Obtain certificate (standalone mode)
sudo certbot certonly --standalone -d app.cnterminalghana.com

# Follow prompts:
# - Email: Enter your email
# - Agree to terms: Yes
# - Share email: Your choice
```

**Certificate will be stored in:**
- `/etc/letsencrypt/live/app.cnterminalghana.com/fullchain.pem`
- `/etc/letsencrypt/live/app.cnterminalghana.com/privkey.pem`

### Option B: Using Docker Certbot (If Using Docker)

```bash
# Run certbot in Docker
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  -p 80:80 \
  certbot/certbot certonly --standalone -d app.cnterminalghana.com
```

---

## 📁 Step 3: Copy Certificates to CN Terminal

```bash
# Create SSL directory
mkdir -p ~/cn_terminal/nginx/ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/app.cnterminalghana.com/fullchain.pem ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.crt
sudo cp /etc/letsencrypt/live/app.cnterminalghana.com/privkey.pem ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.key

# Set proper permissions
sudo chown $USER:$USER ~/cn_terminal/nginx/ssl/*.crt
sudo chown $USER:$USER ~/cn_terminal/nginx/ssl/*.key
chmod 644 ~/cn_terminal/nginx/ssl/*.crt
chmod 600 ~/cn_terminal/nginx/ssl/*.key
```

---

## 🌐 Step 4: Copy Certificates to host-nginx

```bash
# Copy to host-nginx SSL directory
sudo cp /etc/letsencrypt/live/app.cnterminalghana.com/fullchain.pem ~/host-nginx/ssl/app.cnterminalghana.com.crt
sudo cp /etc/letsencrypt/live/app.cnterminalghana.com/privkey.pem ~/host-nginx/ssl/app.cnterminalghana.com.key

# Set proper permissions
sudo chown $USER:$USER ~/host-nginx/ssl/app.cnterminalghana.com.*
chmod 644 ~/host-nginx/ssl/app.cnterminalghana.com.crt
chmod 600 ~/host-nginx/ssl/app.cnterminalghana.com.key
```

---

## ⚙️ Step 5: Configure host-nginx Routing

### 5.1 Add Routing Rules to host-nginx

```bash
# Edit host-nginx configuration
nano ~/host-nginx/conf.d/router.conf
```

### 5.2 Add CN Terminal Routing

**Add this configuration:**

```nginx
# CN Terminal - app.cnterminalghana.com
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name app.cnterminalghana.com;
    
    # Redirect all HTTP to HTTPS
    return 301 https://$host$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.cnterminalghana.com;
    
    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/app.cnterminalghana.com.crt;
    ssl_certificate_key /etc/nginx/ssl/app.cnterminalghana.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Max upload size
    client_max_body_size 10M;
    
    # Use variable for runtime DNS resolution
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
    
    # Socket.IO support (for real-time notifications)
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
    
    # File uploads (static files)
    location /uploads {
        set $cn_terminal_upstream cn_terminal-nginx:443;
        proxy_pass https://$cn_terminal_upstream;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5.3 Test Configuration

```bash
# Test nginx configuration
docker exec host-nginx nginx -t

# Should show:
# nginx: the configuration file /etc/nginx/nginx.conf test is successful
```

### 5.4 Reload host-nginx

```bash
# Reload nginx
docker exec host-nginx nginx -s reload

# Or restart container
docker restart host-nginx
```

---

## ✅ Step 6: Verify Setup

### 6.1 Test DNS Resolution

```bash
# From your local machine
nslookup app.cnterminalghana.com
# Should return your server IP

ping app.cnterminalghana.com
# Should resolve to your server IP
```

### 6.2 Test HTTPS Access

```bash
# Test HTTPS redirect
curl -I http://app.cnterminalghana.com
# Should return 301 redirect to HTTPS

# Test HTTPS access
curl -I https://app.cnterminalghana.com
# Should return 200 OK

# Test API
curl https://app.cnterminalghana.com/api/health
# Should return: {"status":"OK","message":"CN Terminal API is running",...}
```

### 6.3 Test in Browser

1. Open browser
2. Go to: `https://app.cnterminalghana.com`
3. Should see:
   - ✅ Green padlock (SSL working)
   - ✅ CN Terminal application
   - ✅ No SSL errors

---

## 🔄 Step 7: Set Up Auto-Renewal for SSL

### 7.1 Create Renewal Script

```bash
# Create renewal script
nano ~/cn_terminal/renew-ssl.sh
```

**Add this content:**

```bash
#!/bin/bash

# Renew SSL certificate
certbot renew --quiet

# Copy renewed certificates to CN Terminal nginx
cp /etc/letsencrypt/live/app.cnterminalghana.com/fullchain.pem ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.crt
cp /etc/letsencrypt/live/app.cnterminalghana.com/privkey.pem ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.key

# Copy to host-nginx
cp /etc/letsencrypt/live/app.cnterminalghana.com/fullchain.pem ~/host-nginx/ssl/app.cnterminalghana.com.crt
cp /etc/letsencrypt/live/app.cnterminalghana.com/privkey.pem ~/host-nginx/ssl/app.cnterminalghana.com.key

# Reload nginx containers
docker exec cn_terminal-nginx nginx -s reload
docker exec host-nginx nginx -s reload

echo "SSL certificates renewed and nginx reloaded"
```

### 7.2 Make Script Executable

```bash
chmod +x ~/cn_terminal/renew-ssl.sh
```

### 7.3 Add to Crontab (Auto-renew monthly)

```bash
# Edit crontab
crontab -e

# Add this line (runs on 1st of each month at 3 AM)
0 3 1 * * ~/cn_terminal/renew-ssl.sh >> ~/cn_terminal/ssl-renewal.log 2>&1
```

---

## 📋 Checklist

- [ ] DNS A record added in GoDaddy (`app` → server IP)
- [ ] DNS propagated (test with `nslookup`)
- [ ] SSL certificate obtained (`certbot certonly`)
- [ ] Certificates copied to `~/cn_terminal/nginx/ssl/`
- [ ] Certificates copied to `~/host-nginx/ssl/`
- [ ] host-nginx routing configured
- [ ] host-nginx configuration tested
- [ ] host-nginx reloaded
- [ ] HTTPS access works
- [ ] API accessible via HTTPS
- [ ] Auto-renewal script created
- [ ] Crontab configured for auto-renewal

---

## 🆘 Troubleshooting

### DNS Not Resolving

**Check:**
- DNS A record is correct in GoDaddy
- Wait 15-30 minutes for propagation
- Test with: `nslookup app.cnterminalghana.com`

**Fix:**
- Verify A record in GoDaddy
- Check TTL settings
- Try different DNS server: `nslookup app.cnterminalghana.com 8.8.8.8`

### Certbot Fails

**Error: "Failed to bind to port 80"**

**Fix:**
```bash
# Stop services using port 80
docker stop host-nginx
# Or
sudo systemctl stop nginx

# Then run certbot
sudo certbot certonly --standalone -d app.cnterminalghana.com

# Start services again
docker start host-nginx
```

### SSL Certificate Error in Browser

**Check:**
- Certificate paths are correct
- Permissions are correct (`chmod 644` for crt, `chmod 600` for key)
- Certificate not expired

**Fix:**
```bash
# Verify certificate
openssl x509 -in ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.crt -text -noout

# Check expiration
openssl x509 -in ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.crt -noout -dates
```

### 502 Bad Gateway

**Check:**
- `cn_terminal-nginx` is running
- `cn_terminal-nginx` is connected to `host-network`
- CN Terminal services are running

**Fix:**
```bash
# Check containers
docker ps | grep cn_terminal

# Connect nginx to network
docker network connect host-network cn_terminal-nginx

# Check nginx is listening
docker exec cn_terminal-nginx ss -tuln | grep 443
```

---

## 🎯 Quick Reference

```bash
# Get certificate
sudo certbot certonly --standalone -d app.cnterminalghana.com

# Copy certificates
sudo cp /etc/letsencrypt/live/app.cnterminalghana.com/fullchain.pem ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.crt
sudo cp /etc/letsencrypt/live/app.cnterminalghana.com/privkey.pem ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.key
sudo cp /etc/letsencrypt/live/app.cnterminalghana.com/fullchain.pem ~/host-nginx/ssl/app.cnterminalghana.com.crt
sudo cp /etc/letsencrypt/live/app.cnterminalghana.com/privkey.pem ~/host-nginx/ssl/app.cnterminalghana.com.key

# Set permissions
chmod 644 ~/cn_terminal/nginx/ssl/*.crt ~/host-nginx/ssl/*.crt
chmod 600 ~/cn_terminal/nginx/ssl/*.key ~/host-nginx/ssl/*.key

# Test and reload
docker exec host-nginx nginx -t
docker exec host-nginx nginx -s reload
```

---

**Ready to set up?** Follow the steps above! 🚀


