# CN Terminal Nginx Setup Guide
## Following Host-Nginx Router Pattern

This guide explains how to set up CN Terminal to work with your existing `host-nginx` router architecture.

## Architecture Overview

```
Internet → host-nginx (80/443) → cn_terminal-nginx (443 internal) → CN Terminal services
```

## Prerequisites

- `host-nginx` router already running
- `host-network` Docker network exists
- Domain `app.cnterminalghana.com` points to server IP `81.0.247.14`
- CN Terminal Docker containers running (frontend: 3004, backend: 5001)

## Step 1: Create CN Terminal Nginx Container

### 1.1 Update docker-compose.prod.yml

Add an nginx service to your CN Terminal docker-compose file:

```yaml
services:
  # ... existing services (postgres, backend, frontend) ...

  nginx:
    image: nginx:alpine
    container_name: cn_terminal-nginx
    restart: unless-stopped
    # DO NOT map ports 80/443 externally - host-nginx handles that
    # ports:
    #   - "80:80"    # ❌ DON'T DO THIS
    #   - "443:443"  # ❌ DON'T DO THIS
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    networks:
      - cn_terminal_network
      - host-network  # Add this network!

volumes:
  postgres_data:

networks:
  cn_terminal_network:
    driver: bridge
  host-network:
    external: true  # Use existing host-network
```

### 1.2 Create Nginx Directory Structure

```bash
cd ~/cn_terminal
mkdir -p nginx/conf.d nginx/ssl
```

### 1.3 Create Main Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # Include server configurations
    include /etc/nginx/conf.d/*.conf;
}
```

### 1.4 Create CN Terminal Nginx Server Configuration

Create `nginx/conf.d/cn_terminal.conf`:

```nginx
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

    # Frontend (React App)
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://backend:5000/api;
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
        proxy_pass http://backend:5000/api-docs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO support (for real-time notifications)
    location /socket.io {
        proxy_pass http://backend:5000/socket.io;
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
        proxy_pass http://backend:5000/uploads;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Step 2: Obtain SSL Certificate

### Option A: Using Certbot (Recommended)

```bash
# Install Certbot if not already installed
sudo apt install certbot -y

# Obtain certificate (standalone mode - nginx container not running yet)
sudo certbot certonly --standalone -d app.cnterminalghana.com

# Certificate will be stored in:
# /etc/letsencrypt/live/app.cnterminalghana.com/fullchain.pem
# /etc/letsencrypt/live/app.cnterminalghana.com/privkey.pem
```

### Option B: If Certbot is Already Installed

```bash
# Just run certbot
sudo certbot certonly --standalone -d app.cnterminalghana.com
```

### Copy Certificates to CN Terminal Nginx

```bash
# Create ssl directory
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

### Also Copy to host-nginx (Required for Router)

```bash
# Copy to host-nginx ssl directory
sudo cp /etc/letsencrypt/live/app.cnterminalghana.com/fullchain.pem ~/host-nginx/ssl/app.cnterminalghana.com.crt
sudo cp /etc/letsencrypt/live/app.cnterminalghana.com/privkey.pem ~/host-nginx/ssl/app.cnterminalghana.com.key

# Set proper permissions
sudo chown $USER:$USER ~/host-nginx/ssl/app.cnterminalghana.com.*
chmod 644 ~/host-nginx/ssl/app.cnterminalghana.com.crt
chmod 600 ~/host-nginx/ssl/app.cnterminalghana.com.key
```

## Step 3: Update CN Terminal Docker Compose

### 3.1 Remove External Port Mappings

Update `docker-compose.prod.yml` to remove external port mappings for frontend and backend (nginx will handle routing):

```yaml
services:
  frontend:
    # ... other config ...
    # Remove or comment out ports section:
    # ports:
    #   - "3004:3000"  # ❌ Remove this - nginx will route internally

  backend:
    # ... other config ...
    # Remove or comment out ports section:
    # ports:
    #   - "5001:5000"  # ❌ Remove this - nginx will route internally
```

### 3.2 Add Nginx Service

Add the nginx service as shown in Step 1.1

### 3.3 Start Services

```bash
cd ~/cn_terminal

# Build and start all services including nginx
docker-compose -f docker-compose.prod.yml up -d --build

# Verify nginx container is running
docker ps | grep cn_terminal-nginx
```

## Step 4: Connect CN Terminal Nginx to host-network

```bash
# Connect cn_terminal-nginx to host-network
docker network connect host-network cn_terminal-nginx

# Verify connection
docker network inspect host-network | grep cn_terminal-nginx
```

## Step 5: Configure host-nginx Router

### 5.1 Add Routing Rules

Edit `~/host-nginx/conf.d/router.conf` and add:

```nginx
# CN Terminal - app.cnterminalghana.com
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.cnterminalghana.com;

    # SSL Configuration (using certificates in host-nginx)
    ssl_certificate /etc/nginx/ssl/app.cnterminalghana.com.crt;
    ssl_certificate_key /etc/nginx/ssl/app.cnterminalghana.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

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
    }

    location /api {
        set $cn_terminal_upstream cn_terminal-nginx:443;
        proxy_pass https://$cn_terminal_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
    }

    location /api-docs {
        set $cn_terminal_upstream cn_terminal-nginx:443;
        proxy_pass https://$cn_terminal_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

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

    location /uploads {
        set $cn_terminal_upstream cn_terminal-nginx:443;
        proxy_pass https://$cn_terminal_upstream;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name app.cnterminalghana.com;
    return 301 https://$host$request_uri;
}
```

### 5.2 Reload host-nginx

```bash
cd ~/host-nginx

# Test configuration
docker exec host-nginx nginx -t

# Reload if test passes
docker exec host-nginx nginx -s reload
```

## Step 6: Verify Setup

### 6.1 Test Container Connectivity

```bash
# Test from host-nginx to cn_terminal-nginx
docker exec host-nginx ping -c 2 cn_terminal-nginx

# Should see successful ping responses
```

### 6.2 Test Domain Access

```bash
# Test HTTPS redirect
curl -I http://app.cnterminalghana.com
# Should return 301 redirect to HTTPS

# Test HTTPS access
curl -I https://app.cnterminalghana.com
# Should return 200 OK

# Test API endpoint
curl https://app.cnterminalghana.com/api/health
# Should return API health check response

# Test API docs
curl -I https://app.cnterminalghana.com/api-docs
# Should return 200 OK
```

### 6.3 Check Logs

```bash
# Check host-nginx logs
docker logs host-nginx --tail 50

# Check cn_terminal-nginx logs
docker logs cn_terminal-nginx --tail 50

# Check CN Terminal backend logs
docker logs cn_terminal_backend --tail 50

# Check CN Terminal frontend logs
docker logs cn_terminal_frontend --tail 50
```

## Step 7: SSL Certificate Renewal

### Set Up Auto-Renewal Script

Create `~/cn_terminal/renew-ssl.sh`:

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

Make it executable:

```bash
chmod +x ~/cn_terminal/renew-ssl.sh
```

### Add to Crontab (Auto-renew monthly)

```bash
# Add to crontab (runs on 1st of each month at 3 AM)
(crontab -l 2>/dev/null; echo "0 3 1 * * ~/cn_terminal/renew-ssl.sh") | crontab -
```

## Troubleshooting

### Issue: "host not found in upstream" in host-nginx

**Cause:** `cn_terminal-nginx` not connected to `host-network`

**Fix:**
```bash
docker network connect host-network cn_terminal-nginx
docker network inspect host-network | grep cn_terminal-nginx
```

### Issue: "502 Bad Gateway"

**Cause:** Wrong port or protocol in proxy_pass

**Fix:**
- Check `cn_terminal-nginx` is listening on port 443: `docker exec cn_terminal-nginx ss -tuln | grep 443`
- Verify router.conf uses `https://$cn_terminal_upstream` (not `http://`)
- Check CN Terminal services are running: `docker ps | grep cn_terminal`

### Issue: "SSL certificate error"

**Cause:** Certificates not copied or wrong paths

**Fix:**
```bash
# Verify certificates exist
ls -la ~/cn_terminal/nginx/ssl/
ls -la ~/host-nginx/ssl/app.cnterminalghana.com.*

# Check permissions
chmod 644 ~/cn_terminal/nginx/ssl/*.crt
chmod 600 ~/cn_terminal/nginx/ssl/*.key
```

### Issue: "Connection refused" from host-nginx to cn_terminal-nginx

**Cause:** `cn_terminal-nginx` not running or not listening on port 443

**Fix:**
```bash
# Check if container is running
docker ps | grep cn_terminal-nginx

# Check if listening on port 443
docker exec cn_terminal-nginx ss -tuln | grep 443

# Check nginx configuration
docker exec cn_terminal-nginx nginx -t

# View logs
docker logs cn_terminal-nginx
```

## Summary

After completing these steps:

1. ✅ CN Terminal nginx handles SSL termination
2. ✅ host-nginx routes traffic to CN Terminal
3. ✅ All traffic flows: Internet → host-nginx (80/443) → cn_terminal-nginx (443) → CN Terminal services
4. ✅ SSL certificates properly configured
5. ✅ Auto-renewal set up

Your CN Terminal will be accessible at:
- **Frontend:** `https://app.cnterminalghana.com`
- **Backend API:** `https://app.cnterminalghana.com/api`
- **API Docs:** `https://app.cnterminalghana.com/api-docs`

## Quick Reference

```bash
# Restart CN Terminal services
cd ~/cn_terminal
docker-compose -f docker-compose.prod.yml restart

# Reload CN Terminal nginx
docker exec cn_terminal-nginx nginx -s reload

# Reload host-nginx
cd ~/host-nginx
docker exec host-nginx nginx -s reload

# Check connectivity
docker exec host-nginx ping -c 2 cn_terminal-nginx

# View logs
docker logs cn_terminal-nginx --tail 50
docker logs host-nginx --tail 50
```

