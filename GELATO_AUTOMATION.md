# Gelato Automated Payout System

## Overview

SusuChain uses [Gelato Network](https://www.gelato.network/) to provide trustless, automated payout execution for Susu groups on Base. This eliminates the need for manual intervention and ensures payouts are executed reliably when deadlines are reached.

## Architecture

### Smart Contract Components

**SusuGroup.sol** - Enhanced with:
- `roundDeadline` - Timestamp when current round must complete
- `canExecutePayout()` - Gelato checker function
- `executeScheduledPayout()` - Gelato executor function
- Late penalty system (5% for late, 10% for missed contributions)
- Automation fee (0.1% to cover gas costs)

### Gelato Integration

**Web3 Function**: `packages/gelato-functions/susu-payout-automation.ts`
- Monitors active groups
- Calls `canExecutePayout()` to check conditions
- Triggers `executeScheduledPayout()` when ready

**Task Manager**: `packages/nextjs/services/gelato/task-manager.ts`
- Creates/cancels automation tasks
- Manages Gelato 1Balance
- Tracks execution history

## How It Works

### 1. Round Creation
When a new round starts:
```solidity
roundDeadline = block.timestamp + contributionInterval;
```

### 2. Gelato Monitoring
Gelato continuously checks:
```solidity
function canExecutePayout() external view returns (bool canExec, bytes memory execPayload) {
    // Execute if all contributed OR deadline passed
    if (allContributed || deadlinePassed) {
        return (true, abi.encodeWithSelector(this.executeScheduledPayout.selector));
    }
}
```

### 3. Automated Execution
When conditions are met, Gelato calls:
```solidity
function executeScheduledPayout() external onlyGelatoOrOwner {
    // Apply penalties
    // Deduct automation fee
    // Transfer payout
    // Start next round
}
```

## Penalty System

### Late Contribution (after deadline, before payout)
- **Penalty**: 5% of contribution amount
- **Applied to**: Members who contribute after `roundDeadline`

### Missed Contribution (no contribution when payout executes)
- **Penalty**: 10% of contribution amount
- **Applied to**: Members who haven't contributed when deadline passes

### Penalty Tracking
```solidity
mapping(address => uint256) public latePenalties;
```

Penalties accumulate and can be viewed via:
```solidity
function getMemberPenalties(address _member) external view returns (uint256)
```

## Fee Structure

### Automation Fee: 0.1% (10 basis points)
- Deducted from each payout
- Covers Gelato gas costs
- Sent to group owner's Gelato 1Balance

**Example**:
- Total contributions: 1 ETH
- Automation fee: 0.001 ETH (0.1%)
- Beneficiary receives: 0.999 ETH

## Setup Guide

### For Group Owners

#### 1. Enable Automation (UI)
```typescript
import { AutomationPanel } from "~/components/SusuGroup/AutomationPanel";

<AutomationPanel
  groupAddress={groupAddress}
  groupName={groupName}
  timeUntilDeadline={timeRemaining}
  isOwner={true}
/>
```

#### 2. Fund Gelato 1Balance
Visit: https://app.gelato.network
- Deposit ETH to cover gas costs
- Recommended: ~0.01 ETH per month per group
- Base has extremely low gas costs (~$0.001 per execution)

#### 3. Monitor Tasks
- Dashboard: https://app.gelato.network/tasks
- View execution history
- Check balance

### For Developers

#### 1. Deploy Contracts
```bash
cd packages/hardhat
yarn deploy
```

#### 2. Setup Gelato
```bash
yarn hardhat run scripts/setup-gelato.ts --network base
```

#### 3. Deploy Web3 Function
```bash
cd packages/gelato-functions
npx w3f deploy susu-payout-automation.ts
```

#### 4. Create Task Programmatically
```typescript
import { createPayoutTask } from "~/services/gelato/task-manager";

const taskId = await createPayoutTask(
  groupAddress,
  groupName,
  chainId,
  signer
);
```

## Notification System

### Deadline Alerts
Members receive notifications at:
- **24 hours** before deadline
- **6 hours** before deadline
- **1 hour** before deadline
- **Overdue** when deadline passes

### Implementation
```typescript
import { shouldSendNotification, sendBrowserNotification } from
  "~/services/notifications/deadline-notifications";

const notificationType = shouldSendNotification(timeRemaining);
if (notificationType) {
  await sendBrowserNotification({
    groupAddress,
    groupName,
    roundNumber,
    timeRemaining,
    type: notificationType,
    message: generateNotificationMessage(groupName, roundNumber, notificationType)
  });
}
```

## Gas Optimization

### Why Base?
- Base gas price: ~0.001 gwei
- Ethereum gas price: ~30 gwei
- **Cost savings: 99.99%**

### Execution Cost Estimate
```typescript
const estimatedGas = 100,000; // gas units
const baseGasPrice = 0.001 gwei;
const costPerExecution = ~$0.0001 USD

// For weekly contributions over 6 months:
const totalCost = ~$0.0024 USD
```

### Batching (Future Enhancement)
Gelato can batch multiple group payouts into a single transaction for further savings.

## Security Considerations

### Access Control
```solidity
modifier onlyGelatoOrOwner() {
    require(
        msg.sender == gelatoExecutor || msg.sender == owner(),
        "Only Gelato executor or owner"
    );
    _;
}
```

### Reentrancy Protection
All payout functions use OpenZeppelin's `ReentrancyGuard`.

### Deadline Integrity
- Deadlines are immutable once set
- Cannot be changed by owner or Gelato
- Calculated deterministically from contribution interval

## Monitoring & Debugging

### Check if Automation is Active
```typescript
const { hasActiveTask } = useGelatoAutomation(groupAddress, groupName);
```

### View Execution History
```typescript
const executions = await getTaskExecutions(taskId, chainId, signer);
```

### Manual Fallback
Owner can always trigger manually:
```solidity
function executeScheduledPayout() external onlyGelatoOrOwner {
    // Gelato OR owner can call
}
```

## Troubleshooting

### Payout Not Executing?

**Check 1**: Is Gelato 1Balance funded?
```bash
Visit https://app.gelato.network and check balance
```

**Check 2**: Is task active?
```typescript
const taskState = await getTaskStatus(taskId, chainId, signer);
console.log(taskState);
```

**Check 3**: Are conditions met?
```solidity
const [canExec, reason] = await susuGroup.canExecutePayout();
console.log(canExec, reason);
```

**Manual Trigger** (as owner):
```typescript
await susuGroup.executeScheduledPayout();
```

### Task Creation Failed?

**Error**: "Task already exists"
- Each group can only have one active task
- Cancel existing task before creating new one

**Error**: "Insufficient balance"
- Fund Gelato 1Balance first
- Minimum: ~0.001 ETH

## Cost Comparison

### Traditional (Manual Trigger)
- User must pay gas: ~0.0001 ETH
- Requires manual action
- Risk of delays/missed payouts

### With Gelato Automation
- Automation fee: 0.1% of payout
- No manual intervention
- Guaranteed execution
- **Net benefit**: Peace of mind + time saved

## Testing

### Local Testing
```bash
cd packages/gelato-functions
npx w3f test susu-payout-automation.ts --logs
```

### Testnet (Base Sepolia)
1. Deploy to Base Sepolia
2. Create test group
3. Fund Gelato 1Balance on testnet
4. Create automation task
5. Wait for deadline and verify execution

## Resources

- [Gelato Docs](https://docs.gelato.network)
- [Web3 Functions](https://docs.gelato.network/web3-services/web3-functions)
- [1Balance](https://docs.gelato.network/web3-services/1balance)
- [Base Gasless](https://docs.gelato.network/web3-services/1balance/payment-methods/base-gasless)

## Future Enhancements

1. **Batch Execution**: Execute multiple group payouts in one transaction
2. **Dynamic Fees**: Adjust automation fee based on gas prices
3. **Advanced Notifications**: Email/SMS via Gelato Functions
4. **Penalty Redemption**: Allow members to pay penalties to restore reputation
5. **Cross-Chain**: Extend automation to other Gelato-supported chains
