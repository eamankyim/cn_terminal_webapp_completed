#!/bin/bash

echo "🚀 Deploying CN Terminal to Production Branch..."

# Check if we're on main branch
if [ "$(git branch --show-current)" != "main" ]; then
    echo "❌ Error: Must be on main branch to deploy"
    exit 1
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: Uncommitted changes detected"
    echo "Please commit or stash your changes first"
    exit 1
fi

# Check if production branch exists
if ! git show-ref --verify --quiet refs/heads/production; then
    echo "🌿 Creating production branch..."
    git checkout -b production
else
    # Switch to production branch
    git checkout production
fi

# Merge main into production
echo "📦 Merging main into production..."
git merge main --no-edit

# Remove unnecessary files for production
echo "🧹 Cleaning production files..."

# Remove all .md files except README.md
find . -maxdepth 1 -name "*.md" -not -name "README.md" -delete

# Remove development-only directories
rm -rf docs/
rm -rf test/
rm -rf tests/
rm -rf __tests__/
rm -rf .vscode/
rm -rf .idea/

# Remove log files
rm -rf *.log
rm -rf backend/logs/*.log

# Remove uploaded files (but keep directory structure)
find backend/uploads -mindepth 2 -type f -delete 2>/dev/null || true

# Remove development files
rm -rf backend/backup/
rm -rf backend/invitation-links.txt

# Remove development scripts (keep only essential ones)
find backend/scripts -name "*.md" -delete 2>/dev/null || true

# Remove any test/development files
find . -name "*.test.*" -delete 2>/dev/null || true
find . -name "*.spec.*" -delete 2>/dev/null || true
find . -name ".env.local" -delete 2>/dev/null || true
find . -name ".env.development" -delete 2>/dev/null || true
find . -name ".env.test" -delete 2>/dev/null || true

# Remove screenshots and temp files
rm -rf screenshots/
rm -rf tmp/
rm -rf temp/

# Add only production files
git add .

# Commit clean production
git commit -m "Production deployment: $(date +'%Y-%m-%d %H:%M:%S')"

# Push to production
echo "📤 Pushing to production branch..."
git push origin production

# Switch back to main
git checkout main

echo ""
echo "✅ Production deployment completed!"
echo ""
echo "📋 Next steps:"
echo "  The production branch has been pushed to GitHub."
echo "  Your server should auto-deploy when it detects the push."
echo ""
echo "🔍 To manually deploy on server:"
echo "  ssh user@your-server-ip"
echo "  cd ~/cn_terminal"
echo "  git pull origin production"
echo "  docker-compose -f docker-compose.prod.yml down"
echo "  docker-compose -f docker-compose.prod.yml build --no-cache"
echo "  docker-compose -f docker-compose.prod.yml up -d"
echo ""

