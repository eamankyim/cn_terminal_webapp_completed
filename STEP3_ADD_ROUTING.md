# Step 3: Add Routing to host-nginx

## ✅ Step 2 Complete!
Certificates are copied successfully:
- ✅ `~/host-nginx/ssl/app.cnterminalghana.com.crt`
- ✅ `~/host-nginx/ssl/app.cnterminalghana.com.key`
- ✅ `~/cn_terminal/nginx/ssl/app.cnterminalghana.com.crt`
- ✅ `~/cn_terminal/nginx/ssl/app.cnterminalghana.com.key`

---

## 🎯 Step 3: Add Routing Configuration

We need to add CN Terminal routing to `~/host-nginx/conf.d/router.conf`

---

## 📋 Step 3.1: Backup Current Configuration

```bash
# Create backup
cp ~/host-nginx/conf.d/router.conf ~/host-nginx/conf.d/router.conf.backup
```

---

## 📋 Step 3.2: Edit router.conf

```bash
# Open router.conf for editing
nano ~/host-nginx/conf.d/router.conf
```

---

## 📋 Step 3.3: Add CN Terminal Configuration

**Add this configuration at the END of the file (after bestdeal section):**

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

## 📋 Step 3.4: Save and Exit

**In nano:**
- Press `Ctrl + O` to save
- Press `Enter` to confirm
- Press `Ctrl + X` to exit

---

## 📋 Step 3.5: Test Configuration

```bash
# Test nginx configuration
docker exec host-nginx nginx -t
```

**Expected output:**
```
nginx: the configuration file /etc/nginx/nginx.conf test is successful
```

**If there's an error, fix it before proceeding!**

---

## 📋 Step 3.6: Reload host-nginx

```bash
# Reload nginx
docker exec host-nginx nginx -s reload
```

---

## ✅ Step 3 Complete Checklist

- [ ] Created backup of router.conf
- [ ] Opened router.conf for editing
- [ ] Added CN Terminal HTTPS server block
- [ ] Added CN Terminal HTTP redirect block
- [ ] Saved the file
- [ ] Tested configuration (`nginx -t`)
- [ ] Reloaded nginx

---

## 🆘 Troubleshooting

### Error: "nginx: configuration file test failed"

**Check:**
- Syntax errors in the config
- Missing semicolons
- Missing closing braces

**Fix:**
- Review the configuration you added
- Check for typos
- Make sure all blocks are properly closed

---

## 🎯 Next: Step 4

Once Step 3 is complete, we'll move to **Step 4: Test and Verify**

---

**Ready?** Add the configuration to router.conf and let me know when done! ✅


