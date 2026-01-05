# Gelato Web3 Functions for SusuChain

This package contains Gelato Web3 Functions for automated payout execution in SusuChain Susu groups.

## Prerequisites

- Node.js v18+
- Gelato account ([app.gelato.network](https://app.gelato.network))
- Funded Gelato 1Balance

## Installation

```bash
npm install
```

## Development

### Test Locally

```bash
npx w3f test susu-payout-automation.ts --logs
```

### Deploy Function

```bash
# Set your private key
export PRIVATE_KEY="your-private-key"

# Deploy to Base mainnet
npx w3f deploy susu-payout-automation.ts
```

## Function: susu-payout-automation.ts

Monitors Susu groups and automatically triggers payouts when conditions are met.

### User Arguments

- `groupAddress` (required): Address of the SusuGroup contract

### Logic Flow

1. Check if group is active
2. Call `canExecutePayout()` on the group contract
3. If returns `true`, execute the payout
4. If returns `false`, wait and check again

### Execution Conditions

Payout executes when EITHER:
- All members have contributed to the current round, OR
- Round deadline has passed

## Creating Tasks

### Via UI Dashboard

1. Go to [app.gelato.network](https://app.gelato.network)
2. Click "Create Task"
3. Select "Web3 Function"
4. Choose deployed function
5. Set `groupAddress` argument
6. Fund 1Balance and create

### Via SDK (Recommended)

```typescript
import { createPayoutTask } from "../nextjs/services/gelato/task-manager";

const taskId = await createPayoutTask(
  "0xGroupAddress...",
  "My Susu Group",
  8453, // Base chainId
  signer
);
```

### Via Setup Script

```bash
cd ../hardhat
yarn hardhat run scripts/setup-gelato.ts --network base
```

## Monitoring

### View Tasks
- Dashboard: https://app.gelato.network/tasks
- Filter by network: Base (8453)
- Check execution history

### Check 1Balance
```bash
# View balance
npx w3f balance
```

### Task Logs
Execution logs appear in the Gelato dashboard under task details.

## Cost Estimation

### Base Network Costs
- Gas per execution: ~100,000 gas
- Base gas price: ~0.001 gwei
- Cost per execution: ~$0.0001 USD

### Monthly Cost (Weekly Contributions)
- 4 executions/month
- Total: ~$0.0004 USD/month
- **Extremely cheap on Base!**

## Troubleshooting

### "Task not executing"
1. Check 1Balance has sufficient funds
2. Verify group address is correct
3. Check if `canExecutePayout()` returns true
4. View logs in Gelato dashboard

### "Cannot create task"
1. Ensure function is deployed
2. Verify you have Gelato credits
3. Check network (must be Base - chainId 8453)

### "Execution reverts"
1. Check if `gelatoExecutor` is set in contract
2. Verify contract has funds for payout
3. Ensure round hasn't already completed

## Testing

### Local Testing with Mock Data

```bash
npx w3f test susu-payout-automation.ts --logs --user-args='{"groupAddress":"0xYourGroupAddress"}'
```

### Test on Base Sepolia

```bash
# Deploy to testnet
npx w3f deploy susu-payout-automation.ts --network base-sepolia

# Create test task via dashboard or SDK
```

## Security

### Access Control
- Only Gelato or contract owner can call `executeScheduledPayout()`
- Enforced by `onlyGelatoOrOwner` modifier

### Gas Limits
- Execution gas capped by Gelato
- Prevents runaway gas costs

### Reentrancy
- Protected by OpenZeppelin ReentrancyGuard

## Updating Functions

### Update Logic

1. Edit `susu-payout-automation.ts`
2. Test locally: `npx w3f test ...`
3. Deploy new version: `npx w3f deploy ...`
4. Update existing tasks to use new version in dashboard

### Breaking Changes
If function signature changes:
1. Cancel all existing tasks
2. Deploy new function
3. Recreate tasks with new function

## Support

- Gelato Discord: https://discord.gg/gelato
- Gelato Docs: https://docs.gelato.network
- SusuChain Issues: https://github.com/ethaccraEmarcAgedevs/susuchain/issues
