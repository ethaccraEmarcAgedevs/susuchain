"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { siweConfig } from "~~/services/web3/siweConfig";

export type SiweSession = { address?: string; chainId?: number; authenticated: boolean };

export function useSIWE() {
  const { address } = useAccount();
  const [session, setSession] = useState<SiweSession>({ authenticated: false });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await siweConfig.getSession();
      setSession(res as SiweSession);
    } catch {
      setSession({ authenticated: false });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signInWithEthereum = useCallback(async () => {
    if (!address) throw new Error("No wallet connected");
    setLoading(true);
    try {
      // Use nonce and verify directly through config
      const nonce = await siweConfig.getNonce();
      if (!nonce) throw new Error("Failed to get nonce");
      await refresh();
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, [address, refresh]);

  const signOut = useCallback(async () => {
    await siweConfig.signOut();
    await refresh();
  }, [refresh]);

  return { session, loading, signInWithEthereum, signOut };
}
