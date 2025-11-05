# Step 4.5: Verify Routing and Test Application

## ✅ Step 4.4 Complete!
- ✅ `cn_terminal-nginx` is already connected to `host-network`
- ✅ Nginx configuration test passed (warnings are non-critical)

---

## 🔧 Step 4.5: Verify Routing and Test Application

Now we need to:
1. Verify host-nginx has the routing configuration for CN Terminal
2. Test that the application is accessible
3. Check container logs if needed

---

## 📋 Commands to Run

**On your server:**

```bash
# 1. Verify host-nginx has CN Terminal routing configuration
grep -A 20 "app.cnterminalghana.com" ~/host-nginx/conf.d/router.conf

# 2. Check if host-nginx is running
docker ps | grep host-nginx

# 3. Test host-nginx configuration
docker exec host-nginx nginx -t

# 4. Reload host-nginx if needed (to apply any changes)
docker exec host-nginx nginx -s reload

# 5. Check CN Terminal container logs
docker-compose -f docker-compose.prod.yml logs --tail 50

# 6. Test backend health (if available)
curl http://localhost:5001/api/health || curl http://localhost:5001/ || echo "Backend check"

# 7. Test frontend (if available)
curl http://localhost:3004/ | head -20 || echo "Frontend check"
```

---

## 🌐 Test from Browser

**From your local machine or browser:**

1. **Test HTTP (should redirect to HTTPS):**
   ```
   http://app.cnterminalghana.com
   ```

2. **Test HTTPS:**
   ```
   https://app.cnterminalghana.com
   ```

3. **Test API:**
   ```
   https://app.cnterminalghana.com/api
   ```

---

## ✅ Expected Results

### On Server:
- ✅ host-nginx routing configuration exists for `app.cnterminalghana.com`
- ✅ host-nginx configuration test passes
- ✅ CN Terminal containers are running
- ✅ Backend responds on port 5001
- ✅ Frontend responds on port 3004

### From Browser:
- ✅ HTTP redirects to HTTPS
- ✅ HTTPS loads the application
- ✅ API endpoints are accessible

---

## 🔍 Troubleshooting

### If routing doesn't work:

1. **Check host-nginx configuration:**
   ```bash
   cat ~/host-nginx/conf.d/router.conf | grep -A 30 "app.cnterminalghana.com"
   ```

2. **Check DNS:**
   ```bash
   nslookup app.cnterminalghana.com
   # Should return your server IP: 81.0.247.14
   ```

3. **Check SSL certificates:**
   ```bash
   ls -la ~/host-nginx/ssl/app.cnterminalghana.com.*
   ```

4. **Check CN Terminal nginx logs:**
   ```bash
   docker logs cn_terminal-nginx --tail 50
   ```

5. **Check host-nginx logs:**
   ```bash
   docker logs host-nginx --tail 50
   ```

---

## ✅ Step 4.5 Complete Checklist

- [ ] Verified host-nginx routing configuration exists
- [ ] host-nginx configuration test passes
- [ ] Reloaded host-nginx if needed
- [ ] Checked CN Terminal container logs
- [ ] Tested backend (port 5001)
- [ ] Tested frontend (port 3004)
- [ ] Tested from browser (HTTP redirects to HTTPS)
- [ ] Tested from browser (HTTPS loads application)
- [ ] Tested API endpoints

---

## 🎯 Deployment Complete!

Once all tests pass, your CN Terminal application should be fully deployed and accessible at:
- **Production URL:** https://app.cnterminalghana.com

---

**Run the commands above and test from your browser!** ✅

