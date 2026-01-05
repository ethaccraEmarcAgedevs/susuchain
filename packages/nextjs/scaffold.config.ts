import * as chains from "viem/chains";

export type ScaffoldConfig = {
  targetNetworks: readonly chains.Chain[];
  pollingInterval: number;
  alchemyApiKey: string;
  rpcOverrides?: Record<number, string>;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
};

export const DEFAULT_ALCHEMY_API_KEY = "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF";

const scaffoldConfig = {
  // The networks on which your DApp is live
  // Primary network: Base Mainnet (production), Base Sepolia (testing)
  targetNetworks: process.env.NEXT_PUBLIC_ENABLE_TESTNETS === "true"
    ? [chains.base, chains.baseSepolia]
    : [chains.base],

  // The interval at which your front-end polls the RPC servers for new data
  // it has no effect if you only target the local network (default is 4000)
  pollingInterval: 30000,

  // This is ours Alchemy's default API key.
  // You can get your own at https://dashboard.alchemyapi.io
  // It's recommended to store it in an env variable:
  // .env.local for local testing, and in the Vercel/system env config for live apps.
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || DEFAULT_ALCHEMY_API_KEY,

  // If you want to use a different RPC for a specific network, you can add it here.
  // The key is the chain ID, and the value is the HTTP RPC URL
  rpcOverrides: {
    // Base mainnet - using Coinbase's official RPC for optimal performance
    [chains.base.id]: "https://mainnet.base.org",
    // Base Sepolia testnet - official testnet RPC
    [chains.baseSepolia.id]: "https://sepolia.base.org",
  },

  // ==================================================================================
  // WALLETCONNECT CLOUD PROJECT ID
  // ==================================================================================
  // IMPORTANT: Get your own WalletConnect Cloud Project ID for production!
  // The default ID below is for development only and has limitations:
  //   - Shared rate limits (may be throttled)
  //   - No analytics or error tracking
  //   - No custom branding
  //   - Can be disabled at any time
  //
  // Create your FREE project at: https://cloud.reown.com
  // Then set NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID in:
  //   - .env.local (for local development)
  //   - Vercel dashboard (for production)
  //
  // See .env.example for detailed setup instructions.
  // ==================================================================================
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64",

  // Only show the Burner Wallet when running on hardhat network
  onlyLocalBurnerWallet: false,
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;
