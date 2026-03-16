import { ethers } from "hardhat";

/**
 * Deploy VoteToken + VoterPrizeTreasury and wire them together.
 *
 * Base Sepolia addresses (Aave V3):
 *   Pool: 0xA238Dd80C259a72e81d7e4664a9801593F98d1c5
 *   USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
 *   aUSDC: 0x4086fabeE92a080002eeBA1220B9025a27a40A49
 *
 * Override with env vars: USDC_ADDRESS, AAVE_POOL_ADDRESS, AUSDC_ADDRESS
 *
 * Usage:
 *   npx hardhat run scripts/deploy-voter-prize-treasury.ts --network baseSepolia
 *   npx hardhat run scripts/deploy-voter-prize-treasury.ts --network hardhat
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // --- Config ---
  const USDC_ADDRESS =
    process.env.USDC_ADDRESS ||
    "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // USDC on Base Sepolia
  const AUSDC_ADDRESS =
    process.env.AUSDC_ADDRESS ||
    "0x4086fabeE92a080002eeBA1220B9025a27a40A49"; // aUSDC on Base Sepolia
  const AAVE_POOL_ADDRESS =
    process.env.AAVE_POOL_ADDRESS ||
    "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5"; // Aave V3 Pool on Base Sepolia

  const MATURITY_DURATION = 473_364_000; // ~15 years in seconds
  const HEALTH_THRESHOLD = 100; // 1% improvement in median healthy life years
  const INCOME_THRESHOLD = 50; // 0.5% improvement in median real after-tax income

  // --- Deploy VoteToken ---
  console.log("\n1. Deploying VoteToken...");
  const VoteToken = await ethers.getContractFactory("VoteToken");
  const voteToken = await VoteToken.deploy();
  await voteToken.waitForDeployment();
  const voteTokenAddress = await voteToken.getAddress();
  console.log("   VoteToken deployed to:", voteTokenAddress);

  // --- Deploy VoterPrizeTreasury ---
  console.log("\n2. Deploying VoterPrizeTreasury...");
  const VoterPrizeTreasury = await ethers.getContractFactory(
    "VoterPrizeTreasury",
  );
  const treasury = await VoterPrizeTreasury.deploy(
    USDC_ADDRESS,
    AUSDC_ADDRESS,
    AAVE_POOL_ADDRESS,
    MATURITY_DURATION,
    HEALTH_THRESHOLD,
    INCOME_THRESHOLD,
  );
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("   VoterPrizeTreasury deployed to:", treasuryAddress);

  // --- Wire VoterPrizeTreasury → VoteToken ---
  console.log("\n3. Setting VoteToken on VoterPrizeTreasury...");
  const tx1 = await treasury.setVoteToken(voteTokenAddress);
  await tx1.wait();
  console.log("   VoterPrizeTreasury.voteToken =", voteTokenAddress);

  // --- Wire VoteToken → VoterPrizeTreasury ---
  console.log("\n4. Setting PrizeTreasury on VoteToken...");
  const tx2 = await voteToken.setPrizeTreasury(treasuryAddress);
  await tx2.wait();
  console.log("   VoteToken.prizeTreasury =", treasuryAddress);

  // --- Summary ---
  console.log("\n=== Deployment Complete ===");
  console.log("VoteToken:           ", voteTokenAddress);
  console.log("VoterPrizeTreasury:  ", treasuryAddress);
  console.log("USDC:                ", USDC_ADDRESS);
  console.log("aUSDC:               ", AUSDC_ADDRESS);
  console.log("Aave Pool:           ", AAVE_POOL_ADDRESS);
  console.log("Maturity:            ", MATURITY_DURATION, "seconds (~15 years)");
  console.log("Health thr.:         ", HEALTH_THRESHOLD, "bps (1%)");
  console.log("Income thr.:         ", INCOME_THRESHOLD, "bps (0.5%)");

  console.log(
    "\n--- Update packages/web/src/lib/contracts/addresses.ts ---",
  );
  console.log(`  voteToken: "${voteTokenAddress}" as Address,`);
  console.log(`  voterPrizeTreasury: "${treasuryAddress}" as Address,`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
