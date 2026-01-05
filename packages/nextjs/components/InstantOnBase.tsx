"use client";

interface InstantOnBaseProps {
  variant?: "badge" | "banner";
  className?: string;
}

/**
 * Badge/Banner showing Base's instant finality
 */
export const InstantOnBase = ({ variant = "badge", className = "" }: InstantOnBaseProps) => {
  if (variant === "banner") {
    return (
      <div className={`flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-[#0052FF] to-[#0066FF] rounded-lg ${className}`}>
        <svg className="w-5 h-5 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="text-white font-semibold">Instant on Base - No waiting for confirmations!</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0052FF] text-white rounded-full text-xs font-medium ${className}`}>
      <svg className="w-3 h-3 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span>Instant on Base</span>
    </div>
  );
};
