import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

/**
 * Check if everything is ready for mainnet deployment
 * Run: npx hardhat run scripts/check-deployment-ready.ts --network base
 */
async function main() {
  console.log("\n🔍 Deployment Readiness Check\n");
  console.log("=".repeat(60));

  let allChecks = true;

  // Check 1: Network
  try {
    const network = await ethers.provider.getNetwork();
    console.log("✅ Network: " + network.name + " (Chain ID: " + network.chainId + ")");
  } catch (error) {
    console.log("❌ Network: Unable to connect");
    allChecks = false;
  }

  // Check 2: Deployer Account
  try {
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    console.log("✅ Deployer Address: " + deployerAddress);

    // Check 3: Balance
    const balance = await ethers.provider.getBalance(deployerAddress);
    const balanceInEth = ethers.formatEther(balance);
    console.log("💰 Balance: " + balanceInEth + " ETH");

    if (balance < ethers.parseEther("0.01")) {
      console.log("⚠️  Warning: Low balance! Need at least 0.02 ETH for deployment");
      console.log("   Bridge ETH to Base: https://bridge.base.org/");
      allChecks = false;
    } else {
      console.log("✅ Sufficient balance for deployment");
    }
  } catch (error: any) {
    console.log("❌ Deployer Account: Not configured");
    console.log("   Run: yarn account:import");
    allChecks = false;
  }

  // Check 4: BaseScan API Key
  const basescanKey = process.env.BASESCAN_API_KEY;
  if (basescanKey && basescanKey.length > 0) {
    console.log("✅ BaseScan API Key: Configured (" + basescanKey.substring(0, 8) + "...)");
  } else {
    console.log("⚠️  BaseScan API Key: Not set (verification will fail)");
    console.log("   Add BASESCAN_API_KEY to .env file");
  }

  // Check 5: .env file
  if (fs.existsSync(".env")) {
    console.log("✅ .env file: Exists");
  } else {
    console.log("❌ .env file: Missing");
    console.log("   Copy .env.example to .env and fill in values");
    allChecks = false;
  }

  // Check 6: Contracts compiled
  try {
    const SusuFactory = await ethers.getContractFactory("SusuFactory");
    console.log("✅ Contracts: Compiled");
  } catch (error) {
    console.log("⚠️  Contracts: Not compiled");
    console.log("   Run: npm run compile");
  }

  console.log("=".repeat(60));

  if (allChecks) {
    console.log("\n🎉 Ready to Deploy!");
    console.log("\nRun deployment:");
    console.log("  npx hardhat run scripts/deploy-mainnet.ts --network base");
    console.log("\nOr use quick deploy:");
    console.log("  ./scripts/quick-deploy.sh base");
  } else {
    console.log("\n❌ Not Ready - Please fix the issues above");
    console.log("\nQuick Setup:");
    console.log("1. Import your private key:");
    console.log("   yarn account:import");
    console.log("2. Fund your account with ETH on Base:");
    console.log("   https://bridge.base.org/");
    console.log("3. Compile contracts:");
    console.log("   npm run compile");
  }

  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
