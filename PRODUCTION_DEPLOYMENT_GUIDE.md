# Production Deployment Guide

This document outlines the complete strategy for deploying the Best Deal Shipping application to production, specifically for deployment to a Kotombo server. This guide can be used as a reference for deploying similar Node.js applications.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Dockerfile Creation Strategy](#dockerfile-creation-strategy)
3. [Environment Configuration](#environment-configuration)
4. [Docker Compose Setup](#docker-compose-setup)
5. [Deployment Scripts](#deployment-scripts)
6. [Server Deployment Commands](#server-deployment-commands)
7. [Database Setup](#database-setup)
8. [Post-Deployment Tasks](#post-deployment-tasks)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The application consists of three main components:
- **Frontend**: React application served via Node.js serve
- **Backend**: Node.js/Express API with Prisma ORM
- **Database**: PostgreSQL database

All components are containerized using Docker and orchestrated with Docker Compose.

---

## Dockerfile Creation Strategy

### Backend Dockerfile (`backend/Dockerfile.prod`)

**Strategy**: Multi-stage build with dependency optimization

```dockerfile
FROM node:18-bullseye

WORKDIR /app

# Copy dependency files first (Docker layer caching)
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose application port
EXPOSE 5000

# Start application
CMD ["npm","start"]
```

**Key Points:**
- Uses `node:18-bullseye` for stability
- Separates dependency installation from code copying (improves caching)
- Uses `npm ci --omit=dev` to install only production dependencies
- Generates Prisma Client at build time
- Exposes port 5000

### Frontend Dockerfile (`frontend/Dockerfile.prod`)

**Strategy**: Build optimization with minimal production image

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy dependency files
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Set execute permissions for binaries
RUN chmod +x node_modules/.bin/*

# Build React application
RUN npm run build

# Remove unnecessary files to reduce image size
RUN rm -rf *.md test/ tests/ __tests__/ src/dev-tools/

# Install serve globally
RUN npm install -g serve

# Expose application port
EXPOSE 3000

# Serve built application
CMD ["serve", "-s", "build", "-l", "3000"]
```

**Key Points:**
- Uses `node:18-alpine` for smaller image size
- Builds React application during Docker build
- Removes test files and documentation after build
- Uses `serve` to serve static files
- Exposes port 3000

---

## Environment Configuration

### Backend Environment Variables (`.env.production`)

Create `backend/.env.production` with the following structure:

```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://username:password@host:5432/database_name?schema=public

# JWT Configuration
# Generate secrets using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-generated-jwt-secret-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-generated-refresh-secret-here
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
# Comma-separated list of allowed origins
CORS_ORIGINS=https://your-production-domain.com,https://www.your-production-domain.com

# Production URL
PRODUCTION_URL=https://api.your-production-domain.com

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

### Frontend Environment Variables (`.env.production`)

Create `frontend/.env.production` with the following structure:

```bash
# Application Info
REACT_APP_NAME=Best Deal App
REACT_APP_LOGO_PATH=/AppLogo.png

# Backend API Configuration
REACT_APP_API_URL=https://api.your-production-domain.com
REACT_APP_API_BASE_PATH=/api/v1

# Support Contact
REACT_APP_SUPPORT_EMAIL=support@your-domain.com
REACT_APP_SUPPORT_PHONE=+44 20 1234 5678

# LocalStorage Keys
REACT_APP_USER_STORAGE_KEY=shipease_user
REACT_APP_TOKEN_STORAGE_KEY=shipease_token

# Feature Flags
REACT_APP_ENABLE_TRACKING=true
REACT_APP_ENABLE_NOTIFICATIONS=true
```

### Environment File Template Creation

**Backend Template** (`backend/.env.example`):
```bash
# Copy this file to .env.production and update with your production values
PORT=5000
NODE_ENV=production
DATABASE_URL=your-database-url
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
CORS_ORIGINS=https://your-domain.com
PRODUCTION_URL=https://api.your-domain.com
```

**Frontend Template** (`frontend/.env.example`):
```bash
# Copy this file to .env.production and update with your production values
REACT_APP_API_URL=https://api.your-domain.com
REACT_APP_NAME=Your App Name
REACT_APP_SUPPORT_EMAIL=support@your-domain.com
```

---

## Docker Compose Setup

### Production Docker Compose (`docker-compose.prod.yml`)

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: bestdeal_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: bestdeal_shipping
      POSTGRES_USER: bestdeal_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - bestdeal_network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: bestdeal_backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://bestdeal_user:${DB_PASSWORD}@postgres:5432/bestdeal_shipping?schema=public
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - CORS_ORIGINS=${CORS_ORIGINS}
      - PRODUCTION_URL=${PRODUCTION_URL}
      - PORT=5000
    ports:
      - "5000:5000"
    depends_on:
      - postgres
    networks:
      - bestdeal_network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: bestdeal_frontend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - bestdeal_network

volumes:
  postgres_data:

networks:
  bestdeal_network:
    driver: bridge
```

**Key Points:**
- Uses named volumes for database persistence
- Sets `restart: unless-stopped` for automatic container recovery
- Uses Docker bridge network for internal communication
- Environment variables are passed from host `.env` file
- Database exposed on port 5433 (non-standard to avoid conflicts)

---

## Deployment Scripts

### Git-Based Deployment Script (`deploy-production.sh`)

```bash
#!/bin/bash
echo "🚀 Deploying to Production Branch..."

# Check if we're on master branch
if [ "$(git branch --show-current)" != "master" ]; then
    echo "❌ Error: Must be on master branch to deploy"
    exit 1
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: Uncommitted changes detected"
    exit 1
fi

# Switch to production branch
git checkout production

# Merge master into production
git merge master

# Remove unnecessary files
echo "🧹 Cleaning production files..."
rm -rf *.md
rm -rf docs/
rm -rf test/
rm -rf tests/
rm -rf __tests__/
rm -rf .vscode/
rm -rf .idea/
rm -rf *.log
rm -rf .env.example
rm -rf .env.development
rm -rf .env.local
rm -rf .env.test

# Add only production files
git add .

# Commit clean production
git commit -m "Production deployment: $(date)"

# Push to production
git push origin production

# Switch back to master
git checkout master

echo "✅ Production deployment completed!"
```

**Usage:**
```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

---

## Server Deployment Commands

### Initial Server Setup (Kotombo Server)

#### 1. Connect to Server
```bash
ssh user@your-server-ip
```

#### 2. Install Prerequisites
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version
```

#### 3. Create Application Directory
```bash
mkdir -p ~/bestdeal_shipping
cd ~/bestdeal_shipping
```

#### 4. Clone Repository (or upload files)
```bash
# Option A: Clone from Git
git clone -b production https://your-repo-url.git .

# Option B: Upload files via SCP
# From local machine:
# scp -r ./bestdeal_shipping user@server-ip:~/bestdeal_shipping
```

#### 5. Create Environment Files
```bash
# Create backend environment file
nano backend/.env.production

# Create frontend environment file
nano frontend/.env.production

# Create root .env file for Docker Compose
nano .env
```

**Root `.env` file structure:**
```bash
DB_PASSWORD=your-secure-database-password
JWT_SECRET=your-generated-jwt-secret
JWT_REFRESH_SECRET=your-generated-refresh-secret
CORS_ORIGINS=https://your-domain.com
PRODUCTION_URL=https://api.your-domain.com
```

#### 6. Build and Start Containers
```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Regular Deployment Commands

#### Pull Latest Code and Deploy
```bash
# Navigate to application directory
cd ~/bestdeal_shipping

# Pull latest code (if using Git)
git pull origin production

# Rebuild and restart services
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### Quick Restart (without rebuild)
```bash
docker-compose -f docker-compose.prod.yml restart
```

#### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

#### View Service Status
```bash
docker-compose -f docker-compose.prod.yml ps
```

#### Access Container Shells
```bash
# Backend container
docker exec -it bestdeal_backend /bin/bash

# Frontend container
docker exec -it bestdeal_frontend /bin/sh

# Database container
docker exec -it bestdeal_postgres psql -U bestdeal_user -d bestdeal_shipping
```

---

## Database Setup

### Initial Database Migration

#### 1. Push Prisma Schema
```bash
# Enter backend container
docker exec -it bestdeal_backend /bin/bash

# Push schema to database
npx prisma db push

# Generate Prisma Client (if needed)
npx prisma generate

# Seed roles (if needed)
npm run seed:roles
```

#### 2. Create Superadmin (via Swagger or Script)
```bash
# Option A: Use Swagger UI
# Access: https://your-api-domain.com/api/docs
# Use POST /api/auth/create-superadmin endpoint

# Option B: Use script
docker exec -it bestdeal_backend node create-admin.js
```

### Database Backup Commands
```bash
# Create backup
docker exec bestdeal_postgres pg_dump -U bestdeal_user bestdeal_shipping > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
cat backup_file.sql | docker exec -i bestdeal_postgres psql -U bestdeal_user -d bestdeal_shipping
```

---

## Post-Deployment Tasks

### 1. Verify Services are Running
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check logs for errors
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs postgres
```

### 2. Test API Endpoints
```bash
# Health check
curl http://localhost:5000/health

# Test API
curl http://localhost:5000/api/docs
```

### 3. Configure Nginx Reverse Proxy (if needed)

**Nginx Configuration** (`/etc/nginx/sites-available/bestdeal`):
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable Site:**
```bash
sudo ln -s /etc/nginx/sites-available/bestdeal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Configure SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 5. Set Up Automatic Backups
```bash
# Create backup script
cat > ~/backup-database.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
docker exec bestdeal_postgres pg_dump -U bestdeal_user bestdeal_shipping > $BACKUP_DIR/backup_$DATE.sql
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x ~/backup-database.sh

# Add to crontab (daily backup at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * ~/backup-database.sh") | crontab -
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Containers Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check if ports are in use
sudo netstat -tulpn | grep -E ':(3000|5000|5433)'

# Rebuild from scratch
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

#### 2. Database Connection Errors
```bash
# Verify database is running
docker-compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Test connection from backend container
docker exec -it bestdeal_backend node -e "console.log(process.env.DATABASE_URL)"
```

#### 3. Prisma Client Errors
```bash
# Regenerate Prisma Client
docker exec -it bestdeal_backend npx prisma generate

# Push schema
docker exec -it bestdeal_backend npx prisma db push
```

#### 4. Frontend Build Errors
```bash
# Rebuild frontend
docker-compose -f docker-compose.prod.yml build --no-cache frontend
docker-compose -f docker-compose.prod.yml up -d frontend
```

#### 5. Environment Variable Issues
```bash
# Verify environment variables are loaded
docker exec bestdeal_backend env | grep DATABASE_URL
docker exec bestdeal_frontend env | grep REACT_APP
```

#### 6. Permission Issues
```bash
# Fix Docker permissions
sudo usermod -aG docker $USER
newgrp docker
```

---

## Security Best Practices

### 1. Environment Variables
- Never commit `.env` files to Git
- Use strong, randomly generated secrets for JWT
- Rotate secrets regularly
- Use separate credentials for development and production

### 2. Docker Security
- Run containers as non-root users (when possible)
- Keep Docker images updated
- Use specific image tags instead of `latest`
- Scan images for vulnerabilities

### 3. Database Security
- Use strong database passwords
- Restrict database access to specific IPs
- Enable SSL connections
- Regular backups and encryption

### 4. Network Security
- Use HTTPS/SSL in production
- Configure CORS properly
- Implement rate limiting
- Use firewall rules

---

## Quick Reference Commands

### Docker Compose Commands
```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Stop services
docker-compose -f docker-compose.prod.yml down

# Restart services
docker-compose -f docker-compose.prod.yml restart

# View logs
docker-compose -f docker-compose.prod.yml logs -f [service_name]

# Rebuild specific service
docker-compose -f docker-compose.prod.yml build [service_name]

# View running containers
docker-compose -f docker-compose.prod.yml ps
```

### Docker Commands
```bash
# List running containers
docker ps

# List all containers
docker ps -a

# View container logs
docker logs [container_name]

# Execute command in container
docker exec -it [container_name] [command]

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune
```

---

## Deployment Checklist

- [ ] Environment variables configured in `.env.production` files
- [ ] Database credentials secured
- [ ] JWT secrets generated and stored
- [ ] Docker and Docker Compose installed on server
- [ ] Dockerfiles created for both frontend and backend
- [ ] `docker-compose.prod.yml` configured
- [ ] Git repository cloned/uploaded to server
- [ ] Docker images built successfully
- [ ] Containers started and running
- [ ] Database schema pushed
- [ ] Roles seeded (if needed)
- [ ] Superadmin created
- [ ] API health check passes
- [ ] Frontend accessible
- [ ] Nginx configured (if used)
- [ ] SSL certificate installed (if using HTTPS)
- [ ] Backups configured
- [ ] Monitoring/logging set up
- [ ] Security measures implemented

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Production Build](https://create-react-app.dev/docs/deployment/)

---

**Last Updated**: 2024
**Version**: 1.0.0

