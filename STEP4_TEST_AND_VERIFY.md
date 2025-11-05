# Step 4: Test and Verify CN Terminal Setup

## ✅ Step 3 Complete!
- host-nginx is running
- Configuration tested successfully
- Nginx reloaded (warnings are just deprecation notices, not errors)

---

## 🧪 Step 4: Test and Verify

### Step 4.1: Verify CN Terminal Containers Are Running

```bash
# Check CN Terminal containers
cd ~/cn_terminal
docker-compose -f docker-compose.prod.yml ps

# Should show all containers running:
# - cn_terminal_postgres
# - cn_terminal_backend
# - cn_terminal_frontend
# - cn_terminal-nginx
```

### Step 4.2: Verify CN Terminal Nginx is Connected to host-network

```bash
# Check if cn_terminal-nginx is connected to host-network
docker network inspect host-network | grep cn_terminal

# If not connected, connect it:
docker network connect host-network cn_terminal-nginx
```

### Step 4.3: Test HTTPS Access from Server

```bash
# Test HTTPS redirect
curl -I http://app.cnterminalghana.com

# Should return: HTTP/1.1 301 Moved Permanently

# Test HTTPS access
curl -I https://app.cnterminalghana.com

# Should return: HTTP/1.1 200 OK

# Test API health endpoint
curl https://app.cnterminalghana.com/api/health

# Should return: {"status":"OK","message":"CN Terminal API is running",...}
```

### Step 4.4: Check CN Terminal Nginx Logs

```bash
# Check CN Terminal nginx logs
docker logs cn_terminal-nginx --tail 20

# Check host-nginx logs
docker logs host-nginx --tail 20
```

### Step 4.5: Test from Browser

1. Open browser
2. Go to: `https://app.cnterminalghana.com`
3. Should see:
   - ✅ Green padlock (SSL working)
   - ✅ CN Terminal application loads
   - ✅ No SSL errors

---

## ✅ Step 4 Complete Checklist

- [ ] CN Terminal containers are running
- [ ] cn_terminal-nginx connected to host-network
- [ ] HTTPS redirect works (HTTP → HTTPS)
- [ ] HTTPS access works
- [ ] API health endpoint responds
- [ ] Application accessible in browser
- [ ] No SSL errors

---

## 🆘 Troubleshooting

### Issue: 502 Bad Gateway

**Check:**
- CN Terminal containers are running
- cn_terminal-nginx is connected to host-network
- CN Terminal nginx is listening on port 443

**Fix:**
```bash
# Check containers
docker ps | grep cn_terminal

# Connect to network
docker network connect host-network cn_terminal-nginx

# Check nginx is listening
docker exec cn_terminal-nginx ss -tuln | grep 443
```

### Issue: SSL Certificate Error

**Check:**
- Certificates exist in both locations
- Permissions are correct

**Fix:**
```bash
# Verify certificates
ls -la ~/host-nginx/ssl/app.cnterminalghana.com.*
ls -la ~/cn_terminal/nginx/ssl/app.cnterminalghana.com.*

# Fix permissions if needed
chmod 644 ~/host-nginx/ssl/app.cnterminalghana.com.crt
chmod 600 ~/host-nginx/ssl/app.cnterminalghana.com.key
```

### Issue: Connection Refused

**Check:**
- CN Terminal services are running
- Ports are correct
- Network connectivity

**Fix:**
```bash
# Restart CN Terminal services
cd ~/cn_terminal
docker-compose -f docker-compose.prod.yml restart
```

---

## 🎯 Next: Step 5 (After Verification)

Once everything is working:
- Create admin user
- Set up database schema
- Configure auto-renewal for SSL

---

**Run the tests above and let me know the results!** ✅


