"use client";

import { OnchainKitProvider } from "@coinbase/onchainkit";
import { base } from "viem/chains";

/**
 * OnchainKit Provider wrapper for Base blockchain
 * Provides Smart Wallet and Coinbase integration
 */
export function OnchainProviders({ children }: { children: React.ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={base}
      config={{
        appearance: {
          mode: "auto",
          theme: "default",
        },
      }}
    >
      {children}
    </OnchainKitProvider>
  );
}
