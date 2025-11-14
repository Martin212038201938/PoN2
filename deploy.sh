#!/bin/bash
set -e

# PoN2 Production Deployment Script
# Deployiert die App auf alwaysdata Server

# Konfiguration
REMOTE_USER="y-b"
REMOTE_HOST="ssh-y-b.alwaysdata.net"
REMOTE_PATH="~/pon2"
LOCAL_PATH="."

echo "🚀 Starting PoN2 Production Deployment..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Farben für Output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Schritt 1: Lokale Checks
echo -e "${BLUE}📋 Step 1: Local checks...${NC}"
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Are you in the project root?${NC}"
    exit 1
fi

if [ ! -f "backend/.env.production" ]; then
    echo -e "${RED}❌ Error: backend/.env.production not found!${NC}"
    echo "Please create backend/.env.production with production credentials."
    exit 1
fi

echo -e "${GREEN}✓ Local checks passed${NC}"

# Schritt 2: Git Status prüfen
echo -e "${BLUE}📋 Step 2: Checking git status...${NC}"
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes!${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
CURRENT_COMMIT=$(git rev-parse --short HEAD)
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${GREEN}✓ Current: ${CURRENT_BRANCH} @ ${CURRENT_COMMIT}${NC}"

# Schritt 3: Code zum Server kopieren
echo -e "${BLUE}📦 Step 3: Syncing code to server...${NC}"
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude '*.log' \
    --exclude 'dist' \
    --exclude 'build' \
    --exclude '.DS_Store' \
    --exclude 'backend/.env' \
    --exclude 'frontend/.env' \
    ${LOCAL_PATH}/ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/

echo -e "${GREEN}✓ Code synced${NC}"

# Schritt 4: .env.production kopieren
echo -e "${BLUE}🔐 Step 4: Copying production environment...${NC}"
scp backend/.env.production ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/backend/.env
echo -e "${GREEN}✓ Environment configured${NC}"

# Schritt 5: Remote Setup und Build
echo -e "${BLUE}🔨 Step 5: Installing dependencies and building...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
set -e
cd ~/pon2

echo "📦 Installing root dependencies..."
npm install --production=false

echo "🔨 Building backend..."
cd backend
npm install --production=false
npm run build

echo "🎨 Building frontend..."
cd ../frontend
npm install --production=false
npm run build

echo "✓ Build completed"
ENDSSH

echo -e "${GREEN}✓ Build completed${NC}"

# Schritt 6: Datenbank migrieren
echo -e "${BLUE}🗄️  Step 6: Running database migrations...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
set -e
cd ~/pon2/backend

echo "Generating Prisma Client..."
npm run db:generate

echo "Pushing database schema..."
npm run db:push

echo "✓ Database updated"
ENDSSH

echo -e "${GREEN}✓ Database migrations completed${NC}"

# Schritt 7: PM2 Setup und Restart
echo -e "${BLUE}♻️  Step 7: Restarting application with PM2...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
set -e
cd ~/pon2

# PM2 installieren falls nicht vorhanden
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Backend starten/neu starten
cd backend
if pm2 describe pon2-backend > /dev/null 2>&1; then
    echo "Restarting pon2-backend..."
    pm2 restart pon2-backend --update-env
else
    echo "Starting pon2-backend..."
    pm2 start dist/index.js --name pon2-backend
    pm2 save
fi

# Status anzeigen
pm2 list
ENDSSH

echo -e "${GREEN}✓ Application restarted${NC}"

# Schritt 8: Health Check
echo -e "${BLUE}🏥 Step 8: Running health check...${NC}"
sleep 3
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
cd ~/pon2
pm2 logs pon2-backend --lines 10 --nostream
ENDSSH

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📊 Deployment Info:"
echo "   Branch: ${CURRENT_BRANCH}"
echo "   Commit: ${CURRENT_COMMIT}"
echo "   Time:   $(date)"
echo ""
echo "🔗 Next steps:"
echo "   1. Visit: https://PoN2.yellow-plane.com"
echo "   2. Check logs: ssh ${REMOTE_USER}@${REMOTE_HOST} 'pm2 logs pon2-backend'"
echo "   3. Monitor: ssh ${REMOTE_USER}@${REMOTE_HOST} 'pm2 monit'"
echo ""
