#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — One-command production deployment for Techverse
# Run on the server: bash deploy.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e  # Exit immediately on any error

echo ""
echo "════════════════════════════════════════════"
echo "  🚀  Techverse Production Deploy"
echo "════════════════════════════════════════════"
echo ""

# 1. Pull latest code
echo "📥 Pulling latest code from git..."
git pull

# 2. Make sure .env exists (do NOT overwrite if already present)
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found! Copying .env.production → .env"
    echo "   Please update SECRET_KEY in .env before continuing."
    cp .env.production .env
    exit 1
fi

# 3. Build & restart all production containers
echo ""
echo "🔨 Building and starting containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Wait a moment for containers to settle
sleep 5

# 5. Show status
echo ""
echo "📊 Container status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "════════════════════════════════════════════"
echo "  ✅  Deploy complete!"
echo "  🌐  Site: http://$(hostname -I | awk '{print $1}'):8081"
echo "════════════════════════════════════════════"
echo ""
