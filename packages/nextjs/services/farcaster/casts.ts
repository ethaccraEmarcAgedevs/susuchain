export interface CastContent {
  text: string;
  embeds?: {
    url?: string;
    castId?: {
      fid: number;
      hash: string;
    };
  }[];
  channelId?: string;
}

export interface PublishedCast {
  hash: string;
  authorFid: number;
  text: string;
  timestamp: number;
  url: string;
}

/**
 * Publish a cast to Farcaster
 */
export const publishCast = async (
  signerUuid: string,
  content: CastContent,
): Promise<PublishedCast | null> => {
  try {
    const response = await fetch("https://api.neynar.com/v2/farcaster/cast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "",
      },
      body: JSON.stringify({
        signer_uuid: signerUuid,
        text: content.text,
        embeds: content.embeds || [],
        channel_id: content.channelId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to publish cast");
    }

    const data = await response.json();
    const cast = data.cast;

    return {
      hash: cast.hash,
      authorFid: cast.author.fid,
      text: cast.text,
      timestamp: new Date(cast.timestamp).getTime(),
      url: `https://warpcast.com/${cast.author.username}/${cast.hash.slice(0, 10)}`,
    };
  } catch (error) {
    console.error("Error publishing cast:", error);
    return null;
  }
};

/**
 * Create shareable group invitation cast
 */
export const createGroupInvitationCast = (
  groupName: string,
  groupAddress: string,
  contributionAmount: string,
  asset: string,
  inviterUsername: string,
): CastContent => {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://susuchain.app"}/groups/${groupAddress}?ref=farcaster`;

  const text = `🔄 Join "${groupName}" Susu Group!

💰 ${contributionAmount} ${asset} per round
👥 Invited by @${inviterUsername}

Rotating savings & community trust on Base ⛓️

Join now: ${inviteUrl}`;

  return {
    text,
    embeds: [{ url: inviteUrl }],
    channelId: "susuchain",
  };
};

/**
 * Create milestone celebration cast
 */
export const createMilestoneCast = (
  groupName: string,
  groupAddress: string,
  milestone: "created" | "first_contribution" | "first_payout" | "completed",
  data?: {
    totalContributed?: string;
    membersCount?: number;
    cyclesCompleted?: number;
  },
): CastContent => {
  const groupUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://susuchain.app"}/groups/${groupAddress}`;

  let text = "";

  switch (milestone) {
    case "created":
      text = `🎉 New Susu Group Created!

"${groupName}" is now accepting members

Join the rotating savings revolution on Base 🌍`;
      break;

    case "first_contribution":
      text = `💸 First Contribution Made!

"${groupName}" has started its journey
${data?.membersCount || 0} members strong 💪

The rotation begins! 🔄`;
      break;

    case "first_payout":
      text = `🎊 First Payout Completed!

"${groupName}" successfully distributed funds
Building trust through action 🤝

Total contributed: ${data?.totalContributed || "0"} ETH`;
      break;

    case "completed":
      text = `✅ Group Cycle Completed!

"${groupName}" finished ${data?.cyclesCompleted || 1} full cycle(s)
Total contributed: ${data?.totalContributed || "0"} ETH

Trust verified on-chain 🔐`;
      break;
  }

  text += `\n\nView group: ${groupUrl}`;

  return {
    text,
    embeds: [{ url: groupUrl }],
    channelId: "susuchain",
  };
};

/**
 * Create contribution reminder cast
 */
export const createContributionReminderCast = (
  groupName: string,
  memberUsername: string,
  dueDate: Date,
): CastContent => {
  const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const text = `⏰ Contribution Reminder

Hey @${memberUsername}!

Your contribution to "${groupName}" is due ${daysUntilDue === 0 ? "today" : `in ${daysUntilDue} day(s)`}

Keep the rotation going! 🔄`;

  return {
    text,
    channelId: "susuchain",
  };
};

/**
 * Create payout announcement cast
 */
export const createPayoutAnnouncementCast = (
  groupName: string,
  recipientUsername: string,
  amount: string,
  asset: string,
): CastContent => {
  const text = `🎁 Payout Time!

Congrats @${recipientUsername}!

You're receiving ${amount} ${asset} from "${groupName}"

Community savings in action 💪✨`;

  return {
    text,
    channelId: "susuchain",
  };
};

/**
 * Get cast by hash
 */
export const getCastByHash = async (hash: string): Promise<any | null> => {
  try {
    const response = await fetch(`https://api.neynar.com/v2/farcaster/cast?identifier=${hash}&type=hash`, {
      headers: {
        accept: "application/json",
        api_key: process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.cast;
  } catch (error) {
    console.error("Error fetching cast:", error);
    return null;
  }
};

/**
 * Get casts in SusuChain channel
 */
export const getSusuChainCasts = async (limit = 25): Promise<any[]> => {
  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/feed/channels?channel_ids=susuchain&with_recasts=false&limit=${limit}`,
      {
        headers: {
          accept: "application/json",
          api_key: process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "",
        },
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.casts || [];
  } catch (error) {
    console.error("Error fetching SusuChain casts:", error);
    return [];
  }
};

/**
 * Reply to a cast
 */
export const replyCast = async (
  signerUuid: string,
  parentHash: string,
  parentAuthorFid: number,
  text: string,
): Promise<PublishedCast | null> => {
  try {
    const response = await fetch("https://api.neynar.com/v2/farcaster/cast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "",
      },
      body: JSON.stringify({
        signer_uuid: signerUuid,
        text,
        parent: {
          hash: parentHash,
          fid: parentAuthorFid,
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to reply to cast");
    }

    const data = await response.json();
    const cast = data.cast;

    return {
      hash: cast.hash,
      authorFid: cast.author.fid,
      text: cast.text,
      timestamp: new Date(cast.timestamp).getTime(),
      url: `https://warpcast.com/${cast.author.username}/${cast.hash.slice(0, 10)}`,
    };
  } catch (error) {
    console.error("Error replying to cast:", error);
    return null;
  }
};

/**
 * Like a cast
 */
export const likeCast = async (signerUuid: string, castHash: string): Promise<boolean> => {
  try {
    const response = await fetch("https://api.neynar.com/v2/farcaster/reaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "",
      },
      body: JSON.stringify({
        signer_uuid: signerUuid,
        reaction_type: "like",
        target: castHash,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error liking cast:", error);
    return false;
  }
};

/**
 * Recast a cast
 */
export const recast = async (signerUuid: string, castHash: string): Promise<boolean> => {
  try {
    const response = await fetch("https://api.neynar.com/v2/farcaster/reaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "",
      },
      body: JSON.stringify({
        signer_uuid: signerUuid,
        reaction_type: "recast",
        target: castHash,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error recasting:", error);
    return false;
  }
};
