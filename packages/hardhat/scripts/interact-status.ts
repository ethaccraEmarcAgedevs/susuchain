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
 * Check status of a Susu group
 * Run: npx hardhat run scripts/interact-status.ts --network base
 */
async function main() {
  console.log("\n📊 Susu Group Status - Interactive Script\n");

  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();

  console.log("Your Address:", signerAddress);
  console.log("Network:", (await ethers.provider.getNetwork()).name);

  const groupAddress = await question("\nGroup Address: ");

  const susuGroup = await ethers.getContractAt("SusuGroup", groupAddress);

  console.log("\n📊 Loading group data...\n");

  // Basic Info
  const groupName = await susuGroup.groupName();
  const groupENS = await susuGroup.groupENSName();
  const contributionAmount = await susuGroup.contributionAmount();
  const contributionInterval = await susuGroup.contributionInterval();
  const currentRound = await susuGroup.currentRound();
  const maxMembers = await susuGroup.maxMembers();
  const memberCount = await susuGroup.getMemberCount();
  const groupActive = await susuGroup.groupActive();
  const creator = await susuGroup.owner();

  console.log("=".repeat(60));
  console.log("GROUP INFORMATION");
  console.log("=".repeat(60));
  console.log("Name:              ", groupName);
  console.log("ENS:               ", groupENS);
  console.log("Creator:           ", creator);
  console.log("Active:            ", groupActive ? "✅ Yes" : "❌ No");
  console.log("Members:           ", memberCount.toString(), "/", maxMembers.toString());
  console.log("Contribution:      ", ethers.formatEther(contributionAmount), "ETH");
  console.log("Interval:          ", (Number(contributionInterval) / 86400).toString(), "days");
  console.log("Current Round:     ", currentRound.toString());
  console.log("Contract:          ", groupAddress);
  console.log("View on BaseScan:  ", `https://basescan.org/address/${groupAddress}`);

  // Current Round Info
  if (currentRound > 0) {
    console.log("\n" + "=".repeat(60));
    console.log("CURRENT ROUND #" + currentRound.toString());
    console.log("=".repeat(60));

    const roundInfo = await susuGroup.getRoundInfo(currentRound);
    console.log("Contributions:     ", roundInfo.contributionsCount.toString(), "/", memberCount.toString());
    console.log("Total Amount:      ", ethers.formatEther(roundInfo.totalAmount), "ETH");
    console.log("Completed:         ", roundInfo.completed ? "✅ Yes" : "⏳ In Progress");

    if (roundInfo.completed) {
      console.log("Recipient:         ", roundInfo.recipient);
      console.log("Payout Amount:     ", ethers.formatEther(roundInfo.totalAmount), "ETH");
    } else {
      console.log(
        "Progress:          ",
        ((Number(roundInfo.contributionsCount) / Number(memberCount)) * 100).toFixed(1) + "%",
      );
    }
  }

  // Member List
  console.log("\n" + "=".repeat(60));
  console.log("MEMBERS");
  console.log("=".repeat(60));

  const memberAddresses = await susuGroup.getAllMembers();
  for (let i = 0; i < memberAddresses.length; i++) {
    const memberAddr = memberAddresses[i];
    const memberInfo = await susuGroup.getMemberInfo(memberAddr);

    const isYou = memberAddr.toLowerCase() === signerAddress.toLowerCase();
    const prefix = isYou ? "👤 YOU: " : `${i + 1}. `;

    console.log("\n" + prefix + memberAddr);
    console.log("   ENS:              ", memberInfo.ensName || "Not set");
    console.log("   Position:         ", memberInfo.position.toString());
    console.log("   Active:           ", memberInfo.isActive ? "✅" : "❌");
    console.log("   Last Contributed: ", "Round #" + memberInfo.lastContributionRound.toString());
    console.log("   Has Received:     ", memberInfo.hasReceivedPayout ? "✅ Yes" : "⏳ Not yet");
  }

  // Round History
  if (currentRound > 1) {
    console.log("\n" + "=".repeat(60));
    console.log("ROUND HISTORY");
    console.log("=".repeat(60));

    for (let round = 1n; round < currentRound; round++) {
      const roundInfo = await susuGroup.getRoundInfo(round);
      if (roundInfo.completed) {
        console.log(`\nRound #${round}:`);
        console.log("  Amount:    ", ethers.formatEther(roundInfo.totalAmount), "ETH");
        console.log("  Recipient: ", roundInfo.recipient);
      }
    }
  }

  // Your Status
  const isMember = memberAddresses.some(addr => addr.toLowerCase() === signerAddress.toLowerCase());

  if (isMember) {
    const yourInfo = await susuGroup.getMemberInfo(signerAddress);
    console.log("\n" + "=".repeat(60));
    console.log("YOUR STATUS");
    console.log("=".repeat(60));
    console.log("Position:             ", yourInfo.position.toString());
    console.log("Active:               ", yourInfo.isActive ? "✅ Yes" : "❌ No");
    console.log("Last Contribution:    ", "Round #" + yourInfo.lastContributionRound.toString());
    console.log("Received Payout:      ", yourInfo.hasReceivedPayout ? "✅ Yes" : "⏳ Not yet");
    console.log("Deactivation Votes:   ", yourInfo.deactivationVotes.toString());

    if (currentRound > yourInfo.lastContributionRound && yourInfo.isActive) {
      console.log("\n⚠️  You need to contribute to Round #" + currentRound.toString());
      console.log("Run: npx hardhat run scripts/interact-contribute.ts --network base");
    }
  } else {
    console.log("\n" + "=".repeat(60));
    console.log("You are not a member of this group");
    console.log("Join with: npx hardhat run scripts/interact-join-group.ts --network base");
    console.log("=".repeat(60));
  }

  rl.close();
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
