#!/bin/bash

# PoN2 - Deploy from Local Machine to AlwaysData
# This script helps you deploy PoN2 to AlwaysData from your local machine

USERNAME="y-b_pon2"
HOST="ssh-y-b.alwaysdata.net"
PASSWORD="hHHUGGNMPOewGrtTh467642gKhthwhj75fs3h9"

echo "🚀 PoN2 Deployment to AlwaysData"
echo "================================"
echo ""

# Check if sshpass is available
if command -v sshpass &> /dev/null; then
    echo "✅ sshpass found, using automatic authentication"
    echo ""
    echo "📤 Uploading and executing deployment script..."

    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USERNAME@$HOST" 'bash -s' < scripts/deploy-to-alwaysdata.sh

    if [ $? -eq 0 ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "✅ Deployment completed successfully!"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    else
        echo ""
        echo "❌ Deployment failed!"
        exit 1
    fi
else
    echo "⚠️  sshpass not found. You need to deploy manually."
    echo ""
    echo "Option 1: Install sshpass and run this script again"
    echo "  - Ubuntu/Debian: sudo apt-get install sshpass"
    echo "  - macOS: brew install hudochenkov/sshpass/sshpass"
    echo ""
    echo "Option 2: Deploy manually via SSH"
    echo ""
    echo "Run these commands:"
    echo "  ssh $USERNAME@$HOST"
    echo "  Password: $PASSWORD"
    echo ""
    echo "  Then on the server:"
    echo "  curl -s https://raw.githubusercontent.com/Martin212038201938/PoN2/claude/deploy-pon2-alwaysdata-018EkqmRp1zpHFjyVp6P1Xvg/scripts/deploy-to-alwaysdata.sh | bash"
    echo ""
    echo "See DEPLOYMENT_INSTRUCTIONS.md for more details."
fi
