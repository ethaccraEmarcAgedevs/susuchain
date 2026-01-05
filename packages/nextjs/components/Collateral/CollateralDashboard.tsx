"use client";

import { Address } from "viem";
import { CollateralTier, getTierBadgeColor, getTierName, formatAPY } from "~~/services/aave/aave-client";

interface CollateralInfo {
  groupAddress: Address;
  groupName: string;
  tier: CollateralTier;
  deposited: bigint;
  slashed: bigint;
  yieldEarned: bigint;
  missedPayments: number;
}

interface CollateralDashboardProps {
  userAddress: Address;
  collaterals: CollateralInfo[];
  currentAPY: number;
}

/**
 * Dashboard displaying user's collateral across all groups
 */
export const CollateralDashboard = ({ userAddress, collaterals, currentAPY }: CollateralDashboardProps) => {
  const totalDeposited = collaterals.reduce((sum, c) => sum + c.deposited, BigInt(0));
  const totalSlashed = collaterals.reduce((sum, c) => sum + c.slashed, BigInt(0));
  const totalYield = collaterals.reduce((sum, c) => sum + c.yieldEarned, BigInt(0));
  const totalActive = totalDeposited - totalSlashed;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-gray-600">Total Locked</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {(Number(totalActive) / 1e18).toFixed(4)} USDC
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-gray-600">Yield Earned</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            +{(Number(totalYield) / 1e18).toFixed(4)} USDC
          </p>
          <p className="text-xs text-gray-500 mt-1">APY: {formatAPY(currentAPY)}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-gray-600">Slashed</span>
          </div>
          <p className="text-2xl font-bold text-red-600">
            -{(Number(totalSlashed) / 1e18).toFixed(4)} USDC
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            <span className="text-sm font-medium text-gray-600">Active Groups</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{collaterals.length}</p>
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Collateral by Group</h3>
        </div>

        {collaterals.length === 0 ? (
          <div className="p-8 text-center">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-gray-600 font-medium mb-2">No Collateralized Groups</p>
            <p className="text-sm text-gray-500">Join a group with collateral requirements to start earning yield</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Locked</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Yield</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Slashed</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {collaterals.map(collateral => {
                  const activeAmount = collateral.deposited - collateral.slashed;
                  return (
                    <tr key={collateral.groupAddress} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{collateral.groupName}</p>
                          <p className="text-xs text-gray-500 font-mono">
                            {collateral.groupAddress.slice(0, 10)}...{collateral.groupAddress.slice(-8)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTierBadgeColor(collateral.tier)}`}>
                          {getTierName(collateral.tier)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {(Number(activeAmount) / 1e18).toFixed(4)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-medium text-green-600">
                          +{(Number(collateral.yieldEarned) / 1e18).toFixed(6)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {collateral.slashed > 0 ? (
                          <p className="text-sm font-medium text-red-600">
                            -{(Number(collateral.slashed) / 1e18).toFixed(4)}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400">-</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {collateral.missedPayments > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {collateral.missedPayments} missed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Good Standing
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
