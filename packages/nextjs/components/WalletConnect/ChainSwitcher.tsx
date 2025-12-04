"use client";

import { useState, useRef, useEffect } from "react";
import { useAppKitNetwork, useAppKitAccount } from "@reown/appkit/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { base } from "viem/chains";
import { ChainBadge, getChainInfo } from "./ChainBadge";
import { useOutsideClick } from "~~/hooks/scaffold-eth";

// SusuChain operates exclusively on Base Mainnet
const supportedChains = [
  { chain: base, logo: "🔵" },
];

export const ChainSwitcher = () => {
  const { caipNetwork, switchNetwork } = useAppKitNetwork();
  const { isConnected } = useAppKitAccount();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useOutsideClick(dropdownRef, () => setIsOpen(false));

  const currentChainId = caipNetwork?.id ? parseInt(caipNetwork.id.split(":")[1]) : base.id;
  const currentChain = getChainInfo(currentChainId);

  const handleSwitch = async (chainId: number) => {
    if (!isConnected) {
      setIsOpen(false);
      return;
    }

    try {
      // Find the chain in supported chains
      const targetChain = supportedChains.find(c => c.chain.id === chainId);
      if (targetChain) {
        await switchNetwork(targetChain.chain);
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <ChainBadge chainId={currentChainId} showWarning={false} size="sm" />
        <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase">Select Network</p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {supportedChains.map(({ chain, logo }) => {
              const chainInfo = getChainInfo(chain.id);
              const isActive = currentChainId === chain.id;

              return (
                <button
                  key={chain.id}
                  onClick={() => handleSwitch(chain.id)}
                  disabled={isActive}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    isActive ? "bg-blue-50" : ""
                  } disabled:cursor-default`}
                >
                  <span className="text-2xl">{logo}</span>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm text-gray-900">{chain.name}</p>
                    <p className="text-xs text-gray-500">Chain ID: {chain.id}</p>
                  </div>
                  {chainInfo.isTestnet && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                      Testnet
                    </span>
                  )}
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="px-4 py-2 border-t border-gray-100 mt-2">
            <p className="text-xs text-gray-500">
              SusuChain operates exclusively on Base Mainnet for security and reliability.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
