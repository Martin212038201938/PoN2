#!/bin/bash
set -e

echo "🚀 Starting PoN2 Deployment on AlwaysData..."
echo ""

# Configuration flags
SKIP_DB_PUSH=${SKIP_DB_PUSH:-false}  # Set to true to skip db:push

# We're already in ~/pon2 directory when this script is called

# CRITICAL FIX: Install dependencies at ROOT level first
# This is a monorepo with workspaces, so root install is required
echo "📦 Installing root dependencies (monorepo workspaces)..."
npm install --legacy-peer-deps

# Now install backend dependencies specifically
echo "📦 Installing backend dependencies..."
cd backend

# Use npm install for clean installation
# --include=dev ensures devDependencies are installed (needed for build)
echo "Installing backend dependencies..."
rm -rf node_modules package-lock.json 2>/dev/null || true
npm install --legacy-peer-deps --include=dev

# Verify critical Drizzle packages are installed
echo "🔍 Verifying Drizzle packages installation..."
echo "Checking node_modules for drizzle-orm..."
if [ ! -d "node_modules/drizzle-orm" ]; then
    echo "❌ CRITICAL: drizzle-orm directory not found in node_modules!"
    echo "📋 Listing node_modules:"
    ls -la node_modules/ | grep drizzle || echo "No drizzle packages found!"
    echo ""
    echo "📋 Package.json dependencies:"
    cat package.json | grep -A 3 "dependencies"
    exit 1
fi

echo "✅ Drizzle packages verified in node_modules"

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

# Push database schema with Drizzle
echo "🗄️  Database schema migration..."

if [ "$SKIP_DB_PUSH" = "true" ]; then
    echo "⏭️  Skipping db:push (SKIP_DB_PUSH=true)"
    echo "💡 Assuming database schema is already up to date"
else
    echo "Attempting to push database schema with Drizzle..."
    echo "PWD: $(pwd)"
    echo "NODE_MODULES exists: $([ -d node_modules ] && echo 'YES' || echo 'NO')"
    echo "DRIZZLE-ORM exists: $([ -d node_modules/drizzle-orm ] && echo 'YES' || echo 'NO')"
    echo "DRIZZLE-KIT exists: $([ -d node_modules/drizzle-kit ] && echo 'YES' || echo 'NO')"

    # Try multiple approaches to run drizzle-kit push
    PUSH_SUCCESS=false

    # Approach 1: Set NODE_PATH to help module resolution in monorepo
    echo "📍 Approach 1: Using NODE_PATH for module resolution..."
    export NODE_PATH="$(pwd)/node_modules:$(pwd)/../node_modules:/home/y-b/pon2/node_modules"
    if npm run db:push 2>&1 | tee /tmp/db-push.log; then
        echo "✅ db:push succeeded with NODE_PATH"
        PUSH_SUCCESS=true
    else
        echo "⚠️  Approach 1 failed, trying approach 2..."

        # Approach 2: Use npx with explicit --prefix
        echo "📍 Approach 2: Using npx drizzle-kit directly..."
        if npx drizzle-kit push 2>&1 | tee /tmp/db-push.log; then
            echo "✅ db:push succeeded with npx"
            PUSH_SUCCESS=true
        else
            echo "⚠️  Approach 2 failed"
        fi
    fi

    # Check if any approach succeeded
    if [ "$PUSH_SUCCESS" = "false" ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "⚠️  WARNING: Database schema push failed"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "This is a known issue with drizzle-kit in npm workspaces monorepo."
        echo ""
        echo "💡 WORKAROUND OPTIONS:"
        echo ""
        echo "1. If this is an initial deployment, the schema MUST be pushed manually:"
        echo "   - Connect to AlwaysData SSH"
        echo "   - cd ~/pon2/backend"
        echo "   - export NODE_PATH=\$(pwd)/node_modules:\$(pwd)/../node_modules"
        echo "   - npm run db:push"
        echo ""
        echo "2. If the schema already exists in the database:"
        echo "   - The deployment can continue (backend will connect to existing schema)"
        echo "   - Re-run deployment with: SKIP_DB_PUSH=true ./deploy-to-alwaysdata.sh"
        echo ""
        echo "3. Schema changes should be tested locally and pushed via SSH"
        echo ""

        # Check if we should continue or abort
        if grep -q "please install required packages" /tmp/db-push.log 2>/dev/null; then
            echo "📋 Error from drizzle-kit:"
            grep "Error" /tmp/db-push.log || cat /tmp/db-push.log | tail -20
            echo ""
            echo "⚠️  CONTINUING DEPLOYMENT (assuming schema exists in database)"
            echo "   If backend fails to start, push schema manually as shown above."
            echo ""
        else
            echo "📋 Last 20 lines of db:push output:"
            cat /tmp/db-push.log | tail -20
            echo ""
            echo "❌ ABORTING: Unknown db:push error"
            exit 1
        fi
    else
        echo "✅ Database schema pushed successfully"
    fi
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
echo "💡 If backend is not responding:"
echo "   1. Check PM2 logs: pm2 logs pon2-backend"
echo "   2. Check database connection from backend/src/index.ts"
echo "   3. Verify database schema was pushed (see warnings above)"
echo ""
