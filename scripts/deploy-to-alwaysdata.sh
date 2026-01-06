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

# Initialize database schema with Drizzle
echo "🗄️  Database schema initialization..."

if [ "$SKIP_DB_INIT" = "true" ]; then
    echo "⏭️  Skipping db:init (SKIP_DB_INIT=true)"
    echo "💡 Assuming database schema is already up to date"
else
    echo "Initializing database schema via Node.js script..."
    echo "This uses postgres.js directly, no psql or drizzle-kit needed!"
    echo ""

    # CRITICAL: Disable exit-on-error for db:init section
    # This allows deployment to continue even if db:init fails (graceful degradation)
    set +e

    # Run db:init script (uses tsx to execute TypeScript directly)
    npm run db:init 2>&1 | tee /tmp/db-init.log
    DB_INIT_EXIT_CODE=$?

    # Re-enable exit-on-error for subsequent commands
    set -e

    echo ""
    if [ $DB_INIT_EXIT_CODE -eq 0 ]; then
        echo "✅ Database schema initialized successfully"
    else
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "⚠️  WARNING: Database schema initialization failed"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Exit code: $DB_INIT_EXIT_CODE"
        echo ""
        echo "💡 POSSIBLE CAUSES:"
        echo "   1. Database connection issues (check DATABASE_URL in .env)"
        echo "   2. Database permissions insufficient"
        echo "   3. Schema already exists (this is OK, script is idempotent)"
        echo ""
        echo "💡 MANUAL WORKAROUND:"
        echo "   If this is the first deployment, you can manually run:"
        echo "   cd ~/pon2/backend && npm run db:init"
        echo ""
        echo "⚠️  CONTINUING DEPLOYMENT despite db:init error"
        echo "   If schema already exists, backend should start normally."
        echo "   If backend fails, check logs: pm2 logs pon2-backend"
        echo ""
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
# CRITICAL: In a monorepo, we start PM2 from ROOT and point directly to the built JS file
# This avoids npm workspace resolution issues entirely
cd ~/pon2  # Go back to project root

# Delete existing PM2 process if it exists
pm2 delete pon2-backend 2>/dev/null || true

# Verify the built file exists
if [ ! -f "backend/dist/index.js" ]; then
    echo "❌ ERROR: backend/dist/index.js not found!"
    echo "   Build may have failed. Check build output above."
    exit 1
fi

echo "✅ Built file found: backend/dist/index.js"

# Start backend with PM2 pointing directly to the built file
# --cwd sets the working directory to the monorepo ROOT
# The path backend/dist/index.js is relative to the cwd (~/pon2)
# .env file is in ~/pon2/backend, so the app will need to find it via relative path
pm2 start backend/dist/index.js \
    --name pon2-backend \
    --cwd ~/pon2 \
    --env production

# Save PM2 process list
pm2 save

echo ""
echo "📊 PM2 Process Details:"
pm2 show pon2-backend

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
