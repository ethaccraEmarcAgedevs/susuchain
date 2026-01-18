// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ChainlinkPriceFeed
 * @notice Library for interacting with Chainlink Price Feeds on Base
 * @dev Uses Chainlink ETH/USD and USDC/USD feeds
 */

// Chainlink Aggregator Interface
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function version() external view returns (uint256);

    function getRoundData(
        uint80 _roundId
    )
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);

    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

library ChainlinkPriceFeed {
    // Base Sepolia Price Feed Addresses
    address public constant ETH_USD_FEED_BASE_SEPOLIA = 0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1;
    address public constant USDC_USD_FEED_BASE_SEPOLIA = 0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165;

    // Base Mainnet Price Feed Addresses
    address public constant ETH_USD_FEED_BASE_MAINNET = 0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70;
    address public constant USDC_USD_FEED_BASE_MAINNET = 0x7e860098F58bBFC8648a4311b374B1D669a2bc6B;

    // Price staleness threshold (1 hour)
    uint256 public constant PRICE_STALENESS_THRESHOLD = 3600;

    // Maximum price deviation allowed (20%)
    uint256 public constant MAX_PRICE_DEVIATION = 2000; // basis points

    /**
     * @notice Get ETH/USD price from Chainlink feed
     * @param feedAddress Address of the price feed
     * @return price Latest price (8 decimals)
     * @return decimals Number of decimals
     * @return updatedAt Timestamp of last update
     */
    function getETHUSDPrice(
        address feedAddress
    ) internal view returns (uint256 price, uint8 decimals, uint256 updatedAt) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(feedAddress);

        (uint80 roundId, int256 answer, , uint256 timestamp, uint80 answeredInRound) = priceFeed.latestRoundData();

        require(answer > 0, "Invalid price from feed");
        require(answeredInRound >= roundId, "Stale price data");
        require(block.timestamp - timestamp <= PRICE_STALENESS_THRESHOLD, "Price data too old");

        decimals = priceFeed.decimals();
        price = uint256(answer);
        updatedAt = timestamp;
    }

    /**
     * @notice Get USDC/USD price from Chainlink feed
     * @param feedAddress Address of the price feed
     * @return price Latest price (8 decimals)
     * @return decimals Number of decimals
     * @return updatedAt Timestamp of last update
     */
    function getUSDCUSDPrice(
        address feedAddress
    ) internal view returns (uint256 price, uint8 decimals, uint256 updatedAt) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(feedAddress);

        (uint80 roundId, int256 answer, , uint256 timestamp, uint80 answeredInRound) = priceFeed.latestRoundData();

        require(answer > 0, "Invalid price from feed");
        require(answeredInRound >= roundId, "Stale price data");
        require(block.timestamp - timestamp <= PRICE_STALENESS_THRESHOLD, "Price data too old");

        decimals = priceFeed.decimals();
        price = uint256(answer);
        updatedAt = timestamp;
    }

    /**
     * @notice Convert USD amount to ETH amount
     * @param usdAmount Amount in USD (18 decimals)
     * @param ethUsdPrice ETH/USD price (8 decimals)
     * @return ethAmount Amount in ETH (18 decimals)
     */
    function convertUSDToETH(uint256 usdAmount, uint256 ethUsdPrice) internal pure returns (uint256 ethAmount) {
        require(ethUsdPrice > 0, "Invalid ETH price");

        // usdAmount has 18 decimals, ethUsdPrice has 8 decimals
        // ethAmount = (usdAmount * 10^8) / ethUsdPrice
        ethAmount = (usdAmount * 1e8) / ethUsdPrice;
    }

    /**
     * @notice Convert ETH amount to USD amount
     * @param ethAmount Amount in ETH (18 decimals)
     * @param ethUsdPrice ETH/USD price (8 decimals)
     * @return usdAmount Amount in USD (18 decimals)
     */
    function convertETHToUSD(uint256 ethAmount, uint256 ethUsdPrice) internal pure returns (uint256 usdAmount) {
        require(ethUsdPrice > 0, "Invalid ETH price");

        // ethAmount has 18 decimals, ethUsdPrice has 8 decimals
        // usdAmount = (ethAmount * ethUsdPrice) / 10^8
        usdAmount = (ethAmount * ethUsdPrice) / 1e8;
    }

    /**
     * @notice Check if price has deviated beyond threshold
     * @param oldPrice Previous price
     * @param newPrice Current price
     * @param maxDeviationBps Maximum allowed deviation in basis points
     * @return hasDeviated True if deviation exceeds threshold
     * @return deviationBps Actual deviation in basis points
     */
    function checkPriceDeviation(
        uint256 oldPrice,
        uint256 newPrice,
        uint256 maxDeviationBps
    ) internal pure returns (bool hasDeviated, uint256 deviationBps) {
        require(oldPrice > 0, "Invalid old price");
        require(newPrice > 0, "Invalid new price");

        uint256 priceDiff;
        if (newPrice > oldPrice) {
            priceDiff = newPrice - oldPrice;
        } else {
            priceDiff = oldPrice - newPrice;
        }

        // Calculate deviation in basis points (1 basis point = 0.01%)
        deviationBps = (priceDiff * 10000) / oldPrice;
        hasDeviated = deviationBps > maxDeviationBps;
    }

    /**
     * @notice Calculate adjusted contribution amount based on price change
     * @param baseUSDAmount Base USD amount
     * @param currentPrice Current ETH/USD price
     * @param maxAdjustmentBps Maximum adjustment allowed (basis points)
     * @return adjustedETHAmount Adjusted ETH amount
     */
    function calculateAdjustedContribution(
        uint256 baseUSDAmount,
        uint256 currentPrice,
        uint256 maxAdjustmentBps
    ) internal pure returns (uint256 adjustedETHAmount) {
        // Convert USD to ETH with current price
        uint256 requiredETH = convertUSDToETH(baseUSDAmount, currentPrice);

        // Cap adjustment if needed (maxAdjustmentBps default: 2000 = 20%)
        // This is already the adjusted amount based on current price
        adjustedETHAmount = requiredETH;
    }

    /**
     * @notice Get price feed for asset type
     * @param isMainnet True for Base mainnet, false for Base Sepolia
     * @param isUSDC True for USDC feed, false for ETH feed
     * @return feedAddress Address of the appropriate price feed
     */
    function getPriceFeedAddress(bool isMainnet, bool isUSDC) internal pure returns (address feedAddress) {
        if (isMainnet) {
            feedAddress = isUSDC ? USDC_USD_FEED_BASE_MAINNET : ETH_USD_FEED_BASE_MAINNET;
        } else {
            feedAddress = isUSDC ? USDC_USD_FEED_BASE_SEPOLIA : ETH_USD_FEED_BASE_SEPOLIA;
        }
    }

    /**
     * @notice Check if price feed is healthy
     * @param feedAddress Address of the price feed
     * @return isHealthy True if feed is responding and recent
     */
    function isPriceFeedHealthy(address feedAddress) internal view returns (bool isHealthy) {
        try AggregatorV3Interface(feedAddress).latestRoundData() returns (
            uint80 roundId,
            int256 answer,
            uint256,
            uint256 updatedAt,
            uint80 answeredInRound
        ) {
            bool validAnswer = answer > 0;
            bool notStale = answeredInRound >= roundId;
            bool recent = block.timestamp - updatedAt <= PRICE_STALENESS_THRESHOLD;

            isHealthy = validAnswer && notStale && recent;
        } catch {
            isHealthy = false;
        }
    }

    /**
     * @notice Get price with fallback mechanism
     * @param primaryFeed Primary price feed address
     * @param fallbackFeed Fallback price feed address
     * @return price Latest price
     * @return decimals Number of decimals
     * @return usedFallback True if fallback was used
     */
    function getPriceWithFallback(
        address primaryFeed,
        address fallbackFeed
    ) internal view returns (uint256 price, uint8 decimals, bool usedFallback) {
        // Try primary feed
        if (isPriceFeedHealthy(primaryFeed)) {
            (price, decimals, ) = getETHUSDPrice(primaryFeed);
            usedFallback = false;
        } else if (fallbackFeed != address(0) && isPriceFeedHealthy(fallbackFeed)) {
            // Fallback to secondary feed
            (price, decimals, ) = getETHUSDPrice(fallbackFeed);
            usedFallback = true;
        } else {
            revert("All price feeds unavailable");
        }
    }

    /**
     * @notice Format price for display (convert 8 decimals to readable)
     * @param price Price with 8 decimals
     * @return formattedPrice Price as human-readable value (2 decimals)
     */
    function formatPrice(uint256 price) internal pure returns (uint256 formattedPrice) {
        // Price has 8 decimals, convert to 2 decimals for display
        formattedPrice = price / 1e6;
    }

    /**
     * @notice Calculate percentage change between two prices
     * @param oldPrice Old price
     * @param newPrice New price
     * @return percentChange Percentage change (basis points, 100 = 1%)
     * @return isIncrease True if price increased
     */
    function calculatePercentageChange(
        uint256 oldPrice,
        uint256 newPrice
    ) internal pure returns (uint256 percentChange, bool isIncrease) {
        require(oldPrice > 0, "Invalid old price");

        if (newPrice > oldPrice) {
            percentChange = ((newPrice - oldPrice) * 10000) / oldPrice;
            isIncrease = true;
        } else {
            percentChange = ((oldPrice - newPrice) * 10000) / oldPrice;
            isIncrease = false;
        }
    }
}
