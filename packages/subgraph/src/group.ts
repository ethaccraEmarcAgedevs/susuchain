import {
  MemberJoined,
  ContributionMade,
  PayoutCompleted,
  RoundAdvanced,
} from "../generated/templates/SusuGroup/SusuGroup";
import { Group, Member, Contribution, Payout, Round, PlatformStats } from "../generated/schema";
import { BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";
import { updateDailyStats, updateWeeklyStats, calculateReliabilityScore } from "./stats";

export function handleMemberJoined(event: MemberJoined): void {
  let groupId = event.address.toHexString();
  let memberId = groupId + "-" + event.params.member.toHexString();

  // Create member entity
  let member = new Member(memberId);
  member.group = groupId;
  member.address = event.params.member;
  member.ensName = event.params.ensName;
  member.basename = null;
  member.efpProfile = event.params.efpProfile;
  member.joinedAt = event.block.timestamp;
  member.isActive = true;
  member.totalContributions = BigInt.fromI32(0);
  member.totalPayoutsReceived = BigInt.fromI32(0);
  member.contributionCount = 0;
  member.missedContributions = 0;
  member.reliabilityScore = BigDecimal.fromString("100");
  member.save();

  // Update group
  let group = Group.load(groupId);
  if (group != null) {
    group.currentMembers = group.currentMembers + 1;
    group.updatedAt = event.block.timestamp;
    group.save();
  }

  // Update platform stats
  let stats = PlatformStats.load("platform-stats");
  if (stats != null) {
    stats.totalMembers = stats.totalMembers + 1;
    stats.updatedAt = event.block.timestamp;
    stats.save();
  }

  // Update daily stats
  updateDailyStats(event.block.timestamp, "memberJoined", BigInt.fromI32(0));
  updateWeeklyStats(event.block.timestamp, "memberJoined", BigInt.fromI32(0));
}

export function handleContributionMade(event: ContributionMade): void {
  let groupId = event.address.toHexString();
  let memberId = groupId + "-" + event.params.member.toHexString();
  let contributionId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();

  // Create contribution entity
  let contribution = new Contribution(contributionId);
  contribution.group = groupId;
  contribution.member = memberId;
  contribution.amount = event.params.amount;
  contribution.timestamp = event.block.timestamp;
  contribution.transactionHash = event.transaction.hash;
  contribution.isOnTime = true; // Could be calculated based on round timing

  // Link to current round
  let roundId = groupId + "-" + event.params.round.toString();
  let round = Round.load(roundId);
  if (round == null) {
    round = new Round(roundId);
    round.group = groupId;
    round.roundNumber = event.params.round.toI32();
    round.beneficiary = Address.zero();
    round.startTime = event.block.timestamp;
    round.endTime = null;
    round.expectedContributions = 0;
    round.actualContributions = 0;
    round.totalAmount = BigInt.fromI32(0);
    round.isCompleted = false;
  }
  round.actualContributions = round.actualContributions + 1;
  round.totalAmount = round.totalAmount.plus(event.params.amount);
  round.save();

  contribution.round = roundId;
  contribution.save();

  // Update member
  let member = Member.load(memberId);
  if (member != null) {
    member.totalContributions = member.totalContributions.plus(event.params.amount);
    member.contributionCount = member.contributionCount + 1;
    member.reliabilityScore = calculateReliabilityScore(
      member.contributionCount,
      member.missedContributions
    );
    member.save();
  }

  // Update group
  let group = Group.load(groupId);
  if (group != null) {
    group.totalContributions = group.totalContributions.plus(event.params.amount);
    group.totalValueLocked = group.totalValueLocked.plus(event.params.amount);
    group.updatedAt = event.block.timestamp;
    group.save();
  }

  // Update platform stats
  let stats = PlatformStats.load("platform-stats");
  if (stats != null) {
    stats.totalContributions = stats.totalContributions.plus(event.params.amount);
    stats.totalValueLocked = stats.totalValueLocked.plus(event.params.amount);
    stats.updatedAt = event.block.timestamp;
    stats.save();
  }

  // Update daily stats
  updateDailyStats(event.block.timestamp, "contribution", event.params.amount);
  updateWeeklyStats(event.block.timestamp, "contribution", event.params.amount);
}

export function handlePayoutCompleted(event: PayoutCompleted): void {
  let groupId = event.address.toHexString();
  let memberId = groupId + "-" + event.params.beneficiary.toHexString();
  let payoutId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let roundId = groupId + "-" + event.params.round.toString();

  // Create payout entity
  let payout = new Payout(payoutId);
  payout.group = groupId;
  payout.beneficiary = memberId;
  payout.round = roundId;
  payout.amount = event.params.amount;
  payout.timestamp = event.block.timestamp;
  payout.transactionHash = event.transaction.hash;
  payout.save();

  // Update member
  let member = Member.load(memberId);
  if (member != null) {
    member.totalPayoutsReceived = member.totalPayoutsReceived.plus(event.params.amount);
    member.save();
  }

  // Update group
  let group = Group.load(groupId);
  if (group != null) {
    group.totalPayouts = group.totalPayouts.plus(event.params.amount);
    group.totalValueLocked = group.totalValueLocked.minus(event.params.amount);
    group.updatedAt = event.block.timestamp;
    group.save();
  }

  // Update round
  let round = Round.load(roundId);
  if (round != null) {
    round.endTime = event.block.timestamp;
    round.isCompleted = true;
    round.save();
  }

  // Update platform stats
  let stats = PlatformStats.load("platform-stats");
  if (stats != null) {
    stats.totalPayouts = stats.totalPayouts.plus(event.params.amount);
    stats.totalValueLocked = stats.totalValueLocked.minus(event.params.amount);
    stats.updatedAt = event.block.timestamp;
    stats.save();
  }

  // Update daily stats
  updateDailyStats(event.block.timestamp, "payout", event.params.amount);
  updateWeeklyStats(event.block.timestamp, "payout", event.params.amount);
}

export function handleRoundAdvanced(event: RoundAdvanced): void {
  let groupId = event.address.toHexString();
  let roundId = groupId + "-" + event.params.newRound.toString();

  // Update group round
  let group = Group.load(groupId);
  if (group != null) {
    group.currentRound = event.params.newRound.toI32();
    group.updatedAt = event.block.timestamp;
    group.save();
  }

  // Create new round entity
  let round = Round.load(roundId);
  if (round == null) {
    round = new Round(roundId);
    round.group = groupId;
    round.roundNumber = event.params.newRound.toI32();
    round.beneficiary = event.params.beneficiary;
    round.startTime = event.block.timestamp;
    round.endTime = null;
    round.expectedContributions = group != null ? group.currentMembers : 0;
    round.actualContributions = 0;
    round.totalAmount = BigInt.fromI32(0);
    round.isCompleted = false;
    round.save();
  }
}
