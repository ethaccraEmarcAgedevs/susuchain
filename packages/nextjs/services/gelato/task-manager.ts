import { AutomateSDK } from "@gelatonetwork/automate-sdk";
import { Address } from "viem";

/**
 * Gelato Task Manager for SusuChain
 * Manages automated payout execution tasks
 */

// Gelato Automate contract on Base
export const GELATO_AUTOMATE_ADDRESS = "0x2A6C106ae13B558BB9E2Ec64Bd2f1f7BEFF3A5E0";

export interface GelatoTask {
  taskId: string;
  groupAddress: Address;
  name: string;
  active: boolean;
  lastExecuted?: number;
  nextExecution?: number;
}

/**
 * Initialize Gelato Automate SDK
 */
export function initializeGelatoSDK(chainId: number, signer: any): AutomateSDK {
  return new AutomateSDK(chainId, signer);
}

/**
 * Create automated task for a Susu group
 */
export async function createPayoutTask(
  groupAddress: Address,
  groupName: string,
  chainId: number,
  signer: any,
): Promise<string> {
  try {
    const automate = initializeGelatoSDK(chainId, signer);

    // Create task using Gelato Automate
    const { taskId } = await automate.createTask({
      execAddress: groupAddress,
      execSelector: "0x8c7d3c6a", // executeScheduledPayout() selector
      dedicatedMsgSender: true,
      name: `SusuChain Payout - ${groupName}`,
      resolverAddress: groupAddress,
      resolverData: "0x75d5ae14", // canExecutePayout() selector
    });

    console.log(`Created Gelato task ${taskId} for group ${groupAddress}`);
    return taskId;
  } catch (error) {
    console.error("Error creating Gelato task:", error);
    throw error;
  }
}

/**
 * Cancel automated task
 */
export async function cancelPayoutTask(taskId: string, chainId: number, signer: any): Promise<void> {
  try {
    const automate = initializeGelatoSDK(chainId, signer);
    await automate.cancelTask(taskId);
    console.log(`Cancelled Gelato task ${taskId}`);
  } catch (error) {
    console.error("Error cancelling Gelato task:", error);
    throw error;
  }
}

/**
 * Get task status
 */
export async function getTaskStatus(taskId: string, chainId: number, signer: any): Promise<any> {
  try {
    const automate = initializeGelatoSDK(chainId, signer);
    const taskState = await automate.getTaskState(taskId);
    return taskState;
  } catch (error) {
    console.error("Error getting task status:", error);
    throw error;
  }
}

/**
 * Get all tasks for a group
 */
export async function getGroupTasks(groupAddress: Address, chainId: number, signer: any): Promise<GelatoTask[]> {
  try {
    const automate = initializeGelatoSDK(chainId, signer);
    const tasks = await automate.getActiveTasks();

    // Filter tasks for this group
    const groupTasks = tasks.filter((task: any) => task.execAddress.toLowerCase() === groupAddress.toLowerCase());

    return groupTasks.map((task: any) => ({
      taskId: task.taskId,
      groupAddress: task.execAddress as Address,
      name: task.name || `Task ${task.taskId.slice(0, 8)}`,
      active: true,
      lastExecuted: task.lastExecuted,
      nextExecution: task.nextExecution,
    }));
  } catch (error) {
    console.error("Error getting group tasks:", error);
    return [];
  }
}

/**
 * Fund Gelato 1Balance for gas sponsorship
 */
export async function fundGelato1Balance(amount: bigint, chainId: number, signer: any): Promise<void> {
  try {
    const automate = initializeGelatoSDK(chainId, signer);
    // Deposit to 1Balance
    await automate.depositFunds(amount);
    console.log(`Deposited ${amount} to Gelato 1Balance`);
  } catch (error) {
    console.error("Error funding Gelato 1Balance:", error);
    throw error;
  }
}

/**
 * Get Gelato 1Balance balance
 */
export async function getGelato1Balance(chainId: number, signer: any): Promise<bigint> {
  try {
    const automate = initializeGelatoSDK(chainId, signer);
    const balance = await automate.getBalance();
    return BigInt(balance);
  } catch (error) {
    console.error("Error getting Gelato 1Balance:", error);
    return BigInt(0);
  }
}

/**
 * Estimate task execution cost
 */
export function estimateTaskCost(contributionInterval: number): bigint {
  // Estimate based on Base gas costs
  // Average execution: ~100k gas * 0.001 gwei (Base gas price) = ~0.0001 ETH per execution
  const estimatedGas = BigInt(100000);
  const baseGasPrice = BigInt(1000000); // 0.001 gwei in wei

  const executionsPerMonth = BigInt(Math.floor((30 * 24 * 60 * 60) / contributionInterval));
  const costPerExecution = estimatedGas * baseGasPrice;

  return costPerExecution * executionsPerMonth;
}

/**
 * Get task execution history
 */
export async function getTaskExecutions(
  taskId: string,
  chainId: number,
  signer: any,
): Promise<{ timestamp: number; success: boolean; gasUsed: bigint }[]> {
  try {
    const automate = initializeGelatoSDK(chainId, signer);
    const executions = await automate.getTaskExecutions(taskId);

    return executions.map((exec: any) => ({
      timestamp: exec.timestamp,
      success: exec.success,
      gasUsed: BigInt(exec.gasUsed || 0),
    }));
  } catch (error) {
    console.error("Error getting task executions:", error);
    return [];
  }
}
