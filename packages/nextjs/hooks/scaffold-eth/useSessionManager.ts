"use client";

import { useEffect, useState } from "react";
import { useAccount, useDisconnect, useReconnect } from "wagmi";

const SESSION_KEY = "susuchain_session";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes

interface SessionData {
  address: string;
  chainId: number;
  createdAt: number;
  lastActivity: number;
}

export function useSessionManager() {
  const { address, chainId, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { reconnect } = useReconnect();
  const [sessionStatus, setSessionStatus] = useState<"active" | "expiring" | "expired" | "disconnected">(
    "disconnected",
  );
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Initialize or update session on connection
  useEffect(() => {
    if (isConnected && address && chainId) {
      const now = Date.now();
      const existingSession = localStorage.getItem(SESSION_KEY);

      let session: SessionData;

      if (existingSession) {
        session = JSON.parse(existingSession);
        // Update last activity
        session.lastActivity = now;
        session.address = address; // Ensure address matches
        session.chainId = chainId;
      } else {
        // Create new session
        session = {
          address,
          chainId,
          createdAt: now,
          lastActivity: now,
        };
      }

      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setSessionStatus("active");
    } else {
      setSessionStatus("disconnected");
    }
  }, [isConnected, address, chainId]);

  // Check session expiry and auto-reconnect
  useEffect(() => {
    const checkSession = () => {
      const stored = localStorage.getItem(SESSION_KEY);
      if (!stored) {
        if (isConnected) {
          // If connected but no session (e.g. cleared storage), create one
          return;
        }
        return;
      }

      const session: SessionData = JSON.parse(stored);
      const now = Date.now();
      const expiresAt = session.createdAt + SESSION_DURATION;
      const remaining = expiresAt - now;

      setTimeLeft(remaining);

      if (remaining <= 0) {
        setSessionStatus("expired");
        if (isConnected) {
          disconnect();
          localStorage.removeItem(SESSION_KEY);
        }
      } else if (remaining <= WARNING_THRESHOLD) {
        setSessionStatus("expiring");
      } else {
        setSessionStatus("active");
      }
    };

    // Check immediately
    checkSession();

    // Check every minute
    const interval = setInterval(checkSession, 60000);

    // Attempt auto-reconnect if we have a valid session but are disconnected
    // Note: Wagmi usually handles this, but this is a fallback
    if (!isConnected && localStorage.getItem(SESSION_KEY)) {
      reconnect();
    }

    return () => clearInterval(interval);
  }, [isConnected, disconnect, reconnect]);

  // Multi-tab sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SESSION_KEY) {
        if (!e.newValue) {
          // Session cleared in another tab
          if (isConnected) disconnect();
        } else {
          // Session updated
          const session = JSON.parse(e.newValue);
          if (session.address !== address && isConnected) {
            // Address changed in another tab? Rare with wallet, but possible
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [isConnected, address, disconnect]);

  return {
    sessionStatus,
    timeLeft,
    extendSession: () => {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        session.createdAt = Date.now(); // Reset start time
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        setSessionStatus("active");
      }
    },
  };
}
