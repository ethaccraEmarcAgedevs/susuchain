import * as dotenv from "dotenv";
dotenv.config();
import { Wallet } from "ethers";
import password from "@inquirer/password";
import { spawn } from "child_process";

/**
 * Decrypt private key and run any hardhat script with it
 * Usage: npx ts-node scripts/run-with-pk.ts run scripts/deploy-mainnet.ts --network base
 */
async function main() {
  const encryptedKey = process.env.DEPLOYER_PRIVATE_KEY_ENCRYPTED;

  if (!encryptedKey) {
    console.log("🚫️ You don't have a deployer account. Run `npm run account:import` first");
    return;
  }

  const pass = await password({ message: "🔐 Enter password to decrypt private key:" });

  try {
    const wallet = await Wallet.fromEncryptedJson(encryptedKey, pass);
    console.log("✅ Key decrypted successfully");
    console.log("📍 Using address:", wallet.address);
    console.log("");

    // Set the decrypted key as runtime environment variable
    process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY = wallet.privateKey;

    // Run hardhat with the remaining arguments
    const hardhat = spawn("npx", ["hardhat", ...process.argv.slice(2)], {
      stdio: "inherit",
      env: process.env,
      shell: process.platform === "win32",
    });

    hardhat.on("exit", code => {
      process.exit(code || 0);
    });
  } catch (e) {
    console.error("❌ Failed to decrypt private key. Wrong password?");
    process.exit(1);
  }
}

main().catch(console.error);
