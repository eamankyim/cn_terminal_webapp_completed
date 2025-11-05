# Step 4.2: Fix .env.production Values

## ✅ Step 4.1 Complete!
`.env.production` file exists.

## ❌ Issues Found:
1. `CORS_ORIGIN` is **empty** - needs to be set
2. `REACT_APP_API_URL` is **empty** - needs to be set
3. `DATABASE_URL` has placeholder `your_password` - needs actual password
4. `REACT_APP_SENDGRID_API_KEY` looks incomplete

---

## 🔧 Step 4.2: Fix Missing Values

### Edit .env.production:

```bash
# Edit the file
nano ~/cn_terminal/.env.production
```

### Fix These Lines:

**Change:**
```env
CORS_ORIGIN=
REACT_APP_API_URL=
DATABASE_URL=postgresql://cn_terminal_user:your_password@postgres:5432/cn_terminal_db?schema=public
```

**To:**
```env
CORS_ORIGIN=https://app.cnterminalghana.com
REACT_APP_API_URL=https://app.cnterminalghana.com/api
DATABASE_URL=postgresql://cn_terminal_user:Jemima@43457957345757f57df34f98d34f4@postgres:5432/cn_terminal_db?schema=public
```

**Note:** Use the same password from `DB_PASSWORD` in `DATABASE_URL`

---

## 📝 Complete Fixed .env.production

**Your file should look like this:**

```env
NODE_ENV=production
DATABASE_URL=postgresql://cn_terminal_user:Jemima@43457957345757f57df34f98d34f4@postgres:5432/cn_terminal_db?schema=public
PORT=5000
JWT_SECRET=8684048594348504854JKHDJKFHIERUIEHUERERY34734YR43RUHUI4RY43YRI34YR43RY34
FRONTEND_URL=https://app.cnterminalghana.com
PRODUCTION_URL=https://app.cnterminalghana.com
APP_BASE_URL=https://app.cnterminalghana.com
CORS_ORIGIN=https://app.cnterminalghana.com
REACT_APP_API_URL=https://app.cnterminalghana.com/api
REACT_APP_SENDGRID_API_KEY=E3454D434
REACT_APP_FROM_EMAIL=info@cnterminalghana.com
REACT_APP_FROM_NAME=CN Terminal
REACT_APP_EMAIL_DEV_MODE=false
DB_PASSWORD=Jemima@43457957345757f57df34f98d34f4
```

**Important:** 
- Replace `your_password` in DATABASE_URL with your actual `DB_PASSWORD` value
- Make sure `REACT_APP_SENDGRID_API_KEY` is complete (if it's incomplete, get the full key from GitHub Secrets)

---

## ✅ Step 4.2 Complete Checklist

- [ ] `CORS_ORIGIN` is set to `https://app.cnterminalghana.com`
- [ ] `REACT_APP_API_URL` is set to `https://app.cnterminalghana.com/api`
- [ ] `DATABASE_URL` has actual password (not `your_password`)
- [ ] `REACT_APP_SENDGRID_API_KEY` is complete (if needed)

---

## 🎯 Next: Step 4.3

Once values are fixed, we'll start the containers!

---

**Edit the file and fix the missing values, then let me know when done!** ✅

