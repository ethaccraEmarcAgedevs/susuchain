"use client";

import { useAppKitNetwork } from "@reown/appkit/react";
import { useSwitchChain } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

export const ChainChecker = () => {
  const { caipNetworkId } = useAppKitNetwork();
  const { targetNetwork } = useTargetNetwork();
  const { switchChain } = useSwitchChain();

  const currentChainId = caipNetworkId ? parseInt(caipNetworkId.split(":")[1]) : undefined;
  const isWrongNetwork = currentChainId && currentChainId !== targetNetwork.id;

  if (!isWrongNetwork) return null;

  return (
    <div className="alert alert-warning shadow-lg mb-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="stroke-current shrink-0 h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <div>
        <h3 className="font-bold">Wrong Network!</h3>
        <div className="text-sm">
          Please switch to <span className="font-semibold">{targetNetwork.name}</span> to continue.
        </div>
      </div>
      <button className="btn btn-sm" onClick={() => switchChain({ chainId: targetNetwork.id })}>
        Switch Network
      </button>
    </div>
  );
};
