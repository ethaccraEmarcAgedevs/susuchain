"use client";

import { useState } from "react";
import { Address } from "viem";
import { useGelatoAutomation } from "~~/hooks/gelato/useGelatoAutomation";
import { formatTimeRemaining } from "~~/services/notifications/deadline-notifications";

interface AutomationPanelProps {
  groupAddress: Address;
  groupName: string;
  timeUntilDeadline: number;
  isOwner: boolean;
}

/**
 * Panel for managing automated payouts via Gelato
 */
export const AutomationPanel = ({ groupAddress, groupName, timeUntilDeadline, isOwner }: AutomationPanelProps) => {
  const { tasks, loading, error, createTask, cancelTask, hasActiveTask } = useGelatoAutomation(
    groupAddress,
    groupName,
  );
  const [showDetails, setShowDetails] = useState(false);

  const handleEnableAutomation = async () => {
    try {
      await createTask();
    } catch (err) {
      console.error("Failed to enable automation:", err);
    }
  };

  const handleDisableAutomation = async () => {
    if (tasks.length > 0) {
      try {
        await cancelTask(tasks[0].taskId);
      } catch (err) {
        console.error("Failed to disable automation:", err);
      }
    }
  };

  if (!isOwner) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Automated Payouts Enabled</h4>
            <p className="text-sm text-blue-700">
              Payouts will be automatically triggered when the deadline is reached or all members contribute.
            </p>
            <p className="text-sm text-blue-700 mt-2">
              Time remaining: <span className="font-semibold">{formatTimeRemaining(timeUntilDeadline)}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Automated Payouts</h3>
            <p className="text-sm text-gray-600">Powered by Gelato Network</p>
          </div>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          {showDetails ? "Hide" : "Show"} details
          <svg
            className={`w-4 h-4 transition-transform ${showDetails ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${hasActiveTask ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
            ></div>
            <span className="text-sm font-medium text-gray-700">
              Status: {hasActiveTask ? "Active" : "Inactive"}
            </span>
          </div>

          {hasActiveTask ? (
            <button
              onClick={handleDisableAutomation}
              disabled={loading}
              className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              {loading ? "Disabling..." : "Disable"}
            </button>
          ) : (
            <button
              onClick={handleEnableAutomation}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Enabling..." : "Enable Automation"}
            </button>
          )}
        </div>

        {showDetails && (
          <div className="space-y-3">
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">How it works:</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Gelato monitors the group and automatically triggers payouts</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Payout executes when all contribute OR deadline passes</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Late penalties (5%) applied automatically to late contributors</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Small automation fee (0.1%) covers gas costs</span>
                </div>
              </div>
            </div>

            {tasks.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Active Tasks:</h4>
                {tasks.map(task => (
                  <div key={task.taskId} className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded">
                    Task ID: {task.taskId.slice(0, 20)}...
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
