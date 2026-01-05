import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { Contract } from "ethers";

/**
 * Gelato Web3 Function for automated Susu group payout execution
 * Monitors all active groups and triggers payouts when conditions are met
 */

const SUSU_GROUP_ABI = [
  "function canExecutePayout() external view returns (bool canExec, bytes memory execPayload)",
  "function executeScheduledPayout() external",
  "function groupActive() external view returns (bool)",
  "function currentRound() external view returns (uint256)",
  "function roundDeadline() external view returns (uint256)",
  "function getTimeUntilDeadline() external view returns (uint256)",
];

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, storage, multiChainProvider } = context;

  // Get user arguments
  const groupAddress = userArgs.groupAddress as string;

  if (!groupAddress) {
    return { canExec: false, message: "Missing group address" };
  }

  // Get provider for Base network
  const provider = multiChainProvider.default();

  // Create contract instance
  const susuGroup = new Contract(groupAddress, SUSU_GROUP_ABI, provider);

  try {
    // Check if group is still active
    const isActive = await susuGroup.groupActive();

    if (!isActive) {
      return {
        canExec: false,
        message: `Group ${groupAddress} is no longer active`,
      };
    }

    // Call the checker function
    const [canExec, execPayload] = await susuGroup.canExecutePayout();

    if (!canExec) {
      // Get additional context for logging
      const currentRound = await susuGroup.currentRound();
      const timeRemaining = await susuGroup.getTimeUntilDeadline();

      return {
        canExec: false,
        message: `Waiting for round ${currentRound}. Time until deadline: ${timeRemaining}s`,
      };
    }

    // Payout can be executed
    const currentRound = await susuGroup.currentRound();

    return {
      canExec: true,
      callData: [
        {
          to: groupAddress,
          data: execPayload,
        },
      ],
      message: `Executing payout for round ${currentRound} of group ${groupAddress}`,
    };
  } catch (error: any) {
    return {
      canExec: false,
      message: `Error checking payout: ${error.message}`,
    };
  }
});
