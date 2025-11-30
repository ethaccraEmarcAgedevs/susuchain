"use client";
import { useEffect, useState, useCallback } from "react";
import { signIn, signOut as appkitSignOut } from "@reown/appkit-siwe";
import { siweConfig } from "@/services/web3/siweConfig";
import { useAccount } from "wagmi";

export type SiweSession = { address?: string; chainId?: number; authenticated: boolean };

export function useSIWE() {
  const { address } = useAccount();
  const [session, setSession] = useState<SiweSession>({ authenticated: false });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await siweConfig.getSession();
      setSession(res);
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
      const ok = await signIn({ siweConfig });
      if (!ok) throw new Error("SIWE sign-in failed");
      await refresh();
      return true;
    } catch {
      // noop to satisfy lint no-unused-vars
      return false;
    } finally {
      setLoading(false);
    }
  }, [address, refresh]);

  const signOut = useCallback(async () => {
    await appkitSignOut({ siweConfig });
    await refresh();
  }, [refresh]);

  return { session, loading, signInWithEthereum, signOut };
}
