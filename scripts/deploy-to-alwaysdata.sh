#!/bin/bash
set -e

echo "🚀 Starting PoN2 Deployment on AlwaysData..."
echo ""

# We're already in ~/pon2 directory when this script is called

# Set Prisma environment variables to avoid permission issues
export PRISMA_CLI_BINARY_TARGETS="debian-openssl-1.0.x"
export PRISMA_SKIP_POSTINSTALL_GENERATE=true
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --legacy-peer-deps

# Create backend .env
echo "🔧 Creating backend .env file..."
cat > .env << 'ENVEOF'
# Database
DATABASE_URL="postgresql://y-b_pon:Schwyz_6436!@postgresql-y-b.alwaysdata.net:5432/y-b_pon2_production"

# Server
PORT=8080
NODE_ENV=production

# JWT
JWT_SECRET="57uJuRKALW2kWtGA/5Z54nrLZL893NodmFwPShIx8Ao="
JWT_EXPIRES_IN="7d"

# AI Services - REPLACE WITH YOUR ACTUAL KEYS
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# External Integrations
GENEALOGY_NET_API_KEY=""
MYHERITAGE_API_KEY=""
PERPLEXITY_API_KEY=""

# Budget Limits
DEFAULT_CASE_BUDGET_EUR=100
DEFAULT_MAX_API_CALLS_PER_SOURCE=50

# Logging
LOG_LEVEL="info"
ENVEOF

# Generate Prisma client explicitly with proper environment variables
echo "🔧 Generating Prisma client..."
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
export PRISMA_SKIP_POSTINSTALL_GENERATE=true
if ! npx prisma generate; then
    echo "❌ Prisma client generation failed!"
    echo "💡 Troubleshooting tips:"
    echo "   1. Check internet connectivity"
    echo "   2. Verify DATABASE_URL is set correctly"
    echo "   3. Check Prisma cache permissions"
    exit 1
fi

# Push database schema
echo "🗄️  Pushing database schema..."
if ! npx prisma db push --accept-data-loss --skip-generate; then
    echo "❌ Database schema push failed!"
    echo "💡 Check DATABASE_URL and database permissions"
    exit 1
fi

# Build backend
echo "🔨 Building backend..."
if ! npm run build; then
    echo "❌ TypeScript build failed!"
    echo "💡 Check TypeScript errors above"
    exit 1
fi

# Install frontend dependencies and build
echo "🎨 Building frontend..."
cd ../frontend
npm install --legacy-peer-deps

# Create frontend .env
echo "🔧 Creating frontend .env file..."
cat > .env << 'ENVEOF'
VITE_API_URL=https://api.pon2.yellow-plane.com/api
ENVEOF

npm run build

# Install PM2 if not already installed
echo "⚙️  Setting up PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
else
    echo "PM2 already installed"
fi

# Start backend with PM2
echo "🚀 Starting backend with PM2..."
cd ../backend
pm2 delete pon2-backend 2>/dev/null || true
pm2 start npm --name pon2-backend -- run start:prod
pm2 save

# Show status
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 PM2 Status:"
pm2 list
echo ""
echo "📍 Details:"
echo "   Backend:  Running on port 8080"
echo "   Frontend: Built to ~/pon2/frontend/dist"
echo "   Domain:   pon2.yellow-plane.com"
echo "   Database: y-b_pon2_production"
echo ""
echo "📋 Configuration:"
echo "   AlwaysData Site 992755: Node.js app pointing to port 8080"
echo "   AlwaysData Site 992754: Static files from ~/pon2/frontend/dist"
echo ""
echo "✅ Backend is deployed and running!"
echo ""
