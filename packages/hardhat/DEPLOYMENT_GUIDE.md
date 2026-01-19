# Susu Chain Mainnet Deployment Guide

Complete guide for deploying and interacting with Susu contracts on Base mainnet.

## Prerequisites

1. **ETH on Base Mainnet**
   - You need at least 0.02 ETH on Base for deployment
   - Bridge ETH to Base: https://bridge.base.org/

2. **Private Key Setup**
   - Your deployer private key should be in `.env` as `__RUNTIME_DEPLOYER_PRIVATE_KEY`
   - Or import with: `yarn account:import`

3. **BaseScan API Key (Optional but recommended)**
   - Get from: https://basescan.org/myapikey
   - Add to `.env` as `BASESCAN_API_KEY`

## Step-by-Step Deployment

### 1. Deploy Contracts to Base Mainnet

```bash
npx hardhat run scripts/deploy-mainnet.ts --network base
```

**What happens:**
- ✅ Deploys SusuToken
- ✅ Deploys SusuFactory
- ✅ Deploys SusuFactoryViews
- ✅ Authorizes factory as minter
- ✅ Configures ETH/USD price feed
- 💾 Outputs contract addresses

**Save the addresses** from the output to your `.env`:
```env
SUSU_TOKEN_ADDRESS=0x...
SUSU_FACTORY_ADDRESS=0x...
SUSU_FACTORY_VIEWS_ADDRESS=0x...
```

### 2. Verify Contracts on BaseScan

```bash
# Verify SusuToken
npx hardhat verify --network base <SUSU_TOKEN_ADDRESS> "<YOUR_DEPLOYER_ADDRESS>"

# Verify SusuFactory
npx hardhat verify --network base <SUSU_FACTORY_ADDRESS> "<YOUR_DEPLOYER_ADDRESS>"

# Verify SusuFactoryViews
npx hardhat verify --network base <SUSU_FACTORY_VIEWS_ADDRESS> "<SUSU_FACTORY_ADDRESS>"
```

**Benefits:**
- ✅ Users can read contract on BaseScan
- ✅ Increased trust and transparency
- ✅ Easier debugging

### 3. Test Deployment - Create Your First Group

```bash
npx hardhat run scripts/interact-create-group.ts --network base
```

**Interactive prompts:**
- Group Name: `Teachers Savings Circle`
- ENS Name: `teachers-jan-2024`
- Contribution Amount: `0.1` (ETH)
- Interval: `7` (days)
- Max Members: `5`
- USD Denominated: `no`
- Random Payout: `no`

**Real transaction will be sent!** Save the group address from output.

### 4. Join the Group

```bash
npx hardhat run scripts/interact-join-group.ts --network base
```

**Interactive prompts:**
- Group Address: `<paste from step 3>`
- ENS Name: `alice.eth`
- EFP Profile: `alice_efp`
- Referral Code: `<leave empty>`

**Real transaction!** You'll pay the first contribution automatically.

### 5. Make Contributions

```bash
npx hardhat run scripts/interact-contribute.ts --network base
```

**What happens:**
- Sends contribution for current round
- If all members contribute, round completes
- Payout sent automatically
- Next round starts

### 6. Check Group Status

```bash
npx hardhat run scripts/interact-status.ts --network base
```

**Shows:**
- Group info (name, members, rounds)
- Current round progress
- Member list with contribution status
- Round history
- Your personal status

## Complete Workflow Example

```bash
# 1. Deploy to Base
npx hardhat run scripts/deploy-mainnet.ts --network base
# Save addresses to .env

# 2. Verify contracts
npx hardhat verify --network base $SUSU_TOKEN_ADDRESS "$DEPLOYER_ADDRESS"
npx hardhat verify --network base $SUSU_FACTORY_ADDRESS "$DEPLOYER_ADDRESS"
npx hardhat verify --network base $SUSU_FACTORY_VIEWS_ADDRESS "$SUSU_FACTORY_ADDRESS"

# 3. Create a group
npx hardhat run scripts/interact-create-group.ts --network base
# Example: 5 members, 0.1 ETH/week

# 4. Share group address with friends
# They join with:
npx hardhat run scripts/interact-join-group.ts --network base

# 5. Once all joined, contribute each week:
npx hardhat run scripts/interact-contribute.ts --network base

# 6. Check status anytime:
npx hardhat run scripts/interact-status.ts --network base
```

## Real Money Warnings ⚠️

**These scripts send REAL transactions with REAL ETH!**

- ✅ Always test on Base Sepolia testnet first
- ✅ Double-check all inputs before confirming
- ✅ Start with small amounts (0.01 ETH)
- ✅ Verify contract addresses
- ⚠️ No undo button - transactions are permanent

## Network Configuration

### Base Mainnet
- RPC: `https://mainnet.base.org`
- Chain ID: `8453`
- Explorer: https://basescan.org
- Bridge: https://bridge.base.org

### Base Sepolia Testnet (for testing)
- RPC: `https://sepolia.base.org`
- Chain ID: `84532`
- Explorer: https://sepolia.basescan.org
- Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

To deploy on testnet first:
```bash
npx hardhat run scripts/deploy-mainnet.ts --network baseSepolia
```

## Troubleshooting

### "Insufficient balance"
- Check balance: `npx hardhat run scripts/check-balance.ts --network base`
- Bridge more ETH to Base

### "ENS name already taken"
- Use a unique ENS name for your group
- Check with: `await factory.isENSNameAvailable("name")`

### "Group is full"
- Max members reached
- Create a new group or wait for member to leave

### Transaction stuck
- Check on BaseScan
- May need to speed up with higher gas
- Wait for network congestion to clear

## Gas Optimization Tips

- Deploy during low network activity (weekends)
- Set reasonable gas limits
- Batch operations when possible
- Use multicall for reading data

## Security Best Practices

1. **Never share your private key**
2. **Use a burner wallet for testing**
3. **Verify all contract addresses**
4. **Start with testnet**
5. **Test with small amounts first**
6. **Review all transaction details**
7. **Keep backups of important addresses**

## Support

- GitHub Issues: https://github.com/ethaccraEmarcAgedevs/susuchain/issues
- BaseScan: https://basescan.org
- Base Discord: https://discord.gg/base

## Next Steps

After successful deployment:

1. **Update Frontend**
   - Add contract addresses to frontend config
   - Test all user flows
   - Deploy frontend to production

2. **Community Building**
   - Share on social media
   - Create tutorial videos
   - Write blog posts
   - Engage with users

3. **Monitoring**
   - Set up contract monitoring
   - Track transactions
   - Monitor gas usage
   - Watch for issues

4. **Iterate**
   - Gather user feedback
   - Plan improvements
   - Deploy updates
   - Grow the platform

Good luck! 🚀
