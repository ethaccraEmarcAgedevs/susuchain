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
 * Interactive script to contribute to a round
 * Run: npx hardhat run scripts/interact-contribute.ts --network base
 */
async function main() {
  console.log("\n💰 Contribute to Round - Interactive Script\n");

  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();
  const balance = await ethers.provider.getBalance(signerAddress);

  console.log("Your Address:", signerAddress);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  const groupAddress = await question("\nGroup Address: ");

  const susuGroup = await ethers.getContractAt("SusuGroup", groupAddress);

  // Get group and member info
  console.log("\n📊 Loading information...");
  const groupName = await susuGroup.groupName();
  const contributionAmount = await susuGroup.contributionAmount();
  const currentRound = await susuGroup.currentRound();
  const memberInfo = await susuGroup.getMemberInfo(signerAddress);

  console.log("\n📋 Group Status:");
  console.log("  Name:", groupName);
  console.log("  Current Round:", currentRound.toString());
  console.log("  Contribution:", ethers.formatEther(contributionAmount), "ETH");

  console.log("\n👤 Your Status:");
  console.log("  Last Contributed Round:", memberInfo.lastContributionRound.toString());
  console.log("  Active:", memberInfo.isActive);

  if (memberInfo.lastContributionRound >= currentRound) {
    console.log("\n✅ You've already contributed to this round!");
    rl.close();
    return;
  }

  // Get round info
  const roundInfo = await susuGroup.getRoundInfo(currentRound);
  console.log("\n📊 Current Round Info:");
  console.log("  Contributions:", roundInfo.contributionsCount.toString());
  console.log("  Total Amount:", ethers.formatEther(roundInfo.totalAmount), "ETH");
  console.log("  Completed:", roundInfo.completed);

  const confirm = await question("\nContribute " + ethers.formatEther(contributionAmount) + " ETH? (yes/no): ");
  if (confirm.toLowerCase() !== "yes") {
    console.log("❌ Cancelled");
    rl.close();
    return;
  }

  console.log("\n🚀 Submitting contribution...");

  try {
    const tx = await susuGroup.contribute({
      value: contributionAmount,
    });

    console.log("⏳ Transaction submitted:", tx.hash);
    console.log("   Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");

    // Check if round completed
    const newRoundInfo = await susuGroup.getRoundInfo(currentRound);

    console.log("\n🎉 Contribution Successful!");
    console.log("=".repeat(60));
    console.log("Amount:", ethers.formatEther(contributionAmount), "ETH");
    console.log("Round:", currentRound.toString());
    console.log("Round Progress:", newRoundInfo.contributionsCount.toString(), "contributions");
    console.log("View transaction:", `https://basescan.org/tx/${tx.hash}`);
    console.log("=".repeat(60));

    if (newRoundInfo.completed) {
      console.log("\n✨ Round " + currentRound.toString() + " COMPLETED!");
      console.log("Recipient:", newRoundInfo.recipient);
      console.log("Amount paid out:", ethers.formatEther(newRoundInfo.totalAmount), "ETH");
      console.log("\n🔄 Round " + (currentRound + 1n).toString() + " has started!");
    } else {
      console.log("\n⏳ Waiting for other members to contribute...");
      console.log(
        "Progress:",
        newRoundInfo.contributionsCount.toString(),
        "/",
        (await susuGroup.getMemberCount()).toString(),
      );
    }

    console.log("\n✨ Next Steps:");
    console.log("1. Check group status:");
    console.log("   npx hardhat run scripts/interact-status.ts --network base");
    console.log("2. Wait for next round to contribute again");
  } catch (error: any) {
    console.error("\n❌ Error contributing:", error.message);
  }

  rl.close();
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
