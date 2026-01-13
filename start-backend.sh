#!/bin/bash
#
# PoN2 Backend Startup Script für AlwaysData
#
# Verwendung:
#   ./start-backend.sh          # Startet im Vordergrund (für Debugging)
#   ./start-backend.sh pm2      # Startet mit PM2 (für Produktion)
#
# Port: 8100 (fest, identisch mit ecosystem.config.cjs und index.ts)
#

set -e

cd "$(dirname "$0")"
echo "📁 Working directory: $(pwd)"

# .env laden falls vorhanden
if [ -f backend/.env ]; then
    echo "✅ Loading backend/.env"
    export $(grep -v '^#' backend/.env | xargs)
else
    echo "⚠️  No backend/.env found - using defaults"
fi

# Port setzen (überschreibt alles andere)
export PORT=8100
echo "🔧 PORT=$PORT"

# Prüfen ob Port frei ist
if lsof -i :$PORT -t > /dev/null 2>&1; then
    echo "❌ Port $PORT is already in use!"
    echo "   Run: lsof -i :$PORT"
    echo "   Or:  fuser -k $PORT/tcp"
    exit 1
fi

if [ "$1" = "pm2" ]; then
    echo "🚀 Starting with PM2..."
    pm2 delete pon2-backend 2>/dev/null || true
    pm2 start ecosystem.config.cjs --env production
    pm2 logs pon2-backend --lines 20
else
    echo "🚀 Starting directly (Ctrl+C to stop)..."
    cd backend
    npx tsx src/index.ts
fi
