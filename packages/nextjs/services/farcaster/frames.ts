export interface FrameMetadata {
  version: "vNext";
  image: string;
  buttons: FrameButton[];
  postUrl?: string;
  inputText?: string;
  imageAspectRatio?: "1.91:1" | "1:1";
  state?: string;
}

export interface FrameButton {
  label: string;
  action: "post" | "post_redirect" | "link" | "mint";
  target?: string;
  index: number;
}

export interface GroupFrameData {
  groupAddress: string;
  groupName: string;
  contributionAmount: string;
  asset: string;
  membersCount: number;
  totalContributed: string;
  nextPayoutRecipient?: string;
}

/**
 * Generate Frame metadata for HTML head tags
 */
export const generateFrameMetaTags = (metadata: FrameMetadata): string => {
  const tags = [
    `<meta property="fc:frame" content="${metadata.version}" />`,
    `<meta property="fc:frame:image" content="${metadata.image}" />`,
  ];

  if (metadata.imageAspectRatio) {
    tags.push(`<meta property="fc:frame:image:aspect_ratio" content="${metadata.imageAspectRatio}" />`);
  }

  if (metadata.inputText) {
    tags.push(`<meta property="fc:frame:input:text" content="${metadata.inputText}" />`);
  }

  if (metadata.postUrl) {
    tags.push(`<meta property="fc:frame:post_url" content="${metadata.postUrl}" />`);
  }

  if (metadata.state) {
    tags.push(`<meta property="fc:frame:state" content="${metadata.state}" />`);
  }

  metadata.buttons.forEach(button => {
    tags.push(`<meta property="fc:frame:button:${button.index}" content="${button.label}" />`);
    tags.push(`<meta property="fc:frame:button:${button.index}:action" content="${button.action}" />`);
    if (button.target) {
      tags.push(`<meta property="fc:frame:button:${button.index}:target" content="${button.target}" />`);
    }
  });

  return tags.join("\n");
};

/**
 * Create Frame for group discovery/join
 */
export const createGroupJoinFrame = (data: GroupFrameData): FrameMetadata => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://susuchain.app";
  const imageUrl = `${appUrl}/api/frames/group-image?address=${data.groupAddress}`;

  return {
    version: "vNext",
    image: imageUrl,
    imageAspectRatio: "1.91:1",
    buttons: [
      {
        label: "Join Group",
        action: "link",
        target: `${appUrl}/groups/${data.groupAddress}`,
        index: 1,
      },
      {
        label: "View Details",
        action: "post",
        index: 2,
      },
      {
        label: `${data.membersCount} Members`,
        action: "post",
        index: 3,
      },
    ],
    postUrl: `${appUrl}/api/frames/group-action`,
    state: JSON.stringify({ groupAddress: data.groupAddress }),
  };
};

/**
 * Create Frame for contribution
 */
export const createContributionFrame = (data: GroupFrameData): FrameMetadata => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://susuchain.app";
  const imageUrl = `${appUrl}/api/frames/contribution-image?address=${data.groupAddress}`;

  return {
    version: "vNext",
    image: imageUrl,
    imageAspectRatio: "1.91:1",
    buttons: [
      {
        label: `Contribute ${data.contributionAmount} ${data.asset}`,
        action: "link",
        target: `${appUrl}/groups/${data.groupAddress}/contribute`,
        index: 1,
      },
      {
        label: "View Group",
        action: "link",
        target: `${appUrl}/groups/${data.groupAddress}`,
        index: 2,
      },
    ],
    postUrl: `${appUrl}/api/frames/contribution-action`,
    state: JSON.stringify({ groupAddress: data.groupAddress }),
  };
};

/**
 * Create Frame for payout announcement
 */
export const createPayoutFrame = (data: GroupFrameData): FrameMetadata => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://susuchain.app";
  const imageUrl = `${appUrl}/api/frames/payout-image?address=${data.groupAddress}&recipient=${data.nextPayoutRecipient}`;

  return {
    version: "vNext",
    image: imageUrl,
    imageAspectRatio: "1.91:1",
    buttons: [
      {
        label: "🎉 Celebrate",
        action: "post",
        index: 1,
      },
      {
        label: "View Group",
        action: "link",
        target: `${appUrl}/groups/${data.groupAddress}`,
        index: 2,
      },
      {
        label: "Join Similar",
        action: "post",
        index: 3,
      },
    ],
    postUrl: `${appUrl}/api/frames/payout-action`,
    state: JSON.stringify({ groupAddress: data.groupAddress }),
  };
};

/**
 * Create Frame for group creation
 */
export const createGroupCreationFrame = (creatorFid: number): FrameMetadata => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://susuchain.app";
  const imageUrl = `${appUrl}/api/frames/create-group-image`;

  return {
    version: "vNext",
    image: imageUrl,
    imageAspectRatio: "1.91:1",
    inputText: "Group name",
    buttons: [
      {
        label: "Create Group",
        action: "post",
        index: 1,
      },
      {
        label: "Browse Groups",
        action: "link",
        target: `${appUrl}/groups`,
        index: 2,
      },
    ],
    postUrl: `${appUrl}/api/frames/create-group-action`,
    state: JSON.stringify({ creatorFid }),
  };
};

/**
 * Create Frame for milestone celebration
 */
export const createMilestoneFrame = (
  data: GroupFrameData,
  milestone: "first_contribution" | "first_payout" | "completed",
): FrameMetadata => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://susuchain.app";
  const imageUrl = `${appUrl}/api/frames/milestone-image?address=${data.groupAddress}&milestone=${milestone}`;

  return {
    version: "vNext",
    image: imageUrl,
    imageAspectRatio: "1.91:1",
    buttons: [
      {
        label: "🎊 View Group",
        action: "link",
        target: `${appUrl}/groups/${data.groupAddress}`,
        index: 1,
      },
      {
        label: "Share Success",
        action: "post",
        index: 2,
      },
      {
        label: "Create Similar",
        action: "link",
        target: `${appUrl}/create-group`,
        index: 3,
      },
    ],
    postUrl: `${appUrl}/api/frames/milestone-action`,
    state: JSON.stringify({ groupAddress: data.groupAddress, milestone }),
  };
};

/**
 * Validate Frame signature from Farcaster
 */
export const validateFrameSignature = async (frameMessage: any): Promise<boolean> => {
  try {
    const response = await fetch("https://api.neynar.com/v2/farcaster/frame/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "",
      },
      body: JSON.stringify({
        message_bytes_in_hex: frameMessage.trustedData.messageBytes,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    console.error("Error validating frame signature:", error);
    return false;
  }
};

/**
 * Parse Frame action payload
 */
export const parseFrameAction = (frameMessage: any): {
  fid: number;
  buttonIndex: number;
  inputText?: string;
  state?: any;
} => {
  const { fid, button_index, input_text, state } = frameMessage.action;

  return {
    fid,
    buttonIndex: button_index,
    inputText: input_text,
    state: state ? JSON.parse(state) : undefined,
  };
};

/**
 * Generate OG image for group
 */
export const generateGroupOGImageUrl = (data: GroupFrameData): string => {
  const params = new URLSearchParams({
    name: data.groupName,
    contribution: data.contributionAmount,
    asset: data.asset,
    members: data.membersCount.toString(),
    total: data.totalContributed,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://susuchain.app";
  return `${appUrl}/api/og/group?${params.toString()}`;
};
