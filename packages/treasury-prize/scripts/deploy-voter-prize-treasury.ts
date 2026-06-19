import { ethers } from "hardhat";

/**
 * Deploy EarthOptimizationPoint + VoterPrizeTreasury and wire them together.
 *
 * Base Sepolia addresses (Aave V3 — from bgd-labs/aave-address-book):
 *   Pool: 0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27
 *   USDC: 0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f
 *   aUSDC: 0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC
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

  // --- Config (Aave V3 on Base Sepolia, from aave-address-book) ---
  const USDC_ADDRESS =
    process.env.USDC_ADDRESS ||
    "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f"; // Aave testnet USDC on Base Sepolia
  const AUSDC_ADDRESS =
    process.env.AUSDC_ADDRESS ||
    "0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC"; // aUSDC on Base Sepolia
  const AAVE_POOL_ADDRESS =
    process.env.AAVE_POOL_ADDRESS ||
    "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27"; // Aave V3 Pool on Base Sepolia

  const MATURITY_DURATION = 473_364_000; // ~15 years in seconds
  const HEALTH_THRESHOLD = 100; // 1% improvement in median healthy life years
  const INCOME_THRESHOLD = 50; // 0.5% improvement in median real after-tax income

  // --- Deploy EarthOptimizationPoint ---
  console.log("\n1. Deploying EarthOptimizationPoint...");
  const EarthOptimizationPoint = await ethers.getContractFactory(
    "EarthOptimizationPoint",
  );
  const pointToken = await EarthOptimizationPoint.deploy();
  await pointToken.waitForDeployment();
  const pointTokenAddress = await pointToken.getAddress();
  console.log("   EarthOptimizationPoint deployed to:", pointTokenAddress);

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

  // --- Wire VoterPrizeTreasury -> EarthOptimizationPoint ---
  console.log("\n3. Setting EarthOptimizationPoint on VoterPrizeTreasury...");
  const tx1 = await treasury.setEarthOptimizationPoint(pointTokenAddress);
  await tx1.wait();
  console.log("   VoterPrizeTreasury.earthOptimizationPoint =", pointTokenAddress);

  // --- Wire EarthOptimizationPoint -> VoterPrizeTreasury ---
  console.log("\n4. Setting PrizeTreasury on EarthOptimizationPoint...");
  const tx2 = await pointToken.setPrizeTreasury(treasuryAddress);
  await tx2.wait();
  console.log("   EarthOptimizationPoint.prizeTreasury =", treasuryAddress);

  // --- Summary ---
  console.log("\n=== Deployment Complete ===");
  console.log("EarthOptimizationPoint:", pointTokenAddress);
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
  console.log(`  earthOptimizationPoint: "${pointTokenAddress}" as Address,`);
  console.log(`  voterPrizeTreasury: "${treasuryAddress}" as Address,`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
