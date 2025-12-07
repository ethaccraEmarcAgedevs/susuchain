"use client";

import { useEffect, useState } from "react";
import { checkBasenameAvailability, generateGroupBaseName, isValidBaseName } from "~~/utils/basenames";

interface BasenameRegistrationProps {
  groupName: string;
  onBasenameChange?: (basename: string, isValid: boolean) => void;
}

/**
 * Base Name registration component for group creation
 * Allows groups to claim .base.eth names
 */
export default function BasenameRegistration({ groupName, onBasenameChange }: BasenameRegistrationProps) {
  const [basename, setBasename] = useState<string>("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string>("");

  // Generate suggested basename when group name changes
  useEffect(() => {
    if (groupName) {
      const suggested = generateGroupBaseName(groupName);
      setBasename(suggested);
    }
  }, [groupName]);

  // Check availability when basename changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (!basename) {
        setIsAvailable(null);
        setError("");
        onBasenameChange?.("", false);
        return;
      }

      // Validate format first
      if (!isValidBaseName(basename)) {
        setIsAvailable(false);
        setError("Invalid Base Name format. Must be lowercase alphanumeric with hyphens, ending in .base.eth");
        onBasenameChange?.(basename, false);
        return;
      }

      setIsChecking(true);
      setError("");

      try {
        const available = await checkBasenameAvailability(basename);
        setIsAvailable(available);

        if (!available) {
          setError("This Base Name is already taken");
        }

        onBasenameChange?.(basename, available);
      } catch (err) {
        console.error("Error checking availability:", err);
        setError("Error checking availability");
        setIsAvailable(null);
        onBasenameChange?.(basename, false);
      } finally {
        setIsChecking(false);
      }
    };

    const debounceTimer = setTimeout(checkAvailability, 500);
    return () => clearTimeout(debounceTimer);
  }, [basename, onBasenameChange]);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Base Name (Optional)
          <span className="ml-2 text-xs text-gray-500">Claim a .base.eth name for your group</span>
        </label>

        <div className="relative">
          <input
            type="text"
            value={basename}
            onChange={e => setBasename(e.target.value.toLowerCase())}
            placeholder="my-group.base.eth"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {isChecking && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {!isChecking && isAvailable === true && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}

          {!isChecking && isAvailable === false && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
      )}

      {isAvailable === true && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          This Base Name is available!
        </div>
      )}

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-1">Why claim a Base Name?</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Easy-to-remember identity for your group</li>
          <li>• Members can get subnames (member1.yourgroup.base.eth)</li>
          <li>• Permanent on-chain record</li>
          <li>• Transferable ownership</li>
        </ul>
      </div>
    </div>
  );
}
