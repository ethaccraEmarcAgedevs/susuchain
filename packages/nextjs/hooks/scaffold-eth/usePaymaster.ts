import { useEffect, useState } from "react";
import { Address } from "viem";
import { useAccount, useChainId } from "wagmi";
import {
  PaymasterEligibility,
  checkPaymasterEligibility,
  getRemainingSponsored,
  isPaymasterAvailable,
} from "~~/services/web3/paymaster";

/**
 * Hook to check Paymaster eligibility and manage sponsored transaction state
 * @param operation - The operation type (e.g., "joinGroup", "contributeToRound")
 * @param gasEstimate - Optional gas estimate for the transaction
 * @returns Paymaster status and eligibility information
 */
export function usePaymaster(operation: string = "unknown", gasEstimate?: bigint) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [eligibility, setEligibility] = useState<PaymasterEligibility>({
    isEligible: false,
    remainingSponsored: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function checkEligibility() {
      if (!address || !isPaymasterAvailable(chainId)) {
        setEligibility({
          isEligible: false,
          reason: "Paymaster not available on this network",
          remainingSponsored: 0,
        });
        return;
      }

      setIsLoading(true);
      try {
        const estimate = gasEstimate || BigInt(200000);
        const result = await checkPaymasterEligibility(address, operation, estimate);
        setEligibility(result);
      } catch (error) {
        console.error("Error checking Paymaster eligibility:", error);
        setEligibility({
          isEligible: false,
          reason: "Error checking eligibility",
          remainingSponsored: 0,
        });
      } finally {
        setIsLoading(false);
      }
    }

    checkEligibility();
  }, [address, chainId, operation, gasEstimate]);

  return {
    isEligible: eligibility.isEligible,
    reason: eligibility.reason,
    remainingSponsored: eligibility.remainingSponsored,
    isPaymasterAvailable: isPaymasterAvailable(chainId),
    isLoading,
    getRemainingForUser: () => (address ? getRemainingSponsored(address) : 0),
  };
}
