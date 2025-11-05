# Production Environment Setup - Quick Start

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Production Environment File

```bash
# Copy the template
cp env.production.template .env.production
```

### Step 2: Edit `.env.production`

Open `.env.production` and replace these **required** values:

1. **DATABASE_URL** - Your PostgreSQL connection string
   ```env
   DATABASE_URL=postgresql://username:password@host:port/database?schema=public
   ```

2. **JWT_SECRET** - Generate a secure secret:
   ```bash
   openssl rand -base64 32
   ```
   Then set:
   ```env
   JWT_SECRET=your_generated_secret_here
   ```

3. **URLs** - Update all URLs to your production domain:
   ```env
   FRONTEND_URL=https://yourdomain.com
   PRODUCTION_URL=https://api.yourdomain.com
   APP_BASE_URL=https://yourdomain.com
   CORS_ORIGIN=https://yourdomain.com
   REACT_APP_API_URL=https://api.yourdomain.com/api
   ```

4. **Email** - Configure SendGrid:
   ```env
   REACT_APP_SENDGRID_API_KEY=your_sendgrid_api_key
   REACT_APP_FROM_EMAIL=noreply@yourdomain.com
   REACT_APP_FROM_NAME=CN Terminal
   REACT_APP_EMAIL_DEV_MODE=false
   ```

5. **Database Password** (for Docker):
   ```env
   DB_PASSWORD=your_secure_db_password
   ```

### Step 3: Load Environment Variables

#### For Docker Compose:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### For Platform Deployments:
- **Render.com**: Add environment variables in dashboard → Environment
- **Heroku**: Use `heroku config:set KEY=value` or dashboard
- **Vercel**: Add in project settings → Environment Variables
- **AWS/DigitalOcean**: Use `.env.production` file or platform's secret management

### Step 4: Verify

1. **Database Connection**: Check backend logs for successful DB connection
2. **API Health**: Visit `https://api.yourdomain.com/api/health`
3. **Frontend**: Verify it can connect to backend
4. **Email**: Send a test invitation to verify email sending

## ✅ Required Variables Checklist

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - Strong random secret (32+ chars)
- [ ] `FRONTEND_URL` - Frontend application URL
- [ ] `PRODUCTION_URL` - API production URL
- [ ] `APP_BASE_URL` - Base URL for links
- [ ] `CORS_ORIGIN` - Allowed CORS origins
- [ ] `REACT_APP_API_URL` - Backend API URL for frontend
- [ ] `REACT_APP_SENDGRID_API_KEY` - SendGrid API key
- [ ] `REACT_APP_FROM_EMAIL` - Email sender address
- [ ] `REACT_APP_FROM_NAME` - Email sender name
- [ ] `REACT_APP_EMAIL_DEV_MODE` - Set to `false` for production
- [ ] `DB_PASSWORD` - Database password (for Docker)

## 🔒 Security Notes

1. **Never commit `.env.production` to git** - It's already in `.gitignore`
2. **Use strong secrets** - Generate with `openssl rand -base64 32`
3. **Rotate secrets regularly** - Especially JWT_SECRET and API keys
4. **Use different secrets** for dev/staging/production

## 📚 More Information

See `ENV_SETUP_GUIDE.md` for detailed documentation and troubleshooting.

## 🆘 Troubleshooting

### "DATABASE_URL is not defined"
- Ensure `.env.production` exists and contains `DATABASE_URL`
- Check file path is correct
- Restart your application

### "JWT_SECRET is not defined"
- Add `JWT_SECRET` to your environment variables
- Ensure it's a strong, random string

### CORS errors
- Verify `CORS_ORIGIN` includes your frontend URL
- Check `FRONTEND_URL` matches your actual domain

### Email not sending
- Verify `REACT_APP_SENDGRID_API_KEY` is correct
- Check `REACT_APP_EMAIL_DEV_MODE` is set to `false`
- Verify SendGrid API key has proper permissions

