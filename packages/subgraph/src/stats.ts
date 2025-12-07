import { BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { DailyStats, WeeklyStats, MonthlyStats } from "../generated/schema";

const SECONDS_PER_DAY = 86400;
const SECONDS_PER_WEEK = 604800;

export function getDayId(timestamp: BigInt): string {
  let dayTimestamp = timestamp.toI32() / SECONDS_PER_DAY;
  return "day-" + dayTimestamp.toString();
}

export function getWeekId(timestamp: BigInt): string {
  let weekTimestamp = timestamp.toI32() / SECONDS_PER_WEEK;
  return "week-" + weekTimestamp.toString();
}

export function getMonthId(timestamp: BigInt): string {
  // Simple month calculation (approximate)
  let monthTimestamp = timestamp.toI32() / (SECONDS_PER_DAY * 30);
  return "month-" + monthTimestamp.toString();
}

export function updateDailyStats(timestamp: BigInt, eventType: string, amount: BigInt): void {
  let dayId = getDayId(timestamp);
  let stats = DailyStats.load(dayId);

  if (stats == null) {
    stats = new DailyStats(dayId);
    stats.date = dayId;
    stats.timestamp = timestamp;
    stats.groupsCreated = 0;
    stats.membersJoined = 0;
    stats.contributionsMade = 0;
    stats.contributionVolume = BigInt.fromI32(0);
    stats.payoutsCompleted = 0;
    stats.payoutVolume = BigInt.fromI32(0);
    stats.activeGroups = 0;
    stats.totalValueLocked = BigInt.fromI32(0);
  }

  if (eventType == "groupCreated") {
    stats.groupsCreated = stats.groupsCreated + 1;
    stats.activeGroups = stats.activeGroups + 1;
  } else if (eventType == "memberJoined") {
    stats.membersJoined = stats.membersJoined + 1;
  } else if (eventType == "contribution") {
    stats.contributionsMade = stats.contributionsMade + 1;
    stats.contributionVolume = stats.contributionVolume.plus(amount);
    stats.totalValueLocked = stats.totalValueLocked.plus(amount);
  } else if (eventType == "payout") {
    stats.payoutsCompleted = stats.payoutsCompleted + 1;
    stats.payoutVolume = stats.payoutVolume.plus(amount);
    stats.totalValueLocked = stats.totalValueLocked.minus(amount);
  }

  stats.save();
}

export function updateWeeklyStats(timestamp: BigInt, eventType: string, amount: BigInt): void {
  let weekId = getWeekId(timestamp);
  let stats = WeeklyStats.load(weekId);

  if (stats == null) {
    stats = new WeeklyStats(weekId);
    stats.week = weekId;
    stats.startTimestamp = timestamp;
    stats.endTimestamp = timestamp.plus(BigInt.fromI32(SECONDS_PER_WEEK));
    stats.groupsCreated = 0;
    stats.membersJoined = 0;
    stats.contributionsMade = 0;
    stats.contributionVolume = BigInt.fromI32(0);
    stats.payoutsCompleted = 0;
    stats.payoutVolume = BigInt.fromI32(0);
    stats.averageGroupSize = BigDecimal.fromString("0");
    stats.memberRetention = BigDecimal.fromString("100");
  }

  if (eventType == "groupCreated") {
    stats.groupsCreated = stats.groupsCreated + 1;
  } else if (eventType == "memberJoined") {
    stats.membersJoined = stats.membersJoined + 1;
  } else if (eventType == "contribution") {
    stats.contributionsMade = stats.contributionsMade + 1;
    stats.contributionVolume = stats.contributionVolume.plus(amount);
  } else if (eventType == "payout") {
    stats.payoutsCompleted = stats.payoutsCompleted + 1;
    stats.payoutVolume = stats.payoutVolume.plus(amount);
  }

  stats.save();
}

export function updateMonthlyStats(timestamp: BigInt, eventType: string, amount: BigInt): void {
  let monthId = getMonthId(timestamp);
  let stats = MonthlyStats.load(monthId);

  if (stats == null) {
    stats = new MonthlyStats(monthId);
    stats.month = monthId;
    stats.startTimestamp = timestamp;
    stats.endTimestamp = timestamp.plus(BigInt.fromI32(SECONDS_PER_DAY * 30));
    stats.groupsCreated = 0;
    stats.membersJoined = 0;
    stats.contributionsMade = 0;
    stats.contributionVolume = BigInt.fromI32(0);
    stats.payoutsCompleted = 0;
    stats.payoutVolume = BigInt.fromI32(0);
    stats.growthRate = BigDecimal.fromString("0");
  }

  if (eventType == "groupCreated") {
    stats.groupsCreated = stats.groupsCreated + 1;
  } else if (eventType == "memberJoined") {
    stats.membersJoined = stats.membersJoined + 1;
  } else if (eventType == "contribution") {
    stats.contributionsMade = stats.contributionsMade + 1;
    stats.contributionVolume = stats.contributionVolume.plus(amount);
  } else if (eventType == "payout") {
    stats.payoutsCompleted = stats.payoutsCompleted + 1;
    stats.payoutVolume = stats.payoutVolume.plus(amount);
  }

  stats.save();
}

export function calculateReliabilityScore(
  contributionCount: i32,
  missedContributions: i32
): BigDecimal {
  if (contributionCount + missedContributions == 0) {
    return BigDecimal.fromString("100");
  }

  let totalExpected = contributionCount + missedContributions;
  let score = (contributionCount * 100) / totalExpected;
  return BigDecimal.fromString(score.toString());
}
