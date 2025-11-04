# CN Terminal Production Deployment Commands

Quick reference for deploying and managing CN Terminal on Contabo VPS (81.0.247.14).

## Initial Setup on Server

### 1. Connect to Server
```bash
ssh user@81.0.247.14
```

### 2. Install Prerequisites
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

### 3. Create Application Directory
```bash
mkdir -p ~/cn_terminal
cd ~/cn_terminal
```

### 4. Upload Application Files
```bash
# Option A: Clone from Git
git clone <your-repo-url> .

# Option B: Upload via SCP (from local machine)
# scp -r ./cn_terminal_webapp_completed/* user@81.0.247.14:~/cn_terminal/
```

### 5. Create Environment Files
```bash
# Copy environment templates
cp .env.example .env
cp backend/.env.production.example backend/.env.production
cp frontend/.env.production.example frontend/.env.production

# Edit .env file
nano .env
```

**Update `.env` with secure values:**
```bash
DB_PASSWORD=your_secure_database_password
JWT_SECRET=generate_with_node_command_below
FRONTEND_URL=http://81.0.247.14:3000
CORS_ORIGIN=http://81.0.247.14:3000,https://your-domain.com
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 6. Deploy Application
```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

## Database Setup

### 1. Push Prisma Schema
```bash
docker exec -it cn_terminal_backend npx prisma db push
```

### 2. Generate Prisma Client
```bash
docker exec -it cn_terminal_backend npx prisma generate
```

### 3. Create Super Admin
```bash
docker exec -it cn_terminal_backend node scripts/create-admin.js
```

Or use the API:
```bash
curl -X POST http://localhost:5000/api/init/super-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Super Admin",
    "email": "admin@cnterminal.com",
    "password": "SecurePassword123"
  }'
```

## Regular Operations

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Restart Services
```bash
# Restart all
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
docker-compose -f docker-compose.prod.yml restart frontend
```

### Update Application
```bash
# Pull latest code (if using Git)
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Check Service Status
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

## Database Operations

### Create Backup
```bash
docker exec cn_terminal_postgres pg_dump -U cn_terminal_user cn_terminal_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Backup
```bash
cat backup_file.sql | docker exec -i cn_terminal_postgres psql -U cn_terminal_user -d cn_terminal_db
```

### Access Database Console
```bash
docker exec -it cn_terminal_postgres psql -U cn_terminal_user -d cn_terminal_db
```

## Container Access

### Backend Container Shell
```bash
docker exec -it cn_terminal_backend /bin/bash
```

### Frontend Container Shell
```bash
docker exec -it cn_terminal_frontend /bin/sh
```

### Database Container Shell
```bash
docker exec -it cn_terminal_postgres /bin/sh
```

## Troubleshooting

### Containers Won't Start
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

### Database Connection Errors
```bash
# Verify database is running
docker-compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Test connection from backend
docker exec -it cn_terminal_backend node -e "console.log(process.env.DATABASE_URL)"
```

### Prisma Client Errors
```bash
# Regenerate Prisma Client
docker exec -it cn_terminal_backend npx prisma generate

# Push schema
docker exec -it cn_terminal_backend npx prisma db push
```

### Environment Variables Not Loading
```bash
# Verify environment variables
docker exec cn_terminal_backend env | grep DATABASE_URL
docker exec cn_terminal_frontend env | grep REACT_APP
```

## Access Points

- **Frontend**: http://81.0.247.14:3000
- **Backend API**: http://81.0.247.14:5000/api
- **API Documentation**: http://81.0.247.14:5000/api/docs
- **Database**: localhost:5433 (only accessible on server)

## Automatic Backups

### Set Up Daily Backups (Optional)
```bash
# Create backup script
cat > ~/backup-database.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=~/backups/cn_terminal
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
docker exec cn_terminal_postgres pg_dump -U cn_terminal_user cn_terminal_db > $BACKUP_DIR/backup_$DATE.sql
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x ~/backup-database.sh

# Add to crontab (daily backup at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * ~/backup-database.sh") | crontab -
```

## Security Notes

1. **Change default passwords** in `.env` file
2. **Generate strong JWT secrets** using crypto.randomBytes
3. **Configure firewall** to only allow necessary ports
4. **Set up SSL/HTTPS** if using a domain name
5. **Keep Docker images updated** regularly
6. **Monitor logs** for suspicious activity
7. **Regular backups** are essential

## Next Steps

1. ✅ Deploy containers
2. ✅ Set up database schema
3. ✅ Create admin user
4. ⚙️ Configure Nginx reverse proxy (optional)
5. 🔒 Set up SSL certificate (if using domain)
6. 📊 Configure monitoring/logging
7. 🔄 Set up automatic backups


