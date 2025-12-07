import { useEffect, useState } from "react";
import { Address } from "viem";
import { BasenameProfile, formatAddressWithBasename, getBaseName, getBasenameProfile } from "~~/utils/basenames";

/**
 * Hook to fetch and manage Base Names for addresses
 * Replaces useENS with Base L2 name resolution
 */
export function useBaseName(address?: Address) {
  const [basename, setBasename] = useState<string | null>(null);
  const [profile, setProfile] = useState<BasenameProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchBasename() {
      if (!address) {
        setBasename(null);
        setProfile(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [name, profileData] = await Promise.all([getBaseName(address), getBasenameProfile(address)]);

        setBasename(name);
        setProfile(profileData);
      } catch (err) {
        console.error("Error fetching basename:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchBasename();
  }, [address]);

  return {
    basename,
    profile,
    isLoading,
    error,
    displayName: basename || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""),
  };
}

/**
 * Hook for formatting address with basename
 */
export function useFormattedAddress(address?: Address) {
  const [formatted, setFormatted] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function format() {
      if (!address) {
        setFormatted("");
        return;
      }

      setIsLoading(true);

      try {
        const result = await formatAddressWithBasename(address);
        setFormatted(result);
      } catch (error) {
        console.error("Error formatting address:", error);
        setFormatted(`${address.slice(0, 6)}...${address.slice(-4)}`);
      } finally {
        setIsLoading(false);
      }
    }

    format();
  }, [address]);

  return { formatted, isLoading };
}
