# Referral and Rewards Program

## Overview

SusuChain's referral program is a fully onchain reward system that incentivizes user growth through multi-level rewards, milestone bonuses, and tier-based multipliers. Built on Base with transparent smart contracts and anti-fraud mechanisms.

## Architecture

### Smart Contracts

**ReferralRegistry.sol**
- Onchain referral tracking and reward distribution
- Referral code management (8-character alphanumeric)
- Multi-level rewards: 5% direct, 2% indirect
- Milestone bonuses: 0.1 ETH @ 10, 1 ETH @ 50 referrals
- Anti-fraud: rate limiting, blacklisting, activity requirements
- Qualification system: 3 contributions within 30 days

**ReferralRewards.sol (Library)**
- Pure functions for reward calculations
- Tier multiplier system (1x to 2x)
- Milestone bonus calculations
- Code validation and generation
- Performance scoring algorithms

**SusuGroup.sol (Integration)**
- Records referrals when members join with code
- Tracks contributions for qualification
- Interfaces with ReferralRegistry automatically
- Graceful fallback if registry unavailable

### Frontend Services

**code-generator.ts**
- Generate random or deterministic codes
- Validate code format and characters
- Create shareable links and QR codes
- Social media share URLs (Twitter, Telegram, WhatsApp, Facebook)
- localStorage for referral attribution (30-day expiry)

**useReferralData.ts**
- Fetch referrer statistics and stats
- Get referral tree (referees)
- Check qualification status
- Calculate tier and milestone progress

**useReferralActions.ts**
- Create referral codes
- Claim pending rewards
- Claim milestone bonuses
- Transaction tracking and confirmation

## Reward Structure

### Direct Referrals (5%)

When someone you refer makes their first contribution:
- **Base reward**: 5% of contribution amount
- **Tier multiplier applied**: 1x - 2x based on your tier
- **Example**: 0.1 ETH contribution × 5% × 1.5x (Expert tier) = 0.0075 ETH

### Indirect Referrals (2%)

When someone referred by your referee makes their first contribution:
- **Base reward**: 2% of contribution amount
- **No tier multiplier** (flat rate)
- **Example**: 0.1 ETH contribution × 2% = 0.002 ETH

### Milestone Bonuses

Fixed ETH bonuses for reaching qualified referral milestones:

| Milestone | Bonus | Total Earned |
|-----------|-------|--------------|
| 10 qualified | 0.1 ETH | 0.1 ETH |
| 50 qualified | 1 ETH | 1.1 ETH |
| 100 qualified | 5 ETH | 6.1 ETH |
| 500 qualified | 30 ETH | 36.1 ETH |

**Note**: Only qualified referrals count (3+ contributions within 30 days)

## Tier System

Referrer tiers provide reward multipliers based on qualified referrals:

| Tier | Qualified Referrals | Multiplier | Icon |
|------|---------------------|------------|------|
| **Legend** | 500+ | 2.0x | 👑 |
| **Elite** | 100-499 | 1.75x | 💎 |
| **Expert** | 50-99 | 1.5x | ⭐ |
| **Pro** | 10-49 | 1.25x | 🔥 |
| **Active** | 3-9 | 1.1x | ✨ |
| **Novice** | 0-2 | 1.0x | 🌱 |

**Benefits of higher tiers**:
- Increased rewards per referral
- Badge display on profile
- Leaderboard prominence
- Future exclusive features

## Qualification System

### Requirements for Qualified Referral

A referee must complete **3 contributions within 30 days** of joining to qualify.

**Timeline**:
1. User joins with referral code → recorded onchain
2. User makes 1st contribution → count: 1/3
3. User makes 2nd contribution → count: 2/3
4. User makes 3rd contribution → **QUALIFIED** ✓

**What happens when qualified**:
- Referrer receives 5% of that contribution (with tier multiplier)
- If referrer was also referred, their referrer gets 2%
- Referee counts toward referrer's milestone progress
- Referrer's stats updated (qualified count++)

**What if 30 days pass without 3 contributions**:
- Referral does NOT qualify
- No rewards distributed
- Does NOT count toward milestones
- Referee can still contribute, but won't qualify this referrer

## Referral Code System

### Code Requirements

- **Length**: 4-12 characters
- **Characters**: Uppercase letters (A-Z) and numbers (2-9)
- **Excluded**: O, 0, I, 1 (to avoid confusion)
- **Uniqueness**: First-come-first-served onchain

### Code Types

**Auto-Generated** (Recommended)
- Deterministic from wallet address
- Example: `A3F7K9N2`
- Instant creation
- Always available

**Custom Codes** (User Choice)
- Choose memorable code: `MYCODE123`, `AFRIBOSS`
- Subject to availability
- Validate before submission
- Can suggest alternatives if taken

**Vanity Codes** (Premium - Future)
- 4-12 character custom codes
- Reserved for premium users
- Assigned by owner only
- Examples: `BASE`, `SUSU`, `ACCRA`

## Anti-Fraud Mechanisms

### Rate Limiting

**Daily referral limit**: 10 referrals per address per day

Prevents:
- Sybil attacks (creating fake accounts)
- Bot spam
- Referral farming

### Activity Requirements

**Qualification period**: 30 days, 3 contributions

Ensures:
- Real user engagement
- Genuine participation
- Long-term retention

### Blacklist System

**Owner can blacklist addresses** for:
- Detected fraud patterns
- Coordinated attack attempts
- Terms of service violations

**Effects**:
- Cannot create referral codes
- Cannot record referrals
- Cannot claim rewards
- All pending rewards frozen

### Self-Referral Prevention

- Cannot refer your own address
- Checked onchain at recording time
- Transaction reverts if attempted

## User Flow

### For Referrers

**1. Create Referral Code**
```typescript
// Navigate to /referrals
// Click "Create Referral Code"
// Choose auto-generated or custom
// Transaction confirms → code created
```

**2. Share Code**
```typescript
// Copy referral link: https://susuchain.app?ref=MYCODE
// Share on Twitter, Telegram, WhatsApp, Facebook
// Send direct links to friends
// Display QR code for in-person
```

**3. Track Referrals**
```typescript
// View dashboard at /referrals
// See direct/indirect referral counts
// Monitor qualification progress
// Check tier and multiplier
```

**4. Claim Rewards**
```typescript
// Pending rewards accumulate onchain
// Click "Claim Rewards" when ready
// ETH sent to your wallet
// Claim milestone bonuses separately
```

### For Referees

**1. Receive Code**
```typescript
// Friend shares link with code
// Code stored in localStorage (30 days)
// Or manually enter during signup
```

**2. Join Group**
```typescript
// Browse groups or create one
// Enter referral code when joining
// Referral recorded onchain
// You and referrer linked
```

**3. Contribute**
```typescript
// Make 3 contributions within 30 days
// Each contribution tracked
// On 3rd contribution → QUALIFIED
// Referrer receives rewards automatically
```

**4. Become Referrer** (Optional)
```typescript
// Create your own referral code
// Now you can earn rewards too
// Build your referral tree
// Climb the tiers
```

## Frontend Components

### ReferralCodeDisplay

**Purpose**: Display and share referral code

**Features**:
- Large, formatted code display (XXXX-XXXX)
- Copy to clipboard buttons
- Referral link display
- Social share buttons (4 platforms)
- Gradient card design

**Location**: `/referrals` page, top section

### ReferralStats

**Purpose**: Show referrer performance metrics

**Features**:
- Direct/indirect/qualified referral counts
- Total rewards earned
- Qualification rate progress bar
- Next milestone progress tracker
- Color-coded stat cards

**Location**: `/referrals` page, left column

### ReferralTree

**Purpose**: Visualize referral network

**Features**:
- Tree diagram with root (you) and branches (referees)
- Qualification status indicators (✓ or ○)
- Contribution count per referee
- Visual connection lines
- Legend for status codes

**Location**: `/referrals` page, left column

### ClaimRewardsCard

**Purpose**: Claim pending rewards and bonuses

**Features**:
- Pending rewards balance (ETH)
- Claim rewards button
- Available milestone bonuses highlighted
- Upcoming milestones list
- Transaction loading states

**Location**: `/referrals` page, right column

### CreateCodeModal

**Purpose**: Create referral code

**Features**:
- Auto-generated code suggestion
- Custom code input with validation
- Code suggestions generator
- Real-time character validation
- Requirements checklist

**Trigger**: "Create Referral Code" button on `/referrals`

## Smart Contract Functions

### For Users

**createReferralCode(string memory code)**
- Create 8-character referral code
- Validates format and uniqueness
- Checks not blacklisted
- Emits `ReferralCodeCreated` event

**claimRewards()**
- Claim all pending rewards
- Sends ETH to caller
- Updates claimed rewards stat
- Requires non-zero pending balance

**claimMilestoneBonus()**
- Claim available milestone bonuses
- Checks 10, 50, 100, 500 thresholds
- Marks bonuses as claimed
- Sends cumulative bonus amount

**getReferrerStats(address referrer)**
- View statistics for any referrer
- Returns ReferrerStats struct
- No gas cost (view function)

**getReferees(address referrer)**
- Get array of all referees
- View referral tree
- No gas cost (view function)

### For Contracts (Authorized)

**recordReferral(address referee, string memory referralCode)**
- Called by SusuGroup when member joins
- Links referee to referrer
- Validates code and prevents duplicates
- Rate limiting applied

**recordContribution(address referee, uint256 amount)**
- Called by SusuGroup when member contributes
- Increments contribution count
- Checks qualification on 3rd contribution
- Distributes rewards if qualified

### For Owner

**authorizeContract(address contractAddress)**
- Allow contract to record referrals/contributions
- Typically SusuGroup or SusuFactory

**blacklistAddress(address account)**
- Ban address for fraud
- Freezes all rewards and referral activity

**withdrawFunds(uint256 amount)**
- Emergency fund withdrawal
- Owner only

## Integration with SusuChain

### SusuFactory Changes

Update `createSusuGroup()` to pass `referralRegistry` address:

```solidity
function createSusuGroup(
    string memory _groupName,
    // ... other params
    address _referralRegistry
) external returns (address) {
    SusuGroup newGroup = new SusuGroup(
        _groupName,
        // ... other params
        _referralRegistry
    );
    // ...
}
```

### SusuGroup Changes

**Constructor**: Accept `_referralRegistry` parameter

**joinGroup**: Accept `_referralCode` parameter, call `recordReferral()`

**contributeToRound**: Call `recordContribution()` after contribution

**Example**:
```solidity
function joinGroup(
    string memory _ensName,
    string memory _efpProfile,
    string memory _referralCode
) external payable nonReentrant {
    // ... existing join logic

    // Record referral
    if (bytes(_referralCode).length > 0 && referralRegistry != address(0)) {
        try IReferralRegistry(referralRegistry).recordReferral(msg.sender, _referralCode) {
            emit MemberJoinedWithReferral(msg.sender, _referralCode);
        } catch {
            // Silently fail if referral recording fails
        }
    }

    // ... continue with join
}
```

## Deployment

### Deploy ReferralRegistry

```bash
# Deploy to Base Sepolia
cd packages/hardhat
npx hardhat run scripts/deploy-referral.ts --network baseSepolia

# Fund with rewards pool
# Script automatically sends 1 ETH to contract
```

### Update Existing Contracts

1. **Redeploy SusuFactory** with referralRegistry parameter
2. **Redeploy SusuGroups** (or update factory to use new version)
3. **Authorize SusuFactory** to record referrals

```bash
# Authorize SusuFactory
npx hardhat run scripts/authorize-factory.ts --network baseSepolia
```

### Frontend Environment

Add to `.env.local`:

```bash
NEXT_PUBLIC_REFERRAL_REGISTRY_ADDRESS=0x...
```

Update `deployedContracts.ts` with ReferralRegistry ABI and address.

## Testing

### Local Testing

```bash
# Start local node
npx hardhat node

# Deploy contracts
npx hardhat run scripts/deploy-referral.ts --network localhost

# Run tests
npx hardhat test test/ReferralRegistry.test.ts
```

### Test Scenarios

**1. Create Code**
- Auto-generated code works
- Custom code works
- Duplicate code fails
- Invalid format fails

**2. Record Referral**
- Valid code records successfully
- Invalid code fails
- Self-referral fails
- Rate limiting works (11th referral in day fails)

**3. Qualification**
- 3 contributions qualify
- Rewards distributed correctly
- Tier multiplier applied
- Indirect referrer receives 2%

**4. Claim Rewards**
- Pending balance accurate
- ETH transferred correctly
- Claimed balance updates

**5. Milestone Bonuses**
- 10 qualified → 0.1 ETH claimable
- 50 qualified → 1 ETH claimable
- Can't claim twice
- Can claim multiple milestones at once

### Base Sepolia Testing

Full integration testing before mainnet deployment.

## Security Considerations

### Smart Contract Security

**ReentrancyGuard**: All state-changing functions protected

**Ownable**: Administrative functions owner-only

**SafeERC20**: Safe token transfers (future ERC20 rewards)

**Input Validation**: All user inputs validated

**Access Control**: Authorized contracts only

### Frontend Security

**Input Sanitization**: All user inputs cleaned

**XSS Prevention**: React handles escaping

**Code Validation**: Client-side + contract-side validation

**localStorage Expiry**: 30-day referral cookie expiration

### Economic Security

**Rate Limiting**: Max 10 referrals/day prevents spam

**Qualification Period**: 30-day window prevents gaming

**Activity Requirements**: 3 contributions ensures real usage

**Blacklist**: Owner can ban fraudulent addresses

**Funding Model**: Contract pre-funded by protocol, sustainable

## Analytics & Monitoring

### On-chain Events

```solidity
event ReferralCodeCreated(address indexed referrer, string code);
event ReferralRecorded(address indexed referrer, address indexed referee, string code);
event ReferralQualified(address indexed referee, address indexed referrer);
event RewardDistributed(address indexed referrer, uint256 amount, uint8 level);
event RewardsClaimed(address indexed referrer, uint256 amount);
event BonusClaimed(address indexed referrer, uint256 amount, uint256 milestone);
```

### Metrics to Track

- **Total referrals**: All recorded referrals
- **Qualified referrals**: Completed 3 contributions
- **Qualification rate**: Qualified / Total
- **Average time to qualify**: Days from join to 3rd contribution
- **Total rewards distributed**: Sum of all rewards
- **Active referrers**: Users with 1+ qualified referral
- **Top referrers**: Leaderboard by qualified count
- **Milestone achievements**: Bonus claims over time

### Dune Analytics Dashboard

Create dashboard tracking:
- Referral growth over time
- Top 100 referrers leaderboard
- Rewards distribution by tier
- Qualification funnel
- Geographic distribution (if available)

## Future Enhancements

### V2 Features

1. **ERC20 Rewards**: Support USDC/token rewards in addition to ETH
2. **NFT Badges**: Onchain NFT badges for milestones
3. **Delegation**: Referrers can delegate codes to others
4. **Campaigns**: Time-limited 2x reward campaigns
5. **Retroactive Rewards**: Airdrop to early users
6. **Referral Contests**: Monthly competitions with prizes
7. **Group Incentives**: Bonus for referring entire groups
8. **Cross-Chain**: Support referrals on multiple chains

### Gamification

- **Streak Bonuses**: Daily/weekly active referral streaks
- **Combo Multipliers**: Refer multiple in one day
- **Leaderboard Prizes**: Monthly rewards for top 10
- **Social Proof**: Display referrer count on profiles
- **Referral Battles**: Compete with friends

### Advanced Analytics

- **Conversion funnel**: Join → Contribute → Qualify
- **Cohort analysis**: Referral performance by time period
- **Attribution modeling**: Which channels drive referrals
- **Churn prediction**: Identify at-risk referees
- **LTV calculation**: Lifetime value of referred users

## FAQs

**Q: How long does it take to qualify a referral?**
A: The referee must make 3 contributions within 30 days. With weekly Susu groups, this is typically 3 weeks.

**Q: What happens if my referee misses the 30-day window?**
A: They won't qualify, and you won't receive rewards for that referral. However, they can still participate in groups.

**Q: Can I change my referral code?**
A: No, codes are permanent once created. Choose carefully or use the auto-generated one.

**Q: When can I claim rewards?**
A: Anytime! Rewards accumulate onchain and you can claim whenever you want. No expiration.

**Q: Do I need to hold SUSU tokens to participate?**
A: No, the referral program works with ETH rewards. SUSU tokens are separate.

**Q: What if someone uses my code but doesn't join a group?**
A: The referral is only recorded when they join a SusuGroup with your code. Just visiting the site doesn't count.

**Q: Can I refer someone who already has a referrer?**
A: No, each user can only have one referrer (first code they use when joining).

**Q: How do indirect referrals work?**
A: If Alice refers Bob, and Bob refers Charlie, then when Charlie qualifies, Alice gets 2% indirect reward.

**Q: Is there a limit to how many people I can refer?**
A: No global limit, but rate limited to 10 new referrals per day.

**Q: Can I get banned from the referral program?**
A: Yes, if fraud is detected. Play fair and follow the rules.

## Resources

- **Smart Contracts**: `packages/hardhat/contracts/ReferralRegistry.sol`
- **Frontend**: `packages/nextjs/app/referrals/`
- **Hooks**: `packages/nextjs/hooks/referral/`
- **Services**: `packages/nextjs/services/referral/`
- **Deployment**: `packages/hardhat/scripts/deploy-referral.ts`

## Support

For questions or issues:
- GitHub Issues: [susuchain/issues](https://github.com/ethaccraEmarcAgedevs/susuchain/issues)
- Discord: [SusuChain Community](#)
- Twitter: [@SusuChain](#)

---

**Built with ❤️ for SusuChain on Base**
