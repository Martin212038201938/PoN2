#!/bin/bash
set -e

echo "🚀 PoN2 - AlwaysData Deployment Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the PoN2 root directory.${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Directory check passed"

# Step 1: Install dependencies
echo ""
echo "📦 Step 1/7: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to install root dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Root dependencies installed"

# Step 2: Install backend dependencies
echo ""
echo "📦 Step 2/7: Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to install backend dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Backend dependencies installed"

# Step 3: Generate Prisma Client
echo ""
echo "🔧 Step 3/7: Generating Prisma Client..."
npm run db:generate
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠ Warning: Prisma generate failed. Trying with checksum ignore...${NC}"
    PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Failed to generate Prisma Client${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓${NC} Prisma Client generated"

# Step 4: Build Backend
echo ""
echo "🔨 Step 4/7: Building backend..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Backend build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Backend built successfully"

# Step 5: Install frontend dependencies
echo ""
echo "📦 Step 5/7: Installing frontend dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to install frontend dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Frontend dependencies installed"

# Step 6: Build Frontend
echo ""
echo "🎨 Step 6/7: Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Frontend built successfully"

# Step 7: Database setup (optional, only if .env exists)
echo ""
echo "🗄️  Step 7/7: Database setup..."
cd ../backend
if [ -f ".env" ]; then
    echo "Found .env file, setting up database..."

    # Push database schema
    npm run db:push
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Database schema applied"
    else
        echo -e "${YELLOW}⚠ Warning: Database push failed. You may need to run this manually.${NC}"
    fi

    # Optional: Run seed
    read -p "Do you want to seed the database? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm run db:seed
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓${NC} Database seeded"
        else
            echo -e "${YELLOW}⚠ Warning: Database seeding failed${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠ No .env file found in backend directory${NC}"
    echo "Skipping database setup. Please create backend/.env and run:"
    echo "  cd backend"
    echo "  npm run db:generate"
    echo "  npm run db:push"
    echo "  npm run db:seed"
fi

# Summary
echo ""
echo "========================================"
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Make sure backend/.env is configured"
echo "2. Make sure frontend/.env is configured"
echo "3. Start the backend:"
echo "   cd backend && npm start"
echo "   or with PM2: pm2 start dist/index.js --name pon2-backend"
echo "4. Serve the frontend from frontend/dist/"
echo ""
echo "Build outputs:"
echo "  - Backend: backend/dist/"
echo "  - Frontend: frontend/dist/"
echo ""
echo "📖 For more details, see: docs/deployment.md"
