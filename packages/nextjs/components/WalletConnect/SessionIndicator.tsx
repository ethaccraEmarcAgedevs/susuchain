"use client";

import { useSessionManager } from "~~/hooks/scaffold-eth/useSessionManager";

export const SessionIndicator = () => {
  const { sessionStatus, timeLeft, extendSession } = useSessionManager();

  if (sessionStatus === "disconnected") return null;

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  if (sessionStatus === "active") {
    return (
      <div className="fixed bottom-4 right-4 z-50 hidden md:flex items-center gap-2 bg-base-100 rounded-full px-3 py-1 shadow-lg border border-base-300 text-xs opacity-50 hover:opacity-100 transition-opacity">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <span>Session Active</span>
      </div>
    );
  }

  if (sessionStatus === "expiring") {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 animate-bounce">
        <div className="alert alert-warning shadow-lg max-w-xs">
          <div>
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
            <div>
              <h3 className="font-bold">Session Expiring!</h3>
              <div className="text-xs">
                Your session expires in {hours}h {minutes}m.
              </div>
            </div>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={extendSession}>
            Extend
          </button>
        </div>
      </div>
    );
  }

  return null;
};
