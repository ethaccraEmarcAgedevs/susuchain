// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title SusuMembershipNFT
 * @dev Dynamic NFT membership certificates for Susu group participants
 * Automatically updates metadata based on user activity and achievements
 */
contract SusuMembershipNFT is ERC721, Ownable {
    using Strings for uint256;

    // Tier levels
    enum Tier {
        Bronze,      // 0-10 contributions
        Silver,      // 11-50 contributions
        Gold,        // 51-100 contributions
        Platinum,    // 100+ contributions + perfect record
        TrustedElder // 200+ contributions + 90+ reputation
    }

    // Member statistics
    struct MemberStats {
        uint256 totalContributions;
        uint256 groupsCompleted;
        uint256 reputationScore;
        uint256 memberSince;
        uint256 totalContributedETH; // in wei
        uint256 latePayments;
        uint256 membersInvited;
        Tier currentTier;
        bool hasFirstBlood;
        bool hasVeteran;
        bool hasPerfectRecord;
        bool hasCommunityBuilder;
        bool hasWhale;
    }

    // Token ID counter
    uint256 private _tokenIdCounter;

    // Address to token ID mapping
    mapping(address => uint256) public addressToTokenId;

    // Token ID to member stats
    mapping(uint256 => MemberStats) public tokenStats;

    // Authorized updaters (SusuFactory and SusuGroup contracts)
    mapping(address => bool) public authorizedUpdaters;

    // Soulbound toggle
    bool public isSoulbound;

    // Events
    event MembershipMinted(address indexed member, uint256 indexed tokenId, Tier tier);
    event StatsUpdated(uint256 indexed tokenId, uint256 totalContributions, Tier tier);
    event TierUpgraded(uint256 indexed tokenId, Tier oldTier, Tier newTier);
    event AchievementUnlocked(uint256 indexed tokenId, string achievement);

    constructor() ERC721("Susu Membership Certificate", "SUSU-NFT") Ownable(msg.sender) {
        isSoulbound = false; // Can be toggled to make non-transferable
    }

    /**
     * @dev Mint membership NFT for a new member
     */
    function mintMembership(address member) external returns (uint256) {
        require(authorizedUpdaters[msg.sender] || msg.sender == owner(), "Not authorized");
        require(addressToTokenId[member] == 0, "Already has membership");
        require(member != address(0), "Invalid address");

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(member, tokenId);
        addressToTokenId[member] = tokenId;

        // Initialize stats
        tokenStats[tokenId] = MemberStats({
            totalContributions: 0,
            groupsCompleted: 0,
            reputationScore: 50, // Start at neutral
            memberSince: block.timestamp,
            totalContributedETH: 0,
            latePayments: 0,
            membersInvited: 0,
            currentTier: Tier.Bronze,
            hasFirstBlood: false,
            hasVeteran: false,
            hasPerfectRecord: false,
            hasCommunityBuilder: false,
            hasWhale: false
        });

        emit MembershipMinted(member, tokenId, Tier.Bronze);
        return tokenId;
    }

    /**
     * @dev Update member stats after contribution
     */
    function recordContribution(address member, uint256 amountETH, bool wasLate) external {
        require(authorizedUpdaters[msg.sender], "Not authorized");
        uint256 tokenId = addressToTokenId[member];
        require(tokenId != 0, "No membership NFT");

        MemberStats storage stats = tokenStats[tokenId];
        stats.totalContributions++;
        stats.totalContributedETH += amountETH;

        if (wasLate) {
            stats.latePayments++;
        }

        // Check for First Blood achievement
        if (stats.totalContributions == 1 && !stats.hasFirstBlood) {
            stats.hasFirstBlood = true;
            emit AchievementUnlocked(tokenId, "First Blood");
        }

        // Check for Whale achievement (10+ ETH)
        if (stats.totalContributedETH >= 10 ether && !stats.hasWhale) {
            stats.hasWhale = true;
            emit AchievementUnlocked(tokenId, "Whale");
        }

        // Update tier
        Tier oldTier = stats.currentTier;
        Tier newTier = _calculateTier(stats);
        if (newTier != oldTier) {
            stats.currentTier = newTier;
            emit TierUpgraded(tokenId, oldTier, newTier);
        }

        emit StatsUpdated(tokenId, stats.totalContributions, stats.currentTier);
    }

    /**
     * @dev Record group completion
     */
    function recordGroupCompletion(address member) external {
        require(authorizedUpdaters[msg.sender], "Not authorized");
        uint256 tokenId = addressToTokenId[member];
        require(tokenId != 0, "No membership NFT");

        MemberStats storage stats = tokenStats[tokenId];
        stats.groupsCompleted++;

        // Check for Veteran achievement
        if (stats.groupsCompleted >= 10 && !stats.hasVeteran) {
            stats.hasVeteran = true;
            emit AchievementUnlocked(tokenId, "Veteran");
        }

        // Check for Perfect Record
        if (stats.latePayments == 0 && stats.totalContributions >= 10 && !stats.hasPerfectRecord) {
            stats.hasPerfectRecord = true;
            emit AchievementUnlocked(tokenId, "Perfect Record");
        }

        emit StatsUpdated(tokenId, stats.totalContributions, stats.currentTier);
    }

    /**
     * @dev Record member invitation
     */
    function recordInvitation(address inviter) external {
        require(authorizedUpdaters[msg.sender], "Not authorized");
        uint256 tokenId = addressToTokenId[inviter];
        require(tokenId != 0, "No membership NFT");

        MemberStats storage stats = tokenStats[tokenId];
        stats.membersInvited++;

        // Check for Community Builder achievement
        if (stats.membersInvited >= 5 && !stats.hasCommunityBuilder) {
            stats.hasCommunityBuilder = true;
            emit AchievementUnlocked(tokenId, "Community Builder");
        }

        emit StatsUpdated(tokenId, stats.totalContributions, stats.currentTier);
    }

    /**
     * @dev Update reputation score
     */
    function updateReputation(address member, uint256 newScore) external {
        require(authorizedUpdaters[msg.sender] || msg.sender == owner(), "Not authorized");
        uint256 tokenId = addressToTokenId[member];
        require(tokenId != 0, "No membership NFT");

        tokenStats[tokenId].reputationScore = newScore;

        // Recalculate tier
        Tier oldTier = tokenStats[tokenId].currentTier;
        Tier newTier = _calculateTier(tokenStats[tokenId]);
        if (newTier != oldTier) {
            tokenStats[tokenId].currentTier = newTier;
            emit TierUpgraded(tokenId, oldTier, newTier);
        }
    }

    /**
     * @dev Calculate tier based on stats
     */
    function _calculateTier(MemberStats memory stats) internal pure returns (Tier) {
        // Trusted Elder: 200+ contributions + 90+ reputation
        if (stats.totalContributions >= 200 && stats.reputationScore >= 90) {
            return Tier.TrustedElder;
        }

        // Platinum: 100+ contributions + perfect record
        if (stats.totalContributions >= 100 && stats.latePayments == 0) {
            return Tier.Platinum;
        }

        // Gold: 51-100 contributions
        if (stats.totalContributions >= 51) {
            return Tier.Gold;
        }

        // Silver: 11-50 contributions
        if (stats.totalContributions >= 11) {
            return Tier.Silver;
        }

        // Bronze: default
        return Tier.Bronze;
    }

    /**
     * @dev Generate token URI with dynamic metadata
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        MemberStats memory stats = tokenStats[tokenId];
        string memory svg = _generateSVG(tokenId, stats);
        string memory json = _generateMetadata(tokenId, stats, svg);

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    /**
     * @dev Generate SVG image
     */
    function _generateSVG(uint256 tokenId, MemberStats memory stats) internal pure returns (string memory) {
        string memory tierColor = _getTierColor(stats.currentTier);
        string memory tierName = _getTierName(stats.currentTier);

        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">',
                '<defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
                '<stop offset="0%" style="stop-color:', tierColor, ';stop-opacity:1" />',
                '<stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />',
                '</linearGradient></defs>',
                '<rect width="400" height="600" fill="url(#bg)"/>',
                '<text x="200" y="60" font-family="Arial" font-size="24" fill="white" text-anchor="middle" font-weight="bold">SUSU MEMBERSHIP</text>',
                '<text x="200" y="100" font-family="Arial" font-size="18" fill="white" text-anchor="middle">#', tokenId.toString(), '</text>',
                '<rect x="50" y="130" width="300" height="350" rx="10" fill="rgba(255,255,255,0.1)"/>',
                '<text x="200" y="170" font-family="Arial" font-size="32" fill="white" text-anchor="middle" font-weight="bold">', tierName, '</text>',
                '<text x="200" y="220" font-family="Arial" font-size="14" fill="white" text-anchor="middle">Contributions: ', stats.totalContributions.toString(), '</text>',
                '<text x="200" y="250" font-family="Arial" font-size="14" fill="white" text-anchor="middle">Groups Completed: ', stats.groupsCompleted.toString(), '</text>',
                '<text x="200" y="280" font-family="Arial" font-size="14" fill="white" text-anchor="middle">Reputation: ', stats.reputationScore.toString(), '/100</text>',
                '<text x="200" y="310" font-family="Arial" font-size="14" fill="white" text-anchor="middle">Total: ', (stats.totalContributedETH / 1 ether).toString(), ' ETH</text>',
                _generateAchievementBadges(stats),
                '<text x="200" y="560" font-family="Arial" font-size="12" fill="white" text-anchor="middle" opacity="0.8">Member Since Block: ', stats.memberSince.toString(), '</text>',
                '</svg>'
            )
        );
    }

    /**
     * @dev Generate achievement badges in SVG
     */
    function _generateAchievementBadges(MemberStats memory stats) internal pure returns (string memory) {
        string memory badges = '<g id="achievements">';
        uint256 xPos = 70;

        if (stats.hasFirstBlood) {
            badges = string(abi.encodePacked(badges, '<circle cx="', xPos.toString(), '" cy="380" r="20" fill="#ef4444"/><text x="', xPos.toString(), '" y="385" font-size="20" text-anchor="middle">&#127915;</text>'));
            xPos += 60;
        }

        if (stats.hasVeteran) {
            badges = string(abi.encodePacked(badges, '<circle cx="', xPos.toString(), '" cy="380" r="20" fill="#22c55e"/><text x="', xPos.toString(), '" y="385" font-size="20" text-anchor="middle">&#127894;</text>'));
            xPos += 60;
        }

        if (stats.hasPerfectRecord) {
            badges = string(abi.encodePacked(badges, '<circle cx="', xPos.toString(), '" cy="380" r="20" fill="#3b82f6"/><text x="', xPos.toString(), '" y="385" font-size="20" text-anchor="middle">&#11088;</text>'));
            xPos += 60;
        }

        if (stats.hasCommunityBuilder) {
            badges = string(abi.encodePacked(badges, '<circle cx="', xPos.toString(), '" cy="380" r="20" fill="#a855f7"/><text x="', xPos.toString(), '" y="385" font-size="20" text-anchor="middle">&#128101;</text>'));
            xPos += 60;
        }

        if (stats.hasWhale) {
            badges = string(abi.encodePacked(badges, '<circle cx="', xPos.toString(), '" cy="380" r="20" fill="#eab308"/><text x="', xPos.toString(), '" y="385" font-size="20" text-anchor="middle">&#128011;</text>'));
        }

        badges = string(abi.encodePacked(badges, '</g>'));
        return badges;
    }

    /**
     * @dev Generate JSON metadata
     */
    function _generateMetadata(uint256 tokenId, MemberStats memory stats, string memory svg) internal pure returns (string memory) {
        string memory tierName = _getTierName(stats.currentTier);

        return string(
            abi.encodePacked(
                '{"name":"Susu Membership #', tokenId.toString(), '",',
                '"description":"Dynamic NFT membership certificate for Susu group participation on Base",',
                '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '",',
                '"attributes":[',
                '{"trait_type":"Tier","value":"', tierName, '"},',
                '{"trait_type":"Total Contributions","value":', stats.totalContributions.toString(), '},',
                '{"trait_type":"Groups Completed","value":', stats.groupsCompleted.toString(), '},',
                '{"trait_type":"Reputation Score","value":', stats.reputationScore.toString(), '},',
                '{"trait_type":"Total Contributed (ETH)","value":', (stats.totalContributedETH / 1 ether).toString(), '},',
                '{"trait_type":"First Blood","value":"', stats.hasFirstBlood ? "true" : "false", '"},',
                '{"trait_type":"Veteran","value":"', stats.hasVeteran ? "true" : "false", '"},',
                '{"trait_type":"Perfect Record","value":"', stats.hasPerfectRecord ? "true" : "false", '"},',
                '{"trait_type":"Community Builder","value":"', stats.hasCommunityBuilder ? "true" : "false", '"},',
                '{"trait_type":"Whale","value":"', stats.hasWhale ? "true" : "false", '"}',
                ']}'
            )
        );
    }

    /**
     * @dev Get tier color
     */
    function _getTierColor(Tier tier) internal pure returns (string memory) {
        if (tier == Tier.TrustedElder) return "#9333ea"; // Purple
        if (tier == Tier.Platinum) return "#e5e7eb"; // Platinum
        if (tier == Tier.Gold) return "#fbbf24"; // Gold
        if (tier == Tier.Silver) return "#94a3b8"; // Silver
        return "#cd7f32"; // Bronze
    }

    /**
     * @dev Get tier name
     */
    function _getTierName(Tier tier) internal pure returns (string memory) {
        if (tier == Tier.TrustedElder) return "TRUSTED ELDER";
        if (tier == Tier.Platinum) return "PLATINUM";
        if (tier == Tier.Gold) return "GOLD";
        if (tier == Tier.Silver) return "SILVER";
        return "BRONZE";
    }

    /**
     * @dev Add authorized updater
     */
    function addAuthorizedUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = true;
    }

    /**
     * @dev Remove authorized updater
     */
    function removeAuthorizedUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = false;
    }

    /**
     * @dev Toggle soulbound status
     */
    function setSoulbound(bool _isSoulbound) external onlyOwner {
        isSoulbound = _isSoulbound;
    }

    /**
     * @dev Override transfer to implement soulbound
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // Allow minting (from == address(0)) and burning (to == address(0))
        // Block transfers if soulbound
        if (isSoulbound && from != address(0) && to != address(0)) {
            revert("Soulbound: cannot transfer");
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Get member stats by address
     */
    function getMemberStats(address member) external view returns (MemberStats memory) {
        uint256 tokenId = addressToTokenId[member];
        require(tokenId != 0, "No membership NFT");
        return tokenStats[tokenId];
    }

    /**
     * @dev Check if address has membership
     */
    function hasMembership(address member) external view returns (bool) {
        return addressToTokenId[member] != 0;
    }
}
