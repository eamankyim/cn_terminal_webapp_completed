# Production Branch Deployment Guide

## How Production Branch Works

The `deploy-production.sh` script ensures **only production-ready files** are pushed to the `production` branch by:

1. **Merging `main` → `production`** to get latest code
2. **Removing unnecessary files** (docs, tests, logs, uploads, etc.)
3. **Committing clean production code**
4. **Pushing to GitHub** to trigger auto-deployment

## Files Removed from Production Branch

### Documentation & Guides
- All `.md` files except `README.md`
- `docs/` directory

### Development Files
- `test/`, `tests/`, `__tests__/` directories
- All test files (`.test.js`, `.spec.js`, etc.)
- `.vscode/`, `.idea/` directories

### Logs & Temporary Files
- `*.log` files
- `backend/logs/` directory
- `screenshots/`, `tmp/`, `temp/` directories

### User-Generated Content
- `backend/uploads/` (keeps structure, removes files)

### Development Environment Files
- `.env.local`, `.env.development`, `.env.test`
- `backend/backup/`
- `backend/invitation-links.txt`

### Development Scripts Documentation
- `backend/scripts/*.md` files

## Files Kept in Production Branch

### Deployment Files
- `deploy.sh`
- `deploy-production.sh`
- `auto-deploy.sh`
- `docker-compose.prod.yml`
- `backend/Dockerfile.prod`
- `frontend/Dockerfile.prod`
- `.github/workflows/deploy.yml`
- `.env.example` files

### Application Code
- All `frontend/` source code
- All `backend/` source code (routes, services, middleware, utils)
- `package.json` and `package-lock.json` files
- Prisma schema and migrations

### Configuration
- `.gitignore`
- `README.md` (production version)

## How to Deploy

### From Local Machine

```bash
# Ensure you're on main branch with all changes committed
git checkout main

# Run deployment script
./deploy-production.sh
```

The script will:
1. Check you're on `main` branch
2. Check for uncommitted changes
3. Switch to `production` branch
4. Merge `main` into `production`
5. Clean up non-production files
6. Commit and push to GitHub
7. Switch back to `main`

### Auto-Deployment on Server

When the `production` branch is pushed to GitHub, the server automatically:

1. Pulls latest `production` branch code
2. Stops containers
3. Rebuilds images
4. Restarts containers
5. Shows container status

Configured via:
- `.github/workflows/deploy.yml` (GitHub Actions)
- `auto-deploy.sh` (server-side script)

## GitHub Secrets Required

For GitHub Actions to work, set these in your repository settings:

- `PROD_SERVER_IP`: Your server IP address
- `PROD_SERVER_USER`: SSH username
- `PROD_SERVER_SSH_KEY`: Private SSH key

## Environment Variables

Production environment variables are set in:
- `.env` file on the server (created from `.env.example`)
- Docker Compose environment section
- GitHub Actions (optional, for CI/CD)

## Manual Server Deployment

If auto-deployment fails, manually deploy:

```bash
ssh user@your-server-ip
cd ~/cn_terminal
./auto-deploy.sh
```

Or step by step:

```bash
cd ~/cn_terminal
git pull origin production
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml ps
```

## Verification

After deployment, verify:

1. **Containers are running**:
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

2. **Check logs**:
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f
   ```

3. **Access application**:
   - Frontend: `http://your-server-ip:3000`
   - Backend: `http://your-server-ip:5000/api`
   - API Docs: `http://your-server-ip:5000/api/docs`

4. **Database connectivity**:
   ```bash
   docker exec -it cn_terminal_backend npx prisma db pull
   ```

## Troubleshooting

### Deployment script fails

- Ensure you're on `main` branch
- Commit or stash all changes
- Check you have SSH access to GitHub
- Verify production branch exists

### Containers won't start

- Check logs: `docker-compose -f docker-compose.prod.yml logs`
- Verify `.env` file exists on server
- Check database connectivity
- Ensure ports 3000, 5000, 5433 are available

### Auto-deployment not working

- Check GitHub Actions logs
- Verify SSH key is correct in GitHub secrets
- Test SSH connection manually
- Check `auto-deploy.sh` permissions: `chmod +x auto-deploy.sh`

## Best Practices

1. **Always test on `main`** before deploying to `production`
2. **Review changes** before running `deploy-production.sh`
3. **Keep `.env.example` updated** with all required variables
4. **Monitor container logs** after deployment
5. **Test critical functionality** after each deployment
6. **Keep database backups** before major deployments

## Security Notes

- Never commit `.env` files to Git
- Use strong `JWT_SECRET` in production
- Set secure `DB_PASSWORD`
- Configure `CORS_ORIGIN` properly
- Keep Docker images updated
- Regularly rotate secrets


