// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

// Base EAS Interface
interface IEAS {
    struct AttestationRequest {
        bytes32 schema;
        AttestationRequestData data;
    }

    struct AttestationRequestData {
        address recipient;
        uint64 expirationTime;
        bool revocable;
        bytes32 refUID;
        bytes data;
        uint256 value;
    }

    function attest(AttestationRequest calldata request) external payable returns (bytes32);
}

contract AttestationHelper is Ownable {
    // Base EAS contract address on Base mainnet
    IEAS public constant EAS = IEAS(0x4200000000000000000000000000000000000021);

    // Schema UIDs for different attestation types
    bytes32 public contributionSchema;
    bytes32 public vouchSchema;
    bytes32 public groupCompletionSchema;
    bytes32 public reliabilitySchema;

    // Mapping to track attestations
    mapping(address => bytes32[]) public userAttestations;
    mapping(address => uint256) public contributionCount;
    mapping(address => uint256) public vouchCount;
    mapping(address => uint256) public groupsCompleted;
    mapping(address => mapping(address => bool)) public hasVouchedFor;

    // Events
    event ContributionAttested(address indexed member, address indexed group, uint256 round, bytes32 attestationUID);
    event VouchAttested(address indexed voucher, address indexed vouchee, bytes32 attestationUID);
    event GroupCompletionAttested(address indexed member, address indexed group, bytes32 attestationUID);
    event ReliabilityAttested(address indexed member, uint256 score, bytes32 attestationUID);

    constructor(address _owner) Ownable(_owner) {}

    /**
     * @notice Set schema UIDs (should be called after schemas are registered on EAS)
     */
    function setSchemas(
        bytes32 _contributionSchema,
        bytes32 _vouchSchema,
        bytes32 _groupCompletionSchema,
        bytes32 _reliabilitySchema
    ) external onlyOwner {
        contributionSchema = _contributionSchema;
        vouchSchema = _vouchSchema;
        groupCompletionSchema = _groupCompletionSchema;
        reliabilitySchema = _reliabilitySchema;
    }

    /**
     * @notice Attest a member's contribution to a round
     */
    function attestContribution(
        address member,
        address group,
        uint256 round,
        uint256 amount,
        bool isOnTime
    ) external returns (bytes32) {
        require(contributionSchema != bytes32(0), "Contribution schema not set");

        // Encode attestation data: (address group, uint256 round, uint256 amount, bool isOnTime)
        bytes memory attestationData = abi.encode(group, round, amount, isOnTime);

        bytes32 attestationUID = _createAttestation(contributionSchema, member, attestationData);

        userAttestations[member].push(attestationUID);
        contributionCount[member]++;

        emit ContributionAttested(member, group, round, attestationUID);

        return attestationUID;
    }

    /**
     * @notice Attest a vouch from one member to another
     */
    function attestVouch(address voucher, address vouchee, string calldata reason) external returns (bytes32) {
        require(vouchSchema != bytes32(0), "Vouch schema not set");
        require(!hasVouchedFor[voucher][vouchee], "Already vouched for this member");
        require(voucher != vouchee, "Cannot vouch for yourself");

        // Encode attestation data: (address vouchee, string reason)
        bytes memory attestationData = abi.encode(vouchee, reason);

        bytes32 attestationUID = _createAttestation(vouchSchema, voucher, attestationData);

        userAttestations[voucher].push(attestationUID);
        hasVouchedFor[voucher][vouchee] = true;
        vouchCount[vouchee]++;

        emit VouchAttested(voucher, vouchee, attestationUID);

        return attestationUID;
    }

    /**
     * @notice Attest group completion for a member
     */
    function attestGroupCompletion(address member, address group, uint256 totalRounds) external returns (bytes32) {
        require(groupCompletionSchema != bytes32(0), "Group completion schema not set");

        // Encode attestation data: (address group, uint256 totalRounds, uint256 timestamp)
        bytes memory attestationData = abi.encode(group, totalRounds, block.timestamp);

        bytes32 attestationUID = _createAttestation(groupCompletionSchema, member, attestationData);

        userAttestations[member].push(attestationUID);
        groupsCompleted[member]++;

        emit GroupCompletionAttested(member, group, attestationUID);

        return attestationUID;
    }

    /**
     * @notice Attest payment reliability score for a member
     */
    function attestReliability(address member, uint256 score) external returns (bytes32) {
        require(reliabilitySchema != bytes32(0), "Reliability schema not set");
        require(score <= 100, "Score must be between 0 and 100");

        // Encode attestation data: (uint256 score, uint256 timestamp)
        bytes memory attestationData = abi.encode(score, block.timestamp);

        bytes32 attestationUID = _createAttestation(reliabilitySchema, member, attestationData);

        userAttestations[member].push(attestationUID);

        emit ReliabilityAttested(member, score, attestationUID);

        return attestationUID;
    }

    /**
     * @notice Internal function to create attestation on EAS
     */
    function _createAttestation(
        bytes32 schema,
        address recipient,
        bytes memory data
    ) internal returns (bytes32) {
        IEAS.AttestationRequestData memory attestationData = IEAS.AttestationRequestData({
            recipient: recipient,
            expirationTime: 0, // No expiration
            revocable: false,
            refUID: bytes32(0),
            data: data,
            value: 0
        });

        IEAS.AttestationRequest memory request = IEAS.AttestationRequest({
            schema: schema,
            data: attestationData
        });

        return EAS.attest(request);
    }

    /**
     * @notice Get all attestations for a user
     */
    function getUserAttestations(address user) external view returns (bytes32[] memory) {
        return userAttestations[user];
    }

    /**
     * @notice Get reputation metrics for a user
     */
    function getReputationMetrics(address user)
        external
        view
        returns (uint256 contributions, uint256 vouches, uint256 completions)
    {
        return (contributionCount[user], vouchCount[user], groupsCompleted[user]);
    }
}
