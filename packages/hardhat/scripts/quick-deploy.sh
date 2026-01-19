#!/bin/bash

# Quick deployment script for Susu Chain
# Usage: ./scripts/quick-deploy.sh [network]
# Example: ./scripts/quick-deploy.sh base

NETWORK=${1:-baseSepolia}

echo "🚀 Susu Chain Quick Deployment"
echo "================================"
echo "Network: $NETWORK"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "   Run: yarn account:import"
    exit 1
fi

# Deploy contracts
echo "📝 Step 1: Deploying contracts..."
npx hardhat run scripts/deploy-mainnet.ts --network $NETWORK

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Save the contract addresses to .env"
echo "2. Verify contracts on BaseScan"
echo "3. Test with: npx hardhat run scripts/interact-create-group.ts --network $NETWORK"
echo ""
