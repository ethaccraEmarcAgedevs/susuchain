"use client";

import { Fragment } from "react";
import { XMarkIcon, ExclamationTriangleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { ParsedError, AppKitErrorType } from "~~/utils/appkit-error-parser";

interface ConnectionErrorModalProps {
  isOpen: boolean;
  error: ParsedError | null;
  onClose: () => void;
  onRetry?: () => void;
  attemptNumber?: number;
  maxAttempts?: number;
  isRetrying?: boolean;
}

export const ConnectionErrorModal = ({
  isOpen,
  error,
  onClose,
  onRetry,
  attemptNumber = 0,
  maxAttempts = 3,
  isRetrying = false,
}: ConnectionErrorModalProps) => {
  if (!isOpen || !error) return null;

  const canRetry = error.retryable && attemptNumber < maxAttempts;
  const showRetryButton = canRetry && onRetry && !error.requiresUserAction;

  const getErrorIcon = () => {
    switch (error.type) {
      case AppKitErrorType.USER_REJECTED:
        return "text-yellow-500";
      case AppKitErrorType.NETWORK_MISMATCH:
      case AppKitErrorType.CHAIN_NOT_SUPPORTED:
        return "text-orange-500";
      case AppKitErrorType.SESSION_EXPIRED:
      case AppKitErrorType.QR_CODE_EXPIRED:
        return "text-blue-500";
      default:
        return "text-red-500";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Icon */}
          <div className="flex items-center justify-center mb-4">
            <div className={`w-16 h-16 rounded-full bg-opacity-10 flex items-center justify-center ${getErrorIcon()} bg-current`}>
              <ExclamationTriangleIcon className={`h-8 w-8 ${getErrorIcon()}`} />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{error.userMessage}</h3>
            <p className="text-sm text-gray-600 mb-4">{error.action}</p>

            {/* Retry info */}
            {canRetry && attemptNumber > 0 && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                <ArrowPathIcon className="h-4 w-4" />
                Attempt {attemptNumber} of {maxAttempts}
              </div>
            )}
          </div>

          {/* Error details (collapsible) */}
          {error.message && (
            <details className="mb-4">
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700 font-medium">
                Technical details
              </summary>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <code className="text-xs text-gray-700 break-all">{error.message}</code>
              </div>
            </details>
          )}

          {/* Help link */}
          {error.helpLink && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900 mb-2">Need help?</p>
              <a
                href={error.helpLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
              >
                View documentation →
              </a>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>

            {showRetryButton && (
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isRetrying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-5 w-5" />
                    Try Again
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
