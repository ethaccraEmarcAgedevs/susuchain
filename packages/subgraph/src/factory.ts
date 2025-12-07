import { SusuGroupCreated } from "../generated/SusuFactory/SusuFactory";
import { SusuGroup as SusuGroupTemplate } from "../generated/templates";
import { Group, PlatformStats, DailyStats } from "../generated/schema";
import { BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { updateDailyStats, updateWeeklyStats, updateMonthlyStats } from "./stats";

export function handleGroupCreated(event: SusuGroupCreated): void {
  // Create new group entity
  let group = new Group(event.params.groupAddress.toHexString());
  group.name = event.params.groupName;
  group.ensName = "";
  group.basename = null;
  group.creator = event.params.creator;
  group.contributionAmount = event.params.contributionAmount;
  group.contributionInterval = event.params.interval;
  group.maxMembers = event.params.maxMembers.toI32();
  group.currentMembers = 0;
  group.currentRound = 0;
  group.isActive = true;
  group.totalValueLocked = BigInt.fromI32(0);
  group.totalContributions = BigInt.fromI32(0);
  group.totalPayouts = BigInt.fromI32(0);
  group.createdAt = event.block.timestamp;
  group.updatedAt = event.block.timestamp;
  group.save();

  // Start indexing this group contract
  SusuGroupTemplate.create(event.params.groupAddress);

  // Update platform stats
  let stats = PlatformStats.load("platform-stats");
  if (stats == null) {
    stats = new PlatformStats("platform-stats");
    stats.totalGroups = 0;
    stats.activeGroups = 0;
    stats.completedGroups = 0;
    stats.totalMembers = 0;
    stats.totalValueLocked = BigInt.fromI32(0);
    stats.totalContributions = BigInt.fromI32(0);
    stats.totalPayouts = BigInt.fromI32(0);
    stats.averageGroupSize = BigDecimal.fromString("0");
    stats.averageContributionAmount = BigInt.fromI32(0);
  }
  stats.totalGroups = stats.totalGroups + 1;
  stats.activeGroups = stats.activeGroups + 1;
  stats.updatedAt = event.block.timestamp;
  stats.save();

  // Update daily stats
  updateDailyStats(event.block.timestamp, "groupCreated", BigInt.fromI32(0));
  updateWeeklyStats(event.block.timestamp, "groupCreated", BigInt.fromI32(0));
  updateMonthlyStats(event.block.timestamp, "groupCreated", BigInt.fromI32(0));
}
