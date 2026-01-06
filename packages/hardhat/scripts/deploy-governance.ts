import { ethers } from "hardhat";

/**
 * Deploy DAO Governance System
 * - SusuToken (already deployed, just upgrade)
 * - SusuTimelock
 * - SusuGovernor
 * - GovernanceParameters
 */

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying governance contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // 1. Get existing SusuToken (should already be deployed)
  console.log("\n=== Step 1: Get SusuToken ===");
  const susuToken = await ethers.getContract("SusuToken");
  const tokenAddress = await susuToken.getAddress();
  console.log("SusuToken address:", tokenAddress);

  // 2. Deploy Timelock (2 days delay)
  console.log("\n=== Step 2: Deploy SusuTimelock ===");
  const MIN_DELAY = 2 * 24 * 60 * 60; // 2 days
  const proposers: string[] = []; // Will be set to Governor after deployment
  const executors: string[] = []; // Anyone can execute
  const admin = deployer.address; // Temp admin, will be renounced after setup

  const SusuTimelock = await ethers.getContractFactory("SusuTimelock");
  const timelock = await SusuTimelock.deploy(MIN_DELAY, proposers, executors, admin);
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  console.log("SusuTimelock deployed to:", timelockAddress);
  console.log("- Min delay:", MIN_DELAY / 86400, "days");

  // 3. Deploy Governor
  console.log("\n=== Step 3: Deploy SusuGovernor ===");
  const SusuGovernor = await ethers.getContractFactory("SusuGovernor");
  const governor = await SusuGovernor.deploy(tokenAddress, timelockAddress);
  await governor.waitForDeployment();
  const governorAddress = await governor.getAddress();
  console.log("SusuGovernor deployed to:", governorAddress);

  // Get governance settings
  const votingDelay = await governor.votingDelay();
  const votingPeriod = await governor.votingPeriod();
  const proposalThreshold = await governor.proposalThreshold();
  const quorum = await governor.quorum(await ethers.provider.getBlockNumber());

  console.log("Governance Settings:");
  console.log("- Voting delay:", votingDelay.toString(), "blocks (~", Number(votingDelay) / 7200, "days)");
  console.log("- Voting period:", votingPeriod.toString(), "blocks (~", Number(votingPeriod) / 7200, "days)");
  console.log("- Proposal threshold:", ethers.formatEther(proposalThreshold), "SUSU");
  console.log("- Quorum:", ethers.formatEther(quorum), "SUSU");

  // 4. Deploy GovernanceParameters
  console.log("\n=== Step 4: Deploy GovernanceParameters ===");
  const GovernanceParameters = await ethers.getContractFactory("GovernanceParameters");
  const parameters = await GovernanceParameters.deploy(timelockAddress);
  await parameters.waitForDeployment();
  const parametersAddress = await parameters.getAddress();
  console.log("GovernanceParameters deployed to:", parametersAddress);

  // 5. Setup Timelock roles
  console.log("\n=== Step 5: Setup Timelock Roles ===");

  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  const CANCELLER_ROLE = await timelock.CANCELLER_ROLE();
  const ADMIN_ROLE = await timelock.DEFAULT_ADMIN_ROLE();

  // Grant proposer role to Governor
  console.log("Granting PROPOSER_ROLE to Governor...");
  let tx = await timelock.grantRole(PROPOSER_ROLE, governorAddress);
  await tx.wait();

  // Grant executor role to everyone (zero address)
  console.log("Granting EXECUTOR_ROLE to everyone...");
  tx = await timelock.grantRole(EXECUTOR_ROLE, ethers.ZeroAddress);
  await tx.wait();

  // Grant canceller role to Governor
  console.log("Granting CANCELLER_ROLE to Governor...");
  tx = await timelock.grantRole(CANCELLER_ROLE, governorAddress);
  await tx.wait();

  // Renounce admin role (makes timelock self-managed by governance)
  console.log("Renouncing admin role from deployer...");
  tx = await timelock.renounceRole(ADMIN_ROLE, deployer.address);
  await tx.wait();

  console.log("✅ Timelock is now controlled by governance");

  // 6. Summary
  console.log("\n=== Deployment Summary ===");
  console.log("SusuToken:", tokenAddress);
  console.log("SusuTimelock:", timelockAddress);
  console.log("SusuGovernor:", governorAddress);
  console.log("GovernanceParameters:", parametersAddress);

  console.log("\n=== Next Steps ===");
  console.log("1. Delegate voting power: SUSU.delegate(yourAddress)");
  console.log("2. Create proposals via Governor");
  console.log("3. Transfer SusuFactory ownership to Timelock");
  console.log("4. Update contracts to read from GovernanceParameters");

  // Save deployment addresses
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    contracts: {
      SusuToken: tokenAddress,
      SusuTimelock: timelockAddress,
      SusuGovernor: governorAddress,
      GovernanceParameters: parametersAddress,
    },
    settings: {
      votingDelay: votingDelay.toString(),
      votingPeriod: votingPeriod.toString(),
      proposalThreshold: proposalThreshold.toString(),
      quorum: quorum.toString(),
      timelockDelay: MIN_DELAY,
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
