import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("PrizePool", function () {
  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const HEALTH_THRESHOLD = 100n; // 1% improvement
  const INCOME_THRESHOLD = 50n; // 0.5% improvement
  const DISPUTE_BOND_MIN = ethers.parseEther("100");

  async function deployFixture() {
    const [owner, donor1, donor2, donor3, impl1, impl2, challenger] =
      await ethers.getSigners();

    const WishToken = await ethers.getContractFactory("WishToken");
    const wish = await WishToken.deploy(owner.address, INITIAL_SUPPLY, 0n); // no tax for simpler tests

    const PrizePool = await ethers.getContractFactory("PrizePool");
    const pool = await PrizePool.deploy(
      await wish.getAddress(),
      HEALTH_THRESHOLD,
      INCOME_THRESHOLD,
      DISPUTE_BOND_MIN
    );

    // Fund donors
    await wish.transfer(donor1.address, ethers.parseEther("10000"));
    await wish.transfer(donor2.address, ethers.parseEther("5000"));
    await wish.transfer(donor3.address, ethers.parseEther("2000"));
    await wish.transfer(challenger.address, ethers.parseEther("1000"));

    // Approve pool for all donors
    const poolAddr = await pool.getAddress();
    await wish.connect(donor1).approve(poolAddr, ethers.MaxUint256);
    await wish.connect(donor2).approve(poolAddr, ethers.MaxUint256);
    await wish.connect(donor3).approve(poolAddr, ethers.MaxUint256);
    await wish.connect(challenger).approve(poolAddr, ethers.MaxUint256);

    return { wish, pool, owner, donor1, donor2, donor3, impl1, impl2, challenger };
  }

  function implId(name: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(name));
  }

  describe("Deployment", function () {
    it("sets initial state correctly", async function () {
      const { pool, wish } = await loadFixture(deployFixture);
      expect(await pool.wishToken()).to.equal(await wish.getAddress());
      expect(await pool.healthThreshold()).to.equal(HEALTH_THRESHOLD);
      expect(await pool.incomeThreshold()).to.equal(INCOME_THRESHOLD);
      expect(await pool.status()).to.equal(0n); // Open
    });

    it("reverts on zero token", async function () {
      const PrizePool = await ethers.getContractFactory("PrizePool");
      await expect(
        PrizePool.deploy(ethers.ZeroAddress, HEALTH_THRESHOLD, INCOME_THRESHOLD, DISPUTE_BOND_MIN)
      ).to.be.revertedWith("PrizePool: zero token");
    });

    it("reverts on zero thresholds", async function () {
      const { wish } = await loadFixture(deployFixture);
      const PrizePool = await ethers.getContractFactory("PrizePool");
      await expect(
        PrizePool.deploy(await wish.getAddress(), 0n, INCOME_THRESHOLD, DISPUTE_BOND_MIN)
      ).to.be.revertedWith("PrizePool: zero health threshold");
    });
  });

  describe("Deposits (deposit-as-identity)", function () {
    it("accepts deposits and tracks donor amounts", async function () {
      const { pool, donor1 } = await loadFixture(deployFixture);

      await expect(pool.connect(donor1).deposit(ethers.parseEther("1000")))
        .to.emit(pool, "Deposited")
        .withArgs(donor1.address, ethers.parseEther("1000"));

      expect(await pool.donorDeposit(donor1.address)).to.equal(ethers.parseEther("1000"));
      expect(await pool.totalDeposits()).to.equal(ethers.parseEther("1000"));
      expect(await pool.donorCount()).to.equal(1n);
    });

    it("accumulates multiple deposits from same donor", async function () {
      const { pool, donor1 } = await loadFixture(deployFixture);

      await pool.connect(donor1).deposit(ethers.parseEther("500"));
      await pool.connect(donor1).deposit(ethers.parseEther("300"));

      expect(await pool.donorDeposit(donor1.address)).to.equal(ethers.parseEther("800"));
      expect(await pool.donorCount()).to.equal(1n); // still one donor
    });

    it("tracks multiple donors", async function () {
      const { pool, donor1, donor2, donor3 } = await loadFixture(deployFixture);

      await pool.connect(donor1).deposit(ethers.parseEther("5000"));
      await pool.connect(donor2).deposit(ethers.parseEther("3000"));
      await pool.connect(donor3).deposit(ethers.parseEther("1000"));

      expect(await pool.totalDeposits()).to.equal(ethers.parseEther("9000"));
      expect(await pool.donorCount()).to.equal(3n);
    });

    it("allows withdrawal while pool is open", async function () {
      const { pool, wish, donor1 } = await loadFixture(deployFixture);

      await pool.connect(donor1).deposit(ethers.parseEther("1000"));
      const balBefore = await wish.balanceOf(donor1.address);

      await expect(pool.connect(donor1).withdraw(ethers.parseEther("500")))
        .to.emit(pool, "Withdrawn")
        .withArgs(donor1.address, ethers.parseEther("500"));

      expect(await wish.balanceOf(donor1.address)).to.equal(
        balBefore + ethers.parseEther("500")
      );
      expect(await pool.donorDeposit(donor1.address)).to.equal(ethers.parseEther("500"));
    });

    it("rejects deposits when pool is locked", async function () {
      const { pool, donor1 } = await loadFixture(deployFixture);
      await pool.lockPool();

      await expect(
        pool.connect(donor1).deposit(ethers.parseEther("100"))
      ).to.be.revertedWith("PrizePool: not accepting deposits");
    });

    it("rejects withdrawal when pool is locked", async function () {
      const { pool, donor1 } = await loadFixture(deployFixture);
      await pool.connect(donor1).deposit(ethers.parseEther("1000"));
      await pool.lockPool();

      await expect(
        pool.connect(donor1).withdraw(ethers.parseEther("500"))
      ).to.be.revertedWith("PrizePool: pool locked");
    });

    it("rejects zero deposit", async function () {
      const { pool, donor1 } = await loadFixture(deployFixture);
      await expect(
        pool.connect(donor1).deposit(0n)
      ).to.be.revertedWith("PrizePool: zero deposit");
    });
  });

  describe("Metrics & threshold unlock", function () {
    it("updates metrics", async function () {
      const { pool } = await loadFixture(deployFixture);

      await expect(pool.updateMetrics(50n, 30n))
        .to.emit(pool, "MetricsUpdated")
        .withArgs(50n, 30n);

      expect(await pool.currentHealthMetric()).to.equal(50n);
      expect(await pool.currentIncomeMetric()).to.equal(30n);
    });

    it("auto-locks when both thresholds met", async function () {
      const { pool } = await loadFixture(deployFixture);

      await expect(pool.updateMetrics(HEALTH_THRESHOLD, INCOME_THRESHOLD))
        .to.emit(pool, "PoolUnlocked");

      expect(await pool.status()).to.equal(1n); // Locked
    });

    it("does not auto-lock when only one threshold met", async function () {
      const { pool } = await loadFixture(deployFixture);

      await pool.updateMetrics(HEALTH_THRESHOLD, 0n);
      expect(await pool.status()).to.equal(0n); // still Open
    });

    it("reports threshold status correctly", async function () {
      const { pool } = await loadFixture(deployFixture);

      await pool.updateMetrics(HEALTH_THRESHOLD, 30n);
      const [health, income, both] = await pool.isThresholdMet();
      expect(health).to.be.true;
      expect(income).to.be.false;
      expect(both).to.be.false;
    });
  });

  describe("Implementer registration & allocation", function () {
    it("registers implementers with evidence CIDs", async function () {
      const { pool, impl1 } = await loadFixture(deployFixture);

      const id = implId("dfda-trial-network");
      await expect(
        pool.registerImplementer(id, impl1.address, "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3ocigtqy55fbzdi")
      )
        .to.emit(pool, "ImplementerRegistered")
        .withArgs(id, impl1.address, "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3ocigtqy55fbzdi");

      expect(await pool.implementerCount()).to.equal(1n);
    });

    it("rejects duplicate registration", async function () {
      const { pool, impl1 } = await loadFixture(deployFixture);
      const id = implId("dfda");
      await pool.registerImplementer(id, impl1.address, "bafycid1");
      await expect(
        pool.registerImplementer(id, impl1.address, "bafycid2")
      ).to.be.revertedWith("PrizePool: already registered");
    });

    it("sets Wishocratic allocation weights", async function () {
      const { pool, donor1, impl1, impl2 } = await loadFixture(deployFixture);

      // Deposit, lock, begin allocation
      await pool.connect(donor1).deposit(ethers.parseEther("1000"));
      await pool.lockPool();
      await pool.beginAllocation();

      // Register implementers
      const id1 = implId("dfda");
      const id2 = implId("wishocracy-ui");
      await pool.registerImplementer(id1, impl1.address, "bafycid1");
      await pool.registerImplementer(id2, impl2.address, "bafycid2");

      // Set allocations (must sum to 10000)
      await pool.setAllocations([id1, id2], [7000n, 3000n]);

      expect(await pool.totalAllocationWeight()).to.equal(10_000n);
    });

    it("rejects allocations that don't sum to 10000", async function () {
      const { pool, donor1, impl1, impl2 } = await loadFixture(deployFixture);

      await pool.connect(donor1).deposit(ethers.parseEther("1000"));
      await pool.lockPool();
      await pool.beginAllocation();

      const id1 = implId("dfda");
      const id2 = implId("wishocracy");
      await pool.registerImplementer(id1, impl1.address, "bafycid1");
      await pool.registerImplementer(id2, impl2.address, "bafycid2");

      await expect(
        pool.setAllocations([id1, id2], [5000n, 4000n])
      ).to.be.revertedWith("PrizePool: weights must sum to 10000");
    });
  });

  describe("Distribution", function () {
    it("distributes funds proportionally to allocation weights", async function () {
      const { pool, wish, donor1, donor2, impl1, impl2 } =
        await loadFixture(deployFixture);

      // Donors deposit different amounts (deposit-as-identity)
      await pool.connect(donor1).deposit(ethers.parseEther("6000"));
      await pool.connect(donor2).deposit(ethers.parseEther("4000"));

      // Lock and begin allocation
      await pool.lockPool();
      await pool.beginAllocation();

      // Register implementers
      const id1 = implId("dfda");
      const id2 = implId("wishocracy");
      await pool.registerImplementer(id1, impl1.address, "bafycid1");
      await pool.registerImplementer(id2, impl2.address, "bafycid2");

      // Wishocratic allocation: 70% to dfda, 30% to wishocracy
      await pool.setAllocations([id1, id2], [7000n, 3000n]);

      // Distribute
      await expect(pool.distribute())
        .to.emit(pool, "FundsDistributed");

      const totalPool = ethers.parseEther("10000");
      expect(await wish.balanceOf(impl1.address)).to.equal(
        (totalPool * 7000n) / 10_000n
      );
      expect(await wish.balanceOf(impl2.address)).to.equal(
        (totalPool * 3000n) / 10_000n
      );
      expect(await pool.status()).to.equal(3n); // Distributed
    });
  });

  describe("Disputes", function () {
    async function allocatingFixture() {
      const fixture = await deployFixture();
      const { pool, donor1, impl1, impl2, challenger } = fixture;

      await pool.connect(donor1).deposit(ethers.parseEther("5000"));
      await pool.lockPool();
      await pool.beginAllocation();

      const id1 = implId("dfda");
      const id2 = implId("wishocracy");
      await pool.registerImplementer(id1, impl1.address, "bafycid1");
      await pool.registerImplementer(id2, impl2.address, "bafycid2");
      await pool.setAllocations([id1, id2], [7000n, 3000n]);

      return { ...fixture, id1, id2 };
    }

    it("accepts dispute with valid bond", async function () {
      const { pool, challenger, id1 } = await loadFixture(allocatingFixture);

      await expect(
        pool.connect(challenger).openDispute(id1, DISPUTE_BOND_MIN)
      )
        .to.emit(pool, "DisputeOpened")
        .withArgs(0n, challenger.address, id1, DISPUTE_BOND_MIN);

      expect(await pool.disputeCount()).to.equal(1n);
    });

    it("rejects dispute with insufficient bond", async function () {
      const { pool, challenger, id1 } = await loadFixture(allocatingFixture);

      await expect(
        pool.connect(challenger).openDispute(id1, ethers.parseEther("50"))
      ).to.be.revertedWith("PrizePool: bond too small");
    });

    it("successful dispute deactivates implementer and returns bond", async function () {
      const { pool, wish, challenger, id1 } = await loadFixture(allocatingFixture);

      await pool.connect(challenger).openDispute(id1, DISPUTE_BOND_MIN);
      const balBefore = await wish.balanceOf(challenger.address);

      await expect(pool.resolveDispute(0n, true))
        .to.emit(pool, "DisputeResolved")
        .withArgs(0n, true);

      // Bond returned
      expect(await wish.balanceOf(challenger.address)).to.equal(
        balBefore + DISPUTE_BOND_MIN
      );

      // Implementer deactivated
      const impl = await pool.implementers(id1);
      expect(impl.active).to.be.false;
      expect(impl.allocationWeight).to.equal(0n);
    });

    it("failed dispute keeps bond in pool", async function () {
      const { pool, wish, challenger, id1 } = await loadFixture(allocatingFixture);

      await pool.connect(challenger).openDispute(id1, DISPUTE_BOND_MIN);
      const poolBalBefore = await wish.balanceOf(await pool.getAddress());

      await pool.resolveDispute(0n, false);

      // Bond stays in pool
      expect(await wish.balanceOf(await pool.getAddress())).to.equal(poolBalBefore);
    });
  });

  describe("Full lifecycle", function () {
    it("deposit → metrics → unlock → register → allocate → distribute", async function () {
      const { pool, wish, donor1, donor2, impl1, impl2 } =
        await loadFixture(deployFixture);

      // 1. Donors deposit
      await pool.connect(donor1).deposit(ethers.parseEther("8000"));
      await pool.connect(donor2).deposit(ethers.parseEther("2000"));
      expect(await pool.status()).to.equal(0n); // Open

      // 2. Metrics update — auto-unlock
      await pool.updateMetrics(HEALTH_THRESHOLD, INCOME_THRESHOLD);
      expect(await pool.status()).to.equal(1n); // Locked

      // 3. Begin allocation
      await pool.beginAllocation();
      expect(await pool.status()).to.equal(2n); // Allocating

      // 4. Register implementers with Storacha CIDs
      const id1 = implId("dfda-trial-network");
      const id2 = implId("optimocracy-engine");
      await pool.registerImplementer(
        id1, impl1.address,
        "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3ocigtqy55fbzdi"
      );
      await pool.registerImplementer(
        id2, impl2.address,
        "bafybeic2e7hbgqqhk5r3h5jhsjxwed4nw2tof7nnkwmqbyqif3sm5ccouy"
      );

      // 5. Set Wishocratic allocations (from off-chain pairwise comparison)
      await pool.setAllocations([id1, id2], [6500n, 3500n]);

      // 6. Distribute
      await pool.distribute();
      expect(await pool.status()).to.equal(3n); // Distributed

      const total = ethers.parseEther("10000");
      expect(await wish.balanceOf(impl1.address)).to.equal((total * 6500n) / 10_000n);
      expect(await wish.balanceOf(impl2.address)).to.equal((total * 3500n) / 10_000n);
    });
  });
});
