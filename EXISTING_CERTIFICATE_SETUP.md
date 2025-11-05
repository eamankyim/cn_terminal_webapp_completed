# Using Existing Certificate Setup for CN Terminal

## 📋 What We Need to Know

Please share:

1. **Certificate location on server:**
   - Where are the certificates stored? (e.g., `~/host-nginx/ssl/` or `/etc/letsencrypt/live/`)
   - Certificate file names/format

2. **Certificate type:**
   - Wildcard certificate (e.g., `*.cnterminalghana.com`)?
   - Individual certificate for each subdomain?
   - Single certificate for multiple domains?

3. **host-nginx configuration:**
   - How are sabito and bestdeal configured in `~/host-nginx/conf.d/router.conf`?
   - Show the SSL certificate paths they use

4. **Certificate file structure:**
   - What files exist in the SSL directory?
   - File naming pattern

---

## 🔍 To Check on Server

Please run these commands on your server and share the output:

```bash
# 1. Check certificate location
ls -la ~/host-nginx/ssl/
# OR
ls -la /etc/letsencrypt/live/

# 2. Check host-nginx configuration
cat ~/host-nginx/conf.d/router.conf
# OR
grep -A 20 "sabito\|bestdeal" ~/host-nginx/conf.d/router.conf

# 3. Check certificate details (if Let's Encrypt)
sudo certbot certificates

# 4. Check if wildcard certificate
ls -la ~/host-nginx/ssl/ | grep -E "cnterminalghana|wildcard|\*"
```

---

## 📝 Once You Share

I'll:
1. ✅ Identify the certificate pattern
2. ✅ Configure CN Terminal to use the same certificate
3. ✅ Add routing rules to host-nginx following the same pattern
4. ✅ Ensure CN Terminal nginx uses the certificate correctly

---

**Please share the output of the commands above, and I'll configure CN Terminal to use your existing certificate setup!** 🚀


