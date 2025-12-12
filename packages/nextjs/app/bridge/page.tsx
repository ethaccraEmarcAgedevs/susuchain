"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { BridgeModal, BridgeStatus } from "~~/components/Bridge";
import { useBridge } from "~~/hooks/bridge/useBridge";

const BridgePage = () => {
  const { isConnected } = useAccount();
  const { pendingBridges, allBridges, hasPendingBridges } = useBridge();
  const [showBridgeModal, setShowBridgeModal] = useState(false);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">Connect your wallet to bridge assets to Base.</p>
            <Link href="/">
              <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Go Back Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Bridge to Base</h1>
          <p className="text-lg text-gray-600">Transfer assets from other chains to Base for Susu groups</p>
        </div>

        {/* Why Base Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Why Bridge to Base?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold mb-1">Lower Fees</h3>
                <p className="text-sm opacity-90">Transactions cost ~$0.01 vs $10+ on Ethereum</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold mb-1">Faster</h3>
                <p className="text-sm opacity-90">Instant confirmations, no waiting for blocks</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold mb-1">Secure</h3>
                <p className="text-sm opacity-90">Built on Ethereum with Coinbase backing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bridge Action */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Start Bridging</h3>
              <p className="text-gray-600">Bridge ETH or USDC from Ethereum, Arbitrum, Optimism, or Polygon</p>
            </div>
            <button
              onClick={() => setShowBridgeModal(true)}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Bridge Assets
            </button>
          </div>
        </div>

        {/* Pending Bridges */}
        {hasPendingBridges && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Bridges</h2>
            <div className="space-y-4">
              {pendingBridges.map(bridge => (
                <BridgeStatus key={bridge.id} transaction={bridge} />
              ))}
            </div>
          </div>
        )}

        {/* Bridge History */}
        {allBridges.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Bridge History</h2>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allBridges.map(bridge => (
                    <tr key={bridge.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{bridge.asset}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{bridge.amount}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            bridge.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : bridge.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {bridge.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(bridge.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-900 py-2">
                How long does bridging take?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="text-gray-600 mt-2 pl-4">
                ETH bridging takes approximately 7 days due to the optimistic rollup finalization period. USDC bridging via Circle's CCTP takes only 15-20 minutes.
              </p>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-900 py-2">
                What are the fees?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="text-gray-600 mt-2 pl-4">
                You only pay gas fees on your source chain. There are no additional bridge fees for using Base's official bridge or Circle's CCTP.
              </p>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-900 py-2">
                Is bridging safe?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="text-gray-600 mt-2 pl-4">
                Yes. We use Base's official bridge and Circle's CCTP, both audited and battle-tested protocols. Base is built by Coinbase, ensuring institutional-grade security.
              </p>
            </details>
          </div>
        </div>
      </div>

      {/* Bridge Modal */}
      <BridgeModal isOpen={showBridgeModal} onClose={() => setShowBridgeModal(false)} />
    </div>
  );
};

export default BridgePage;
