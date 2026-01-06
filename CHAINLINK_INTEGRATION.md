# Chainlink Price Feeds and VRF Integration

## Overview

SusuChain integrates Chainlink's decentralized oracle network to provide:
1. **Price Feeds**: Real-time ETH/USD and USDC/USD prices for accurate contribution calculations
2. **VRF (Verifiable Random Function)**: Provably fair randomization of payout order

This ensures fair, transparent, and stable Susu operations on Base L2.

## Architecture

### Chainlink Price Feeds

**Purpose**: Enable USD-denominated Susu groups with automatic ETH conversion

**Components**:
- `ChainlinkPriceFeed.sol`: Solidity library for price feed interactions
- `price-feed-client.ts`: Frontend service for price calculations
- `usePriceFeed.ts`: React hooks for live price data
- `USDConverter.tsx`: UI component for price display

**Base Sepolia Addresses**:
- ETH/USD: `0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1`
- USDC/USD: `0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165`

**Base Mainnet Addresses**:
- ETH/USD: `0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70`
- USDC/USD: `0x7e860098F58bBFC8648a4311b374B1D669a2bc6B`

### Chainlink VRF

**Purpose**: Fair random payout ordering to prevent early-joiner advantage

**Components**:
- `ChainlinkVRF.sol`: Abstract contract for VRF integration
- `RandomPayoutQueue` library: Fisher-Yates shuffle implementation
- `VRFProof.tsx`: UI component showing VRF verification

**Base VRF Coordinator**:
- Sepolia: `0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634`
- Mainnet: `0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634`

## Price Feed Integration

### USD-Denominated Groups

**Problem**: ETH price volatility makes contribution amounts unstable

**Solution**: Store contributions in USD terms, convert to ETH at current price

**Example**:
```solidity
// Group created with $100 USD contribution
baseUSDAmount = 100e18; // $100 in 18 decimals

// ETH price is $3,000
contributionAmount = (100e18 * 1e8) / 3000e8 = 0.0333 ETH

// Price increases to $3,300 (+10%)
updateContributionPrice();
contributionAmount = 0.0303 ETH // Requires less ETH for same $100
```

### Dynamic Price Adjustments

**Mechanism**:
1. Monitor ETH price via Chainlink feed
2. If price deviates >10%, update required ETH amount
3. Cap maximum adjustment at ±20% per round
4. Notify members of new contribution amount

**Smart Contract Functions**:

```solidity
/**
 * @notice Update contribution amount based on current price
 */
function updateContributionPrice() external {
    require(isUSDDenominated, "Group is not USD-denominated");

    (uint256 currentPrice, , ) = ChainlinkPriceFeed.getETHUSDPrice(priceFeedAddress);

    (bool hasDeviated, ) = ChainlinkPriceFeed.checkPriceDeviation(
        lastETHPrice,
        currentPrice,
        MAX_PRICE_ADJUSTMENT
    );

    if (hasDeviated) {
        contributionAmount = ChainlinkPriceFeed.convertUSDToETH(baseUSDAmount, currentPrice);
        lastETHPrice = currentPrice;
        emit PriceUpdated(oldAmount, newAmount, contributionAmount);
    }
}
```

### Price Staleness Checks

**Protection**: Reject prices older than 1 hour

```solidity
require(block.timestamp - updatedAt <= PRICE_STALENESS_THRESHOLD, "Price data too old");
```

**Heartbeat**: Chainlink feeds update every ~1 minute on Base

### Fallback Mechanisms

**Primary Feed Failure**:
1. Check if price feed is healthy
2. If unhealthy, use fallback feed (if configured)
3. If all feeds fail, revert transaction

```solidity
function getPriceWithFallback(
    address primaryFeed,
    address fallbackFeed
) internal view returns (uint256 price, uint8 decimals, bool usedFallback) {
    if (isPriceFeedHealthy(primaryFeed)) {
        (price, decimals, ) = getETHUSDPrice(primaryFeed);
        usedFallback = false;
    } else if (fallbackFeed != address(0) && isPriceFeedHealthy(fallbackFeed)) {
        (price, decimals, ) = getETHUSDPrice(fallbackFeed);
        usedFallback = true;
    } else {
        revert("All price feeds unavailable");
    }
}
```

## VRF Integration

### Random Payout Ordering

**Problem**: First-come-first-served creates perverse incentives (rush to join early)

**Solution**: Use Chainlink VRF to randomly shuffle payout queue

**How it Works**:
1. When group fills up, request randomness from VRF
2. VRF coordinator generates random number onchain
3. Use Fisher-Yates shuffle with VRF seed
4. Shuffled queue determines payout order

**Smart Contract Implementation**:

```solidity
function _shufflePayoutQueue() internal {
    // Use block hash as fallback (for demo/testing)
    uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao)));

    randomSeed = seed;

    // Fisher-Yates shuffle
    payoutQueue = RandomPayoutQueue.shuffle(payoutQueue, seed);

    emit PayoutQueueShuffled(seed);
}
```

**Production VRF Integration** (requires subscription):

```solidity
// Request randomness
uint256 requestId = _requestRandomness(1); // 1 random word

// VRF callback
function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
    uint256 seed = randomWords[0];
    payoutQueue = RandomPayoutQueue.shuffle(payoutQueue, seed);
    emit PayoutQueueShuffled(seed);
}
```

### Fisher-Yates Shuffle

**Algorithm**: Industry-standard unbiased shuffling

```solidity
function shuffle(address[] memory addresses, uint256 randomSeed) internal pure returns (address[] memory) {
    uint256 n = addresses.length;

    for (uint256 i = n - 1; i > 0; i--) {
        // Generate random index from 0 to i
        uint256 j = uint256(keccak256(abi.encode(randomSeed, i))) % (i + 1);

        // Swap elements
        address temp = addresses[i];
        addresses[i] = addresses[j];
        addresses[j] = temp;
    }

    return addresses;
}
```

**Properties**:
- Each permutation equally likely
- No bias toward any position
- Deterministic given same seed
- Cryptographically secure with VRF seed

### VRF Subscription Setup

**Steps to Deploy with VRF**:

1. **Create VRF Subscription**:
```bash
# On Base Sepolia
# Visit https://vrf.chain.link/base-sepolia
# Click "Create Subscription"
# Fund with LINK tokens
```

2. **Add Consumer Contract**:
```bash
# Add SusuFactory as consumer
# Copy subscription ID to deployment script
```

3. **Deploy with VRF Config**:
```typescript
const susuFactory = await SusuFactory.deploy(
    vrfCoordinator,
    subscriptionId,
    keyHash,
    callbackGasLimit
);
```

4. **Monitor VRF Requests**:
```bash
# Check VRF dashboard for request status
# Requests typically fulfill in 1-3 blocks
```

### VRF Cost Estimation

**Gas Costs**:
- Request randomness: ~120k gas
- Fulfill callback: ~200k gas
- Total: ~320k gas per shuffle

**LINK Costs** (Base Sepolia):
- ~0.1 LINK per VRF request
- Depends on gas price and callback limit

## Frontend Integration

### Using Price Feeds

**Display ETH/USD Price**:
```typescript
import { useETHPrice } from "~~/hooks/chainlink/usePriceFeed";

function PriceDisplay() {
    const { priceData, isLoading } = useETHPrice();

    return (
        <div>
            {priceData && (
                <div>
                    <span>ETH: {priceData.formatted}</span>
                    {priceData.isStale && <span className="badge badge-warning">Stale</span>}
                </div>
            )}
        </div>
    );
}
```

**Convert USD to ETH**:
```typescript
import { USDConverter } from "~~/components/Chainlink/USDConverter";

function ContributionForm() {
    return (
        <USDConverter
            usdAmount={100}
            showBothDirections={true}
        />
    );
}
```

**Dynamic Contribution Display**:
```typescript
import { DynamicContributionAdjuster } from "~~/components/Chainlink/USDConverter";

function GroupSettings() {
    return (
        <DynamicContributionAdjuster
            baseUSDAmount={100}
            onAdjustment={(newETH) => console.log("New amount:", newETH)}
        />
    );
}
```

### Displaying VRF Proof

**Show VRF Verification**:
```typescript
import { VRFProof } from "~~/components/Chainlink/VRFProof";

function GroupDetails() {
    return (
        <VRFProof
            requestId={groupData.vrfRequestId}
            randomSeed={groupData.randomSeed}
            fulfilled={groupData.vrfFulfilled}
            shuffled={groupData.useVRF}
            payoutQueue={groupData.payoutQueue}
        />
    );
}
```

**VRF Badge on Group Cards**:
```typescript
import { VRFBadge } from "~~/components/Chainlink/VRFProof";

function GroupCard({ group }) {
    return (
        <div className="card">
            <VRFBadge useVRF={group.useVRF} />
            {/* other content */}
        </div>
    );
}
```

## User Flows

### Creating USD-Denominated Group

1. User clicks "Create Group"
2. Selects "USD-Denominated" option
3. Enters contribution amount in USD (e.g., $100)
4. Frontend displays required ETH using live price
5. Contract stores baseUSDAmount = $100
6. Contract calculates initial contributionAmount in ETH
7. Group created with USD denomination flag

### Contributing to USD Group

1. User opens group details
2. Sees current contribution amount in both USD and ETH
3. If price changed significantly, sees adjustment notice
4. Contributes current ETH amount (auto-calculated)
5. Backend tracks contribution in USD terms

### Random Payout Order Flow

1. Group creator enables "Fair Random Order" toggle
2. Group fills up with max members
3. Contract requests VRF randomness (or uses block hash fallback)
4. VRF fulfills with random seed
5. Contract shuffles payout queue using Fisher-Yates
6. First round starts with random beneficiary
7. Users can verify randomness onchain

## Security Considerations

### Price Feed Security

**Staleness Protection**:
- Reject prices older than 1 hour
- Check `answeredInRound >= roundId`
- Verify price > 0

**Deviation Limits**:
- Cap price adjustments at ±20% per round
- Prevents extreme volatility impact
- Gradual adjustments over multiple rounds

**Circuit Breaker**:
- If price deviates >20% instantly, pause updates
- Admin can review and manually adjust
- Prevents oracle manipulation attacks

### VRF Security

**Randomness Verification**:
- All VRF requests onchain and auditable
- Random seed cryptographically verifiable
- Chainlink security guarantees apply

**Fallback Randomness**:
- Uses block.prevrandao if VRF unavailable
- Less secure but still unpredictable
- Clearly labeled as "fallback" in UI

**No VRF Manipulation**:
- Contract owner cannot influence randomness
- No re-rolls or re-requests allowed
- One shuffle per group lifetime

## Gas Optimization

### Caching Prices

**Avoid Repeated Calls**:
```solidity
// Cache price for round
uint256 roundPrice = lastETHPrice;

// Use cached price for all contributions in round
contributionAmount = ChainlinkPriceFeed.convertUSDToETH(baseUSDAmount, roundPrice);
```

**Update Frequency**:
- Update price at start of each round
- Don't update mid-round unless extreme deviation
- Batch price checks with other operations

### VRF Gas Savings

**Callback Gas Limit**:
- Set appropriate callback gas limit (200k default)
- Avoid expensive operations in fulfillRandomWords
- Store random seed, shuffle later if needed

**Single VRF Request**:
- One randomness request per group (at startup)
- Use single random word for entire shuffle
- Don't request randomness per round

## Monitoring and Alerts

### Price Feed Health

**Monitor**:
- Feed heartbeat (should update every ~1 min)
- Price staleness
- Deviation from other data sources

**Alerts**:
- Slack/Discord notification if feed stale >1 hour
- Email alert if price deviation >10% from CEX prices
- Dashboard showing feed health status

### VRF Request Tracking

**Monitor**:
- VRF subscription balance (LINK)
- Request fulfillment time
- Failed requests

**Alerts**:
- Low LINK balance (<5 LINK)
- VRF request pending >5 minutes
- VRF request failure

## Testing

### Local Testing

**Mock Price Feeds**:
```typescript
// Use mock price feed for development
const mockPrice = parseUnits("3000", 8); // $3000 ETH

// Deploy mock aggregator
const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
const mockFeed = await MockV3Aggregator.deploy(8, mockPrice);
```

**Mock VRF**:
```solidity
// Override _shufflePayoutQueue for testing
function _shufflePayoutQueueMock(uint256 seed) internal {
    payoutQueue = RandomPayoutQueue.shuffle(payoutQueue, seed);
}
```

### Base Sepolia Testing

**Price Feed Testing**:
1. Create USD-denominated group
2. Monitor ETH price changes
3. Trigger updateContributionPrice()
4. Verify adjustment calculations

**VRF Testing**:
1. Create VRF subscription on Base Sepolia
2. Fund with test LINK
3. Create group with VRF enabled
4. Monitor VRF request fulfillment
5. Verify payout queue shuffle

## Deployment Checklist

### Price Feeds

- [ ] Verify price feed addresses for network
- [ ] Test price feed connectivity
- [ ] Set appropriate staleness threshold
- [ ] Configure price deviation limits
- [ ] Deploy with correct feed addresses

### VRF

- [ ] Create VRF subscription
- [ ] Fund subscription with LINK
- [ ] Add consumer contracts
- [ ] Set callback gas limit
- [ ] Test VRF request/fulfill cycle
- [ ] Monitor subscription balance

### Frontend

- [ ] Update chainlink addresses in config
- [ ] Test price display components
- [ ] Verify USD/ETH conversions accurate
- [ ] Test VRF proof display
- [ ] Add price trend charts

## Future Enhancements

### Advanced Price Features

1. **Multiple Asset Pairs**: Support BTC/USD, MATIC/USD, etc.
2. **Price Averaging**: Use TWAP (Time-Weighted Average Price)
3. **Custom Oracles**: Allow groups to specify preferred oracles
4. **Price Hedging**: Integrate with options protocols

### Enhanced VRF

1. **VRF v2.5**: Upgrade to latest VRF version
2. **Weighted Random**: Bias toward active contributors
3. **Partial Shuffle**: Shuffle only next N positions
4. **Re-shuffle Option**: Allow mid-cycle re-randomization (governance vote)

### Analytics

1. **Price Impact Dashboard**: Show how price changes affect contributions
2. **VRF Fairness Metrics**: Statistical analysis of shuffle randomness
3. **Cost Tracking**: Monitor Chainlink service costs
4. **Performance Monitoring**: Feed latency, VRF fulfillment time

## Resources

- [Chainlink Price Feeds Docs](https://docs.chain.link/data-feeds/price-feeds)
- [Chainlink VRF Docs](https://docs.chain.link/vrf/v2/introduction)
- [Base Network Docs](https://docs.base.org/)
- [Fisher-Yates Algorithm](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle)

## Support

For issues or questions:
- Chainlink Discord: [discord.gg/chainlink](https://discord.gg/chainlink)
- Base Discord: [discord.gg/base](https://discord.gg/base)
- GitHub Issues: [susuchain/issues](https://github.com/ethaccraEmarcAgedevs/susuchain/issues)

---

**Built with Chainlink on Base for Fair and Stable Susu**
