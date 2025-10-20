# Server Logging Guide

This guide explains how to view and manage server logs in the CN Terminal Web App backend.

## 📋 Overview

All server logs are automatically saved to files in the `backend/logs/` directory. This includes:
- Login attempts
- Password changes
- Admin actions
- Database queries
- Error messages
- All console.log and console.error output

## 📁 Log Files

Logs are organized by date:
```
backend/logs/
  ├── server-2025-10-19.log
  ├── server-2025-10-20.log
  └── ...
```

Each file contains all logs for that day, with timestamps.

## 🔍 Viewing Logs

### Method 1: View Current Day's Logs (Recommended)

```bash
cd backend
npm run view-logs
```

This displays all logs from today's log file.

### Method 2: View Logs in Real-Time (Terminal)

Simply run the server and watch the terminal:
```bash
npm run dev     # With auto-restart
# OR
npm start       # Without auto-restart (better for debugging)
```

### Method 3: Open Log File Directly

Navigate to `backend/logs/` and open the log file for today:
```
backend/logs/server-2025-10-19.log
```

### Method 4: Tail Logs (Linux/Mac/Git Bash)

```bash
tail -f backend/logs/server-$(date +%Y-%m-%d).log
```

### Method 5: PowerShell Real-Time Viewing

```powershell
Get-Content backend/logs/server-$(Get-Date -Format "yyyy-MM-dd").log -Wait
```

## 🚀 Running Server Without Auto-Restart

If nodemon keeps restarting and clearing logs, use:

```bash
npm start
```

This runs the server without nodemon, so it won't auto-restart on file changes.

## 📊 What Gets Logged

### Login Attempts
```
=== LOGIN ATTEMPT ===
Email received: admin@cnterminal.com
Password received: Yes (***@1A)
✅ User found: Eric Amankyim
🔐 Comparing passwords...
Password comparison result: true
✅ Password matches!
=== LOGIN SUCCESSFUL ===
```

### Password Changes
```
=== PASSWORD CHANGE ATTEMPT ===
User ID: cmg00p60u0000hpi13g7wzfnf
User Email: admin@cnterminal.com
🔍 Validating new password strength...
✅ Current password verified!
🔐 Hashing new password...
💾 Updating password in database...
✅ Password updated successfully!
=== PASSWORD CHANGE SUCCESSFUL ===
```

### Admin Password Resets
```
=== ADMIN PASSWORD RESET ATTEMPT ===
Admin User: admin@cnterminal.com
Target User ID: user123
✅ User found: John Doe
🔐 Hashing new password...
💾 Updating password in database...
✅ Password reset successfully by admin!
=== ADMIN PASSWORD RESET SUCCESSFUL ===
```

### Errors
```
❌ PASSWORD CHANGE ERROR: Error message here
Error stack: Full stack trace...
=== PASSWORD CHANGE ERROR ===
```

## 🔧 Nodemon Configuration

Nodemon is configured to:
- ✅ Ignore `logs/` directory (won't restart on log changes)
- ✅ Ignore `uploads/` directory
- ✅ Wait 2 seconds before restarting (reduces excessive restarts)
- ✅ Only watch specific file types (`.js`, `.json`)

Configuration is in `backend/nodemon.json`

## 🧹 Cleaning Up Old Logs

Logs are not automatically deleted. To clean up:

### Delete Logs Older Than 30 Days (Manual)

**Linux/Mac:**
```bash
find backend/logs -name "*.log" -mtime +30 -delete
```

**Windows PowerShell:**
```powershell
Get-ChildItem backend/logs -Filter *.log | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} | Remove-Item
```

### Delete All Logs

```bash
# Linux/Mac/Git Bash
rm -rf backend/logs/*.log

# Windows PowerShell
Remove-Item backend/logs/*.log
```

## 🔒 Security Notes

1. **Logs contain sensitive information** - Never commit log files to git
2. **Passwords are partially masked** - Only last 4 characters shown in logs
3. **Log files are in .gitignore** - Automatically excluded from version control
4. **Review logs regularly** - Monitor for unauthorized access attempts

## 📝 Tips for Debugging

1. **Use specific search terms** in log files:
   - Search for email addresses
   - Search for "❌" to find errors
   - Search for "PASSWORD CHANGE" to find password-related actions
   - Search for "LOGIN" to find authentication attempts

2. **Keep terminal open** when testing to see real-time logs

3. **Use `npm start`** instead of `npm run dev` when debugging to prevent restarts

4. **Check timestamps** to correlate user actions with log entries

5. **Look for patterns** in failed attempts to identify issues

## 🆘 Troubleshooting

### Problem: No logs appearing

**Solution:**
1. Check if `backend/logs/` directory exists
2. Ensure server is actually running
3. Try creating a log manually: `console.log('test')`
4. Check file permissions on logs directory

### Problem: Log file not found

**Solution:**
1. Make sure the server has been started at least once today
2. Check the logs directory: `ls backend/logs/` (or `dir backend\logs\` on Windows)
3. Log files are created on server start

### Problem: Can't read log file

**Solution:**
1. Use a text editor to open: `backend/logs/server-YYYY-MM-DD.log`
2. Or use: `cat` (Linux/Mac) or `type` (Windows)
3. Ensure file isn't locked by another process

## 📚 Related Files

- `backend/logger.js` - Logging implementation
- `backend/nodemon.json` - Nodemon configuration
- `backend/.gitignore` - Excludes logs from git
- `backend/scripts/view-logs.js` - Log viewing script

## 🎯 Quick Reference

```bash
# Start server (no auto-restart)
npm start

# Start server (with auto-restart)
npm run dev

# View today's logs
npm run view-logs

# Follow logs in real-time (Git Bash/Linux/Mac)
tail -f backend/logs/server-$(date +%Y-%m-%d).log

# Follow logs in real-time (PowerShell)
Get-Content backend/logs/server-$(Get-Date -Format "yyyy-MM-dd").log -Wait
```



