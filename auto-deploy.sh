#!/bin/bash

# Auto-deploy script to be run on the server
# This script should be called via GitHub webhook or cron job

cd ~/cn_terminal

# Pull latest from production branch
echo "📥 Pulling latest changes from production..."
git fetch origin
git checkout production
git pull origin production

# Restart containers
echo "🔄 Restarting containers..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Show status
echo "📊 Container status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Deployment completed!"


