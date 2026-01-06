# DAO Governance System

## Overview

SusuChain implements a fully decentralized autonomous organization (DAO) using OpenZeppelin Governor contracts. SUSU token holders can vote on platform parameters, treasury decisions, and protocol upgrades.

## Architecture

### Smart Contracts

**SusuToken** (ERC20Votes)
- Governance-enabled ERC20 token
- Vote delegation support
- Checkpoint-based voting power
- 1 billion max supply

**SusuGovernor** (OpenZeppelin Governor)
- Proposal creation and voting
- 3-day voting period
- 1-day voting delay
- 4% quorum requirement
- 1% proposal threshold (10M tokens)

**SusuTimelock** (TimelockController)
- 2-day execution delay
- Proposal queuing
- Emergency cancellation
- Multi-sig style security

**GovernanceParameters**
- Platform fee rates
- Group size limits
- Contribution limits
- Collateral tier rules
- Treasury allocations
- Emergency pause controls

## Governance Process

### 1. Delegate Voting Power

Before participating, delegate your tokens:

```solidity
// Delegate to yourself
susuToken.delegate(yourAddress);

// Or delegate to someone else
susuToken.delegate(expertAddress);
```

**Why delegate?**
- Voting power = token balance at proposal snapshot
- Must delegate before proposal creation
- Can change delegation anytime
- Delegation doesn't transfer tokens

### 2. Create Proposal

**Requirements:**
- Hold 10M+ SUSU tokens (1% of supply)
- Or receive delegation to reach threshold

**Example: Reduce Platform Fee**

```typescript
const targets = [GOVERNANCE_PARAMETERS_ADDRESS];
const values = [0]; // No ETH sent
const calldatas = [
  encodeFunctionData({
    abi: GovernanceParametersABI,
    functionName: "setPlatformFeeRate",
    args: [30], // 0.3% (30 basis points)
  }),
];
const description = `
# Reduce Platform Fee to 0.3%

Lower the platform fee from 0.5% to 0.3% to increase competitiveness and attract more users.

## Rationale

- Current fee (0.5%) is higher than competitors
- Lower fee will increase adoption
- Platform has sufficient reserves
- Expected 20% user growth

## Impact

- Users save 40% on fees
- Estimated revenue reduction: $10K/month
- Projected new revenue from growth: $15K/month
- Net positive: $5K/month

`;

await governor.propose(targets, values, calldatas, description);
```

### 3. Voting Period

**Timeline:**
- **Day 1**: Voting delay (1 day) - proposal pending
- **Days 2-4**: Active voting (3 days)
- **After Day 4**: Vote closes

**Vote Options:**
- **For**: Support the proposal
- **Against**: Oppose the proposal
- **Abstain**: Counted for quorum but not for/against

**Voting:**
```solidity
// Vote For
governor.castVote(proposalId, 1);

// Vote Against
governor.castVote(proposalId, 0);

// Vote Abstain
governor.castVote(proposalId, 2);

// Vote with reason
governor.castVoteWithReason(proposalId, 1, "This will help growth");
```

### 4. Proposal Execution

**If proposal succeeds (For > Against + Quorum met):**

1. **Queue**: Proposal queued in Timelock
```solidity
governor.queue(targets, values, calldatas, descriptionHash);
```

2. **Wait**: 2-day timelock delay

3. **Execute**: Anyone can execute after delay
```solidity
governor.execute(targets, values, calldatas, descriptionHash);
```

**If proposal fails:**
- Not enough For votes
- Quorum not reached
- Proposal marked as Defeated

## Governable Parameters

### Platform Fees

```solidity
function setPlatformFeeRate(uint256 newRate) external onlyOwner;
```

**Current**: 0.5% (50 basis points)
**Range**: 0% - 10%
**Example**: Reduce to 0.3% to compete with other platforms

### Group Size Limits

```solidity
function setGroupSizeLimits(uint256 minSize, uint256 maxSize) external onlyOwner;
```

**Current**: 2 - 100 members
**Example**: Increase max to 200 for mega-groups

### Contribution Limits

```solidity
function setContributionLimits(uint256 minAmount, uint256 maxAmount) external onlyOwner;
```

**Current**: 0.001 USDC - 1M USDC
**Example**: Raise min to 10 USDC to reduce spam

### Collateral Tiers

```solidity
function setCollateralTiers(uint256 minTier, uint256 maxTier, bool enabled) external onlyOwner;
```

**Current**: 0% - 100% (all tiers enabled)
**Example**: Require minimum 25% collateral

### Treasury Allocations

```solidity
function setTreasuryAllocations(
    uint256 devAllocation,
    uint256 rewardsAllocation,
    uint256 reserveAllocation
) external onlyOwner;
```

**Current**:
- Development: 40%
- Rewards: 30%
- Reserve: 30%

**Example**: Increase rewards to 50% to boost participation

### Emergency Pause

```solidity
function setEmergencyPause(bool paused) external;
```

**Guardian-only function**
Pause all group creation in emergency

## Delegation System

### Why Delegate?

**For Token Holders:**
- Don't have time to vote on every proposal
- Trust experts in specific areas
- Still retain token ownership
- Can revoke anytime

**For Delegates:**
- Build reputation
- Influence platform direction
- Earn trust of community
- No financial compensation (governance only)

### How to Delegate

```typescript
import { useWriteContract } from "wagmi";

const { writeContract } = useWriteContract();

// Delegate to expert
await writeContract({
  address: SUSU_TOKEN_ADDRESS,
  abi: SusuTokenABI,
  functionName: "delegate",
  args: [expertAddress],
});
```

### Delegate Profiles

Delegates should provide:
- Name/ENS
- Areas of expertise
- Voting history
- Rationale for past votes
- Contact info (Discord/Twitter)

### Top Delegates Leaderboard

Track by:
- Total delegated votes
- Voting participation rate
- Proposal success rate
- Community reputation

## Proposal Templates

### Template: Adjust Platform Fee

```markdown
# [Action] Platform Fee to [X]%

[Brief one-line summary]

## Current State
- Platform fee: 0.5%
- Monthly revenue: $50K
- Active groups: 1000

## Proposed Change
- New platform fee: 0.3%
- Expected impact: [details]

## Rationale
1. [Reason 1]
2. [Reason 2]
3. [Reason 3]

## Financial Impact
- Revenue change: [amount]
- User savings: [amount]
- Growth projection: [%]

## Implementation
- Timeline: Immediate upon execution
- Migration: None required
- Risks: [list]
```

### Template: Emergency Action

```markdown
# [EMERGENCY] Pause Group Creation

Critical security issue requires immediate action.

## Issue
[Description of vulnerability/problem]

## Impact
- Affected: [who/what]
- Severity: Critical/High/Medium
- Timeline: Immediate

## Proposed Action
Activate emergency pause for [duration]

## Next Steps
1. Pause contracts
2. Deploy fix
3. Audit fix
4. Resume operations
```

## Token Incentives

### Retroactive Airdrop

**Eligibility:**
- Created group: 1000 SUSU
- Contributed to 5+ rounds: 500 SUSU
- Completed full cycle: 2000 SUSU
- Invited 3+ members: 300 SUSU per invite

### Proposal Creation Rewards

**Successful proposal:**
- 5000 SUSU bonus
- NFT badge
- Delegate ranking boost

### Voter Participation Rewards

**Vote on 80%+ proposals:**
- Monthly: 100 SUSU
- Quarterly: 500 SUSU bonus
- Yearly: 2000 SUSU bonus

### Delegation Incentives

**For delegates:**
- Reputation score
- Featured on leaderboard
- Direct from delegators (optional)

## Security Measures

### Timelock Protection

2-day delay allows:
- Community review
- Emergency cancellation
- Exit if opposed
- Guardian veto

### Quorum Requirements

4% quorum ensures:
- Minimum participation
- Representative decisions
- Anti-manipulation
- Legitimacy

### Proposal Threshold

10M tokens (1%) prevents:
- Spam proposals
- Low-quality votes
- Governance attacks
- Distraction

### Emergency Guardian

Designated address can:
- Pause in emergency
- Cancel malicious proposals
- Not execute proposals
- Eventually removed

## Governance Attacks & Mitigation

### Flash Loan Attack

**Risk**: Borrow tokens, vote, return
**Mitigation**: Checkpoint system - voting power from block before proposal

### Whale Dominance

**Risk**: Large holder controls votes
**Mitigation**:
- Delegation to distribute power
- Community engagement
- Future: Quadratic voting

### Governance Gridlock

**Risk**: Nothing passes due to apathy
**Mitigation**:
- Lower quorum if needed
- Delegate to active voters
- Incentivize participation

### Proposal Spam

**Risk**: Too many proposals
**Mitigation**:
- 1% threshold
- 1-day delay between proposals
- Community moderation

## Integration with Contracts

### SusuFactory

```solidity
// Read from GovernanceParameters
function createSusuGroup(...) external {
    require(
        members >= params.minGroupSize() &&
        members <= params.maxGroupSize(),
        "Invalid group size"
    );
    // ...
}
```

### Fee Collection

```solidity
// Use governance-set fee
function _deductPlatformFee(uint256 amount) internal {
    uint256 feeRate = governanceParams.platformFeeRate();
    uint256 fee = (amount * feeRate) / 10000;
    // ...
}
```

## Frontend Dashboard

### Active Proposals View

```tsx
<ProposalList>
  {proposals.map(proposal => (
    <ProposalCard
      key={proposal.id}
      proposal={proposal}
      onVote={handleVote}
      userVotingPower={votingPower}
    />
  ))}
</ProposalList>
```

### Delegation Management

```tsx
<DelegationPanel>
  <CurrentDelegate address={delegatee} votes={delegatedVotes} />
  <DelegateSearch onSelect={handleDelegate} />
  <SelfDelegateButton onClick={handleSelfDelegate} />
</DelegationPanel>
```

### Create Proposal Form

```tsx
<ProposalForm>
  <ActionSelector options={GOVERNANCE_ACTIONS} />
  <ParametersInput />
  <DescriptionEditor markdown />
  <ProposalPreview />
  <SubmitButton disabled={!hasThreshold} />
</ProposalForm>
```

## Testing Governance

### Local Testing

```bash
# Deploy governance
yarn deploy:governance --network localhost

# Delegate tokens
yarn hardhat delegate --network localhost

# Create test proposal
yarn hardhat propose --action SET_PLATFORM_FEE --value 30

# Vote on proposal
yarn hardhat vote --proposal-id 1 --support 1

# Execute proposal (after timelock)
yarn hardhat execute --proposal-id 1
```

### Base Sepolia Testing

Full governance lifecycle on testnet before mainnet

## Resources

- [OpenZeppelin Governor](https://docs.openzeppelin.com/contracts/4.x/governance)
- [Compound Governance](https://compound.finance/governance)
- [Tally](https://www.tally.xyz/) - Governance UI
- [Snapshot](https://snapshot.org/) - Off-chain voting

## Future Enhancements

1. **Quadratic Voting**: Reduce whale influence
2. **Conviction Voting**: Time-weighted votes
3. **Rage Quit**: Exit with assets if opposed
4. **Optimistic Governance**: Execute unless vetoed
5. **Cross-Chain Voting**: Vote from any chain
6. **NFT Voting**: Special voting rights
7. **Reputation Weighting**: Experience matters
8. **Futarchy**: Bet on outcomes
