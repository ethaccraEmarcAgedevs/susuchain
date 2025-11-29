"use client";

import { useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { Address } from "viem";
import { useDisconnect } from "wagmi";
import { Balance } from "~~/components/scaffold-eth/Balance";
import { AddressQRCodeModal } from "~~/components/scaffold-eth/RainbowKitCustomConnectButton/AddressQRCodeModal";

export const AccountModal = () => {
  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const [showModal, setShowModal] = useState(false);

  if (!isConnected || !address) return null;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
    alert("Address copied!");
  };

  return (
    <>
      <button className="btn btn-sm btn-ghost" onClick={() => setShowModal(true)}>
        Account
      </button>

      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Account Details</h3>

            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Address</span>
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-base-200 rounded text-xs break-all">{address}</code>
                  <button className="btn btn-sm btn-square" onClick={handleCopyAddress}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Balance</span>
                </label>
                <Balance address={address as Address} className="text-2xl font-bold" />
              </div>

              <div className="flex gap-2">
                <button
                  className="btn btn-sm flex-1"
                  onClick={() => {
                    const modal = document.getElementById("qrcode-modal") as HTMLDialogElement;
                    modal?.showModal();
                  }}
                >
                  Show QR
                </button>
                <button className="btn btn-sm btn-error flex-1" onClick={() => disconnect()}>
                  Disconnect
                </button>
              </div>
            </div>

            <div className="modal-action">
              <button className="btn btn-sm" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
        </div>
      )}

      <AddressQRCodeModal address={address as Address} modalId="qrcode-modal" />
    </>
  );
};
