import { Address } from "viem";

/**
 * Referral code generation utilities
 */

const ALPHANUMERIC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No O, 0, I, 1

/**
 * Generate a random referral code
 */
export function generateRandomCode(length: number = 8): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * ALPHANUMERIC.length);
    code += ALPHANUMERIC[randomIndex];
  }
  return code;
}

/**
 * Generate deterministic code from address
 */
export function generateCodeFromAddress(address: Address): string {
  // Remove 0x prefix and take first 16 characters
  const hash = address.slice(2, 18);

  let code = "";
  for (let i = 0; i < 8; i++) {
    const hexPair = hash.slice(i * 2, i * 2 + 2);
    const index = parseInt(hexPair, 16) % ALPHANUMERIC.length;
    code += ALPHANUMERIC[index];
  }

  return code;
}

/**
 * Validate referral code format
 */
export function validateReferralCode(code: string): {
  valid: boolean;
  error?: string;
} {
  // Check length
  if (code.length < 4 || code.length > 12) {
    return {
      valid: false,
      error: "Code must be 4-12 characters long",
    };
  }

  // Check characters (alphanumeric only)
  const validPattern = /^[A-Z0-9]+$/;
  if (!validPattern.test(code)) {
    return {
      valid: false,
      error: "Code must contain only uppercase letters and numbers",
    };
  }

  // Check for confusing characters
  const confusingChars = /[O0I1]/;
  if (confusingChars.test(code)) {
    return {
      valid: false,
      error: "Code cannot contain O, 0, I, or 1",
    };
  }

  return { valid: true };
}

/**
 * Suggest available codes based on a desired code
 */
export function suggestCodes(desiredCode: string, count: number = 5): string[] {
  const suggestions: string[] = [];
  const baseCode = desiredCode.toUpperCase().replace(/[O0I1]/g, "");

  // Add variations
  for (let i = 0; i < count; i++) {
    let suggestion = baseCode;

    // Add random suffix if needed
    if (suggestion.length < 8) {
      const needed = 8 - suggestion.length;
      for (let j = 0; j < needed; j++) {
        suggestion += ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)];
      }
    }

    // Add random characters for variation
    if (i > 0) {
      suggestion += ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)];
    }

    suggestions.push(suggestion.slice(0, 8));
  }

  return [...new Set(suggestions)]; // Remove duplicates
}

/**
 * Format code for display (add dashes)
 */
export function formatCodeForDisplay(code: string): string {
  if (code.length <= 4) return code;
  if (code.length <= 8) return `${code.slice(0, 4)}-${code.slice(4)}`;
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`;
}

/**
 * Parse formatted code (remove dashes)
 */
export function parseFormattedCode(formattedCode: string): string {
  return formattedCode.replace(/-/g, "").toUpperCase();
}

/**
 * Generate QR code data URL
 */
export function generateReferralLink(code: string, baseUrl?: string): string {
  const base = baseUrl || typeof window !== "undefined" ? window.location.origin : "";
  return `${base}?ref=${code}`;
}

/**
 * Extract referral code from URL
 */
export function extractReferralCodeFromURL(url?: string): string | null {
  if (typeof window === "undefined" && !url) return null;

  const urlString = url || window.location.href;
  const urlObj = new URL(urlString);
  const refParam = urlObj.searchParams.get("ref");

  if (refParam) {
    const parsed = parseFormattedCode(refParam);
    const validation = validateReferralCode(parsed);
    return validation.valid ? parsed : null;
  }

  return null;
}

/**
 * Store referral code in localStorage
 */
export function storeReferralCode(code: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("susuchain_referral", code);
    localStorage.setItem("susuchain_referral_timestamp", Date.now().toString());
  }
}

/**
 * Get stored referral code
 */
export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;

  const code = localStorage.getItem("susuchain_referral");
  const timestamp = localStorage.getItem("susuchain_referral_timestamp");

  // Expire after 30 days
  if (code && timestamp) {
    const age = Date.now() - parseInt(timestamp);
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    if (age < thirtyDays) {
      return code;
    } else {
      // Clear expired code
      clearStoredReferralCode();
    }
  }

  return null;
}

/**
 * Clear stored referral code
 */
export function clearStoredReferralCode(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("susuchain_referral");
    localStorage.removeItem("susuchain_referral_timestamp");
  }
}

/**
 * Generate shareable message
 */
export function generateShareMessage(code: string, referrerName?: string): string {
  const name = referrerName || "A friend";
  return `${name} invited you to join SusuChain! Use code ${formatCodeForDisplay(code)} to get started and earn rewards together. 🚀`;
}

/**
 * Generate social share URLs
 */
export function generateSocialShareURLs(code: string, referrerName?: string): {
  twitter: string;
  telegram: string;
  whatsapp: string;
  facebook: string;
} {
  const link = generateReferralLink(code);
  const message = generateShareMessage(code, referrerName);
  const encodedMessage = encodeURIComponent(message);
  const encodedLink = encodeURIComponent(link);

  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedLink}`,
    telegram: `https://t.me/share/url?url=${encodedLink}&text=${encodedMessage}`,
    whatsapp: `https://wa.me/?text=${encodedMessage}%20${encodedLink}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`,
  };
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        textArea.remove();
        return true;
      } catch (err) {
        textArea.remove();
        return false;
      }
    }
  } catch (err) {
    console.error("Failed to copy:", err);
    return false;
  }
}
