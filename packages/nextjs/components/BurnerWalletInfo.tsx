"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { deleteBurnerWallet, getBurnerPrivateKey } from "~~/services/web3/burnerWallet";

/**
 * BurnerWalletInfo Component
 *
 * Displays information and controls for the burner wallet in development mode.
 * Shows warnings, allows exporting private key, and deleting the burner wallet.
 */
export const BurnerWalletInfo = () => {
  const { connector, address } = useAccount();
  const [privateKey, setPrivateKey] = useState<string>("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Only show if connected with burner wallet
    if (connector?.id === "burner") {
      const pk = getBurnerPrivateKey();
      setPrivateKey(pk || "");
    } else {
      setPrivateKey("");
      setShowPrivateKey(false);
    }
  }, [connector]);

  // Don't render if not using burner wallet
  if (connector?.id !== "burner" || !address) {
    return null;
  }

  const handleCopyPrivateKey = async () => {
    if (privateKey) {
      await navigator.clipboard.writeText(privateKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeleteBurner = () => {
    if (confirm("⚠️ This will delete your burner wallet permanently. Any funds will be lost. Continue?")) {
      deleteBurnerWallet();
      // Reload page to disconnect
      window.location.reload();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-sm z-50">
      <div className="alert alert-warning shadow-lg">
        <div className="flex flex-col gap-2 w-full">
          {/* Warning Header */}
          <div className="flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current flex-shrink-0 h-6 w-6"
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
            <div className="flex-1">
              <h3 className="font-bold text-sm">⚠️ Burner Wallet (Development Only)</h3>
              <p className="text-xs mt-1">DO NOT send real funds! Private key stored in browser localStorage.</p>
            </div>
          </div>

          {/* Address Display */}
          <div className="text-xs font-mono bg-base-200 p-2 rounded">
            <span className="opacity-60">Address:</span> {address.slice(0, 6)}...{address.slice(-4)}
          </div>

          {/* Private Key Section */}
          <div className="flex flex-col gap-2">
            <button className="btn btn-xs btn-outline" onClick={() => setShowPrivateKey(!showPrivateKey)}>
              {showPrivateKey ? "Hide" : "Show"} Private Key
            </button>

            {showPrivateKey && privateKey && (
              <div className="flex flex-col gap-2">
                <div className="text-xs font-mono bg-error bg-opacity-10 p-2 rounded break-all border border-error">
                  {privateKey}
                </div>
                <button className="btn btn-xs btn-primary" onClick={handleCopyPrivateKey}>
                  {copied ? "✓ Copied!" : "Copy Private Key"}
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-2">
            <button className="btn btn-xs btn-error flex-1" onClick={handleDeleteBurner}>
              Delete Burner
            </button>
          </div>

          {/* Info */}
          <div className="text-xs opacity-70 border-t border-warning pt-2">
            <p>💡 Burner wallets are temporary test wallets.</p>
            <p>🔒 For production, use MetaMask or WalletConnect.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
