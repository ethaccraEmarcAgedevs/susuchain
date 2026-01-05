import { ethers } from "hardhat";
import { AutomateSDK } from "@gelatonetwork/automate-sdk";

/**
 * Setup script for Gelato automation
 * Configures Gelato executor and creates initial tasks
 */

const GELATO_AUTOMATE_ADDRESS = "0x2A6C106ae13B558BB9E2Ec64Bd2f1f7BEFF3A5E0";

async function main() {
  const [deployer] = await ethers.getSigners();
  const chainId = (await ethers.provider.getNetwork()).chainId;

  console.log("Setting up Gelato automation on chain:", chainId);
  console.log("Deployer address:", deployer.address);

  // Initialize Gelato SDK
  const automate = new AutomateSDK(Number(chainId), deployer);

  console.log("\n=== Gelato Setup ===\n");

  // 1. Check Gelato 1Balance
  try {
    const balance = await automate.getBalance();
    console.log("Current Gelato 1Balance:", ethers.formatEther(balance), "ETH");

    if (BigInt(balance) < ethers.parseEther("0.01")) {
      console.log("\n⚠️  Warning: Low Gelato 1Balance. Consider funding for automation.");
      console.log("Fund via: https://app.gelato.network");
    }
  } catch (error) {
    console.log("Could not fetch 1Balance (might need to fund first)");
  }

  // 2. Get SusuFactory address
  const susuFactory = await ethers.getContract("SusuFactory");
  console.log("\nSusuFactory address:", await susuFactory.getAddress());

  // 3. Get recent groups
  const recentGroups = await susuFactory.getRecentGroups(5);
  console.log("\nRecent groups:", recentGroups.length);

  // 4. Setup automation for each group
  for (const groupAddress of recentGroups) {
    console.log(`\n--- Setting up automation for group: ${groupAddress} ---`);

    const susuGroup = await ethers.getContractAt("SusuGroup", groupAddress);

    // Set Gelato executor (if not already set)
    const currentExecutor = await susuGroup.gelatoExecutor();

    if (currentExecutor === ethers.ZeroAddress) {
      console.log("Setting Gelato executor...");

      // Set dedicated msg.sender from Gelato
      const tx = await susuGroup.setGelatoExecutor(GELATO_AUTOMATE_ADDRESS);
      await tx.wait();

      console.log("✅ Gelato executor set");
    } else {
      console.log("Gelato executor already set:", currentExecutor);
    }

    // Get group info
    const groupInfo = await susuGroup.getGroupInfo();
    const groupName = groupInfo[0];
    const isActive = groupInfo[7];

    console.log("Group name:", groupName);
    console.log("Active:", isActive);

    if (!isActive) {
      console.log("⏭️  Skipping inactive group");
      continue;
    }

    // Create Gelato task
    try {
      const { taskId } = await automate.createTask({
        execAddress: groupAddress,
        execSelector: "0x8c7d3c6a", // executeScheduledPayout()
        dedicatedMsgSender: true,
        name: `SusuChain - ${groupName}`,
        resolverAddress: groupAddress,
        resolverData: "0x75d5ae14", // canExecutePayout()
      });

      console.log("✅ Created Gelato task:", taskId);
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        console.log("⏭️  Task already exists for this group");
      } else {
        console.error("❌ Error creating task:", error.message);
      }
    }
  }

  console.log("\n=== Setup Complete ===\n");
  console.log("Next steps:");
  console.log("1. Fund Gelato 1Balance at: https://app.gelato.network");
  console.log("2. Monitor tasks at: https://app.gelato.network/tasks");
  console.log("3. Automated payouts will trigger based on deadlines");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
