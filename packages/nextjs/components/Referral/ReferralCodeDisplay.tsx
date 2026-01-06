"use client";

import { useState } from "react";
import {
  formatCodeForDisplay,
  generateReferralLink,
  copyToClipboard,
  generateSocialShareURLs,
} from "~~/services/referral/code-generator";

interface ReferralCodeDisplayProps {
  code: string;
}

export function ReferralCodeDisplay({ code }: ReferralCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const formattedCode = formatCodeForDisplay(code);
  const referralLink = generateReferralLink(code);
  const socialURLs = generateSocialShareURLs(code);

  const handleCopyCode = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(referralLink);
    if (success) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  return (
    <div className="card bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-2xl">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4">Your Referral Code</h2>

        {/* Code Display */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
          <div className="text-center">
            <p className="text-sm opacity-80 mb-2">Your Code</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl font-mono font-bold tracking-wider">{formattedCode}</span>
              <button
                onClick={handleCopyCode}
                className="btn btn-circle btn-sm bg-white/20 hover:bg-white/30 border-none"
                title="Copy code"
              >
                {copied ? "✓" : "📋"}
              </button>
            </div>
          </div>
        </div>

        {/* Link Display */}
        <div className="mb-6">
          <p className="text-sm opacity-80 mb-2">Referral Link</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="input input-bordered bg-white/10 border-white/20 flex-1 text-white"
            />
            <button
              onClick={handleCopyLink}
              className="btn bg-white/20 hover:bg-white/30 border-none"
            >
              {linkCopied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </div>

        {/* Share Buttons */}
        <div>
          <p className="text-sm opacity-80 mb-3">Share on</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <a
              href={socialURLs.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-white/20 hover:bg-white/30 border-none"
            >
              <span className="text-xl">𝕏</span>
              Twitter
            </a>
            <a
              href={socialURLs.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-white/20 hover:bg-white/30 border-none"
            >
              <span className="text-xl">📱</span>
              Telegram
            </a>
            <a
              href={socialURLs.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-white/20 hover:bg-white/30 border-none"
            >
              <span className="text-xl">💬</span>
              WhatsApp
            </a>
            <a
              href={socialURLs.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-white/20 hover:bg-white/30 border-none"
            >
              <span className="text-xl">👥</span>
              Facebook
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
