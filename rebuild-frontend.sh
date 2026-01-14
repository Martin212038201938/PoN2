#!/bin/bash
# PoN2 Frontend Rebuild Script
# Führe dieses Script aus, um das Frontend mit der korrekten API-URL neu zu bauen

set -e

echo "=== PoN2 Frontend Rebuild ==="
echo ""

cd ~/pon2

echo "1. Git Pull..."
git pull origin claude/restore-pre-merge-state-0UOVb || git pull

echo ""
echo "2. Frontend Dependencies installieren..."
cd frontend
npm install

echo ""
echo "3. Frontend bauen mit Production-Config..."
npm run build

echo ""
echo "=== FERTIG ==="
echo "Frontend wurde neu gebaut mit VITE_API_URL=https://api.pon2.yellow-plane.com/api"
echo ""
echo "Teste jetzt den Login auf https://pon2.yellow-plane.com"
