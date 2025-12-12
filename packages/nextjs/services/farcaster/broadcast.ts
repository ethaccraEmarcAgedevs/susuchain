import { publishCast } from "./casts";
import {
  createGroupInvitationCast,
  createMilestoneCast,
  createPayoutAnnouncementCast,
  createContributionReminderCast,
} from "./casts";
import { createGroupJoinFrame, createPayoutFrame, createMilestoneFrame } from "./frames";

export interface BroadcastConfig {
  signerUuid: string;
  autoPublish: boolean;
  channelId?: string;
}

export interface GroupEvent {
  type: "created" | "joined" | "contribution" | "payout" | "completed" | "reminder";
  groupAddress: string;
  groupName: string;
  data?: any;
}

/**
 * Broadcast group creation to Farcaster
 */
export const broadcastGroupCreation = async (
  config: BroadcastConfig,
  groupAddress: string,
  groupName: string,
  contributionAmount: string,
  asset: string,
): Promise<boolean> => {
  if (!config.autoPublish) return false;

  try {
    const castContent = createMilestoneCast(groupAddress, groupName, "created");

    const publishedCast = await publishCast(config.signerUuid, castContent);

    return publishedCast !== null;
  } catch (error) {
    console.error("Error broadcasting group creation:", error);
    return false;
  }
};

/**
 * Broadcast first contribution milestone
 */
export const broadcastFirstContribution = async (
  config: BroadcastConfig,
  groupAddress: string,
  groupName: string,
  membersCount: number,
): Promise<boolean> => {
  if (!config.autoPublish) return false;

  try {
    const castContent = createMilestoneCast(groupAddress, groupName, "first_contribution", {
      membersCount,
    });

    const publishedCast = await publishCast(config.signerUuid, castContent);

    return publishedCast !== null;
  } catch (error) {
    console.error("Error broadcasting first contribution:", error);
    return false;
  }
};

/**
 * Broadcast payout event
 */
export const broadcastPayout = async (
  config: BroadcastConfig,
  groupAddress: string,
  groupName: string,
  recipientUsername: string,
  amount: string,
  asset: string,
  totalContributed: string,
): Promise<boolean> => {
  if (!config.autoPublish) return false;

  try {
    const castContent = createPayoutAnnouncementCast(groupName, recipientUsername, amount, asset);

    // Add Frame metadata for interactive payout announcement
    const frameData = {
      groupAddress,
      groupName,
      contributionAmount: amount,
      asset,
      membersCount: 0, // Will be populated from contract
      totalContributed,
      nextPayoutRecipient: recipientUsername,
    };

    const publishedCast = await publishCast(config.signerUuid, castContent);

    return publishedCast !== null;
  } catch (error) {
    console.error("Error broadcasting payout:", error);
    return false;
  }
};

/**
 * Broadcast group completion milestone
 */
export const broadcastGroupCompletion = async (
  config: BroadcastConfig,
  groupAddress: string,
  groupName: string,
  totalContributed: string,
  cyclesCompleted: number,
): Promise<boolean> => {
  if (!config.autoPublish) return false;

  try {
    const castContent = createMilestoneCast(groupAddress, groupName, "completed", {
      totalContributed,
      cyclesCompleted,
    });

    const publishedCast = await publishCast(config.signerUuid, castContent);

    return publishedCast !== null;
  } catch (error) {
    console.error("Error broadcasting group completion:", error);
    return false;
  }
};

/**
 * Send contribution reminder via cast
 */
export const sendContributionReminder = async (
  config: BroadcastConfig,
  groupName: string,
  memberUsername: string,
  dueDate: Date,
): Promise<boolean> => {
  if (!config.autoPublish) return false;

  try {
    const castContent = createContributionReminderCast(groupName, memberUsername, dueDate);

    const publishedCast = await publishCast(config.signerUuid, castContent);

    return publishedCast !== null;
  } catch (error) {
    console.error("Error sending contribution reminder:", error);
    return false;
  }
};

/**
 * Broadcast group invitation
 */
export const broadcastGroupInvitation = async (
  config: BroadcastConfig,
  groupName: string,
  groupAddress: string,
  contributionAmount: string,
  asset: string,
  inviterUsername: string,
): Promise<boolean> => {
  if (!config.autoPublish) return false;

  try {
    const castContent = createGroupInvitationCast(
      groupName,
      groupAddress,
      contributionAmount,
      asset,
      inviterUsername,
    );

    const publishedCast = await publishCast(config.signerUuid, castContent);

    return publishedCast !== null;
  } catch (error) {
    console.error("Error broadcasting group invitation:", error);
    return false;
  }
};

/**
 * Handle group event and broadcast if configured
 */
export const handleGroupEvent = async (config: BroadcastConfig, event: GroupEvent): Promise<boolean> => {
  switch (event.type) {
    case "created":
      return await broadcastGroupCreation(
        config,
        event.groupAddress,
        event.groupName,
        event.data.contributionAmount,
        event.data.asset,
      );

    case "contribution":
      if (event.data.isFirst) {
        return await broadcastFirstContribution(
          config,
          event.groupAddress,
          event.groupName,
          event.data.membersCount,
        );
      }
      return true;

    case "payout":
      return await broadcastPayout(
        config,
        event.groupAddress,
        event.groupName,
        event.data.recipientUsername,
        event.data.amount,
        event.data.asset,
        event.data.totalContributed,
      );

    case "completed":
      return await broadcastGroupCompletion(
        config,
        event.groupAddress,
        event.groupName,
        event.data.totalContributed,
        event.data.cyclesCompleted,
      );

    case "reminder":
      return await sendContributionReminder(
        config,
        event.groupName,
        event.data.memberUsername,
        event.data.dueDate,
      );

    default:
      return false;
  }
};

/**
 * Schedule automated broadcasts for group milestones
 */
export const scheduleGroupBroadcasts = async (
  groupAddress: string,
  groupName: string,
  milestones: string[],
): Promise<void> => {
  // This would integrate with a job scheduler (e.g., cron, bull queue)
  // For now, this is a placeholder for the scheduling logic

  console.log(`Scheduled broadcasts for group ${groupName}:`, milestones);

  // Example: Schedule weekly activity summaries
  // Example: Schedule contribution reminders before due dates
  // Example: Schedule celebration casts for completed cycles
};

/**
 * Get broadcast analytics for a group
 */
export const getBroadcastAnalytics = async (groupAddress: string): Promise<{
  totalCasts: number;
  totalLikes: number;
  totalRecasts: number;
  totalReplies: number;
  reachEstimate: number;
}> => {
  // This would query Farcaster API for cast analytics
  // Placeholder implementation

  return {
    totalCasts: 0,
    totalLikes: 0,
    totalRecasts: 0,
    totalReplies: 0,
    reachEstimate: 0,
  };
};

/**
 * Enable/disable auto-broadcasting for a group
 */
export const toggleAutoBroadcast = async (
  groupAddress: string,
  enabled: boolean,
): Promise<boolean> => {
  // This would update group settings in database
  // Placeholder implementation

  console.log(`Auto-broadcast ${enabled ? "enabled" : "disabled"} for group ${groupAddress}`);
  return true;
};
