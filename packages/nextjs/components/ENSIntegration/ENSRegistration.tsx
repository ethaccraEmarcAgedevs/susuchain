import { useEffect, useState } from "react";
import { formatENSName, generateGroupENSName, validateSusuENSName } from "../../utils/ens";

interface ENSRegistrationProps {
  groupName: string;
  onENSNameChange: (ensName: string) => void;
  onValidityChange: (isValid: boolean) => void;
  disabled?: boolean;
}

export const ENSRegistration = ({
  groupName,
  onENSNameChange,
  onValidityChange,
  disabled = false,
}: ENSRegistrationProps) => {
  const [ensName, setEnsName] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [error, setError] = useState("");

  // Auto-generate ENS name when group name changes
  useEffect(() => {
    if (groupName && !ensName) {
      const generated = generateGroupENSName(groupName);
      setEnsName(generated);
    }
  }, [groupName]);

  // Validate and check availability when ENS name changes
  useEffect(() => {
    const validateAndCheck = async () => {
      if (!ensName) {
        setIsValid(false);
        setError("");
        onValidityChange(false);
        return;
      }

      setIsChecking(true);
      setError("");

      try {
        // Basic format validation
        const formatValid = validateSusuENSName(ensName);
        if (!formatValid) {
          setIsValid(false);
          setError("Invalid ENS format. Must be a .susu.eth subdomain");
          onValidityChange(false);
          return;
        }

        // For demo purposes, assume all .susu.eth names are available
        setIsAvailable(true);

        // For .susu.eth subdomains, assume they're available if valid format
        if (formatValid) {
          setIsValid(true);
          onValidityChange(true);
        } else {
          setIsValid(false);
          onValidityChange(false);
        }
      } catch (error) {
        console.error("ENS validation error:", error);
        setError("Failed to check ENS availability");
        setIsValid(false);
        onValidityChange(false);
      } finally {
        setIsChecking(false);
      }
    };

    const timeoutId = setTimeout(validateAndCheck, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [ensName]); // Remove onValidityChange from dependencies to prevent infinite loop

  // Notify parent component of ENS name changes
  useEffect(() => {
    onENSNameChange(ensName);
  }, [ensName]); // Remove onENSNameChange from dependencies to prevent infinite loop

  const handleInputChange = (value: string) => {
    // Ensure it always ends with .susu.eth
    let cleanedValue = value.toLowerCase().trim();

    // Remove .susu.eth if user typed it
    if (cleanedValue.endsWith(".susu.eth")) {
      cleanedValue = cleanedValue.replace(".susu.eth", "");
    }

    // Clean up the subdomain part
    cleanedValue = cleanedValue
      .replace(/[^a-z0-9-]/g, "") // Only allow alphanumeric and hyphens
      .replace(/--+/g, "-") // Replace multiple hyphens with single
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

    const fullEnsName = cleanedValue ? `${cleanedValue}.susu.eth` : "";
    setEnsName(fullEnsName);
  };

  const getInputValue = () => {
    return ensName.replace(".susu.eth", "");
  };

  const getStatusColor = () => {
    if (!ensName) return "border-gray-300";
    if (isChecking) return "border-yellow-400";
    if (error) return "border-red-400";
    if (isValid && isAvailable) return "border-green-400";
    return "border-gray-300";
  };

  const getStatusIcon = () => {
    if (isChecking) return "⏳";
    if (error) return "❌";
    if (isValid && isAvailable) return "✅";
    return "";
  };

  return (
    <div className="space-y-2">
      <label htmlFor="ens-name" className="block text-sm font-medium text-gray-700">
        Group ENS Name
      </label>

      <div className="relative">
        <div className="flex items-center">
          <input
            id="ens-name"
            type="text"
            value={getInputValue()}
            onChange={e => handleInputChange(e.target.value)}
            disabled={disabled}
            placeholder="teachers-group"
            className={`flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder:text-gray-400 ${getStatusColor()}`}
          />
          <div className="px-3 py-2 bg-gray-50 border border-l-0 rounded-r-md text-gray-600 text-sm">.susu.eth</div>
          {getStatusIcon() && (
            <div className="absolute right-20 top-1/2 transform -translate-y-1/2">
              <span className="text-lg">{getStatusIcon()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {ensName && (
        <div className="text-sm">
          <div className="text-gray-600">
            Full ENS: <span className="font-mono">{formatENSName(ensName, 40)}</span>
          </div>
        </div>
      )}

      {isChecking && (
        <div className="text-sm text-yellow-600 flex items-center gap-1">
          <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
          Checking availability...
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 flex items-center gap-1">
          <span>❌</span>
          {error}
        </div>
      )}

      {isValid && isAvailable && (
        <div className="text-sm text-green-600 flex items-center gap-1">
          <span>✅</span>
          ENS name is available!
        </div>
      )}

      {/* Helper Text */}
      <div className="text-xs text-gray-500">
        <p>Your group will be accessible at this ENS name.</p>
        <p>Members will get subdomains like: member.{ensName.replace(".susu.eth", "")}.susu.eth</p>
      </div>
    </div>
  );
};

export default ENSRegistration;
