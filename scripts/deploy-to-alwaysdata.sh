#!/bin/bash
set -e

echo "🚀 Starting PoN2 Deployment on AlwaysData..."
echo ""

# Change to home directory
cd ~

# Remove old installation if exists
if [ -d ~/pon2 ]; then
    echo "⚠️  Removing old pon2 directory..."
    rm -rf ~/pon2
fi

# Clone repository
echo "📥 Cloning repository..."
git clone https://github.com/Martin212038201938/PoN2.git pon2
cd ~/pon2

# Install dependencies
echo "📦 Installing dependencies (this may take a while)..."
npm install

# Create backend .env
echo "🔧 Creating backend .env file..."
cat > backend/.env << 'ENVEOF'
# Database
DATABASE_URL="postgresql://y-b_pon2:hHHUGGNMPOewGrtTh467642gKhthwhj75fs3h9@postgresql-y-b.alwaysdata.net:5432/y-b_pon2_production?schema=public"

# Redis (optional - disable if not available)
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# Server
PORT=8080
NODE_ENV="production"

# JWT
JWT_SECRET="57UjURKALW2kWtGA/5Z54nrLZLB93NodmFwPShIx8Ao="
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

# Create frontend .env
echo "🔧 Creating frontend .env file..."
cat > frontend/.env << 'ENVEOF'
VITE_API_URL=https://pon2.yellow-plane.com/api
ENVEOF

# Initialize database
echo "🗄️  Initializing database with Prisma..."
cd ~/pon2/backend
npm run db:generate
npm run db:push

# Build backend
echo "🔨 Building backend..."
npm run build

# Build frontend
echo "🎨 Building frontend..."
cd ~/pon2/frontend
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
cd ~/pon2/backend
pm2 delete pon2-backend 2>/dev/null || true
pm2 start dist/index.js --name pon2-backend
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
echo "📋 Next Steps:"
echo "   1. Configure AlwaysData website for backend (Node.js on port 8080)"
echo "   2. Configure AlwaysData website for frontend (static files from ~/pon2/frontend/dist)"
echo "   3. Add your API keys to ~/pon2/backend/.env"
echo "   4. Enable SSL/HTTPS in AlwaysData panel"
echo "   5. Test: https://pon2.yellow-plane.com"
echo ""
echo "🔄 Future Updates:"
echo "   Run: ~/pon2/scripts/deploy.sh"
echo ""
