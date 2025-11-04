#!/bin/bash

# CN Terminal Production Deployment Script
# Configure environment variables in .env file before running

echo "🚀 CN Terminal Production Deployment Script"
echo "============================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please copy .env.example to .env and update the values"
    exit 1
fi

# Load environment variables
source .env

echo ""
echo "📋 Configuration:"
echo "  - Frontend URL: $FRONTEND_URL"
echo "  - CORS Origins: $CORS_ORIGIN"
echo ""

# Build and start containers
echo "🔨 Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo ""
echo "🚀 Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check if containers are running
echo ""
echo "📊 Container Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📝 Next steps:"
echo "  1. Wait for containers to be fully up (check logs: docker-compose -f docker-compose.prod.yml logs -f)"
echo "  2. Set up database schema:"
echo "     docker exec -it cn_terminal_backend npx prisma db push"
echo "  3. Create super admin:"
echo "     docker exec -it cn_terminal_backend node scripts/create-admin.js"
echo "  4. Access the application (check your .env for URLs):"
echo "     Frontend: ${FRONTEND_URL:-https://app.cnterminalghana.com}"
echo "     Backend: ${PRODUCTION_URL:-https://app.cnterminalghana.com}"
echo "     API Docs: ${PRODUCTION_URL:-https://app.cnterminalghana.com}/api-docs"
echo ""
echo "🔍 View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "🛑 Stop services: docker-compose -f docker-compose.prod.yml down"
echo ""

