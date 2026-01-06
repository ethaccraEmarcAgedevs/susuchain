// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

/**
 * @title ChainlinkVRF
 * @notice Abstract contract for using Chainlink VRF v2 for random payout ordering
 * @dev Contracts inheriting this can request verifiable randomness
 */
abstract contract ChainlinkVRF is VRFConsumerBaseV2 {
    // VRF Coordinator
    VRFCoordinatorV2Interface public immutable vrfCoordinator;

    // Base Sepolia VRF Coordinator
    address public constant VRF_COORDINATOR_BASE_SEPOLIA = 0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634;

    // Base Mainnet VRF Coordinator
    address public constant VRF_COORDINATOR_BASE_MAINNET = 0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634;

    // VRF Configuration
    uint64 public subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit;
    uint16 public requestConfirmations;
    uint32 public numWords;

    // Base Sepolia Key Hash (500 gwei)
    bytes32 public constant KEY_HASH_BASE_SEPOLIA = 0xc799bd1e3bd4d1a41cd4968997a4e03dfd2a3c7c04b695881138580163f42887;

    // Base Mainnet Key Hash (500 gwei)
    bytes32 public constant KEY_HASH_BASE_MAINNET = 0x3c1f8da13fb0e16f39ebfa28f4bf52c6cd7b5cd2e0a1ae31cb80e5b9cfe87a13;

    // VRF Request tracking
    struct VRFRequest {
        uint256 requestId;
        address requester;
        uint256 timestamp;
        bool fulfilled;
        uint256[] randomWords;
    }

    mapping(uint256 => VRFRequest) public vrfRequests;
    mapping(address => uint256[]) public requesterRequests; // Track requests by address

    // Events
    event VRFRequested(uint256 indexed requestId, address indexed requester, uint32 numWords);
    event VRFFulfilled(uint256 indexed requestId, uint256[] randomWords);
    event VRFConfigUpdated(uint64 subscriptionId, bytes32 keyHash, uint32 callbackGasLimit);

    /**
     * @notice Constructor
     * @param _vrfCoordinator Address of VRF Coordinator
     * @param _subscriptionId VRF subscription ID
     * @param _keyHash Key hash for VRF
     * @param _callbackGasLimit Gas limit for callback
     */
    constructor(
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash,
        uint32 _callbackGasLimit
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        callbackGasLimit = _callbackGasLimit;
        requestConfirmations = 3; // Standard 3 confirmations
        numWords = 1; // Request 1 random word by default
    }

    /**
     * @notice Request randomness from Chainlink VRF
     * @param _numWords Number of random words to request
     * @return requestId VRF request ID
     */
    function _requestRandomness(uint32 _numWords) internal returns (uint256 requestId) {
        requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            _numWords
        );

        vrfRequests[requestId] = VRFRequest({
            requestId: requestId,
            requester: msg.sender,
            timestamp: block.timestamp,
            fulfilled: false,
            randomWords: new uint256[](0)
        });

        requesterRequests[msg.sender].push(requestId);

        emit VRFRequested(requestId, msg.sender, _numWords);
    }

    /**
     * @notice Callback function used by VRF Coordinator
     * @param requestId VRF request ID
     * @param randomWords Array of random values
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        VRFRequest storage request = vrfRequests[requestId];
        require(!request.fulfilled, "Request already fulfilled");

        request.fulfilled = true;
        request.randomWords = randomWords;

        emit VRFFulfilled(requestId, randomWords);

        // Call implementation-specific handler
        _handleRandomness(requestId, randomWords);
    }

    /**
     * @notice Handler for randomness (to be implemented by inheriting contracts)
     * @param requestId VRF request ID
     * @param randomWords Array of random values
     */
    function _handleRandomness(uint256 requestId, uint256[] memory randomWords) internal virtual;

    /**
     * @notice Get VRF request details
     * @param requestId VRF request ID
     * @return request VRF request struct
     */
    function getVRFRequest(uint256 requestId) external view returns (VRFRequest memory request) {
        request = vrfRequests[requestId];
    }

    /**
     * @notice Get all VRF requests for an address
     * @param requester Address that requested randomness
     * @return requestIds Array of request IDs
     */
    function getRequesterRequests(address requester) external view returns (uint256[] memory requestIds) {
        requestIds = requesterRequests[requester];
    }

    /**
     * @notice Check if VRF request is fulfilled
     * @param requestId VRF request ID
     * @return fulfilled True if fulfilled
     */
    function isRequestFulfilled(uint256 requestId) external view returns (bool fulfilled) {
        fulfilled = vrfRequests[requestId].fulfilled;
    }

    /**
     * @notice Update VRF configuration (admin only)
     * @param _subscriptionId New subscription ID
     * @param _keyHash New key hash
     * @param _callbackGasLimit New callback gas limit
     */
    function _updateVRFConfig(
        uint64 _subscriptionId,
        bytes32 _keyHash,
        uint32 _callbackGasLimit
    ) internal {
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        callbackGasLimit = _callbackGasLimit;

        emit VRFConfigUpdated(_subscriptionId, _keyHash, _callbackGasLimit);
    }

    /**
     * @notice Fisher-Yates shuffle algorithm using VRF randomness
     * @param array Array to shuffle
     * @param randomSeed Random seed from VRF
     * @return shuffled Shuffled array
     */
    function fisherYatesShuffle(
        address[] memory array,
        uint256 randomSeed
    ) internal pure returns (address[] memory shuffled) {
        shuffled = array;
        uint256 n = array.length;

        for (uint256 i = n - 1; i > 0; i--) {
            // Generate random index from 0 to i using the seed
            uint256 j = uint256(keccak256(abi.encode(randomSeed, i))) % (i + 1);

            // Swap elements at i and j
            address temp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = temp;
        }
    }

    /**
     * @notice Generate random number in range
     * @param randomWord Random word from VRF
     * @param min Minimum value (inclusive)
     * @param max Maximum value (inclusive)
     * @return randomNumber Random number in range
     */
    function getRandomInRange(uint256 randomWord, uint256 min, uint256 max) internal pure returns (uint256 randomNumber) {
        require(max >= min, "Invalid range");
        uint256 range = max - min + 1;
        randomNumber = min + (randomWord % range);
    }

    /**
     * @notice Get multiple random numbers from single random word
     * @param randomWord Random word from VRF
     * @param count Number of random numbers needed
     * @param maxValue Maximum value for each random number
     * @return randomNumbers Array of random numbers
     */
    function expandRandomness(
        uint256 randomWord,
        uint256 count,
        uint256 maxValue
    ) internal pure returns (uint256[] memory randomNumbers) {
        randomNumbers = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            randomNumbers[i] = uint256(keccak256(abi.encode(randomWord, i))) % maxValue;
        }
    }

    /**
     * @notice Verify randomness was generated by Chainlink VRF
     * @param requestId VRF request ID
     * @return isValid True if request exists and is fulfilled
     * @return randomWords Random words from request
     */
    function verifyRandomness(uint256 requestId) external view returns (bool isValid, uint256[] memory randomWords) {
        VRFRequest memory request = vrfRequests[requestId];
        isValid = request.fulfilled && request.requestId == requestId;
        randomWords = request.randomWords;
    }
}

/**
 * @title RandomPayoutQueue
 * @notice Library for managing randomized payout queues
 */
library RandomPayoutQueue {
    /**
     * @notice Shuffle array of addresses using Fisher-Yates
     * @param addresses Array of addresses to shuffle
     * @param randomSeed Random seed
     * @return shuffled Shuffled array
     */
    function shuffle(address[] memory addresses, uint256 randomSeed) internal pure returns (address[] memory shuffled) {
        shuffled = addresses;
        uint256 n = addresses.length;

        for (uint256 i = n - 1; i > 0; i--) {
            uint256 j = uint256(keccak256(abi.encode(randomSeed, i))) % (i + 1);
            address temp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = temp;
        }
    }

    /**
     * @notice Assign random positions to members
     * @param members Array of member addresses
     * @param randomSeed Random seed from VRF
     * @return positions Array of positions (index = member, value = position)
     */
    function assignRandomPositions(
        address[] memory members,
        uint256 randomSeed
    ) internal pure returns (uint256[] memory positions) {
        uint256 n = members.length;
        positions = new uint256[](n);

        // Initialize positions array [0, 1, 2, ..., n-1]
        for (uint256 i = 0; i < n; i++) {
            positions[i] = i;
        }

        // Shuffle positions
        for (uint256 i = n - 1; i > 0; i--) {
            uint256 j = uint256(keccak256(abi.encode(randomSeed, i))) % (i + 1);
            uint256 temp = positions[i];
            positions[i] = positions[j];
            positions[j] = temp;
        }
    }

    /**
     * @notice Calculate fairness score for shuffle
     * @param originalOrder Original order of members
     * @param shuffledOrder Shuffled order of members
     * @return fairnessScore Score from 0-100 (100 = perfectly random)
     */
    function calculateFairnessScore(
        address[] memory originalOrder,
        address[] memory shuffledOrder
    ) internal pure returns (uint256 fairnessScore) {
        require(originalOrder.length == shuffledOrder.length, "Arrays must be same length");

        uint256 n = originalOrder.length;
        uint256 samePositionCount = 0;

        // Count how many are in same position (lower is better for randomness)
        for (uint256 i = 0; i < n; i++) {
            if (originalOrder[i] == shuffledOrder[i]) {
                samePositionCount++;
            }
        }

        // Fairness score: fewer same positions = higher score
        // Perfect shuffle should have ~1/n elements in same position
        fairnessScore = 100 - ((samePositionCount * 100) / n);
    }
}
