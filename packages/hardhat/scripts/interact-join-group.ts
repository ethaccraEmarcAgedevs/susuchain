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
 * Interactive script to join a Susu group
 * Run: npx hardhat run scripts/interact-join-group.ts --network base
 */
async function main() {
  console.log("\n👥 Join Susu Group - Interactive Script\n");

  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();
  const balance = await ethers.provider.getBalance(signerAddress);

  console.log("Your Address:", signerAddress);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  console.log("Network:", (await ethers.provider.getNetwork()).name);

  const groupAddress = await question("\nGroup Address: ");

  const susuGroup = await ethers.getContractAt("SusuGroup", groupAddress);

  // Get group info
  console.log("\n📊 Loading group information...");
  const groupName = await susuGroup.groupName();
  const contributionAmount = await susuGroup.contributionAmount();
  const memberCount = await susuGroup.getMemberCount();
  const maxMembers = await susuGroup.maxMembers();
  const contributionAsset = await susuGroup.contributionAsset();

  console.log("\n📋 Group Details:");
  console.log("  Name:", groupName);
  console.log("  Contribution:", ethers.formatEther(contributionAmount), "ETH");
  console.log("  Members:", memberCount.toString(), "/", maxMembers.toString());
  console.log("  Asset:", contributionAsset === ethers.ZeroAddress ? "ETH" : contributionAsset);

  if (memberCount >= maxMembers) {
    console.log("\n❌ Group is full!");
    rl.close();
    return;
  }

  // Get member details
  const ensName = await question("\nYour ENS Name (e.g., 'alice.eth'): ");
  const efpProfile = await question("Your EFP Profile (e.g., 'alice_efp'): ");
  const referralCode = await question("Referral Code (optional, press enter to skip): ");

  console.log("\n📊 Join Details:");
  console.log("  Your Address:", signerAddress);
  console.log("  ENS Name:", ensName);
  console.log("  EFP Profile:", efpProfile);
  console.log("  Referral:", referralCode || "None");

  const confirm = await question("\nProceed with joining? (yes/no): ");
  if (confirm.toLowerCase() !== "yes") {
    console.log("❌ Cancelled");
    rl.close();
    return;
  }

  console.log("\n🚀 Joining group on-chain...");

  try {
    const tx = await susuGroup.joinGroup(ensName, efpProfile, referralCode || "", {
      value: contributionAmount, // First contribution
    });

    console.log("⏳ Transaction submitted:", tx.hash);
    console.log("   Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");

    console.log("\n🎉 Successfully Joined Group!");
    console.log("=".repeat(60));
    console.log("You are now member #" + ((await susuGroup.getMemberCount()).toString()));
    console.log("View transaction:", `https://basescan.org/tx/${tx.hash}`);
    console.log("=".repeat(60));

    // Get your member info
    const memberInfo = await susuGroup.getMemberInfo(signerAddress);
    console.log("\n👤 Your Member Profile:");
    console.log("  ENS Name:", memberInfo.ensName);
    console.log("  Position:", memberInfo.position.toString());
    console.log("  Active:", memberInfo.isActive);
    console.log("  Last Contribution Round:", memberInfo.lastContributionRound.toString());

    console.log("\n✨ Next Steps:");
    console.log("1. Wait for all members to join");
    console.log("2. Contribute each round:");
    console.log("   npx hardhat run scripts/interact-contribute.ts --network base");
    console.log("3. Check group status:");
    console.log("   npx hardhat run scripts/interact-status.ts --network base");
  } catch (error: any) {
    console.error("\n❌ Error joining group:", error.message);
  }

  rl.close();
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
