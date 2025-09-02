// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SusuToken is ERC20, ERC20Permit, Ownable {
    uint256 public constant MAX_SUPPLY = 1000000000 * 10 ** 18; // 1 billion tokens

    // Reward rates (tokens per wei contributed)
    uint256 public rewardRate = 1000; // 1000 tokens per 1 ETH contributed

    // Contracts that can mint tokens (SusuGroup contracts)
    mapping(address => bool) public authorizedMinters;

    // Member participation tracking
    mapping(address => uint256) public contributionRewards;
    mapping(address => uint256) public participationScore;

    event RewardDistributed(address indexed member, uint256 amount, uint256 contribution);
    event MinterAuthorized(address indexed minter);
    event MinterRevoked(address indexed minter);
    event RewardRateUpdated(uint256 newRate);

    modifier onlyAuthorizedMinter() {
        require(authorizedMinters[msg.sender], "Not authorized to mint");
        _;
    }

    constructor(address _owner) ERC20("SusuChain Token", "SUSU") ERC20Permit("SusuChain Token") Ownable(_owner) {
        // Initial mint for testing and community rewards
        _mint(_owner, 10000000 * 10 ** 18); // 10 million tokens
    }

    function mint(address to, uint256 amount) external onlyAuthorizedMinter {
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");
        _mint(to, amount);
    }

    function rewardContribution(address member, uint256 contributionAmount) external onlyAuthorizedMinter {
        uint256 rewardAmount = (contributionAmount * rewardRate) / 10 ** 18;

        if (totalSupply() + rewardAmount <= MAX_SUPPLY) {
            _mint(member, rewardAmount);
            contributionRewards[member] += rewardAmount;
            participationScore[member] += 1;

            emit RewardDistributed(member, rewardAmount, contributionAmount);
        }
    }

    function authorizeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
        emit MinterAuthorized(minter);
    }

    function revokeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRevoked(minter);
    }

    function setRewardRate(uint256 _newRate) external onlyOwner {
        require(_newRate > 0, "Reward rate must be positive");
        rewardRate = _newRate;
        emit RewardRateUpdated(_newRate);
    }

    function getMemberStats(
        address member
    ) external view returns (uint256 balance, uint256 totalRewards, uint256 participationCount) {
        return (balanceOf(member), contributionRewards[member], participationScore[member]);
    }

    // Governance functions (for future DAO implementation)
    function delegate(address delegatee) external {
        // Future implementation for governance delegation
    }

    function getVotes(address account) external view returns (uint256) {
        return balanceOf(account);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) external {
        uint256 currentAllowance = allowance(account, msg.sender);
        require(currentAllowance >= amount, "ERC20: burn amount exceeds allowance");

        _approve(account, msg.sender, currentAllowance - amount);
        _burn(account, amount);
    }
}
