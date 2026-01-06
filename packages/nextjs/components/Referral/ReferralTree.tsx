"use client";

import { Address } from "viem";
import { useReferralData } from "~~/hooks/referral/useReferralData";

interface ReferralTreeProps {
  referees: Address[];
  address: Address;
}

function RefereeCard({ address }: { address: Address }) {
  const { referral } = useReferralData(address);

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const qualified = referral?.qualified || false;
  const contributions = Number(referral?.contributionCount || 0);

  return (
    <div className={`p-3 rounded-lg border-2 ${qualified ? "border-green-400 bg-green-50" : "border-gray-300 bg-gray-50"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {qualified ? <span className="text-green-600">✓</span> : <span className="text-gray-400">○</span>}
          <span className="font-mono text-sm">{shortAddress}</span>
        </div>
        <div className="badge badge-sm">{contributions} contributions</div>
      </div>
      {qualified && (
        <div className="mt-1 text-xs text-green-600 font-semibold">Qualified</div>
      )}
    </div>
  );
}

export function ReferralTree({ referees, address }: ReferralTreeProps) {
  if (!referees || referees.length === 0) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Referral Tree</h2>
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-4">🌳</p>
            <p className="text-lg">No referrals yet</p>
            <p className="text-sm">Share your code to grow your tree!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4">
          Referral Tree <span className="badge badge-lg badge-primary">{referees.length}</span>
        </h2>

        {/* Root (You) */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👤</span>
              <div>
                <p className="font-semibold">You</p>
                <p className="text-sm opacity-80 font-mono">{`${address.slice(0, 6)}...${address.slice(-4)}`}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Branches */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-600 mb-2">Direct Referrals</p>
          {referees.map((referee, index) => (
            <div key={index} className="ml-8 relative">
              {/* Connection line */}
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-300" style={{ left: "-20px" }}></div>
              <div className="absolute left-0 top-1/2 w-5 h-px bg-gray-300" style={{ left: "-20px" }}></div>

              <RefereeCard address={referee} />
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm font-semibold mb-2">Legend</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Qualified (3+ contributions)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">○</span>
              <span>Not yet qualified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
