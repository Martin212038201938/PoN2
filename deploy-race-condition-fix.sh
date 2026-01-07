#!/bin/bash
set -e

echo "🚀 Deploying Race Condition Fix"
echo "================================"
echo ""
echo "This script will:"
echo "  1. Pull latest changes (commit 9521c08)"
echo "  2. Clean and rebuild backend"
echo "  3. Restart PM2 with fresh code"
echo "  4. Verify HTTP server starts"
echo ""
read -p "Press Enter to continue..."
echo ""

cd ~/pon2

# Step 1: Pull latest changes
echo "📥 Step 1: Pulling race condition fix (9521c08)..."
git pull origin claude/migrate-prisma-to-drizzle-opqvS
echo ""

# Step 2: Verify source code has the fix
echo "🔍 Step 2: Verifying source code has the fix..."
if grep -q "PostgreSQL connection pool created" backend/src/db/index.ts; then
    echo "✅ Source code has new sync pool creation"
else
    echo "❌ ERROR: Source code still has old async callback!"
    exit 1
fi
echo ""

# Step 3: Clean build
echo "🧹 Step 3: Cleaning old build..."
cd backend
rm -rf dist/
echo "✅ dist/ removed"
echo ""

# Step 4: Fresh build
echo "🔨 Step 4: Building TypeScript..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi
echo ""

# Step 5: Verify compiled code has the fix
echo "🔍 Step 5: Verifying compiled code has the fix..."
if grep -q "PostgreSQL connection pool created" dist/db/index.js; then
    echo "✅ Compiled code has the fix"
else
    echo "❌ ERROR: Compiled code is missing the fix!"
    exit 1
fi
echo ""

# Step 6: Stop old PM2 process
echo "🛑 Step 6: Stopping old PM2 process..."
cd ~/pon2
pm2 delete pon2-backend 2>/dev/null || echo "   (Process wasn't running)"
echo ""

# Step 7: Start fresh PM2 process
echo "🚀 Step 7: Starting fresh PM2 process..."
pm2 start backend/dist/index.js \
    --name pon2-backend \
    --cwd ~/pon2 \
    --env production \
    --time

pm2 save
echo ""

# Step 8: Wait for startup
echo "⏳ Step 8: Waiting 5 seconds for server startup..."
sleep 5
echo ""

# Step 9: Check PM2 status
echo "📊 Step 9: PM2 Status..."
pm2 status
echo ""

# Step 10: Show logs and verify critical messages
echo "📋 Step 10: Checking logs for critical startup messages..."
echo "==========================================="
echo ""
echo "Looking for these CRITICAL messages:"
echo "  1. 'Testing database connection...'"
echo "  2. '✅ Database connected successfully'"
echo "  3. '🚀 PoN2 Backend API running on 0.0.0.0:8080'"
echo ""
echo "Recent logs:"
echo "-------------------------------------------"
pm2 logs pon2-backend --lines 40 --nostream
echo "-------------------------------------------"
echo ""

# Step 11: Check for critical startup messages
echo "🔍 Step 11: Verifying HTTP server started..."
LOGS=$(pm2 logs pon2-backend --lines 100 --nostream 2>&1)

if echo "$LOGS" | grep -q "Testing database connection"; then
    echo "✅ Found: 'Testing database connection...'"
else
    echo "❌ MISSING: 'Testing database connection...'"
fi

if echo "$LOGS" | grep -q "Database connected successfully"; then
    echo "✅ Found: '✅ Database connected successfully'"
else
    echo "❌ MISSING: '✅ Database connected successfully'"
fi

if echo "$LOGS" | grep -q "Backend API running on"; then
    echo "✅ Found: 'Backend API running on 0.0.0.0:8080'"
else
    echo "❌ MISSING: 'Backend API running on 0.0.0.0:8080'"
fi
echo ""

# Step 12: Test API
echo "🌐 Step 12: Testing API endpoint..."
echo "GET https://api.pon2.yellow-plane.com/api/health"
echo ""
curl -i https://api.pon2.yellow-plane.com/api/health 2>&1
echo ""
echo ""

# Step 13: Final summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if echo "$LOGS" | grep -q "Backend API running on"; then
    echo "✅ SUCCESS! HTTP server is running!"
    echo ""
    echo "The race condition has been fixed:"
    echo "  - Pool creation is now synchronous"
    echo "  - startServer() properly tests connection"
    echo "  - HTTP server starts successfully"
    echo ""
    echo "🎉 Backend is fully operational!"
else
    echo "❌ FAILED! HTTP server still not starting"
    echo ""
    echo "The logs above should help diagnose the issue."
    echo "If you still don't see 'Backend API running', check:"
    echo "  1. Are there any error messages in the logs?"
    echo "  2. Is port 8080 already in use?"
    echo "  3. Are there any TypeScript compilation errors?"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔧 Useful commands:"
echo "   pm2 logs pon2-backend           - Live logs"
echo "   pm2 restart pon2-backend        - Restart"
echo "   pm2 show pon2-backend           - Detailed info"
echo "   curl https://api.pon2.yellow-plane.com/api/health  - Test API"
echo ""
