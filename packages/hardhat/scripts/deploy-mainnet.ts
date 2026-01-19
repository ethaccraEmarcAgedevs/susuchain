import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Deploy all Susu contracts to Base Mainnet
 * Run: npx hardhat run scripts/deploy-mainnet.ts --network base
 */
async function main() {
  console.log("\n🚀 Deploying Susu Contracts to Base Mainnet...\n");

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log("Deployer:", deployerAddress);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);

  if (balance < ethers.parseEther("0.0005")) {
    throw new Error("Insufficient balance. Need at least 0.0005 ETH for deployment (actual cost ~0.0001 ETH on Base).");
  }

  console.log("\n📝 Step 1: Deploying SusuToken...");
  const SusuToken = await ethers.getContractFactory("SusuToken");
  const susuToken = await SusuToken.deploy(deployerAddress, { gasLimit: 3000000 });
  await susuToken.waitForDeployment();
  const susuTokenAddress = await susuToken.getAddress();
  console.log("✅ SusuToken deployed to:", susuTokenAddress);

  console.log("\n📝 Step 2: Deploying SusuFactory...");
  const SusuFactory = await ethers.getContractFactory("SusuFactory");
  const susuFactory = await SusuFactory.deploy(deployerAddress, { gasLimit: 6000000 });
  await susuFactory.waitForDeployment();
  const susuFactoryAddress = await susuFactory.getAddress();
  console.log("✅ SusuFactory deployed to:", susuFactoryAddress);

  console.log("\n📝 Step 3: Deploying SusuFactoryViews...");
  const SusuFactoryViews = await ethers.getContractFactory("SusuFactoryViews");
  const susuFactoryViews = await SusuFactoryViews.deploy(susuFactoryAddress, { gasLimit: 6000000 });
  await susuFactoryViews.waitForDeployment();
  const susuFactoryViewsAddress = await susuFactoryViews.getAddress();
  console.log("✅ SusuFactoryViews deployed to:", susuFactoryViewsAddress);

  console.log("\n📝 Step 4: Authorizing SusuFactory as minter...");
  const authTx = await susuToken.authorizeMinter(susuFactoryAddress);
  await authTx.wait();
  console.log("✅ SusuFactory authorized to mint tokens");

  console.log("\n📝 Step 5: Setting up price feeds (Base Mainnet)...");
  // Base Mainnet ETH/USD price feed: 0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70
  const ethUsdFeed = "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70";
  const setPriceFeedTx = await susuFactory.setPriceFeed(ethUsdFeed);
  await setPriceFeedTx.wait();
  console.log("✅ ETH/USD price feed configured:", ethUsdFeed);

  console.log("\n🎉 Deployment Complete!\n");
  console.log("=".repeat(60));
  console.log("Contract Addresses:");
  console.log("=".repeat(60));
  console.log("SusuToken:        ", susuTokenAddress);
  console.log("SusuFactory:      ", susuFactoryAddress);
  console.log("SusuFactoryViews: ", susuFactoryViewsAddress);
  console.log("=".repeat(60));

  console.log("\n📋 Save these addresses to your .env file:");
  console.log(`SUSU_TOKEN_ADDRESS=${susuTokenAddress}`);
  console.log(`SUSU_FACTORY_ADDRESS=${susuFactoryAddress}`);
  console.log(`SUSU_FACTORY_VIEWS_ADDRESS=${susuFactoryViewsAddress}`);

  console.log("\n✨ Next Steps:");
  console.log("1. Verify contracts on BaseScan:");
  console.log(`   npx hardhat verify --network base ${susuTokenAddress} "${deployerAddress}"`);
  console.log(`   npx hardhat verify --network base ${susuFactoryAddress} "${deployerAddress}"`);
  console.log(`   npx hardhat verify --network base ${susuFactoryViewsAddress} "${susuFactoryAddress}"`);
  console.log("\n2. Test deployment with interaction scripts:");
  console.log("   npx hardhat run scripts/interact-create-group.ts --network base");
  console.log("\n3. Update frontend with new contract addresses");

  // Auto-verify if on mainnet or testnet (not localhost)
  const network = await ethers.provider.getNetwork();
  if (network.chainId === 8453n || network.chainId === 84532n) {
    console.log("\n🔍 Starting automatic verification...");
    console.log("⏳ This may take 1-2 minutes. Please wait...\n");

    try {
      // Wait a bit for Etherscan to index the contracts
      console.log("⏳ Waiting 30 seconds for BaseScan to index contracts...");
      await new Promise(resolve => setTimeout(resolve, 30000));

      console.log("📝 Verifying SusuToken...");
      await verifyContract(susuTokenAddress, [deployerAddress]);

      console.log("📝 Verifying SusuFactory...");
      await verifyContract(susuFactoryAddress, [deployerAddress]);

      console.log("📝 Verifying SusuFactoryViews...");
      await verifyContract(susuFactoryViewsAddress, [susuFactoryAddress]);

      console.log("\n✅ All contracts verified on BaseScan!");
    } catch (error: any) {
      console.log("\n⚠️  Automatic verification failed:", error.message);
      console.log("📌 Please verify manually using the commands above");
    }
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
