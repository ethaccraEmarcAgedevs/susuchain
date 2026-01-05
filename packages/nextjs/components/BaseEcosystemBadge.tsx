"use client";

interface BaseEcosystemBadgeProps {
  variant?: "full" | "compact" | "icon";
  showGrant?: boolean;
  className?: string;
}

/**
 * Display Base ecosystem affiliation badges
 * Shows "Built on Base" and optional grant/ecosystem participation
 */
export const BaseEcosystemBadge = ({
  variant = "compact",
  showGrant = false,
  className = "",
}: BaseEcosystemBadgeProps) => {
  if (variant === "icon") {
    return (
      <a
        href="https://base.org"
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center w-8 h-8 bg-[#0052FF] rounded-full hover:bg-[#0066FF] transition-colors ${className}`}
        title="Built on Base"
      >
        <span className="text-white font-bold text-sm">B</span>
      </a>
    );
  }

  if (variant === "compact") {
    return (
      <a
        href="https://base.org"
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-3 py-1.5 bg-[#0052FF] text-white rounded-lg hover:bg-[#0066FF] transition-colors ${className}`}
      >
        <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
          <span className="text-[#0052FF] font-bold text-xs">B</span>
        </div>
        <span className="text-sm font-semibold">Built on Base</span>
      </a>
    );
  }

  // Full variant with additional info
  return (
    <div className={`inline-flex flex-col gap-2 ${className}`}>
      <a
        href="https://base.org"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0052FF] text-white rounded-lg hover:bg-[#0066FF] transition-colors"
      >
        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
          <span className="text-[#0052FF] font-bold text-sm">B</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Built on Base</span>
          <span className="text-xs opacity-90">by Coinbase</span>
        </div>
      </a>

      {showGrant && (
        <a
          href="https://paragraph.xyz/@grants.base.eth/calling-based-builders"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-semibold">Base Ecosystem</span>
        </a>
      )}
    </div>
  );
};

/**
 * Base OnChain Summer badge
 */
export const OnChainSummerBadge = ({ className = "" }: { className?: string }) => {
  return (
    <a
      href="https://onchainsummer.xyz"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-colors ${className}`}
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
          clipRule="evenodd"
        />
      </svg>
      <span className="text-sm font-semibold">OnChain Summer</span>
    </a>
  );
};
