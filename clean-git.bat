@echo off
echo Cleaning up Git repository...

REM Remove cache files from Git tracking
git rm -r --cached frontend/node_modules/.cache
git rm -r --cached backend/node_modules/.cache

REM Add important files
git add .gitignore
git add backend/prisma/schema.prisma
git add backend/routes/invoices.js
git add frontend/src/pages/InvoicesPage.jsx
git add frontend/src/services/configurationService.js
git add frontend/src/utils/vatCalculator.js
git add backend/prisma/migrations/

REM Commit changes
git commit -m "Fix invoice charges display and remove cache files from tracking"

echo Done! Now you can push to Git.
