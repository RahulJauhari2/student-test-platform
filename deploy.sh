#!/bin/bash
# ======================================================
# Student Test Platform - VPS + Caddy Automated Deployment Script
# ======================================================

set -e

echo "🚀 Starting Deployment Update for Student Test Platform..."

# 1. Pull Latest Changes from Git
echo "📥 Pulling latest code from Git..."
git pull origin main

# 2. Update and Restart Backend API
echo "⚙️ Installing server dependencies & restarting backend..."
cd server
npm install --production
pm2 restart student-backend || pm2 start server.js --name "student-backend"
cd ..

# 3. Build Frontend Assets
echo "🎨 Installing client dependencies & building frontend..."
cd client
npm install
npm run build
cd ..

# 4. Reload Caddy Web Server
echo "🌐 Reloading Caddy Web Server..."
if command -v caddy &> /dev/null; then
    sudo caddy reload --config /etc/caddy/Caddyfile || true
fi

echo "======================================================"
echo "🎉 Deployment Completed Successfully!"
echo "======================================================"
