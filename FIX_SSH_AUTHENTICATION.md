# Fix SSH Authentication Error

## ❌ Error

```
ssh: handshake failed: ssh: unable to authenticate, attempted methods [none publickey], no supported methods remain
```

This means the SSH key in GitHub Secrets is not working with your server.

---

## 🔧 Step-by-Step Fix

### Step 1: Verify SSH Key on Your Local Machine

```bash
# Check if you have an SSH key
ls -la ~/.ssh/

# If you see id_rsa and id_rsa.pub, you have keys
# If not, generate one:
ssh-keygen -t rsa -b 4096 -C "github-deploy@cnterminal"
# Press Enter to accept default location
# Press Enter twice for no passphrase (or set one)
```

### Step 2: Add Public Key to Server

**Option A: Using ssh-copy-id (Easiest)**

```bash
# From your local machine
ssh-copy-id user@your-server-ip

# Enter password when prompted
# This automatically adds your public key to server
```

**Option B: Manual Method**

```bash
# 1. Copy your public key
cat ~/.ssh/id_rsa.pub

# 2. SSH to your server
ssh user@your-server-ip

# 3. On server, add the key to authorized_keys
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "PASTE_YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 4. Test connection
exit
ssh user@your-server-ip
# Should connect without password
```

### Step 3: Get Private Key for GitHub Secret

```bash
# On your local machine
cat ~/.ssh/id_rsa
```

**Copy the ENTIRE output, including:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
... (all the content) ...
-----END OPENSSH PRIVATE KEY-----
```

### Step 4: Update GitHub Secret

1. Go to GitHub → Repository → Settings → Secrets and variables → Actions
2. Find `PROD_SERVER_SSH_KEY`
3. Click "Update"
4. Paste the ENTIRE private key (including BEGIN and END lines)
5. Save

### Step 5: Verify Server User

Make sure `PROD_SERVER_USER` matches the user you SSH with:

```bash
# Test SSH connection manually
ssh user@your-server-ip
# If this works, use this user in PROD_SERVER_USER
```

---

## 🔍 Troubleshooting

### Issue 1: "Permission denied (publickey)"

**Check on server:**
```bash
# SSH to server
ssh user@your-server-ip

# Check authorized_keys file
cat ~/.ssh/authorized_keys

# Check permissions
ls -la ~/.ssh/
# Should show:
# drwx------  .ssh
# -rw-------  authorized_keys

# Fix permissions if needed
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Issue 2: SSH Key Format Wrong

**Make sure the private key in GitHub Secret includes:**
- `-----BEGIN OPENSSH PRIVATE KEY-----` (or `-----BEGIN RSA PRIVATE KEY-----`)
- All the key content
- `-----END OPENSSH PRIVATE KEY-----` (or `-----END RSA PRIVATE KEY-----`)

**No extra spaces or characters!**

### Issue 3: Wrong User

**Check:**
- `PROD_SERVER_USER` matches the user you SSH with
- User has a home directory
- User can access Docker

```bash
# Test with correct user
ssh correct-user@your-server-ip
```

### Issue 4: SSH Key Not Added to Server

**Re-add the key:**
```bash
# 1. Get your public key
cat ~/.ssh/id_rsa.pub

# 2. SSH to server
ssh user@your-server-ip

# 3. Add to authorized_keys (if not already there)
cat >> ~/.ssh/authorized_keys
# Paste public key
# Press Ctrl+D to finish

# 4. Set correct permissions
chmod 600 ~/.ssh/authorized_keys
```

---

## ✅ Quick Fix Checklist

- [ ] SSH key exists on local machine (`~/.ssh/id_rsa`)
- [ ] Public key added to server (`~/.ssh/authorized_keys`)
- [ ] Server permissions correct (`chmod 700 ~/.ssh`, `chmod 600 ~/.ssh/authorized_keys`)
- [ ] Private key copied to GitHub Secret `PROD_SERVER_SSH_KEY`
- [ ] Private key includes BEGIN and END lines
- [ ] `PROD_SERVER_USER` matches SSH user
- [ ] Manual SSH connection works (`ssh user@server-ip`)

---

## 🧪 Test Connection

**Before testing in GitHub Actions, test manually:**

```bash
# Test SSH connection
ssh -i ~/.ssh/id_rsa user@your-server-ip

# If this works, the key is correct
# If not, fix the key setup first
```

---

## 📋 Common Issues

### Wrong Key Format

**Old format (RSA):**
```
-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
```

**New format (OpenSSH):**
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

**Both work!** Just make sure you copy the entire key including BEGIN/END lines.

### Key Has Passphrase

If your SSH key has a passphrase, you need to either:
1. Remove passphrase (not recommended for security)
2. Use `INPUT_PASSPHRASE` in GitHub Actions (not supported by appleboy/ssh-action)
3. Generate a new key without passphrase (recommended for deployments)

```bash
# Generate new key without passphrase
ssh-keygen -t rsa -b 4096 -C "github-deploy@cnterminal"
# When asked for passphrase, press Enter (empty)
```

---

## 🎯 Recommended Solution

**1. Generate a dedicated deployment key:**

```bash
# Generate new key for deployment
ssh-keygen -t rsa -b 4096 -C "github-deploy-cn-terminal" -f ~/.ssh/id_rsa_deploy
# Press Enter twice (no passphrase)

# Add public key to server
ssh-copy-id -i ~/.ssh/id_rsa_deploy.pub user@your-server-ip

# Get private key for GitHub
cat ~/.ssh/id_rsa_deploy
# Copy entire output to PROD_SERVER_SSH_KEY secret
```

**2. Test connection:**

```bash
ssh -i ~/.ssh/id_rsa_deploy user@your-server-ip
# Should connect without password
```

**3. Update GitHub Secret:**

- Copy private key (`cat ~/.ssh/id_rsa_deploy`)
- Update `PROD_SERVER_SSH_KEY` in GitHub Secrets

**4. Test GitHub Actions again!**

---

**After fixing SSH, the deployment should work!** 🚀


