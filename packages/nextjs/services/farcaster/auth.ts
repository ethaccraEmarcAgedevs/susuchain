import { AuthClientError, createAppClient, viemConnector } from "@farcaster/auth-kit";

export interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio: string;
  custody: string;
  verifications: string[];
  followerCount?: number;
  followingCount?: number;
}

export interface FarcasterAuthConfig {
  domain: string;
  siweUri: string;
  rpcUrl: string;
}

let appClient: ReturnType<typeof createAppClient> | null = null;

/**
 * Initialize Farcaster Auth Client
 */
export const initializeFarcasterAuth = (config: FarcasterAuthConfig) => {
  if (!appClient) {
    appClient = createAppClient({
      ethereum: viemConnector(),
    });
  }
  return appClient;
};

/**
 * Sign in with Farcaster using AuthKit
 */
export const signInWithFarcaster = async (
  onSuccess: (user: FarcasterUser) => void,
  onError: (error: AuthClientError) => void,
) => {
  if (!appClient) {
    throw new Error("Farcaster auth client not initialized");
  }

  try {
    const { message, signature, fid } = await appClient.signIn();

    // Fetch user profile
    const profile = await getFarcasterProfile(fid);

    if (profile) {
      onSuccess(profile);
    } else {
      onError({
        message: "Failed to fetch Farcaster profile",
        errCode: "unavailable",
      } as AuthClientError);
    }
  } catch (error) {
    onError(error as AuthClientError);
  }
};

/**
 * Fetch Farcaster profile by FID
 */
export const getFarcasterProfile = async (fid: number): Promise<FarcasterUser | null> => {
  try {
    // Using Neynar API (free tier)
    const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
      headers: {
        accept: "application/json",
        // Note: In production, use environment variable for API key
        api_key: process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Farcaster profile");
    }

    const data = await response.json();
    const user = data.users[0];

    if (!user) return null;

    return {
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
      bio: user.profile.bio.text,
      custody: user.custody_address,
      verifications: user.verifications || [],
      followerCount: user.follower_count,
      followingCount: user.following_count,
    };
  } catch (error) {
    console.error("Error fetching Farcaster profile:", error);
    return null;
  }
};

/**
 * Link Farcaster profile to Ethereum address
 */
export const linkFarcasterToAddress = async (fid: number, address: string): Promise<boolean> => {
  try {
    const profile = await getFarcasterProfile(fid);
    if (!profile) return false;

    // Check if address is in verified addresses
    const isVerified = profile.verifications.some(
      verification => verification.toLowerCase() === address.toLowerCase(),
    );

    return isVerified;
  } catch (error) {
    console.error("Error linking Farcaster to address:", error);
    return false;
  }
};

/**
 * Get FID by Ethereum address
 */
export const getFidByAddress = async (address: string): Promise<number | null> => {
  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`,
      {
        headers: {
          accept: "application/json",
          api_key: process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "",
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const users = data[address.toLowerCase()];

    if (!users || users.length === 0) return null;

    return users[0].fid;
  } catch (error) {
    console.error("Error fetching FID by address:", error);
    return null;
  }
};

/**
 * Check if address has Farcaster account
 */
export const hasFarcasterAccount = async (address: string): Promise<boolean> => {
  const fid = await getFidByAddress(address);
  return fid !== null;
};

/**
 * Verify Farcaster signature
 */
export const verifyFarcasterSignature = async (
  message: string,
  signature: string,
  fid: number,
): Promise<boolean> => {
  try {
    // Verify signature using Farcaster's verification endpoint
    const response = await fetch("https://api.neynar.com/v2/farcaster/auth/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "",
      },
      body: JSON.stringify({
        message,
        signature,
        fid,
      }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    console.error("Error verifying Farcaster signature:", error);
    return false;
  }
};

/**
 * Get mutual followers between two FIDs
 */
export const getMutualFollowers = async (fid1: number, fid2: number): Promise<number[]> => {
  try {
    // Get followers for both FIDs
    const [followers1Response, followers2Response] = await Promise.all([
      fetch(`https://api.neynar.com/v2/farcaster/followers?fid=${fid1}&limit=1000`, {
        headers: {
          accept: "application/json",
          api_key: process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "",
        },
      }),
      fetch(`https://api.neynar.com/v2/farcaster/followers?fid=${fid2}&limit=1000`, {
        headers: {
          accept: "application/json",
          api_key: process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "",
        },
      }),
    ]);

    const followers1Data = await followers1Response.json();
    const followers2Data = await followers2Response.json();

    const followers1Set = new Set(followers1Data.users.map((u: { fid: number }) => u.fid));
    const mutualFollowers = followers2Data.users
      .filter((u: { fid: number }) => followers1Set.has(u.fid))
      .map((u: { fid: number }) => u.fid);

    return mutualFollowers;
  } catch (error) {
    console.error("Error getting mutual followers:", error);
    return [];
  }
};

/**
 * Check if one FID follows another
 */
export const checkFollowRelationship = async (fid: number, targetFid: number): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/following?fid=${fid}&limit=1000`,
      {
        headers: {
          accept: "application/json",
          api_key: process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "",
        },
      },
    );

    const data = await response.json();
    return data.users.some((u: { fid: number }) => u.fid === targetFid);
  } catch (error) {
    console.error("Error checking follow relationship:", error);
    return false;
  }
};
