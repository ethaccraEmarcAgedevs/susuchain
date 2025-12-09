import { useEffect, useState } from "react";
import { Address, erc20Abi } from "viem";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { isNativeETH } from "~~/utils/tokens";

/**
 * Hook to get token balance for the connected user
 */
export function useTokenBalance(tokenAddress?: Address) {
  const { address: userAddress } = useAccount();
  const [balance, setBalance] = useState<bigint>(0n);
  const [isLoading, setIsLoading] = useState(false);

  // Get ETH balance if token is native ETH
  const { data: ethBalance } = useBalance({
    address: userAddress,
    query: {
      enabled: !!userAddress && !!tokenAddress && isNativeETH(tokenAddress),
    },
  });

  // Get ERC20 balance if token is not ETH
  const { data: tokenBalance, isLoading: isTokenLoading } = useReadContract({
    address: tokenAddress && !isNativeETH(tokenAddress) ? tokenAddress : undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!tokenAddress && !isNativeETH(tokenAddress),
    },
  });

  useEffect(() => {
    if (!tokenAddress) {
      setBalance(0n);
      setIsLoading(false);
      return;
    }

    if (isNativeETH(tokenAddress)) {
      setBalance(ethBalance?.value ?? 0n);
      setIsLoading(false);
    } else {
      setBalance(tokenBalance ?? 0n);
      setIsLoading(isTokenLoading);
    }
  }, [tokenAddress, ethBalance, tokenBalance, isTokenLoading]);

  return {
    balance,
    isLoading,
  };
}
