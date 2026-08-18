import { ethers } from "hardhat";

/**
 * Deploy IABVault + PublicGoodsPool + mocks to local Hardhat node.
 * Also mints test USDC to the first 5 accounts for testing.
 *
 * Usage:
 *   npx hardhat node                                    # terminal 1
 *   npx hardhat run scripts/deploy-iab-local.ts --network localhost  # terminal 2
 */
async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0]!;
  console.log("Deploying with account:", deployer.address);

  const MATURITY_DURATION = 473_364_000; // ~15 years
  const HEALTH_THRESHOLD = 100; // 1% improvement
  const INCOME_THRESHOLD = 50; // 0.5% improvement
  const DISPUTE_BOND_MIN = ethers.parseUnits("100", 6); // 100 USDC

  // --- 1. Deploy Mock USDC ---
  console.log("\n1. Deploying Mock USDC...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("   USDC:", usdcAddress);

  // --- 2. Deploy Mock aToken ---
  console.log("\n2. Deploying Mock aToken...");
  const MockAToken = await ethers.getContractFactory("MockAToken");
  const aToken = await MockAToken.deploy();
  await aToken.waitForDeployment();
  const aTokenAddress = await aToken.getAddress();
  console.log("   aUSDC:", aTokenAddress);

  // --- 3. Deploy Mock Aave Pool ---
  console.log("\n3. Deploying Mock Aave Pool...");
  const MockAavePool = await ethers.getContractFactory("MockAavePool");
  const aavePool = await MockAavePool.deploy(usdcAddress, aTokenAddress);
  await aavePool.waitForDeployment();
  const aavePoolAddress = await aavePool.getAddress();
  console.log("   Aave Pool:", aavePoolAddress);

  // Wire aToken to pool
  await aToken.setPool(aavePoolAddress);
  console.log("   aToken pool set");

  // --- 4. Deploy IABVault ---
  console.log("\n4. Deploying IABVault...");
  const IABVault = await ethers.getContractFactory("IABVault");
  const vault = await IABVault.deploy(
    usdcAddress,
    aTokenAddress,
    aavePoolAddress,
    MATURITY_DURATION,
    HEALTH_THRESHOLD,
    INCOME_THRESHOLD
  );
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("   IABVault:", vaultAddress);

  // --- 5. Deploy PublicGoodsPool ---
  console.log("\n5. Deploying PublicGoodsPool...");
  const PublicGoodsPool = await ethers.getContractFactory("PublicGoodsPool");
  const pool = await PublicGoodsPool.deploy(
    usdcAddress,
    HEALTH_THRESHOLD,
    INCOME_THRESHOLD,
    DISPUTE_BOND_MIN
  );
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  console.log("   PublicGoodsPool:", poolAddress);

  // --- 6. Wire IABVault → PublicGoodsPool ---
  await vault.setPublicGoodsPool(poolAddress);
  console.log("\n6. IABVault.publicGoodsPool =", poolAddress);

  // --- 7. Mint test USDC to first 5 accounts ---
  console.log("\n7. Minting test USDC...");
  const testAmount = ethers.parseUnits("100000", 6); // 100,000 USDC each
  for (let i = 0; i < 5 && i < signers.length; i++) {
    await usdc.mint(signers[i]!.address, testAmount);
    console.log(
      `   ${signers[i]!.address}: 100,000 USDC`
    );
  }

  // --- Summary ---
  console.log("\n" + "=".repeat(60));
  console.log("  LOCAL DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log("");
  console.log("Contracts:");
  console.log(`  IABVault:   ${vaultAddress}`);
  console.log(`  PublicGoodsPool: ${poolAddress}`);
  console.log(`  USDC:       ${usdcAddress}`);
  console.log(`  aUSDC:      ${aTokenAddress}`);
  console.log(`  Aave Pool:  ${aavePoolAddress}`);
  console.log("");
  console.log("Test accounts have 100,000 USDC each.");
  console.log("Import Hardhat Account #0 into MetaMask:");
  console.log("  Private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
  console.log("  Add USDC token:", usdcAddress);
  console.log("  Add IAB token: ", vaultAddress);
  console.log("");
  console.log("--- Copy these to apps/optimitron/src/lib/contracts/addresses.ts ---");
  console.log(`  31337: {`);
  console.log(`    iabVault: "${vaultAddress}" as Address,`);
  console.log(`    publicGoodsPool: "${poolAddress}" as Address,`);
  console.log(`    usdc: "${usdcAddress}" as Address,`);
  console.log(`  },`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
