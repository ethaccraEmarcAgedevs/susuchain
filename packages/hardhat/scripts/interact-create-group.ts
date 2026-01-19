import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as readline from "readline";

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

/**
 * Interactive script to create a Susu group on-chain
 * Run: npx hardhat run scripts/interact-create-group.ts --network base
 */
async function main() {
  console.log("\n🏗️  Create Susu Group - Interactive Script\n");

  const factoryAddress = process.env.SUSU_FACTORY_ADDRESS;
  if (!factoryAddress) {
    throw new Error("SUSU_FACTORY_ADDRESS not set in .env file");
  }

  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();
  const balance = await ethers.provider.getBalance(signerAddress);

  console.log("Your Address:", signerAddress);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Factory:", factoryAddress);

  const susuFactory = await ethers.getContractAt("SusuFactory", factoryAddress);

  console.log("\n📋 Let's create your Susu group!\n");

  // Get group details
  const groupName = await question("Group Name (e.g., 'Teachers Savings Circle'): ");
  const ensName = await question("ENS Name (e.g., 'teachers-jan-2024'): ");
  const contributionAmount = await question("Contribution Amount in ETH (e.g., 0.1): ");
  const intervalDays = await question("Contribution Interval in days (e.g., 7): ");
  const maxMembers = await question("Maximum Members (2-20): ");

  const useUSD = await question("Use USD-denominated contributions? (yes/no): ");
  const isUSDDenominated = useUSD.toLowerCase() === "yes";

  const useRandomPayout = await question("Use random payout order (VRF)? (yes/no): ");
  const useVRF = useRandomPayout.toLowerCase() === "yes";

  console.log("\n📊 Group Configuration:");
  console.log("  Name:", groupName);
  console.log("  ENS:", ensName);
  console.log("  Contribution:", contributionAmount, "ETH");
  console.log("  Interval:", intervalDays, "days");
  console.log("  Max Members:", maxMembers);
  console.log("  USD Denominated:", isUSDDenominated);
  console.log("  Random Payout:", useVRF);

  const confirm = await question("\nProceed with creation? (yes/no): ");
  if (confirm.toLowerCase() !== "yes") {
    console.log("❌ Cancelled");
    rl.close();
    return;
  }

  console.log("\n🚀 Creating group on-chain...");

  // Price feed for Base mainnet
  const priceFeedAddress = isUSDDenominated
    ? "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70" // ETH/USD on Base
    : ethers.ZeroAddress;

  try {
    const tx = await susuFactory.createSusuGroup(
      groupName,
      ensName,
      ethers.parseEther(contributionAmount),
      parseInt(intervalDays) * 24 * 60 * 60, // days to seconds
      parseInt(maxMembers),
      ethers.ZeroAddress, // ETH as contribution asset
      0, // Basic collateral tier
      ethers.ZeroAddress, // No Aave pool for now
      priceFeedAddress,
      isUSDDenominated,
      useVRF,
    );

    console.log("⏳ Transaction submitted:", tx.hash);
    console.log("   Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");

    // Find GroupCreated event
    const event = receipt?.logs.find((log: any) => {
      try {
        const parsed = susuFactory.interface.parseLog(log);
        return parsed?.name === "GroupCreated";
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = susuFactory.interface.parseLog(event);
      const groupAddress = parsed?.args?.groupAddress;

      console.log("\n🎉 Group Created Successfully!");
      console.log("=".repeat(60));
      console.log("Group Address:", groupAddress);
      console.log("View on BaseScan:", `https://basescan.org/address/${groupAddress}`);
      console.log("=".repeat(60));

      console.log("\n💾 Save this group address:");
      console.log(`export GROUP_ADDRESS=${groupAddress}`);

      console.log("\n✨ Next Steps:");
      console.log("1. Share the group address with members");
      console.log("2. Members join with:");
      console.log("   npx hardhat run scripts/interact-join-group.ts --network base");
      console.log("3. Check group status:");
      console.log("   npx hardhat run scripts/interact-status.ts --network base");
    }
  } catch (error: any) {
    console.error("\n❌ Error creating group:", error.message);
  }

  rl.close();
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
