import { ethers } from "hardhat";

/**
 * Deploy Referral System
 * - ReferralRegistry
 * - Fund with initial rewards pool
 */

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying referral contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // 1. Deploy ReferralRegistry
  console.log("\n=== Step 1: Deploy ReferralRegistry ===");
  const ReferralRegistry = await ethers.getContractFactory("ReferralRegistry");
  const referralRegistry = await ReferralRegistry.deploy(deployer.address);
  await referralRegistry.waitForDeployment();
  const registryAddress = await referralRegistry.getAddress();
  console.log("ReferralRegistry deployed to:", registryAddress);

  // 2. Fund the registry with initial rewards pool (1 ETH)
  console.log("\n=== Step 2: Fund ReferralRegistry ===");
  const fundingAmount = ethers.parseEther("1.0"); // 1 ETH for testing
  const fundTx = await deployer.sendTransaction({
    to: registryAddress,
    value: fundingAmount,
  });
  await fundTx.wait();
  console.log("Funded ReferralRegistry with:", ethers.formatEther(fundingAmount), "ETH");

  // 3. Get existing SusuFactory (if deployed)
  console.log("\n=== Step 3: Integrate with SusuFactory ===");
  try {
    const susuFactory = await ethers.getContract("SusuFactory");
    const factoryAddress = await susuFactory.getAddress();
    console.log("SusuFactory found at:", factoryAddress);

    // Authorize SusuFactory to create groups with referral tracking
    console.log("Authorizing SusuFactory...");
    const authTx = await referralRegistry.authorizeContract(factoryAddress);
    await authTx.wait();
    console.log("✅ SusuFactory authorized to record referrals");
  } catch (error) {
    console.log("⚠️ SusuFactory not deployed yet. You'll need to authorize it manually.");
  }

  // 4. Display summary
  console.log("\n=== Deployment Summary ===");
  console.log("ReferralRegistry:", registryAddress);
  console.log("Funded with:", ethers.formatEther(fundingAmount), "ETH");

  // 5. Display configuration
  console.log("\n=== Referral Configuration ===");
  const directRewardRate = await referralRegistry.DIRECT_REWARD_RATE();
  const indirectRewardRate = await referralRegistry.INDIRECT_REWARD_RATE();
  const qualificationContributions = await referralRegistry.QUALIFICATION_CONTRIBUTIONS();
  const qualificationPeriod = await referralRegistry.QUALIFICATION_PERIOD();
  const bonus10 = await referralRegistry.BONUS_10_REFERRALS();
  const bonus50 = await referralRegistry.BONUS_50_REFERRALS();

  console.log("Direct Reward Rate:", Number(directRewardRate) / 100, "%");
  console.log("Indirect Reward Rate:", Number(indirectRewardRate) / 100, "%");
  console.log("Qualification Contributions:", qualificationContributions.toString());
  console.log("Qualification Period:", Number(qualificationPeriod) / 86400, "days");
  console.log("10 Referrals Bonus:", ethers.formatEther(bonus10), "ETH");
  console.log("50 Referrals Bonus:", ethers.formatEther(bonus50), "ETH");

  console.log("\n=== Next Steps ===");
  console.log("1. Update SusuFactory deployment to include referralRegistry parameter");
  console.log("2. Update SusuGroup creation to accept referral codes");
  console.log("3. Deploy frontend changes for referral UI");
  console.log("4. Test referral flow end-to-end");

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    contracts: {
      ReferralRegistry: registryAddress,
    },
    configuration: {
      directRewardRate: directRewardRate.toString(),
      indirectRewardRate: indirectRewardRate.toString(),
      qualificationContributions: qualificationContributions.toString(),
      qualificationPeriod: qualificationPeriod.toString(),
      bonus10Referrals: bonus10.toString(),
      bonus50Referrals: bonus50.toString(),
    },
    funding: {
      initialAmount: fundingAmount.toString(),
    },
    timestamp: new Date().toISOString(),
  };

  console.log("\n" + JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
