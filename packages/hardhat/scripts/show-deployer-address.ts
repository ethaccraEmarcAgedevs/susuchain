import * as dotenv from "dotenv";
dotenv.config();
import { ethers, Wallet } from "ethers";
import password from "@inquirer/password";

/**
 * Show your deployer address (decrypts encrypted key)
 * Run: npx hardhat run scripts/show-deployer-address.ts
 */
async function main() {
  const encryptedKey = process.env.DEPLOYER_PRIVATE_KEY_ENCRYPTED;

  if (!encryptedKey) {
    console.log("\n❌ No deployer account found in .env");
    console.log("\nRun this command to import your private key:");
    console.log("  npm run account:import\n");
    return;
  }

  console.log("\n🔓 Decrypting your deployer account...\n");
  const pass = await password({ message: "Enter your password:" });

  let wallet: Wallet;
  try {
    wallet = (await Wallet.fromEncryptedJson(encryptedKey, pass)) as Wallet;
  } catch (e) {
    console.log("\n❌ Failed to decrypt. Wrong password?\n");
    return;
  }

  console.log("✅ Deployer Address:", wallet.address);
  console.log("\n📋 Use this address to:");
  console.log("   1. Bridge ETH to Base: https://bridge.base.org/");
  console.log("   2. Fund with at least 0.05 ETH");
  console.log("\n💡 Check balance on Base:");
  console.log("   https://basescan.org/address/" + wallet.address);
  console.log("");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
