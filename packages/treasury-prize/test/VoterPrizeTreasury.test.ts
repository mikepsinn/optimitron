import { expect } from "chai";
import { ethers } from "hardhat";
import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("VoterPrizeTreasury", function () {
  const DECIMALS = 6;
  const parseUSDC = (amount: number) =>
    ethers.parseUnits(amount.toString(), DECIMALS);

  const ONE_POINT = ethers.parseEther("1");
  const HEALTH_THRESHOLD = 100n;
  const INCOME_THRESHOLD = 50n;
  const FIFTEEN_YEARS = 473_364_000n;

  async function deployFixture() {
    const [owner, contributor1, contributor2, voter1, voter2, voter3] =
      await ethers.getSigners();

    // Deploy mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("USD Coin", "USDC", DECIMALS);

    // Deploy mock aToken + Aave pool
    const MockAToken = await ethers.getContractFactory("MockAToken");
    const aToken = await MockAToken.deploy();

    const MockAavePool = await ethers.getContractFactory("MockAavePool");
    const aavePool = await MockAavePool.deploy(
      await usdc.getAddress(),
      await aToken.getAddress()
    );
    await aToken.setPool(await aavePool.getAddress());

    // Deploy EarthOptimizationPoint
    const EarthOptimizationPoint = await ethers.getContractFactory("EarthOptimizationPoint");
    const pointToken = await EarthOptimizationPoint.deploy();

    // Deploy VoterPrizeTreasury
    const VoterPrizeTreasury = await ethers.getContractFactory(
      "VoterPrizeTreasury"
    );
    const treasury = await VoterPrizeTreasury.deploy(
      await usdc.getAddress(),
      await aToken.getAddress(),
      await aavePool.getAddress(),
      FIFTEEN_YEARS,
      HEALTH_THRESHOLD,
      INCOME_THRESHOLD
    );

    // Wire up
    await treasury.setEarthOptimizationPoint(await pointToken.getAddress());
    await pointToken.setPrizeTreasury(await treasury.getAddress());

    // Fund contributors with USDC
    await usdc.mint(contributor1.address, parseUSDC(100_000));
    await usdc.mint(contributor2.address, parseUSDC(50_000));

    // Approve treasury
    const treasuryAddr = await treasury.getAddress();
    await usdc.connect(contributor1).approve(treasuryAddr, ethers.MaxUint256);
    await usdc.connect(contributor2).approve(treasuryAddr, ethers.MaxUint256);

    // Mint EOP to voters (simulating verified votes)
    const ref1 = ethers.keccak256(ethers.toUtf8Bytes("referendum-1"));
    const null1 = ethers.keccak256(ethers.toUtf8Bytes("voter1-null"));
    const null2 = ethers.keccak256(ethers.toUtf8Bytes("voter2-null"));
    const null3 = ethers.keccak256(ethers.toUtf8Bytes("voter3-null"));

    await pointToken.mintForVoter(voter1.address, ref1, null1, ONE_POINT);
    await pointToken.mintForVoter(voter2.address, ref1, null2, ONE_POINT);
    await pointToken.mintForVoter(voter3.address, ref1, null3, ONE_POINT);

    return {
      usdc,
      aToken,
      aavePool,
      pointToken,
      treasury,
      owner,
      contributor1,
      contributor2,
      voter1,
      voter2,
      voter3,
    };
  }

  describe("Deployment", function () {
    it("sets initial state correctly", async function () {
      const { treasury, usdc, aToken, aavePool } =
        await loadFixture(deployFixture);

      expect(await treasury.stablecoin()).to.equal(await usdc.getAddress());
      expect(await treasury.aToken()).to.equal(await aToken.getAddress());
      expect(await treasury.aavePool()).to.equal(await aavePool.getAddress());
      expect(await treasury.maturityDuration()).to.equal(FIFTEEN_YEARS);
      expect(await treasury.healthThreshold()).to.equal(HEALTH_THRESHOLD);
      expect(await treasury.incomeThreshold()).to.equal(INCOME_THRESHOLD);
      expect(await treasury.thresholdMet()).to.be.false;
      expect(await treasury.pointSupplySnapshotted()).to.be.false;
    });

    it("has correct ERC20 metadata", async function () {
      const { treasury } = await loadFixture(deployFixture);

      expect(await treasury.name()).to.equal("Voter Prize Share");
      expect(await treasury.symbol()).to.equal("PRIZE");
      expect(await treasury.decimals()).to.equal(6n);
    });

    it("reverts on zero addresses", async function () {
      const { usdc, aToken, aavePool } = await loadFixture(deployFixture);
      const Factory = await ethers.getContractFactory("VoterPrizeTreasury");

      await expect(
        Factory.deploy(
          ethers.ZeroAddress,
          await aToken.getAddress(),
          await aavePool.getAddress(),
          FIFTEEN_YEARS,
          HEALTH_THRESHOLD,
          INCOME_THRESHOLD
        )
      ).to.be.revertedWith("VoterPrizeTreasury: zero stablecoin");
    });

    it("reverts on zero thresholds", async function () {
      const { usdc, aToken, aavePool } = await loadFixture(deployFixture);
      const Factory = await ethers.getContractFactory("VoterPrizeTreasury");

      await expect(
        Factory.deploy(
          await usdc.getAddress(),
          await aToken.getAddress(),
          await aavePool.getAddress(),
          FIFTEEN_YEARS,
          0n,
          INCOME_THRESHOLD
        )
      ).to.be.revertedWith("VoterPrizeTreasury: zero health threshold");
    });
  });

  describe("Deposits", function () {
    it("accepts USDC and mints PRIZE shares", async function () {
      const { treasury, contributor1 } = await loadFixture(deployFixture);

      const tx = await treasury
        .connect(contributor1)
        .deposit(parseUSDC(10_000));
      await expect(tx).to.emit(treasury, "Deposited");

      const shares = await treasury.balanceOf(contributor1.address);
      expect(shares).to.be.greaterThan(0n);
      expect(await treasury.depositorCount()).to.equal(1n);
    });

    it("supplies deposited USDC to Aave", async function () {
      const { treasury, aToken, contributor1 } =
        await loadFixture(deployFixture);

      await treasury.connect(contributor1).deposit(parseUSDC(10_000));

      const aTokenBal = await aToken.balanceOf(await treasury.getAddress());
      expect(aTokenBal).to.equal(parseUSDC(10_000));
    });

    it("rejects zero deposit", async function () {
      const { treasury, contributor1 } = await loadFixture(deployFixture);
      await expect(
        treasury.connect(contributor1).deposit(0n)
      ).to.be.revertedWith("VoterPrizeTreasury: zero deposit");
    });

    it("rejects deposit after maturity", async function () {
      const { treasury, contributor1 } = await loadFixture(deployFixture);

      await time.increase(Number(FIFTEEN_YEARS));
      await expect(
        treasury.connect(contributor1).deposit(parseUSDC(100))
      ).to.be.revertedWith("VoterPrizeTreasury: matured");
    });
  });

  describe("Share pricing", function () {
    it("late depositors get fewer shares when yield accrues", async function () {
      const { treasury, aavePool, contributor1, contributor2 } =
        await loadFixture(deployFixture);

      await treasury.connect(contributor1).deposit(parseUSDC(10_000));
      const shares1 = await treasury.balanceOf(contributor1.address);

      await aavePool.simulateYield(
        await treasury.getAddress(),
        parseUSDC(5_000)
      );

      await treasury.connect(contributor2).deposit(parseUSDC(10_000));
      const shares2 = await treasury.balanceOf(contributor2.address);

      expect(shares2).to.be.lessThan(shares1);
    });

    it("early depositor is not diluted", async function () {
      const { treasury, aavePool, contributor1, contributor2 } =
        await loadFixture(deployFixture);

      await treasury.connect(contributor1).deposit(parseUSDC(10_000));

      await aavePool.simulateYield(
        await treasury.getAddress(),
        parseUSDC(5_000)
      );

      const valBefore = await treasury.getBalance(contributor1.address);
      expect(valBefore).to.be.closeTo(parseUSDC(15_000), parseUSDC(1));

      await treasury.connect(contributor2).deposit(parseUSDC(10_000));

      const valAfter = await treasury.getBalance(contributor1.address);
      expect(valAfter).to.be.closeTo(parseUSDC(15_000), parseUSDC(1));
    });
  });

  describe("Claim Refund (fail path)", function () {
    it("allows refund after maturity when thresholds not met", async function () {
      const { treasury, usdc, aavePool, contributor1 } =
        await loadFixture(deployFixture);

      await treasury.connect(contributor1).deposit(parseUSDC(10_000));

      await aavePool.simulateYield(
        await treasury.getAddress(),
        parseUSDC(5_000)
      );

      await time.increase(Number(FIFTEEN_YEARS));

      const balBefore = await usdc.balanceOf(contributor1.address);
      await expect(treasury.connect(contributor1).claimRefund()).to.emit(
        treasury,
        "RefundClaimed"
      );
      const balAfter = await usdc.balanceOf(contributor1.address);

      expect(balAfter - balBefore).to.be.closeTo(
        parseUSDC(15_000),
        parseUSDC(1)
      );
    });

    it("rejects refund before maturity", async function () {
      const { treasury, contributor1 } = await loadFixture(deployFixture);

      await treasury.connect(contributor1).deposit(parseUSDC(1_000));

      await expect(
        treasury.connect(contributor1).claimRefund()
      ).to.be.revertedWith("VoterPrizeTreasury: not matured");
    });

    it("rejects refund when thresholds met", async function () {
      const { treasury, contributor1 } = await loadFixture(deployFixture);

      await treasury.connect(contributor1).deposit(parseUSDC(1_000));
      await treasury.updateMetrics(HEALTH_THRESHOLD, INCOME_THRESHOLD);

      await time.increase(Number(FIFTEEN_YEARS));

      await expect(
        treasury.connect(contributor1).claimRefund()
      ).to.be.revertedWith("VoterPrizeTreasury: threshold met");
    });

    it("rejects refund with no shares", async function () {
      const { treasury, contributor1 } = await loadFixture(deployFixture);

      await time.increase(Number(FIFTEEN_YEARS));

      await expect(
        treasury.connect(contributor1).claimRefund()
      ).to.be.revertedWith("VoterPrizeTreasury: no shares");
    });
  });

  describe("EOP Redemption (success path)", function () {
    it("EOP holders redeem proportionally when thresholds met", async function () {
      const { treasury, usdc, aavePool, pointToken, contributor1, voter1, voter2, voter3 } =
        await loadFixture(deployFixture);

      // Contributors fund the prize pool
      await treasury.connect(contributor1).deposit(parseUSDC(30_000));

      // Yield accrues
      await aavePool.simulateYield(
        await treasury.getAddress(),
        parseUSDC(6_000)
      );
      // Total = 36,000 USDC

      // Thresholds met
      await treasury.updateMetrics(HEALTH_THRESHOLD, INCOME_THRESHOLD);
      expect(await treasury.thresholdMet()).to.be.true;

      // Snapshot EOP supply (3 EOP total)
      await treasury.snapshotPointSupply();
      expect(await treasury.pointTotalSupplySnapshot()).to.equal(ONE_POINT * 3n);

      // Fast forward to maturity
      await time.increase(Number(FIFTEEN_YEARS));

      // Each voter has 1/3 of EOP supply = 12,000 USDC each
      const bal1Before = await usdc.balanceOf(voter1.address);
      await treasury.connect(voter1).redeemEarthOptimizationPoints();
      const bal1After = await usdc.balanceOf(voter1.address);
      expect(bal1After - bal1Before).to.be.closeTo(
        parseUSDC(12_000),
        parseUSDC(1)
      );

      const bal2Before = await usdc.balanceOf(voter2.address);
      await treasury.connect(voter2).redeemEarthOptimizationPoints();
      const bal2After = await usdc.balanceOf(voter2.address);
      expect(bal2After - bal2Before).to.be.closeTo(
        parseUSDC(12_000),
        parseUSDC(1)
      );

      const bal3Before = await usdc.balanceOf(voter3.address);
      await treasury.connect(voter3).redeemEarthOptimizationPoints();
      const bal3After = await usdc.balanceOf(voter3.address);
      expect(bal3After - bal3Before).to.be.closeTo(
        parseUSDC(12_000),
        parseUSDC(1)
      );
    });

    it("prevents double redemption", async function () {
      const { treasury, aavePool, contributor1, voter1 } =
        await loadFixture(deployFixture);

      await treasury.connect(contributor1).deposit(parseUSDC(10_000));
      await treasury.updateMetrics(HEALTH_THRESHOLD, INCOME_THRESHOLD);
      await treasury.snapshotPointSupply();
      await time.increase(Number(FIFTEEN_YEARS));

      await treasury.connect(voter1).redeemEarthOptimizationPoints();

      await expect(
        treasury.connect(voter1).redeemEarthOptimizationPoints()
      ).to.be.revertedWith("VoterPrizeTreasury: already redeemed");
    });

    it("rejects redemption before maturity", async function () {
      const { treasury, contributor1, voter1 } =
        await loadFixture(deployFixture);

      await treasury.connect(contributor1).deposit(parseUSDC(10_000));
      await treasury.updateMetrics(HEALTH_THRESHOLD, INCOME_THRESHOLD);
      await treasury.snapshotPointSupply();

      await expect(
        treasury.connect(voter1).redeemEarthOptimizationPoints()
      ).to.be.revertedWith("VoterPrizeTreasury: not matured");
    });

    it("rejects redemption when thresholds not met", async function () {
      const { treasury, contributor1, voter1 } =
        await loadFixture(deployFixture);

      await treasury.connect(contributor1).deposit(parseUSDC(10_000));
      await time.increase(Number(FIFTEEN_YEARS));

      await expect(
        treasury.connect(voter1).redeemEarthOptimizationPoints()
      ).to.be.revertedWith("VoterPrizeTreasury: threshold not met");
    });

    it("rejects redemption without snapshot", async function () {
      const { treasury, contributor1, voter1 } =
        await loadFixture(deployFixture);

      await treasury.connect(contributor1).deposit(parseUSDC(10_000));
      await treasury.updateMetrics(HEALTH_THRESHOLD, INCOME_THRESHOLD);
      await time.increase(Number(FIFTEEN_YEARS));

      await expect(
        treasury.connect(voter1).redeemEarthOptimizationPoints()
      ).to.be.revertedWith("VoterPrizeTreasury: not snapshotted");
    });

    it("rejects redemption with no EOP", async function () {
      const { treasury, contributor1 } =
        await loadFixture(deployFixture);

      await treasury.connect(contributor1).deposit(parseUSDC(10_000));
      await treasury.updateMetrics(HEALTH_THRESHOLD, INCOME_THRESHOLD);
      await treasury.snapshotPointSupply();
      await time.increase(Number(FIFTEEN_YEARS));

      // contributor1 has no EOP
      await expect(
        treasury.connect(contributor1).redeemEarthOptimizationPoints()
      ).to.be.revertedWith("VoterPrizeTreasury: no EOP");
    });
  });

  describe("Snapshot", function () {
    it("snapshots EOP total supply", async function () {
      const { treasury, contributor1 } = await loadFixture(deployFixture);

      await treasury.connect(contributor1).deposit(parseUSDC(10_000));
      await treasury.updateMetrics(HEALTH_THRESHOLD, INCOME_THRESHOLD);

      await expect(treasury.snapshotPointSupply())
        .to.emit(treasury, "PointSupplySnapshotted")
        .withArgs(ONE_POINT * 3n); // 3 voters minted in fixture

      expect(await treasury.pointSupplySnapshotted()).to.be.true;
      expect(await treasury.pointTotalSupplySnapshot()).to.equal(ONE_POINT * 3n);
    });

    it("rejects snapshot when threshold not met", async function () {
      const { treasury } = await loadFixture(deployFixture);

      await expect(treasury.snapshotPointSupply()).to.be.revertedWith(
        "VoterPrizeTreasury: threshold not met"
      );
    });

    it("rejects double snapshot", async function () {
      const { treasury, contributor1 } = await loadFixture(deployFixture);

      await treasury.connect(contributor1).deposit(parseUSDC(10_000));
      await treasury.updateMetrics(HEALTH_THRESHOLD, INCOME_THRESHOLD);
      await treasury.snapshotPointSupply();

      await expect(treasury.snapshotPointSupply()).to.be.revertedWith(
        "VoterPrizeTreasury: already snapshotted"
      );
    });

    it("only owner can snapshot", async function () {
      const { treasury, contributor1 } = await loadFixture(deployFixture);

      await treasury.connect(contributor1).deposit(parseUSDC(10_000));
      await treasury.updateMetrics(HEALTH_THRESHOLD, INCOME_THRESHOLD);

      await expect(
        treasury.connect(contributor1).snapshotPointSupply()
      ).to.be.revertedWithCustomError(treasury, "OwnableUnauthorizedAccount");
    });
  });

  describe("Metrics", function () {
    it("updates threshold to true when both met", async function () {
      const { treasury } = await loadFixture(deployFixture);

      await expect(
        treasury.updateMetrics(HEALTH_THRESHOLD, INCOME_THRESHOLD)
      )
        .to.emit(treasury, "MetricsUpdated")
        .withArgs(HEALTH_THRESHOLD, INCOME_THRESHOLD, true);

      expect(await treasury.thresholdMet()).to.be.true;
    });

    it("does not flip when only one met", async function () {
      const { treasury } = await loadFixture(deployFixture);

      await treasury.updateMetrics(HEALTH_THRESHOLD, 0n);
      expect(await treasury.thresholdMet()).to.be.false;
    });

    it("threshold stays true once set", async function () {
      const { treasury } = await loadFixture(deployFixture);

      await treasury.updateMetrics(HEALTH_THRESHOLD, INCOME_THRESHOLD);
      expect(await treasury.thresholdMet()).to.be.true;

      await treasury.updateMetrics(0n, 0n);
      expect(await treasury.thresholdMet()).to.be.true;
    });

    it("only owner can update metrics", async function () {
      const { treasury, contributor1 } = await loadFixture(deployFixture);

      await expect(
        treasury.connect(contributor1).updateMetrics(100n, 50n)
      ).to.be.revertedWithCustomError(treasury, "OwnableUnauthorizedAccount");
    });
  });

  describe("Admin", function () {
    it("sets EOP address", async function () {
      const { treasury, pointToken } = await loadFixture(deployFixture);

      // Already set in fixture; verify
      expect(await treasury.earthOptimizationPoint()).to.equal(
        await pointToken.getAddress()
      );
    });

    it("rejects zero address for EOP", async function () {
      const { treasury } = await loadFixture(deployFixture);

      await expect(
        treasury.setEarthOptimizationPoint(ethers.ZeroAddress)
      ).to.be.revertedWith("VoterPrizeTreasury: zero EOP");
    });

    it("only owner can set EOP", async function () {
      const { treasury, pointToken, contributor1 } =
        await loadFixture(deployFixture);

      await expect(
        treasury
          .connect(contributor1)
          .setEarthOptimizationPoint(await pointToken.getAddress())
      ).to.be.revertedWithCustomError(treasury, "OwnableUnauthorizedAccount");
    });
  });

  describe("View functions", function () {
    it("maturityTimestamp is deploy + duration", async function () {
      const { treasury } = await loadFixture(deployFixture);

      const deploy = await treasury.deployTimestamp();
      const maturity = await treasury.maturityTimestamp();
      expect(maturity).to.equal(deploy + FIFTEEN_YEARS);
    });

    it("previewPointRedemption returns correct amount", async function () {
      const { treasury, aavePool, contributor1, voter1 } =
        await loadFixture(deployFixture);

      await treasury.connect(contributor1).deposit(parseUSDC(30_000));

      await aavePool.simulateYield(
        await treasury.getAddress(),
        parseUSDC(6_000)
      );

      await treasury.updateMetrics(HEALTH_THRESHOLD, INCOME_THRESHOLD);
      await treasury.snapshotPointSupply();

      // voter1 has 1/3 of 3 EOP → 1/3 of 36,000 = 12,000
      const preview = await treasury.previewPointRedemption(voter1.address);
      expect(preview).to.be.closeTo(parseUSDC(12_000), parseUSDC(1));
    });

    it("previewPointRedemption returns 0 before snapshot", async function () {
      const { treasury, contributor1, voter1 } =
        await loadFixture(deployFixture);

      await treasury.connect(contributor1).deposit(parseUSDC(10_000));

      const preview = await treasury.previewPointRedemption(voter1.address);
      expect(preview).to.equal(0n);
    });
  });

  describe("Full lifecycle — fail path", function () {
    it("deposit → yield → maturity → PRIZE holders refund", async function () {
      const { treasury, usdc, aavePool, contributor1, contributor2 } =
        await loadFixture(deployFixture);

      await treasury.connect(contributor1).deposit(parseUSDC(8_000));
      await treasury.connect(contributor2).deposit(parseUSDC(2_000));

      await aavePool.simulateYield(
        await treasury.getAddress(),
        parseUSDC(2_000)
      );
      // Total = 12,000

      await treasury.updateMetrics(50n, 25n);
      expect(await treasury.thresholdMet()).to.be.false;

      await time.increase(Number(FIFTEEN_YEARS));

      // C1: 80% of 12,000 = 9,600
      const bal1Before = await usdc.balanceOf(contributor1.address);
      await treasury.connect(contributor1).claimRefund();
      const bal1After = await usdc.balanceOf(contributor1.address);
      expect(bal1After - bal1Before).to.be.closeTo(
        parseUSDC(9_600),
        parseUSDC(1)
      );

      // C2: 20% of 12,000 = 2,400
      const bal2Before = await usdc.balanceOf(contributor2.address);
      await treasury.connect(contributor2).claimRefund();
      const bal2After = await usdc.balanceOf(contributor2.address);
      expect(bal2After - bal2Before).to.be.closeTo(
        parseUSDC(2_400),
        parseUSDC(1)
      );
    });
  });

  describe("Full lifecycle — success path", function () {
    it("deposit → threshold met → snapshot → maturity → EOP holders redeem", async function () {
      const {
        treasury,
        usdc,
        aavePool,
        pointToken,
        contributor1,
        voter1,
        voter2,
        voter3,
      } = await loadFixture(deployFixture);

      // 1. Contributors fund prize pool
      await treasury.connect(contributor1).deposit(parseUSDC(30_000));

      // 2. Yield accrues
      await aavePool.simulateYield(
        await treasury.getAddress(),
        parseUSDC(6_000)
      );

      // 3. Thresholds met
      await treasury.updateMetrics(HEALTH_THRESHOLD, INCOME_THRESHOLD);

      // 4. Snapshot EOP supply
      await treasury.snapshotPointSupply();

      // 5. Maturity
      await time.increase(Number(FIFTEEN_YEARS));

      // 6. Each voter redeems 1/3 of 36,000 = 12,000
      for (const voter of [voter1, voter2, voter3]) {
        const balBefore = await usdc.balanceOf(voter.address);
        await treasury.connect(voter).redeemEarthOptimizationPoints();
        const balAfter = await usdc.balanceOf(voter.address);
        expect(balAfter - balBefore).to.be.closeTo(
          parseUSDC(12_000),
          parseUSDC(1)
        );
      }

      // 7. PRIZE holders cannot refund (threshold was met)
      await expect(
        treasury.connect(contributor1).claimRefund()
      ).to.be.revertedWith("VoterPrizeTreasury: threshold met");

      // 8. EOP still exist (not burned by treasury)
      expect(await pointToken.balanceOf(voter1.address)).to.equal(ONE_POINT);
    });
  });

  describe("Prediction market behavior", function () {
    it("EOP buyer on secondary market can redeem", async function () {
      const { treasury, usdc, aavePool, pointToken, contributor1, voter1, voter2 } =
        await loadFixture(deployFixture);

      await treasury.connect(contributor1).deposit(parseUSDC(30_000));
      await aavePool.simulateYield(
        await treasury.getAddress(),
        parseUSDC(6_000)
      );

      // voter1 transfers all EOP to voter2 (secondary market sale)
      await pointToken
        .connect(voter1)
        .transfer(voter2.address, ONE_POINT);

      // voter2 now has 2 EOP (own + purchased)
      expect(await pointToken.balanceOf(voter2.address)).to.equal(
        ONE_POINT * 2n
      );

      await treasury.updateMetrics(HEALTH_THRESHOLD, INCOME_THRESHOLD);
      await treasury.snapshotPointSupply();
      await time.increase(Number(FIFTEEN_YEARS));

      // voter2 redeems: 2/3 of 36,000 = 24,000
      const bal2Before = await usdc.balanceOf(voter2.address);
      await treasury.connect(voter2).redeemEarthOptimizationPoints();
      const bal2After = await usdc.balanceOf(voter2.address);
      expect(bal2After - bal2Before).to.be.closeTo(
        parseUSDC(24_000),
        parseUSDC(1)
      );

      // voter1 sold their EOP — nothing to redeem
      await expect(
        treasury.connect(voter1).redeemEarthOptimizationPoints()
      ).to.be.revertedWith("VoterPrizeTreasury: no EOP");
    });
  });
});
