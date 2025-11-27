import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { Chain, createClient, fallback, http } from "viem";
import { hardhat, mainnet } from "viem/chains";
import { createConfig } from "wagmi";
import scaffoldConfig, { DEFAULT_ALCHEMY_API_KEY, ScaffoldConfig } from "~~/scaffold.config";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth";
import { burnerWalletConnector } from "./burnerWallet";

const { targetNetworks } = scaffoldConfig;

// We always want to have mainnet enabled (ENS resolution, ETH price, etc). But only once.
export const enabledChains = targetNetworks.find((network: Chain) => network.id === 1)
  ? targetNetworks
  : ([...targetNetworks, mainnet] as const);

// Create Wagmi adapter for Reown AppKit
const wagmiAdapter = new WagmiAdapter({
  networks: enabledChains as any,
  projectId: scaffoldConfig.walletConnectProjectId,
  ssr: true,
});

// Add burner wallet connector in development mode
const isDevelopment = process.env.NODE_ENV === "development";

// Get all connectors
const getAllConnectors = () => {
  const baseConnectors = wagmiAdapter.wagmiConfig?.connectors || [];
  if (isDevelopment) {
    return [...baseConnectors, burnerWalletConnector()];
  }
  return baseConnectors;
};

// Create Wagmi config with burner wallet support
export const wagmiConfig = createConfig({
  chains: enabledChains,
  connectors: getAllConnectors() as any,
  ssr: true,
  client({ chain }) {
    let rpcFallbacks = [http()];

    const rpcOverrideUrl = (scaffoldConfig.rpcOverrides as ScaffoldConfig["rpcOverrides"])?.[chain.id];
    if (rpcOverrideUrl) {
      rpcFallbacks = [http(rpcOverrideUrl), http()];
    } else {
      const alchemyHttpUrl = getAlchemyHttpUrl(chain.id);
      if (alchemyHttpUrl) {
        const isUsingDefaultKey = scaffoldConfig.alchemyApiKey === DEFAULT_ALCHEMY_API_KEY;
        // If using default Scaffold-ETH 2 API key, we prioritize the default RPC
        rpcFallbacks = isUsingDefaultKey ? [http(), http(alchemyHttpUrl)] : [http(alchemyHttpUrl), http()];
      }
    }

    return createClient({
      chain,
      transport: fallback(rpcFallbacks),
      ...(chain.id !== (hardhat as Chain).id
        ? {
            pollingInterval: scaffoldConfig.pollingInterval,
          }
        : {}),
    });
  },
});

// Initialize Reown AppKit with Base network configuration
createAppKit({
  adapters: [wagmiAdapter],
  networks: enabledChains as any,
  projectId: scaffoldConfig.walletConnectProjectId,
  metadata: {
    name: "SusuChain on Base",
    description: "Traditional savings groups, blockchain-powered on Base network",
    url: typeof window !== "undefined" ? window.location.origin : "https://susuchain.app",
    icons: [typeof window !== "undefined" ? `${window.location.origin}/logo.svg` : "https://susuchain.app/logo.svg"],
  },
  features: {
    analytics: true,
    email: false,
    socials: [],
    emailShowWallets: true,
    swaps: false,
    onramp: false,
  },
  featuredWalletIds: [
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
    "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Trust Wallet
    "1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369", // Rainbow
    "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa", // Coinbase Wallet
  ],
  themeMode: "light",
  themeVariables: {
    "--w3m-color-mix": "#0052FF", // Base blue
    "--w3m-color-mix-strength": 20,
    "--w3m-accent": "#0052FF", // Base blue
    "--w3m-border-radius-master": "8px",
    "--w3m-font-family": "Inter, system-ui, sans-serif",
  },
});
