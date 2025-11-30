"use client";

import { useState, useEffect } from "react";
import { useAppKit } from "@reown/appkit/react";
import { QrCodeIcon, DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import { WalletDeepLink, WalletDownloadButton } from "./WalletDeepLink";
import { getPopularWallets } from "~~/utils/wallet-deeplinks";
import { useMobileDetection } from "~~/hooks/scaffold-eth/useMobileDetection";

interface MobileWalletSelectorProps {
  onConnect?: () => void;
  showQRFallback?: boolean;
}

export const MobileWalletSelector = ({
  onConnect,
  showQRFallback = true,
}: MobileWalletSelectorProps) => {
  const { isMobile, isDesktop } = useMobileDetection();
  const { open } = useAppKit();
  const [wcUri, setWcUri] = useState<string>("");
  const [showMode, setShowMode] = useState<"wallets" | "qr">("wallets");

  const popularWallets = getPopularWallets();

  useEffect(() => {
    // Listen for WalletConnect URI
    const handleWalletConnectUri = (event: CustomEvent) => {
      if (event.detail?.uri) {
        setWcUri(event.detail.uri);
      }
    };

    window.addEventListener("walletconnect_uri" as any, handleWalletConnectUri);
    return () => {
      window.removeEventListener("walletconnect_uri" as any, handleWalletConnectUri);
    };
  }, []);

  const handleOpenAppKit = () => {
    open();
    if (onConnect) {
      onConnect();
    }
  };

  // Desktop view - always show QR
  if (isDesktop) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-6">
          <QrCodeIcon className="h-12 w-12 mx-auto mb-3 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Connect Your Wallet</h3>
          <p className="text-sm text-gray-600">
            Scan with your mobile wallet app to connect
          </p>
        </div>
        <button
          onClick={handleOpenAppKit}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Show QR Code
        </button>
      </div>
    );
  }

  // Mobile view - show wallet buttons or QR based on mode
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="text-center mb-6">
        <DevicePhoneMobileIcon className="h-12 w-12 mx-auto mb-3 text-blue-600" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Connect Your Wallet</h3>
        <p className="text-sm text-gray-600">
          {showMode === "wallets"
            ? "Choose your preferred wallet app"
            : "Scan QR code with your wallet"
          }
        </p>
      </div>

      {/* Mode toggle for mobile */}
      {showQRFallback && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setShowMode("wallets")}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              showMode === "wallets"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Wallets
          </button>
          <button
            onClick={() => setShowMode("qr")}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              showMode === "qr"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            QR Code
          </button>
        </div>
      )}

      {showMode === "wallets" ? (
        <div className="space-y-3">
          {popularWallets.map(wallet => (
            <div key={wallet.id} className="space-y-2">
              <WalletDeepLink
                wallet={wallet}
                wcUri={wcUri}
                onConnect={onConnect}
                variant="default"
              />
            </div>
          ))}

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleOpenAppKit}
              className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              More Wallets
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-sm text-gray-600 text-center">
              QR code will appear when you open the wallet connection modal
            </p>
          </div>
          <button
            onClick={handleOpenAppKit}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Show QR Code
          </button>
        </div>
      )}

      {/* Help text */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-900 font-medium mb-1">New to crypto?</p>
        <p className="text-xs text-blue-700">
          Download a wallet app to get started with SusuChain
        </p>
      </div>
    </div>
  );
};
