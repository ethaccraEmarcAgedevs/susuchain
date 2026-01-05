# Aave V3 Collateral System

## Overview

SusuChain integrates [Aave V3](https://aave.com) on Base to provide collateralized savings groups with automatic yield generation. This addresses traditional Susu's limitation of relying solely on social trust by adding financial accountability.

## Architecture

### Smart Contract Integration

**Aave V3 Pool** (Base): `0xA238Dd80C259a72e81d7e4664a9801593F98d1c5`

**Supported Assets**:
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- WETH: `0x4200000000000000000000000000000000000006`

### Collateral Tiers

Groups can choose from four risk levels:

| Tier | Requirement | Use Case |
|------|-------------|----------|
| **NONE** | 0% | Traditional social trust groups |
| **LOW** | 25% | Light financial backing |
| **MEDIUM** | 50% | Balanced risk/trust |
| **FULL** | 100% | Fully collateralized, maximum security |

## How It Works

### 1. Group Creation

```solidity
createSusuGroup(
    "My Savings Group",
    "my-group.base.eth",
    1000000, // 1 USDC contribution
    7 days,
    10,
    USDC_ADDRESS,
    CollateralTier.MEDIUM, // 50% collateral = 0.5 USDC
    AAVE_POOL_ADDRESS
)
```

### 2. Member Joins with Collateral

When joining:
1. Member approves collateral amount (based on tier)
2. Contract deposits collateral to Aave V3
3. Aave returns aTokens (yield-bearing)
4. Member is added to group

```solidity
// User must approve first
USDC.approve(groupAddress, collateralAmount);

// Join and deposit collateral
group.joinGroup("alice.base.eth", "alice@efp");
```

### 3. Yield Generation

Collateral automatically earns yield in Aave:
- aUSDC current APY: ~5-8% (variable)
- Yield accrues in real-time
- Distributed proportionally to members
- Option to auto-compound

### 4. Penalty System

Progressive slashing for defaults:

**First Late Payment**: 10% slash
```
- Deposited: 0.5 USDC
- Slashed: 0.05 USDC (10%)
- Remaining: 0.45 USDC
```

**Second Late Payment**: 25% slash
```
- Remaining: 0.45 USDC
- Slashed: 0.1125 USDC (25%)
- Remaining: 0.3375 USDC
```

**Third Late Payment**: 50% slash
```
- Remaining: 0.3375 USDC
- Slashed: 0.16875 USDC (50%)
- Remaining: 0.16875 USDC
```

**Fourth+ Late Payment**: 100% slash
```
- All remaining collateral forfeited
- Distributed to compliant members
```

### 5. Completion & Return

When group cycle completes:
1. Collateral withdrawn from Aave
2. Yield calculated and distributed
3. Each member receives: `collateral - slashed + yieldEarned`

```solidity
// Owner triggers return after group completes
group.returnCollateral(memberAddress);
```

## Frontend Integration

### Creating Collateralized Group

```typescript
import { CollateralTier, AAVE_V3_POOL_BASE } from "~/services/aave/aave-client";

const { writeContract } = useScaffoldWriteContract("SusuFactory");

await writeContract({
  functionName: "createSusuGroup",
  args: [
    groupName,
    ensName,
    contributionAmount,
    contributionInterval,
    maxMembers,
    USDC_ADDRESS,
    CollateralTier.MEDIUM,
    AAVE_V3_POOL_BASE,
  ],
});
```

### Displaying Collateral Dashboard

```tsx
import { CollateralDashboard } from "~/components/Collateral/CollateralDashboard";

<CollateralDashboard
  userAddress={address}
  collaterals={userCollaterals}
  currentAPY={5.5}
/>
```

### Tier Badge on Group Cards

```tsx
import { getTierBadgeColor, getTierName } from "~/services/aave/aave-client";

<span className={`px-2 py-1 rounded-full ${getTierBadgeColor(tier)}`}>
  {getTierName(tier)}
</span>
```

## Benefits

### For Members

1. **Earn While Saving**: Collateral generates 5-8% APY
2. **Financial Accountability**: Defaulters lose collateral
3. **Risk Visibility**: Clear tier badges show group risk level
4. **Trustless Enforcement**: Smart contracts handle penalties automatically

### For Groups

1. **Attract Quality Members**: Financial stake filters commitment
2. **Risk Management**: Choose tier based on member trust level
3. **Yield Distribution**: Extra returns for compliant members
4. **Transparent Metrics**: On-chain risk scoring

## Risk Scoring

Groups display calculated risk scores:

```typescript
interface GroupRiskScore {
  tier: CollateralTier;
  historicalDefaultRate: number; // %
  avgContributionTime: number; // seconds
  riskLevel: "Low" | "Medium" | "High";
  yieldBonus: number; // % extra yield for risk
}
```

**Low Risk Groups** (FULL collateral):
- Minimal default risk
- Standard Aave APY
- Suitable for large amounts

**Medium Risk Groups** (MEDIUM collateral):
- Balanced approach
- +1-2% yield bonus from redistributed penalties
- Most popular tier

**High Risk Groups** (LOW/NONE collateral):
- Higher default potential
- +2-3% yield bonus potential
- Requires strong social trust

## Yield Distribution

### Manual Distribution

Owner can trigger at any time:
```solidity
group.distributeYield();
```

### Auto-Compound (Default)

Yield automatically reinvested into Aave:
```solidity
group.autoCompound = true; // Set during creation
```

### Withdrawal

Members can view accumulated yield:
```solidity
(deposited, slashed, yieldEarned, missedPayments) = group.getMemberCollateral(member);
```

## Emergency Withdrawals

### Pre-Launch Refunds

If group doesn't fill:
```solidity
// Available before group starts
group.emergencyWithdrawCollateral();
```

Conditions:
- Group hasn't started (no first contribution)
- Full collateral refunded
- Proportional yield included (if any)

### Grace Period

7-day grace period after missed payment before slashing:
```solidity
// Owner waits 7 days before triggering slash
if (block.timestamp > deadline + 7 days) {
    group.slashCollateral(defaulter);
}
```

## Gas Costs (Base Network)

Extremely cheap on Base:

| Operation | Gas | Cost @ 0.001 gwei |
|-----------|-----|-------------------|
| Join w/ Collateral | ~150k | $0.0003 |
| Aave Deposit | ~100k | $0.0002 |
| Yield Claim | ~80k | $0.00016 |
| Collateral Return | ~120k | $0.00024 |

**Total cost for full cycle**: ~$0.001 USD

## Security Considerations

### Smart Contract Security

1. **ReentrancyGuard**: All external calls protected
2. **Access Control**: Only owner can slash/distribute
3. **Aave Integration**: Battle-tested protocol
4. **Slashing Limits**: Progressive, capped at 100%

### Aave-Specific Risks

1. **Liquidity Risk**: Aave pool must have available liquidity
2. **Smart Contract Risk**: Aave V3 contract risk (mitigated by audits)
3. **Rate Volatility**: APY can fluctuate

### Mitigation Strategies

```solidity
// Check Aave liquidity before deposit
function _depositToAave(uint256 amount) internal {
    // Fail gracefully if Aave unavailable
    if (aavePool == address(0)) return;
    // ... deposit logic
}
```

## Monitoring & Analytics

### Collateral Metrics

Track across platform:
- Total Value Locked (TVL) in Aave
- Average collateral tier
- Slashing rate by tier
- Yield distribution amounts

### Member Metrics

Individual tracking:
- Total collateral locked
- Yield earned to date
- Penalties paid
- Collateral return history

## Future Enhancements

1. **Multi-Asset Collateral**: Support ETH, other stablecoins
2. **Dynamic Tiers**: Adjust collateral requirements based on behavior
3. **Insurance Integration**: Third-party insurance for Aave risks
4. **Cross-Chain Collateral**: Use Aave on multiple chains
5. **NFT Collateral**: Accept Base NFTs as collateral
6. **Credit Score Integration**: Lower collateral for good history

## Resources

- [Aave V3 Docs](https://docs.aave.com/developers/getting-started/readme)
- [Base Aave Deployment](https://docs.aave.com/developers/deployed-contracts/v3-mainnet/base)
- [aTokens Explanation](https://docs.aave.com/developers/tokens/atoken)
- [Yield Calculation](https://docs.aave.com/developers/guides/apy-and-apr)

## Testing

### Local Testing

```bash
# Deploy with Aave integration
yarn deploy --network base

# Create collateralized group
yarn hardhat run scripts/create-collateral-group.ts --network base
```

### Base Sepolia Testnet

Aave V3 on Base Sepolia: Available for testing

```typescript
const AAVE_POOL_SEPOLIA = "0x..." // Base Sepolia pool
```

## Support

- GitHub Issues: [susuchain/issues](https://github.com/ethaccraEmarcAgedevs/susuchain/issues)
- Aave Discord: [discord.gg/aave](https://discord.gg/aave)
- Base Discord: [discord.gg/buildonbase](https://discord.gg/buildonbase)
