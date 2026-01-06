#!/bin/bash
# Simple wrapper script to initialize Drizzle schema
# Can be run manually on AlwaysData or locally

echo "🗄️  Initializing Drizzle Schema..."
echo ""

cd "$(dirname "$0")/.." || exit 1

if [ ! -f ".env" ]; then
    echo "❌ ERROR: .env file not found!"
    echo "   Please create .env with DATABASE_URL"
    exit 1
fi

if [ ! -f "drizzle-schema.sql" ]; then
    echo "❌ ERROR: drizzle-schema.sql not found!"
    echo "   Expected: $(pwd)/drizzle-schema.sql"
    exit 1
fi

echo "✅ Found .env and drizzle-schema.sql"
echo ""
echo "Running: npm run db:init"
echo ""

npm run db:init

exit $?
