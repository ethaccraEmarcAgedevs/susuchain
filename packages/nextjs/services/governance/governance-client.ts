import { Address } from "viem";

/**
 * Governance utilities for SusuChain DAO
 */

export enum ProposalState {
  Pending = 0,
  Active = 1,
  Canceled = 2,
  Defeated = 3,
  Succeeded = 4,
  Queued = 5,
  Expired = 6,
  Executed = 7,
}

export enum VoteType {
  Against = 0,
  For = 1,
  Abstain = 2,
}

export interface Proposal {
  id: string;
  proposer: Address;
  targets: Address[];
  values: bigint[];
  calldatas: string[];
  description: string;
  state: ProposalState;
  startBlock: bigint;
  endBlock: bigint;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  createdAt: number;
  executedAt?: number;
}

export interface Vote {
  proposalId: string;
  voter: Address;
  support: VoteType;
  weight: bigint;
  reason?: string;
  timestamp: number;
}

export interface DelegateInfo {
  delegator: Address;
  delegatee: Address;
  votes: bigint;
  timestamp: number;
}

/**
 * Get proposal state name
 */
export function getProposalStateName(state: ProposalState): string {
  const names = {
    [ProposalState.Pending]: "Pending",
    [ProposalState.Active]: "Active",
    [ProposalState.Canceled]: "Canceled",
    [ProposalState.Defeated]: "Defeated",
    [ProposalState.Succeeded]: "Succeeded",
    [ProposalState.Queued]: "Queued",
    [ProposalState.Expired]: "Expired",
    [ProposalState.Executed]: "Executed",
  };
  return names[state] || "Unknown";
}

/**
 * Get proposal state color
 */
export function getProposalStateColor(state: ProposalState): string {
  const colors = {
    [ProposalState.Pending]: "bg-gray-100 text-gray-700",
    [ProposalState.Active]: "bg-blue-100 text-blue-700",
    [ProposalState.Canceled]: "bg-red-100 text-red-700",
    [ProposalState.Defeated]: "bg-red-100 text-red-700",
    [ProposalState.Succeeded]: "bg-green-100 text-green-700",
    [ProposalState.Queued]: "bg-yellow-100 text-yellow-700",
    [ProposalState.Expired]: "bg-gray-100 text-gray-700",
    [ProposalState.Executed]: "bg-purple-100 text-purple-700",
  };
  return colors[state] || "bg-gray-100 text-gray-700";
}

/**
 * Get vote type name
 */
export function getVoteTypeName(voteType: VoteType): string {
  const names = {
    [VoteType.Against]: "Against",
    [VoteType.For]: "For",
    [VoteType.Abstain]: "Abstain",
  };
  return names[voteType] || "Unknown";
}

/**
 * Get vote type color
 */
export function getVoteTypeColor(voteType: VoteType): string {
  const colors = {
    [VoteType.Against]: "text-red-600",
    [VoteType.For]: "text-green-600",
    [VoteType.Abstain]: "text-gray-600",
  };
  return colors[voteType] || "text-gray-600";
}

/**
 * Calculate voting power percentage
 */
export function calculateVotingPowerPercent(votes: bigint, totalSupply: bigint): number {
  if (totalSupply === BigInt(0)) return 0;
  return (Number(votes) / Number(totalSupply)) * 100;
}

/**
 * Calculate quorum progress
 */
export function calculateQuorumProgress(totalVotes: bigint, requiredQuorum: bigint): number {
  if (requiredQuorum === BigInt(0)) return 0;
  return (Number(totalVotes) / Number(requiredQuorum)) * 100;
}

/**
 * Check if proposal can be queued
 */
export function canQueueProposal(state: ProposalState): boolean {
  return state === ProposalState.Succeeded;
}

/**
 * Check if proposal can be executed
 */
export function canExecuteProposal(state: ProposalState): boolean {
  return state === ProposalState.Queued;
}

/**
 * Check if can vote on proposal
 */
export function canVoteOnProposal(state: ProposalState): boolean {
  return state === ProposalState.Active;
}

/**
 * Format proposal description
 */
export function formatProposalDescription(description: string): {
  title: string;
  summary: string;
  details: string;
} {
  // Description format: "# Title\n\nSummary\n\n## Details\n\nDetails text"
  const lines = description.split("\n");

  let title = "Untitled Proposal";
  let summary = "";
  let details = "";

  let currentSection = "title";

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("# ")) {
      title = trimmed.substring(2);
      currentSection = "summary";
    } else if (trimmed.startsWith("## ")) {
      currentSection = "details";
    } else if (trimmed) {
      if (currentSection === "summary") {
        summary += trimmed + " ";
      } else if (currentSection === "details") {
        details += trimmed + " ";
      }
    }
  }

  return {
    title: title.trim(),
    summary: summary.trim(),
    details: details.trim(),
  };
}

/**
 * Encode proposal calldata
 */
export function encodeProposalCalldata(
  functionSignature: string,
  args: any[],
): string {
  // Simple encoding - in production use proper ABI encoder
  // This is a placeholder
  return "0x";
}

/**
 * Calculate time remaining for voting
 */
export function calculateTimeRemaining(
  endBlock: bigint,
  currentBlock: bigint,
  secondsPerBlock: number = 2,
): {
  blocks: bigint;
  seconds: number;
  formatted: string;
} {
  const blocksRemaining = endBlock > currentBlock ? endBlock - currentBlock : BigInt(0);
  const secondsRemaining = Number(blocksRemaining) * secondsPerBlock;

  const days = Math.floor(secondsRemaining / 86400);
  const hours = Math.floor((secondsRemaining % 86400) / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);

  let formatted = "";
  if (days > 0) formatted += `${days}d `;
  if (hours > 0) formatted += `${hours}h `;
  if (minutes > 0) formatted += `${minutes}m`;

  return {
    blocks: blocksRemaining,
    seconds: secondsRemaining,
    formatted: formatted.trim() || "Ended",
  };
}

/**
 * Format token amount for display
 */
export function formatVotes(votes: bigint): string {
  const amount = Number(votes) / 1e18;

  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(2)}K`;
  } else {
    return amount.toFixed(2);
  }
}

/**
 * Check if address has enough tokens to propose
 */
export function canCreateProposal(balance: bigint, threshold: bigint): boolean {
  return balance >= threshold;
}

/**
 * Get governance action types
 */
export const GOVERNANCE_ACTIONS = {
  SET_PLATFORM_FEE: "Set Platform Fee",
  SET_GROUP_LIMITS: "Set Group Size Limits",
  SET_CONTRIBUTION_LIMITS: "Set Contribution Limits",
  SET_COLLATERAL_TIERS: "Set Collateral Tiers",
  SET_TREASURY_ALLOCATIONS: "Set Treasury Allocations",
  SET_EMERGENCY_PAUSE: "Emergency Pause",
  TRANSFER_OWNERSHIP: "Transfer Contract Ownership",
  UPGRADE_CONTRACT: "Upgrade Contract",
} as const;

/**
 * Example proposal templates
 */
export const PROPOSAL_TEMPLATES = {
  REDUCE_FEE: {
    title: "Reduce Platform Fee to 0.3%",
    summary: "Lower the platform fee from 0.5% to 0.3% to increase competitiveness",
    action: GOVERNANCE_ACTIONS.SET_PLATFORM_FEE,
    params: { newFeeRate: 30 }, // 0.3% in basis points
  },
  INCREASE_GROUP_SIZE: {
    title: "Increase Maximum Group Size to 50",
    summary: "Allow larger groups to form for bigger savings pools",
    action: GOVERNANCE_ACTIONS.SET_GROUP_LIMITS,
    params: { minSize: 2, maxSize: 50 },
  },
};
