import { ethers } from "hardhat";

/**
 * Deploy IABVault + PublicGoodsPool for Incentive Alignment Bonds.
 *
 * Sepolia testnet addresses (Aave V3):
 *   Pool: 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
 *   USDC: 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8
 *   aUSDC: 0x16dA4541aD1807f4443d92D26044C1147406EB80
 *
 * Override with env vars: USDC_ADDRESS, AAVE_POOL_ADDRESS, AUSDC_ADDRESS
 *
 * Usage:
 *   npx hardhat run scripts/deploy-iab.ts --network sepolia
 *   npx hardhat run scripts/deploy-iab.ts --network hardhat
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // --- Config ---
  const USDC_ADDRESS =
    process.env.USDC_ADDRESS ||
    "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8"; // Aave testnet USDC on Sepolia
  const AUSDC_ADDRESS =
    process.env.AUSDC_ADDRESS ||
    "0x16dA4541aD1807f4443d92D26044C1147406EB80"; // Aave testnet aUSDC on Sepolia
  const AAVE_POOL_ADDRESS =
    process.env.AAVE_POOL_ADDRESS ||
    "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951"; // Aave V3 Pool on Sepolia

  const MATURITY_DURATION = 473_364_000; // ~15 years in seconds
  const HEALTH_THRESHOLD = 100; // 1% improvement in median healthy life years
  const INCOME_THRESHOLD = 50; // 0.5% improvement in median real after-tax income
  const DISPUTE_BOND_MIN = ethers.parseUnits("100", 6); // 100 USDC

  // --- Deploy IABVault ---
  console.log("\n1. Deploying IABVault...");
  const IABVault = await ethers.getContractFactory("IABVault");
  const vault = await IABVault.deploy(
    USDC_ADDRESS,
    AUSDC_ADDRESS,
    AAVE_POOL_ADDRESS,
    MATURITY_DURATION,
    HEALTH_THRESHOLD,
    INCOME_THRESHOLD
  );
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("   IABVault deployed to:", vaultAddress);

  // --- Deploy PublicGoodsPool ---
  console.log("\n2. Deploying PublicGoodsPool...");
  const PublicGoodsPool = await ethers.getContractFactory("PublicGoodsPool");
  const pool = await PublicGoodsPool.deploy(
    USDC_ADDRESS,
    HEALTH_THRESHOLD,
    INCOME_THRESHOLD,
    DISPUTE_BOND_MIN
  );
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  console.log("   PublicGoodsPool deployed to:", poolAddress);

  // --- Wire IABVault → PublicGoodsPool ---
  console.log("\n3. Setting PublicGoodsPool on IABVault...");
  const tx = await vault.setPublicGoodsPool(poolAddress);
  await tx.wait();
  console.log("   IABVault.publicGoodsPool =", poolAddress);

  // --- Summary ---
  console.log("\n=== Deployment Complete ===");
  console.log("IABVault:    ", vaultAddress);
  console.log("PublicGoodsPool:", poolAddress);
  console.log("USDC:        ", USDC_ADDRESS);
  console.log("aUSDC:       ", AUSDC_ADDRESS);
  console.log("Aave Pool:   ", AAVE_POOL_ADDRESS);
  console.log("Maturity:    ", MATURITY_DURATION, "seconds (~15 years)");
  console.log("Health thr.: ", HEALTH_THRESHOLD, "bps (1%)");
  console.log("Income thr.: ", INCOME_THRESHOLD, "bps (0.5%)");

  console.log("\n--- Update apps/optimitron/src/lib/contracts/addresses.ts ---");
  console.log(`  iabVault: "${vaultAddress}" as Address,`);
  console.log(`  publicGoodsPool: "${poolAddress}" as Address,`);
  console.log(`  usdc: "${USDC_ADDRESS}" as Address,`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
