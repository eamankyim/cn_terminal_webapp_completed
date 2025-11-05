# Environment Variables Setup Guide

This guide explains how to set up environment variables for CN Terminal in production.

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env.production
   ```

2. **Edit `.env.production`** and replace all placeholder values with your actual production values.

3. **Load the environment variables** in your deployment platform (see platform-specific instructions below).

## Environment Variables Reference

### Required Variables

#### Database Configuration
- `DATABASE_URL` - PostgreSQL connection string
  - Format: `postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=public`
  - Example: `postgresql://cn_terminal_user:secure_pass@db.example.com:5432/cn_terminal_db?schema=public`

#### Authentication
- `JWT_SECRET` - Secret key for JWT token signing
  - **Generate a secure secret:** `openssl rand -base64 32`
  - **Must be at least 32 characters long**
  - **Never share or commit this value**

#### URLs
- `FRONTEND_URL` - Your frontend application URL
  - Example: `https://app.yourdomain.com`
  - Used for CORS and Socket.IO connections

- `PRODUCTION_URL` - Your production API URL
  - Example: `https://api.yourdomain.com`
  - Used for API documentation

- `APP_BASE_URL` - Base URL for invitation links and email templates
  - Example: `https://yourdomain.com`
  - Used in email links

- `CORS_ORIGIN` - Allowed CORS origins (comma-separated)
  - Example: `https://yourdomain.com,https://www.yourdomain.com`
  - For multiple origins, separate with commas

- `REACT_APP_API_URL` - Backend API URL (used during frontend build)
  - Example: `https://api.yourdomain.com/api`
  - Must match your production backend URL

#### Email (SendGrid)
- `REACT_APP_SENDGRID_API_KEY` - SendGrid API key
  - Get from: https://app.sendgrid.com/settings/api_keys
  - Requires "Mail Send" permission

- `REACT_APP_FROM_EMAIL` - Email sender address
  - For production: Use a verified domain (e.g., `noreply@yourdomain.com`)
  - For development: Can use `noreply@sendgrid.net`

- `REACT_APP_FROM_NAME` - Email sender name
  - Example: `CN Terminal`

- `REACT_APP_EMAIL_DEV_MODE` - Email development mode
  - Set to `false` for production (sends real emails)
  - Set to `true` for development (logs emails instead)

### Optional Variables

- `PORT` - Backend server port (default: `5000`)
- `NODE_ENV` - Node environment (set to `production` for production)
- `DB_PASSWORD` - Database password (used in docker-compose)

## Platform-Specific Setup

### Docker Compose

1. Create `.env.production` file in the project root
2. Add all environment variables
3. Update `docker-compose.prod.yml` to use these variables:
   ```yaml
   environment:
     - DATABASE_URL=${DATABASE_URL}
     - JWT_SECRET=${JWT_SECRET}
     # ... etc
   ```
4. Run: `docker-compose -f docker-compose.prod.yml up -d`

### Render.com

1. Go to your service settings
2. Navigate to **Environment** tab
3. Add each environment variable as a key-value pair
4. Save and redeploy

### Heroku

1. Install Heroku CLI: `heroku login`
2. Set variables:
   ```bash
   heroku config:set DATABASE_URL=your_value
   heroku config:set JWT_SECRET=your_value
   # ... etc
   ```
3. Or use the Heroku dashboard: Settings → Config Vars

### Vercel

1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add variables for Production, Preview, and Development
4. Redeploy

### AWS/DigitalOcean/Other VPS

1. Create `.env.production` file on the server
2. Use a process manager like PM2 with `dotenv`:
   ```bash
   pm2 start server.js --env production
   ```
3. Or use systemd service files with `EnvironmentFile` directive

## Security Best Practices

1. **Never commit `.env` files to version control**
   - Add `.env*` to `.gitignore` (except `.env.example`)
   - Use `.env.example` as a template

2. **Use strong secrets:**
   ```bash
   # Generate JWT secret
   openssl rand -base64 32
   
   # Generate database password
   openssl rand -base64 24
   ```

3. **Rotate secrets regularly:**
   - Change JWT_SECRET periodically
   - Update database passwords regularly
   - Rotate API keys when compromised

4. **Limit access:**
   - Only authorized personnel should have access to production env vars
   - Use environment-specific secrets (different for dev/staging/prod)

5. **Use secret management services:**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault
   - Render/Heroku built-in secret management

## Verification

After setting up environment variables, verify they're loaded correctly:

### Backend Verification
```bash
# In backend directory
node -e "require('dotenv').config(); console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing');"
```

### Frontend Verification
```bash
# Build frontend and check if API URL is correct
cd frontend
npm run build
# Check build output for API URL
```

## Troubleshooting

### Common Issues

1. **"DATABASE_URL is not defined"**
   - Ensure `.env.production` exists and contains `DATABASE_URL`
   - Check file path is correct
   - Verify `dotenv` is loading the file

2. **"JWT_SECRET is not defined"**
   - Add `JWT_SECRET` to your environment variables
   - Ensure it's a strong, random string

3. **CORS errors**
   - Verify `CORS_ORIGIN` includes your frontend URL
   - Check `FRONTEND_URL` matches your actual frontend domain

4. **Email not sending**
   - Verify `REACT_APP_SENDGRID_API_KEY` is correct
   - Check `REACT_APP_EMAIL_DEV_MODE` is set to `false`
   - Verify SendGrid API key has proper permissions
   - Check SendGrid dashboard for email delivery status

5. **Frontend can't connect to backend**
   - Verify `REACT_APP_API_URL` is correct
   - Ensure it matches your production backend URL
   - Check if backend is accessible from frontend domain

## Next Steps

After setting up environment variables:

1. ✅ Test database connection
2. ✅ Test authentication (login)
3. ✅ Test email sending (send invitation)
4. ✅ Test API endpoints
5. ✅ Verify CORS is working
6. ✅ Check Socket.IO connections (if using real-time features)

## Support

For issues or questions:
- Check application logs
- Review error messages
- Verify all environment variables are set correctly
- Test with a minimal configuration first

