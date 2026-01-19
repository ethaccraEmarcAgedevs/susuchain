import { ethers } from "hardhat";

async function main() {
  console.log("Testing Base connection...\n");

  try {
    const network = await ethers.provider.getNetwork();
    console.log("✅ Connected to:", network.name);
    console.log("✅ Chain ID:", network.chainId.toString());

    const blockNumber = await ethers.provider.getBlockNumber();
    console.log("✅ Latest block:", blockNumber);

    const [signer] = await ethers.getSigners();
    const address = await signer.getAddress();
    console.log("✅ Your address:", address);

    const balance = await ethers.provider.getBalance(address);
    console.log("✅ Balance:", ethers.formatEther(balance), "ETH");

    console.log("\n🎉 Connection successful!");
  } catch (error: any) {
    console.error("❌ Connection failed:", error.message);
    console.error("\nTroubleshooting:");
    console.error("1. Check your internet connection");
    console.error("2. Try again in a few seconds");
    console.error("3. The RPC might be temporarily unavailable");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
