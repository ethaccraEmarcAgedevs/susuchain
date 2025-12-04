"use client";

import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  AppKitErrorType,
  ParsedError,
  getExponentialBackoffDelay,
  getRetryMessage as getRetryMsg,
  isRetryableError,
  parseAppKitError,
} from "~~/utils/appkit-error-parser";

const MAX_RETRY_ATTEMPTS = 3;

/**
 * Hook for handling wallet connection errors with user-friendly messages and retry logic
 */
export function useWalletErrors() {
  const [currentError, setCurrentError] = useState<ParsedError | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = undefined;
    }
  }, []);

  const resetRetryState = useCallback(() => {
    setAttemptNumber(0);
    setIsRetrying(false);
    clearRetryTimeout();
  }, [clearRetryTimeout]);

  const handleWalletError = useCallback(
    (error: any, retryCallback?: () => Promise<void>) => {
      const parsedError = parseAppKitError(error);
      setCurrentError(parsedError);

      // Show toast for quick feedback
      toast.error(
        <div className="text-sm">
          <p className="font-semibold mb-1">{parsedError.userMessage}</p>
          <p className="text-xs opacity-90">{parsedError.action}</p>
        </div>,
        {
          duration: 5000,
          position: "top-right",
        },
      );

      // Handle automatic retry for retryable errors
      if (
        retryCallback &&
        isRetryableError(error) &&
        attemptNumber < MAX_RETRY_ATTEMPTS &&
        parsedError.type !== AppKitErrorType.USER_REJECTED
      ) {
        const nextAttempt = attemptNumber + 1;
        setAttemptNumber(nextAttempt);
        setIsRetrying(true);

        const delay = getExponentialBackoffDelay(nextAttempt);

        toast.loading(getRetryMsg(nextAttempt, MAX_RETRY_ATTEMPTS), {
          duration: delay,
        });

        clearRetryTimeout();
        retryTimeoutRef.current = setTimeout(async () => {
          try {
            await retryCallback();
            resetRetryState();
            toast.success("Connection successful!");
          } catch (retryError) {
            handleWalletError(retryError, retryCallback);
          } finally {
            setIsRetrying(false);
          }
        }, delay);
      } else {
        resetRetryState();
      }

      // Open modal for errors requiring user action
      if (parsedError.requiresUserAction || attemptNumber >= MAX_RETRY_ATTEMPTS) {
        setIsModalOpen(true);
      }
    },
    [attemptNumber, resetRetryState, clearRetryTimeout],
  );

  const closeErrorModal = useCallback(() => {
    setIsModalOpen(false);
    setCurrentError(null);
    resetRetryState();
  }, [resetRetryState]);

  const retryConnection = useCallback(
    async (retryCallback?: () => Promise<void>) => {
      if (!retryCallback) return;

      setIsRetrying(true);
      try {
        await retryCallback();
        toast.success("Connection successful!");
        closeErrorModal();
      } catch (error) {
        handleWalletError(error, retryCallback);
      } finally {
        setIsRetrying(false);
      }
    },
    [handleWalletError, closeErrorModal],
  );

  return {
    handleWalletError,
    currentError,
    isModalOpen,
    closeErrorModal,
    retryConnection,
    attemptNumber,
    isRetrying,
    maxAttempts: MAX_RETRY_ATTEMPTS,
  };
}

// Re-export getRetryMessage for convenience
export { getRetryMsg as getRetryMessage };
