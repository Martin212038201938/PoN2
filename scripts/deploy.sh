#!/bin/bash
set -e

echo "🚀 Starting deployment..."

cd ~/pon2
git pull

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building backend..."
cd backend
npm run build

echo "🎨 Building frontend..."
cd ../frontend
npm run build

echo "🔄 Updating database..."
cd ../backend
npm run db:generate

echo "♻️  Restarting backend..."
pm2 restart pon2-backend --update-env

echo "✅ Deployment completed!"
