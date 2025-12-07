"use client";

import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
  WalletDropdownLink,
} from "@coinbase/onchainkit/wallet";
import { Address, Avatar, EthBalance, Identity, Name } from "@coinbase/onchainkit/identity";

/**
 * Smart Wallet Connect Button using Coinbase OnchainKit
 * Provides seamless wallet connection with Smart Wallet support
 */
export function ConnectWalletButton() {
  return (
    <Wallet>
      <ConnectWallet>
        <Avatar className="h-6 w-6" />
        <Name />
      </ConnectWallet>
      <WalletDropdown>
        <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
          <Avatar />
          <Name />
          <Address />
          <EthBalance />
        </Identity>
        <WalletDropdownLink icon="wallet" href="/dashboard">
          Dashboard
        </WalletDropdownLink>
        <WalletDropdownDisconnect />
      </WalletDropdown>
    </Wallet>
  );
}
