"use client";

import { useState } from "react";
import { Address } from "viem";
import { useGroupAnalytics } from "~~/hooks/scaffold-eth/useGroupAnalytics";
import { usePlatformStats, useDailyStats } from "~~/hooks/scaffold-eth/usePlatformAnalytics";
import {
  downloadCSV,
  downloadJSON,
  exportGroupAnalyticsToCSV,
  exportGroupAnalyticsToJSON,
  exportMembersToCSV,
  exportRoundHistoryToCSV,
  exportPlatformStatsToCSV,
  exportDailyStatsToCSV,
} from "~~/utils/analytics/exportData";

interface ExportButtonProps {
  type: "group" | "platform";
  groupAddress?: Address;
  className?: string;
}

export default function ExportButton({ type, groupAddress, className = "" }: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { groupAnalytics } = useGroupAnalytics(groupAddress);
  const { platformStats } = usePlatformStats();
  const { dailyStats } = useDailyStats(30);

  const handleExport = (format: "csv" | "json", dataType: string) => {
    const timestamp = new Date().toISOString().split("T")[0];

    if (type === "group" && groupAnalytics) {
      switch (dataType) {
        case "overview":
          if (format === "csv") {
            const csv = exportGroupAnalyticsToCSV(groupAnalytics);
            downloadCSV(csv, `group-${groupAnalytics.name}-overview-${timestamp}.csv`);
          } else {
            const json = exportGroupAnalyticsToJSON(groupAnalytics);
            downloadJSON(json, `group-${groupAnalytics.name}-overview-${timestamp}.json`);
          }
          break;
        case "members":
          const csv = exportMembersToCSV(groupAnalytics.members);
          downloadCSV(csv, `group-${groupAnalytics.name}-members-${timestamp}.csv`);
          break;
        case "rounds":
          const roundsCsv = exportRoundHistoryToCSV(groupAnalytics.roundHistory);
          downloadCSV(roundsCsv, `group-${groupAnalytics.name}-rounds-${timestamp}.csv`);
          break;
      }
    } else if (type === "platform") {
      switch (dataType) {
        case "stats":
          if (platformStats) {
            const csv = exportPlatformStatsToCSV(platformStats);
            downloadCSV(csv, `platform-stats-${timestamp}.csv`);
          }
          break;
        case "daily":
          const dailyCsv = exportDailyStatsToCSV(dailyStats);
          downloadCSV(dailyCsv, `platform-daily-stats-${timestamp}.csv`);
          break;
      }
    }

    setShowMenu(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Export Data
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
          <div className="p-2">
            {type === "group" ? (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Group Data</div>
                <button
                  onClick={() => handleExport("csv", "overview")}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Overview (CSV)
                </button>
                <button
                  onClick={() => handleExport("json", "overview")}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Overview (JSON)
                </button>
                <button
                  onClick={() => handleExport("csv", "members")}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Members List (CSV)
                </button>
                <button
                  onClick={() => handleExport("csv", "rounds")}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Round History (CSV)
                </button>
              </>
            ) : (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Platform Data</div>
                <button
                  onClick={() => handleExport("csv", "stats")}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Platform Stats (CSV)
                </button>
                <button
                  onClick={() => handleExport("csv", "daily")}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Daily Stats (CSV)
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
