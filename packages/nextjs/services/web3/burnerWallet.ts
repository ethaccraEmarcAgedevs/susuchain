"use client";

import { createConnector } from "wagmi";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import type { Address } from "viem";

// Storage key for burner wallet private key
const BURNER_STORAGE_KEY = "susuchain.burner.pk";

/**
 * Custom Burner Wallet Connector for Development
 *
 * ⚠️ WARNING: For development and testing only!
 * - Private keys stored in localStorage (NOT SECURE)
 * - Do NOT send real funds to burner addresses
 * - Keys are lost when localStorage is cleared
 */
export function burnerWalletConnector() {
  return createConnector((config) => {
    let currentAccount: ReturnType<typeof privateKeyToAccount> | null = null;

    return {
      id: "burner",
      name: "Burner Wallet",
      type: "injected" as const,

      async setup() {
        // Load existing burner wallet if available
        if (typeof window !== "undefined") {
          const existingPk = localStorage.getItem(BURNER_STORAGE_KEY);
          if (existingPk) {
            try {
              currentAccount = privateKeyToAccount(existingPk as `0x${string}`);
            } catch (error) {
              // Invalid private key, will create new one on connect
              console.warn("Invalid burner key in storage, will create new one");
              localStorage.removeItem(BURNER_STORAGE_KEY);
            }
          }
        }
      },

      async connect() {
        if (typeof window === "undefined") {
          throw new Error("Burner wallet only works in browser environment");
        }

        // Create new burner if doesn't exist
        if (!currentAccount) {
          const privateKey = generatePrivateKey();
          currentAccount = privateKeyToAccount(privateKey);
          localStorage.setItem(BURNER_STORAGE_KEY, privateKey);
        }

        return {
          accounts: [currentAccount.address as Address],
          chainId: config.chains[0].id,
        };
      },

      async disconnect() {
        if (typeof window !== "undefined") {
          localStorage.removeItem(BURNER_STORAGE_KEY);
          currentAccount = null;
        }
      },

      async getAccounts() {
        if (!currentAccount && typeof window !== "undefined") {
          const pk = localStorage.getItem(BURNER_STORAGE_KEY);
          if (pk) {
            currentAccount = privateKeyToAccount(pk as `0x${string}`);
          }
        }
        return currentAccount ? [currentAccount.address as Address] : [];
      },

      async isAuthorized() {
        if (typeof window === "undefined") return false;
        return !!localStorage.getItem(BURNER_STORAGE_KEY);
      },

      async getChainId() {
        return config.chains[0].id;
      },

      async switchChain({ chainId }) {
        const chain = config.chains.find(x => x.id === chainId);
        if (!chain) {
          throw new Error(`Chain ${chainId} not configured`);
        }
        return chain;
      },

      async getProvider() {
        // Burner wallet doesn't have an external provider
        return null;
      },

      onAccountsChanged() {},
      onChainChanged() {},
      onDisconnect() {
        if (typeof window !== "undefined") {
          localStorage.removeItem(BURNER_STORAGE_KEY);
          currentAccount = null;
        }
      },
    };
  });
}

/**
 * Get the current burner wallet private key from storage
 * @returns Private key or null if not found
 */
export function getBurnerPrivateKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(BURNER_STORAGE_KEY);
}

/**
 * Delete the current burner wallet
 */
export function deleteBurnerWallet(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BURNER_STORAGE_KEY);
}

/**
 * Check if a burner wallet exists
 */
export function hasBurnerWallet(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(BURNER_STORAGE_KEY);
}
