import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("WishocraticTreasury", function () {
  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const TAX_RATE_BPS = 50n; // 0.5%

  async function deployFixture() {
    const [owner, recipientA, recipientB, recipientC, citizen1, citizen2, anyone] =
      await ethers.getSigners();

    // Deploy WishToken with owner as temporary treasury
    const WishToken = await ethers.getContractFactory("WishToken");
    const wish = await WishToken.deploy(owner.address, INITIAL_SUPPLY, TAX_RATE_BPS);

    // Deploy UBIDistributor (recipient for the UBI budget category)
    const UBIDistributor = await ethers.getContractFactory("UBIDistributor");
    const ubiDistributor = await UBIDistributor.deploy(await wish.getAddress());

    // Deploy WishocraticTreasury
    const WishocraticTreasury = await ethers.getContractFactory("WishocraticTreasury");
    const treasury = await WishocraticTreasury.deploy(await wish.getAddress());

    // Set WishocraticTreasury as the WishToken's treasury
    await wish.setTreasury(await treasury.getAddress());

    // Category IDs
    const UBI = ethers.keccak256(ethers.toUtf8Bytes("UNIVERSAL_BASIC_INCOME"));
    const CLINICAL = ethers.keccak256(ethers.toUtf8Bytes("PRAGMATIC_CLINICAL_TRIALS"));
    const EDUCATION = ethers.keccak256(ethers.toUtf8Bytes("EARLY_CHILDHOOD_EDUCATION"));

    return {
      wish, treasury, ubiDistributor, owner,
      recipientA, recipientB, recipientC,
      citizen1, citizen2, anyone,
      UBI, CLINICAL, EDUCATION,
    };
  }

  describe("Deployment", function () {
    it("sets wish token", async function () {
      const { wish, treasury } = await loadFixture(deployFixture);
      expect(await treasury.wishToken()).to.equal(await wish.getAddress());
    });

    it("sets owner", async function () {
      const { treasury, owner } = await loadFixture(deployFixture);
      expect(await treasury.owner()).to.equal(owner.address);
    });

    it("reverts on zero token address", async function () {
      const WishocraticTreasury = await ethers.getContractFactory("WishocraticTreasury");
      await expect(
        WishocraticTreasury.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("WishocraticTreasury: zero token");
    });

    it("starts with zero categories", async function () {
      const { treasury } = await loadFixture(deployFixture);
      expect(await treasury.categoryCount()).to.equal(0n);
    });
  });

  describe("registerRecipient", function () {
    it("registers a category recipient", async function () {
      const { treasury, recipientA, UBI } = await loadFixture(deployFixture);

      await expect(treasury.registerRecipient(UBI, recipientA.address))
        .to.emit(treasury, "RecipientRegistered")
        .withArgs(UBI, recipientA.address);

      const recipient = await treasury.recipients(UBI);
      expect(recipient.wallet).to.equal(recipientA.address);
      expect(recipient.active).to.be.true;
      expect(await treasury.categoryCount()).to.equal(1n);
    });

    it("rejects duplicate registration", async function () {
      const { treasury, recipientA, UBI } = await loadFixture(deployFixture);

      await treasury.registerRecipient(UBI, recipientA.address);
      await expect(
        treasury.registerRecipient(UBI, recipientA.address)
      ).to.be.revertedWith("WishocraticTreasury: already registered");
    });

    it("rejects zero address wallet", async function () {
      const { treasury, UBI } = await loadFixture(deployFixture);
      await expect(
        treasury.registerRecipient(UBI, ethers.ZeroAddress)
      ).to.be.revertedWith("WishocraticTreasury: zero wallet");
    });

    it("rejects zero categoryId", async function () {
      const { treasury, recipientA } = await loadFixture(deployFixture);
      await expect(
        treasury.registerRecipient(ethers.ZeroHash, recipientA.address)
      ).to.be.revertedWith("WishocraticTreasury: zero categoryId");
    });

    it("only owner can register", async function () {
      const { treasury, recipientA, anyone, UBI } = await loadFixture(deployFixture);
      await expect(
        treasury.connect(anyone).registerRecipient(UBI, recipientA.address)
      ).to.be.revertedWithCustomError(treasury, "OwnableUnauthorizedAccount");
    });
  });

  describe("updateRecipient", function () {
    it("updates an existing recipient wallet", async function () {
      const { treasury, recipientA, recipientB, UBI } = await loadFixture(deployFixture);

      await treasury.registerRecipient(UBI, recipientA.address);
      await expect(treasury.updateRecipient(UBI, recipientB.address))
        .to.emit(treasury, "RecipientUpdated")
        .withArgs(UBI, recipientA.address, recipientB.address);

      const recipient = await treasury.recipients(UBI);
      expect(recipient.wallet).to.equal(recipientB.address);
    });

    it("rejects update for unregistered category", async function () {
      const { treasury, recipientA, UBI } = await loadFixture(deployFixture);
      await expect(
        treasury.updateRecipient(UBI, recipientA.address)
      ).to.be.revertedWith("WishocraticTreasury: not registered");
    });
  });

  describe("deactivateRecipient", function () {
    it("deactivates a recipient", async function () {
      const { treasury, recipientA, UBI } = await loadFixture(deployFixture);

      await treasury.registerRecipient(UBI, recipientA.address);
      await expect(treasury.deactivateRecipient(UBI))
        .to.emit(treasury, "RecipientDeactivated")
        .withArgs(UBI);

      const recipient = await treasury.recipients(UBI);
      expect(recipient.active).to.be.false;
    });

    it("rejects deactivation of unregistered category", async function () {
      const { treasury, UBI } = await loadFixture(deployFixture);
      await expect(
        treasury.deactivateRecipient(UBI)
      ).to.be.revertedWith("WishocraticTreasury: not registered");
    });
  });

  describe("updateWeights", function () {
    it("posts allocation weights that sum to 10000", async function () {
      const { treasury, recipientA, recipientB, recipientC, UBI, CLINICAL, EDUCATION } =
        await loadFixture(deployFixture);

      await treasury.registerRecipient(UBI, recipientA.address);
      await treasury.registerRecipient(CLINICAL, recipientB.address);
      await treasury.registerRecipient(EDUCATION, recipientC.address);

      await expect(
        treasury.updateWeights(
          [UBI, CLINICAL, EDUCATION],
          [3000n, 4500n, 2500n],
          150n, // participants
          2400n, // comparisons
        )
      ).to.emit(treasury, "WeightsUpdated");

      expect(await treasury.allocationWeights(UBI)).to.equal(3000n);
      expect(await treasury.allocationWeights(CLINICAL)).to.equal(4500n);
      expect(await treasury.allocationWeights(EDUCATION)).to.equal(2500n);
      expect(await treasury.totalParticipants()).to.equal(150n);
      expect(await treasury.totalComparisons()).to.equal(2400n);
      expect(await treasury.lastWeightsUpdate()).to.be.gt(0n);
    });

    it("rejects weights not summing to 10000", async function () {
      const { treasury, recipientA, recipientB, UBI, CLINICAL } =
        await loadFixture(deployFixture);

      await treasury.registerRecipient(UBI, recipientA.address);
      await treasury.registerRecipient(CLINICAL, recipientB.address);

      await expect(
        treasury.updateWeights([UBI, CLINICAL], [5000n, 4000n], 10n, 20n)
      ).to.be.revertedWith("WishocraticTreasury: weights must sum to 10000");
    });

    it("rejects unregistered category in weights", async function () {
      const { treasury, recipientA, UBI, CLINICAL } = await loadFixture(deployFixture);

      await treasury.registerRecipient(UBI, recipientA.address);

      await expect(
        treasury.updateWeights([UBI, CLINICAL], [5000n, 5000n], 10n, 20n)
      ).to.be.revertedWith("WishocraticTreasury: unregistered category");
    });

    it("rejects empty input", async function () {
      const { treasury } = await loadFixture(deployFixture);
      await expect(
        treasury.updateWeights([], [], 0n, 0n)
      ).to.be.revertedWith("WishocraticTreasury: empty input");
    });

    it("rejects length mismatch", async function () {
      const { treasury, recipientA, UBI } = await loadFixture(deployFixture);
      await treasury.registerRecipient(UBI, recipientA.address);

      await expect(
        treasury.updateWeights([UBI], [5000n, 5000n], 10n, 20n)
      ).to.be.revertedWith("WishocraticTreasury: length mismatch");
    });

    it("only owner can update weights", async function () {
      const { treasury, recipientA, anyone, UBI } = await loadFixture(deployFixture);
      await treasury.registerRecipient(UBI, recipientA.address);

      await expect(
        treasury.connect(anyone).updateWeights([UBI], [10000n], 1n, 1n)
      ).to.be.revertedWithCustomError(treasury, "OwnableUnauthorizedAccount");
    });
  });

  describe("distribute", function () {
    it("splits $WISH proportionally to weights", async function () {
      const { wish, treasury, recipientA, recipientB, UBI, CLINICAL } =
        await loadFixture(deployFixture);

      await treasury.registerRecipient(UBI, recipientA.address);
      await treasury.registerRecipient(CLINICAL, recipientB.address);
      await treasury.updateWeights([UBI, CLINICAL], [6000n, 4000n], 50n, 100n);

      // Fund the treasury
      const fundAmount = ethers.parseEther("10000");
      await wish.transfer(await treasury.getAddress(), fundAmount);

      await expect(treasury.distribute())
        .to.emit(treasury, "FundsDistributed");

      // 60% to UBI recipient, 40% to clinical recipient
      const expectedUbi = (fundAmount * 6000n) / 10000n;
      const expectedClinical = (fundAmount * 4000n) / 10000n;

      expect(await wish.balanceOf(recipientA.address)).to.equal(expectedUbi);
      expect(await wish.balanceOf(recipientB.address)).to.equal(expectedClinical);
    });

    it("is permissionless — anyone can trigger", async function () {
      const { wish, treasury, recipientA, anyone, UBI } =
        await loadFixture(deployFixture);

      await treasury.registerRecipient(UBI, recipientA.address);
      await treasury.updateWeights([UBI], [10000n], 10n, 20n);
      await wish.transfer(await treasury.getAddress(), ethers.parseEther("1000"));

      await expect(treasury.connect(anyone).distribute())
        .to.emit(treasury, "FundsDistributed");
    });

    it("reverts when no funds", async function () {
      const { treasury, recipientA, UBI } = await loadFixture(deployFixture);

      await treasury.registerRecipient(UBI, recipientA.address);
      await treasury.updateWeights([UBI], [10000n], 10n, 20n);

      await expect(treasury.distribute())
        .to.be.revertedWith("WishocraticTreasury: no funds");
    });

    it("reverts when no weights set", async function () {
      const { wish, treasury } = await loadFixture(deployFixture);
      await wish.transfer(await treasury.getAddress(), ethers.parseEther("100"));

      await expect(treasury.distribute())
        .to.be.revertedWith("WishocraticTreasury: no weights set");
    });

    it("skips categories with 0 weight", async function () {
      const { wish, treasury, recipientA, recipientB, recipientC, UBI, CLINICAL, EDUCATION } =
        await loadFixture(deployFixture);

      await treasury.registerRecipient(UBI, recipientA.address);
      await treasury.registerRecipient(CLINICAL, recipientB.address);
      await treasury.registerRecipient(EDUCATION, recipientC.address);

      // Education gets 0 weight
      await treasury.updateWeights(
        [UBI, CLINICAL, EDUCATION],
        [7000n, 3000n, 0n],
        20n, 40n,
      );

      const fundAmount = ethers.parseEther("10000");
      await wish.transfer(await treasury.getAddress(), fundAmount);

      await treasury.distribute();

      expect(await wish.balanceOf(recipientC.address)).to.equal(0n);
      expect(await wish.balanceOf(recipientA.address)).to.equal(
        (fundAmount * 7000n) / 10000n
      );
      expect(await wish.balanceOf(recipientB.address)).to.equal(
        (fundAmount * 3000n) / 10000n
      );
    });

    it("skips deactivated categories", async function () {
      const { wish, treasury, recipientA, recipientB, UBI, CLINICAL } =
        await loadFixture(deployFixture);

      await treasury.registerRecipient(UBI, recipientA.address);
      await treasury.registerRecipient(CLINICAL, recipientB.address);
      await treasury.updateWeights([UBI, CLINICAL], [5000n, 5000n], 10n, 20n);

      // Deactivate clinical
      await treasury.deactivateRecipient(CLINICAL);

      const fundAmount = ethers.parseEther("10000");
      await wish.transfer(await treasury.getAddress(), fundAmount);

      await treasury.distribute();

      // Only UBI gets its 50% share; clinical's share stays in contract
      expect(await wish.balanceOf(recipientA.address)).to.equal(
        (fundAmount * 5000n) / 10000n
      );
      expect(await wish.balanceOf(recipientB.address)).to.equal(0n);
    });
  });

  describe("Integration: WishToken → WishocraticTreasury → UBIDistributor → Citizens", function () {
    it("full chain: transfer tax → Wishocratic split → UBI to citizens", async function () {
      const {
        wish, treasury, ubiDistributor, owner,
        recipientB, citizen1, citizen2,
        UBI, CLINICAL,
      } = await loadFixture(deployFixture);

      // Make UBIDistributor tax-exempt (as it would be in real deployment)
      await wish.setTaxExempt(await ubiDistributor.getAddress(), true);

      // 1. Register UBI category pointing to UBIDistributor
      await treasury.registerRecipient(UBI, await ubiDistributor.getAddress());
      await treasury.registerRecipient(CLINICAL, recipientB.address);

      // 2. Set weights: 60% UBI, 40% clinical trials
      await treasury.updateWeights(
        [UBI, CLINICAL],
        [6000n, 4000n],
        100n, 500n,
      );

      // 3. Register citizens in UBIDistributor
      const null1 = ethers.keccak256(ethers.toUtf8Bytes("worldid-1"));
      const null2 = ethers.keccak256(ethers.toUtf8Bytes("worldid-2"));
      await ubiDistributor.registerForUBI(citizen1.address, null1);
      await ubiDistributor.registerForUBI(citizen2.address, null2);

      // 4. Fund WishocraticTreasury (simulate accumulated tax)
      const fundAmount = ethers.parseEther("100000");
      await wish.transfer(await treasury.getAddress(), fundAmount);

      // 5. Distribute from WishocraticTreasury
      await treasury.distribute();

      const ubiShare = (fundAmount * 6000n) / 10000n; // 60,000 WISH
      const clinicalShare = (fundAmount * 4000n) / 10000n; // 40,000 WISH

      // UBIDistributor should hold the UBI share
      expect(await wish.balanceOf(await ubiDistributor.getAddress())).to.equal(ubiShare);
      // Clinical recipient gets their share directly
      expect(await wish.balanceOf(recipientB.address)).to.equal(clinicalShare);

      // 6. Distribute UBI to citizens
      await ubiDistributor.distributeUBI();

      const perCitizen = ubiShare / 2n;
      expect(await wish.balanceOf(citizen1.address)).to.equal(perCitizen);
      expect(await wish.balanceOf(citizen2.address)).to.equal(perCitizen);
    });

    it("end-to-end: actual transfer tax flows through entire chain", async function () {
      const {
        wish, treasury, ubiDistributor, owner,
        recipientB, citizen1, citizen2, anyone,
        UBI, CLINICAL,
      } = await loadFixture(deployFixture);

      // Re-exempt owner (setTreasury removed it) and exempt UBIDistributor
      await wish.setTaxExempt(owner.address, true);
      await wish.setTaxExempt(await ubiDistributor.getAddress(), true);

      // Setup recipients and weights
      await treasury.registerRecipient(UBI, await ubiDistributor.getAddress());
      await treasury.registerRecipient(CLINICAL, recipientB.address);
      await treasury.updateWeights([UBI, CLINICAL], [5000n, 5000n], 50n, 200n);

      // Register citizens
      await ubiDistributor.registerForUBI(
        citizen1.address,
        ethers.keccak256(ethers.toUtf8Bytes("wid-1"))
      );
      await ubiDistributor.registerForUBI(
        citizen2.address,
        ethers.keccak256(ethers.toUtf8Bytes("wid-2"))
      );

      // Give anyone some WISH (owner is now tax-exempt again)
      const transferToAnyone = ethers.parseEther("100000");
      await wish.transfer(anyone.address, transferToAnyone);

      // anyone is NOT tax-exempt, so transferring triggers the 0.5% tax
      const sendAmount = ethers.parseEther("50000");
      await wish.connect(anyone).transfer(citizen1.address, sendAmount);

      // Tax should be 0.5% of 50000 = 250 WISH, sent to WishocraticTreasury
      const expectedTax = (sendAmount * TAX_RATE_BPS) / 10000n;
      expect(await treasury.pendingBalance()).to.equal(expectedTax);

      // Distribute from WishocraticTreasury
      await treasury.distribute();

      const ubiShare = (expectedTax * 5000n) / 10000n;

      // UBIDistributor got its UBI share
      expect(await wish.balanceOf(await ubiDistributor.getAddress())).to.equal(ubiShare);

      // Distribute UBI
      await ubiDistributor.distributeUBI();

      // Each citizen gets half the UBI share
      // citizen1 already had sendAmount - tax from the transfer
      const perCitizen = ubiShare / 2n;
      const citizen1Expected = (sendAmount - expectedTax) + perCitizen;
      expect(await wish.balanceOf(citizen1.address)).to.equal(citizen1Expected);
      expect(await wish.balanceOf(citizen2.address)).to.equal(perCitizen);
    });
  });

  describe("View functions", function () {
    it("reports pending balance", async function () {
      const { wish, treasury } = await loadFixture(deployFixture);

      expect(await treasury.pendingBalance()).to.equal(0n);

      const amount = ethers.parseEther("5000");
      await wish.transfer(await treasury.getAddress(), amount);
      expect(await treasury.pendingBalance()).to.equal(amount);
    });

    it("reports category count", async function () {
      const { treasury, recipientA, recipientB, UBI, CLINICAL } =
        await loadFixture(deployFixture);

      expect(await treasury.categoryCount()).to.equal(0n);
      await treasury.registerRecipient(UBI, recipientA.address);
      expect(await treasury.categoryCount()).to.equal(1n);
      await treasury.registerRecipient(CLINICAL, recipientB.address);
      expect(await treasury.categoryCount()).to.equal(2n);
    });

    it("reports active category count", async function () {
      const { treasury, recipientA, recipientB, UBI, CLINICAL } =
        await loadFixture(deployFixture);

      await treasury.registerRecipient(UBI, recipientA.address);
      await treasury.registerRecipient(CLINICAL, recipientB.address);
      await treasury.updateWeights([UBI, CLINICAL], [5000n, 5000n], 10n, 20n);

      expect(await treasury.activeCategoryCount()).to.equal(2n);

      await treasury.deactivateRecipient(CLINICAL);
      expect(await treasury.activeCategoryCount()).to.equal(1n);
    });
  });
});
