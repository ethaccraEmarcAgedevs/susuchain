import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createAppKit } from "@reown/appkit/react";
import { Chain } from "viem";
import { mainnet } from "viem/chains";
import scaffoldConfig from "~~/scaffold.config";
import { DARK_THEME, LIGHT_THEME, getInitialTheme } from "~~/utils/appkit-theme";

const { targetNetworks } = scaffoldConfig;

// We always want to have mainnet enabled (ENS resolution, ETH price, etc). But only once.
export const enabledChains = targetNetworks.find((network: Chain) => network.id === 1)
  ? targetNetworks
  : ([...targetNetworks, mainnet] as const);

// Create Wagmi adapter for Reown AppKit - this handles all wallet connectors including injected ones
const wagmiAdapter = new WagmiAdapter({
  networks: enabledChains as any,
  projectId: scaffoldConfig.walletConnectProjectId,
  ssr: true,
});

// Export the wagmi config from the adapter - this includes injected connector by default
export const wagmiConfig = wagmiAdapter.wagmiConfig;

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
  allWallets: "SHOW", // Show all available wallets including injected ones
  featuredWalletIds: [
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
    "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Trust Wallet
    "1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369", // Rainbow
    "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa", // Coinbase Wallet
  ],
  themeMode: typeof window !== "undefined" ? getInitialTheme() : "light",
  themeVariables: typeof window !== "undefined" && getInitialTheme() === "dark" ? DARK_THEME : LIGHT_THEME,
});
