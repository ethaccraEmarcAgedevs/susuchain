import { formatEther } from "viem";
import { GroupAnalytics, MemberAnalytics, RoundData } from "~~/hooks/scaffold-eth/useGroupAnalytics";
import { PlatformStats, DailyStats } from "~~/hooks/scaffold-eth/usePlatformAnalytics";

/**
 * Export group analytics to CSV format
 */
export function exportGroupAnalyticsToCSV(groupAnalytics: GroupAnalytics): string {
  const headers = [
    "Group Name",
    "ENS Name",
    "Creator",
    "Contribution Amount (ETH)",
    "Max Members",
    "Current Members",
    "Current Round",
    "Total Value Locked (ETH)",
    "Total Contributions (ETH)",
    "Total Payouts (ETH)",
    "Active Status",
  ];

  const row = [
    groupAnalytics.name,
    groupAnalytics.ensName,
    groupAnalytics.creator,
    formatEther(groupAnalytics.contributionAmount),
    groupAnalytics.maxMembers.toString(),
    groupAnalytics.currentMembers.toString(),
    groupAnalytics.currentRound.toString(),
    formatEther(groupAnalytics.totalValueLocked),
    formatEther(groupAnalytics.totalContributions),
    formatEther(groupAnalytics.totalPayouts),
    groupAnalytics.isActive ? "Active" : "Inactive",
  ];

  return [headers.join(","), row.join(",")].join("\n");
}

/**
 * Export group members to CSV format
 */
export function exportMembersToCSV(members: MemberAnalytics[]): string {
  const headers = [
    "Address",
    "ENS Name",
    "Joined At",
    "Active Status",
    "Total Contributions (ETH)",
    "Total Payouts (ETH)",
    "Contribution Count",
    "Missed Contributions",
    "Reliability Score (%)",
  ];

  const rows = members.map(member => [
    member.address,
    member.ensName,
    new Date(Number(member.joinedAt) * 1000).toLocaleDateString(),
    member.isActive ? "Active" : "Inactive",
    formatEther(member.totalContributions),
    formatEther(member.totalPayoutsReceived),
    member.contributionCount.toString(),
    member.missedContributions.toString(),
    member.reliabilityScore.toFixed(2),
  ]);

  return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
}

/**
 * Export round history to CSV format
 */
export function exportRoundHistoryToCSV(rounds: RoundData[]): string {
  const headers = [
    "Round Number",
    "Beneficiary",
    "Start Time",
    "End Time",
    "Expected Contributions",
    "Actual Contributions",
    "Total Amount (ETH)",
    "Completion Status",
  ];

  const rows = rounds.map(round => [
    round.roundNumber.toString(),
    round.beneficiary,
    new Date(Number(round.startTime) * 1000).toLocaleString(),
    round.endTime ? new Date(Number(round.endTime) * 1000).toLocaleString() : "In Progress",
    round.expectedContributions.toString(),
    round.actualContributions.toString(),
    formatEther(round.totalAmount),
    round.isCompleted ? "Completed" : "In Progress",
  ]);

  return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
}

/**
 * Export platform stats to CSV format
 */
export function exportPlatformStatsToCSV(stats: PlatformStats): string {
  const headers = [
    "Total Groups",
    "Active Groups",
    "Completed Groups",
    "Total Members",
    "Total Value Locked (ETH)",
    "Total Contributions (ETH)",
    "Total Payouts (ETH)",
    "Average Group Size",
    "Average Contribution (ETH)",
  ];

  const row = [
    stats.totalGroups.toString(),
    stats.activeGroups.toString(),
    stats.completedGroups.toString(),
    stats.totalMembers.toString(),
    formatEther(stats.totalValueLocked),
    formatEther(stats.totalContributions),
    formatEther(stats.totalPayouts),
    stats.averageGroupSize.toFixed(2),
    formatEther(stats.averageContributionAmount),
  ];

  return [headers.join(","), row.join(",")].join("\n");
}

/**
 * Export daily stats to CSV format
 */
export function exportDailyStatsToCSV(dailyStats: DailyStats[]): string {
  const headers = [
    "Date",
    "Groups Created",
    "Members Joined",
    "Contributions Made",
    "Contribution Volume (ETH)",
    "Payouts Completed",
    "Payout Volume (ETH)",
    "Active Groups",
    "Total Value Locked (ETH)",
  ];

  const rows = dailyStats.map(stat => [
    new Date(Number(stat.timestamp) * 1000).toLocaleDateString(),
    stat.groupsCreated.toString(),
    stat.membersJoined.toString(),
    stat.contributionsMade.toString(),
    formatEther(stat.contributionVolume),
    stat.payoutsCompleted.toString(),
    formatEther(stat.payoutVolume),
    stat.activeGroups.toString(),
    formatEther(stat.totalValueLocked),
  ]);

  return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
}

/**
 * Export group analytics to JSON format
 */
export function exportGroupAnalyticsToJSON(groupAnalytics: GroupAnalytics): string {
  const data = {
    ...groupAnalytics,
    contributionAmount: formatEther(groupAnalytics.contributionAmount),
    totalValueLocked: formatEther(groupAnalytics.totalValueLocked),
    totalContributions: formatEther(groupAnalytics.totalContributions),
    totalPayouts: formatEther(groupAnalytics.totalPayouts),
    members: groupAnalytics.members.map(m => ({
      ...m,
      totalContributions: formatEther(m.totalContributions),
      totalPayoutsReceived: formatEther(m.totalPayoutsReceived),
    })),
    roundHistory: groupAnalytics.roundHistory.map(r => ({
      ...r,
      totalAmount: formatEther(r.totalAmount),
    })),
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download JSON file
 */
export function downloadJSON(jsonContent: string, filename: string): void {
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
