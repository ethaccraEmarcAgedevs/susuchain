import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Verify deployed contracts on BaseScan
 * Run: npx hardhat run scripts/verify-contracts.ts --network base
 */
async function main() {
  console.log("\n🔍 Verify Contracts on BaseScan\n");

  const susuTokenAddress = process.env.SUSU_TOKEN_ADDRESS;
  const susuFactoryAddress = process.env.SUSU_FACTORY_ADDRESS;
  const susuFactoryViewsAddress = process.env.SUSU_FACTORY_VIEWS_ADDRESS;

  if (!susuTokenAddress || !susuFactoryAddress || !susuFactoryViewsAddress) {
    console.error("❌ Missing contract addresses in .env file!");
    console.log("Please add:");
    console.log("  SUSU_TOKEN_ADDRESS=0x...");
    console.log("  SUSU_FACTORY_ADDRESS=0x...");
    console.log("  SUSU_FACTORY_VIEWS_ADDRESS=0x...");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  console.log("Deployer Address:", deployerAddress);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("\nContract Addresses:");
  console.log("  SusuToken:        ", susuTokenAddress);
  console.log("  SusuFactory:      ", susuFactoryAddress);
  console.log("  SusuFactoryViews: ", susuFactoryViewsAddress);

  console.log("\n⏳ Starting verification process...\n");

  try {
    console.log("📝 Verifying SusuToken...");
    await verifyContract(susuTokenAddress, [deployerAddress]);

    console.log("\n📝 Verifying SusuFactory...");
    await verifyContract(susuFactoryAddress, [deployerAddress]);

    console.log("\n📝 Verifying SusuFactoryViews...");
    await verifyContract(susuFactoryViewsAddress, [susuFactoryAddress]);

    console.log("\n✅ All contracts verified successfully!");
    console.log("\n🔗 View on BaseScan:");
    console.log(`   SusuToken:        https://basescan.org/address/${susuTokenAddress}#code`);
    console.log(`   SusuFactory:      https://basescan.org/address/${susuFactoryAddress}#code`);
    console.log(`   SusuFactoryViews: https://basescan.org/address/${susuFactoryViewsAddress}#code`);
  } catch (error: any) {
    console.error("\n❌ Verification error:", error.message);
    console.log("\n💡 Troubleshooting:");
    console.log("1. Make sure BASESCAN_API_KEY is set in .env");
    console.log("2. Wait a few minutes and try again (BaseScan needs time to index)");
    console.log("3. Check if contracts are already verified on BaseScan");
    console.log("\n📌 Manual verification commands:");
    console.log(`   npx hardhat verify --network base ${susuTokenAddress} "${deployerAddress}"`);
    console.log(`   npx hardhat verify --network base ${susuFactoryAddress} "${deployerAddress}"`);
    console.log(`   npx hardhat verify --network base ${susuFactoryViewsAddress} "${susuFactoryAddress}"`);
    process.exit(1);
  }
}

async function verifyContract(address: string, constructorArguments: any[]) {
  const hre = require("hardhat");

  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArguments,
    });
    console.log(`   ✅ ${address} verified`);
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`   ℹ️  ${address} already verified`);
    } else if (error.message.includes("does not have bytecode")) {
      throw new Error(`Contract not found at ${address}. Check the address.`);
    } else if (error.message.includes("Invalid API Key")) {
      throw new Error("Invalid BaseScan API key. Set BASESCAN_API_KEY in .env");
    } else {
      throw error;
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
