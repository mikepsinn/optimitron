import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("EarthOptimizationPoint", function () {
  const ONE_POINT = ethers.parseEther("1"); // 1e18

  async function deployFixture() {
    const [owner, voter1, voter2, voter3, nonOwner] =
      await ethers.getSigners();

    const EarthOptimizationPoint = await ethers.getContractFactory("EarthOptimizationPoint");
    const pointToken = await EarthOptimizationPoint.deploy();

    // Sample referendum IDs and nullifier hashes
    const ref1 = ethers.keccak256(ethers.toUtf8Bytes("referendum-1"));
    const ref2 = ethers.keccak256(ethers.toUtf8Bytes("referendum-2"));
    const null1 = ethers.keccak256(ethers.toUtf8Bytes("nullifier-voter1"));
    const null2 = ethers.keccak256(ethers.toUtf8Bytes("nullifier-voter2"));
    const null3 = ethers.keccak256(ethers.toUtf8Bytes("nullifier-voter3"));

    return {
      pointToken,
      owner,
      voter1,
      voter2,
      voter3,
      nonOwner,
      ref1,
      ref2,
      null1,
      null2,
      null3,
    };
  }

  describe("Deployment", function () {
    it("sets correct ERC20 metadata", async function () {
      const { pointToken } = await loadFixture(deployFixture);

      expect(await pointToken.name()).to.equal("Earth Optimization Point");
      expect(await pointToken.symbol()).to.equal("EOP");
      expect(await pointToken.decimals()).to.equal(18n);
    });

    it("starts with zero supply", async function () {
      const { pointToken } = await loadFixture(deployFixture);
      expect(await pointToken.totalSupply()).to.equal(0n);
    });

    it("sets deployer as owner", async function () {
      const { pointToken, owner } = await loadFixture(deployFixture);
      expect(await pointToken.owner()).to.equal(owner.address);
    });
  });

  describe("mintForVoter", function () {
    it("mints EOP to a verified voter", async function () {
      const { pointToken, voter1, ref1, null1 } =
        await loadFixture(deployFixture);

      await expect(
        pointToken.mintForVoter(voter1.address, ref1, null1, ONE_POINT)
      )
        .to.emit(pointToken, "PointMinted")
        .withArgs(voter1.address, ref1, null1, ONE_POINT);

      expect(await pointToken.balanceOf(voter1.address)).to.equal(ONE_POINT);
      expect(await pointToken.totalSupply()).to.equal(ONE_POINT);
    });

    it("allows same voter to mint for different referendums", async function () {
      const { pointToken, voter1, ref1, ref2, null1 } =
        await loadFixture(deployFixture);

      await pointToken.mintForVoter(voter1.address, ref1, null1, ONE_POINT);
      await pointToken.mintForVoter(voter1.address, ref2, null1, ONE_POINT);

      expect(await pointToken.balanceOf(voter1.address)).to.equal(
        ONE_POINT * 2n
      );
    });

    it("allows different voters on same referendum", async function () {
      const { pointToken, voter1, voter2, ref1, null1, null2 } =
        await loadFixture(deployFixture);

      await pointToken.mintForVoter(voter1.address, ref1, null1, ONE_POINT);
      await pointToken.mintForVoter(voter2.address, ref1, null2, ONE_POINT);

      expect(await pointToken.balanceOf(voter1.address)).to.equal(ONE_POINT);
      expect(await pointToken.balanceOf(voter2.address)).to.equal(ONE_POINT);
    });

    it("prevents double-mint for same referendum + nullifier", async function () {
      const { pointToken, voter1, ref1, null1 } =
        await loadFixture(deployFixture);

      await pointToken.mintForVoter(voter1.address, ref1, null1, ONE_POINT);

      await expect(
        pointToken.mintForVoter(voter1.address, ref1, null1, ONE_POINT)
      ).to.be.revertedWith("EarthOptimizationPoint: already claimed");
    });

    it("rejects zero voter address", async function () {
      const { pointToken, ref1, null1 } = await loadFixture(deployFixture);

      await expect(
        pointToken.mintForVoter(ethers.ZeroAddress, ref1, null1, ONE_POINT)
      ).to.be.revertedWith("EarthOptimizationPoint: zero voter");
    });

    it("rejects zero amount", async function () {
      const { pointToken, voter1, ref1, null1 } =
        await loadFixture(deployFixture);

      await expect(
        pointToken.mintForVoter(voter1.address, ref1, null1, 0n)
      ).to.be.revertedWith("EarthOptimizationPoint: zero amount");
    });

    it("only owner can mint", async function () {
      const { pointToken, voter1, nonOwner, ref1, null1 } =
        await loadFixture(deployFixture);

      await expect(
        pointToken
          .connect(nonOwner)
          .mintForVoter(voter1.address, ref1, null1, ONE_POINT)
      ).to.be.revertedWithCustomError(pointToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("batchMintForVoters", function () {
    it("mints for multiple voters in one transaction", async function () {
      const { pointToken, voter1, voter2, voter3, ref1, null1, null2, null3 } =
        await loadFixture(deployFixture);

      await pointToken.batchMintForVoters(
        [voter1.address, voter2.address, voter3.address],
        [ref1, ref1, ref1],
        [null1, null2, null3],
        [ONE_POINT, ONE_POINT, ONE_POINT]
      );

      expect(await pointToken.balanceOf(voter1.address)).to.equal(ONE_POINT);
      expect(await pointToken.balanceOf(voter2.address)).to.equal(ONE_POINT);
      expect(await pointToken.balanceOf(voter3.address)).to.equal(ONE_POINT);
      expect(await pointToken.totalSupply()).to.equal(ONE_POINT * 3n);
    });

    it("reverts on length mismatch", async function () {
      const { pointToken, voter1, ref1, null1 } =
        await loadFixture(deployFixture);

      await expect(
        pointToken.batchMintForVoters(
          [voter1.address],
          [ref1, ref1], // length 2 vs 1
          [null1],
          [ONE_POINT]
        )
      ).to.be.revertedWith("EarthOptimizationPoint: length mismatch");
    });

    it("reverts entire batch if one entry is duplicate", async function () {
      const { pointToken, voter1, voter2, ref1, null1, null2 } =
        await loadFixture(deployFixture);

      // Pre-mint for voter1
      await pointToken.mintForVoter(voter1.address, ref1, null1, ONE_POINT);

      // Batch includes voter1 (already claimed) + voter2
      await expect(
        pointToken.batchMintForVoters(
          [voter1.address, voter2.address],
          [ref1, ref1],
          [null1, null2],
          [ONE_POINT, ONE_POINT]
        )
      ).to.be.revertedWith("EarthOptimizationPoint: already claimed");
    });

    it("only owner can batch mint", async function () {
      const { pointToken, voter1, nonOwner, ref1, null1 } =
        await loadFixture(deployFixture);

      await expect(
        pointToken
          .connect(nonOwner)
          .batchMintForVoters(
            [voter1.address],
            [ref1],
            [null1],
            [ONE_POINT]
          )
      ).to.be.revertedWithCustomError(pointToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("ERC20 Transferability", function () {
    it("EOP is transferable", async function () {
      const { pointToken, voter1, voter2, ref1, null1 } =
        await loadFixture(deployFixture);

      await pointToken.mintForVoter(voter1.address, ref1, null1, ONE_POINT);

      await pointToken
        .connect(voter1)
        .transfer(voter2.address, ONE_POINT / 2n);

      expect(await pointToken.balanceOf(voter1.address)).to.equal(
        ONE_POINT / 2n
      );
      expect(await pointToken.balanceOf(voter2.address)).to.equal(
        ONE_POINT / 2n
      );
    });

    it("supports approve + transferFrom", async function () {
      const { pointToken, voter1, voter2, ref1, null1 } =
        await loadFixture(deployFixture);

      await pointToken.mintForVoter(voter1.address, ref1, null1, ONE_POINT);
      await pointToken.connect(voter1).approve(voter2.address, ONE_POINT);

      await pointToken
        .connect(voter2)
        .transferFrom(voter1.address, voter2.address, ONE_POINT);

      expect(await pointToken.balanceOf(voter2.address)).to.equal(ONE_POINT);
    });
  });

  describe("setPrizeTreasury", function () {
    it("sets the prize treasury address", async function () {
      const { pointToken, voter1 } = await loadFixture(deployFixture);

      await expect(pointToken.setPrizeTreasury(voter1.address))
        .to.emit(pointToken, "PrizeTreasurySet")
        .withArgs(voter1.address);

      expect(await pointToken.prizeTreasury()).to.equal(voter1.address);
    });

    it("rejects zero address", async function () {
      const { pointToken } = await loadFixture(deployFixture);

      await expect(
        pointToken.setPrizeTreasury(ethers.ZeroAddress)
      ).to.be.revertedWith("EarthOptimizationPoint: zero treasury");
    });

    it("only owner can set", async function () {
      const { pointToken, voter1, nonOwner } =
        await loadFixture(deployFixture);

      await expect(
        pointToken.connect(nonOwner).setPrizeTreasury(voter1.address)
      ).to.be.revertedWithCustomError(pointToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("burnForRedemption", function () {
    it("lets the prize treasury burn redeemed EOP", async function () {
      const { pointToken, voter1, nonOwner, ref1, null1 } =
        await loadFixture(deployFixture);

      await pointToken.mintForVoter(voter1.address, ref1, null1, ONE_POINT);
      await pointToken.setPrizeTreasury(nonOwner.address);

      await expect(
        pointToken.connect(nonOwner).burnForRedemption(voter1.address, ONE_POINT)
      )
        .to.emit(pointToken, "PointsBurnedForRedemption")
        .withArgs(voter1.address, ONE_POINT);

      expect(await pointToken.balanceOf(voter1.address)).to.equal(0n);
      expect(await pointToken.totalSupply()).to.equal(0n);
    });

    it("rejects non-treasury burns", async function () {
      const { pointToken, voter1, voter2, nonOwner, ref1, null1 } =
        await loadFixture(deployFixture);

      await pointToken.mintForVoter(voter1.address, ref1, null1, ONE_POINT);
      await pointToken.setPrizeTreasury(voter2.address);

      await expect(
        pointToken.connect(nonOwner).burnForRedemption(voter1.address, ONE_POINT)
      ).to.be.revertedWith("EarthOptimizationPoint: only treasury");
    });
  });

  describe("Claim key tracking", function () {
    it("correctly tracks claimed keys", async function () {
      const { pointToken, voter1, ref1, null1 } =
        await loadFixture(deployFixture);

      const claimKey = ethers.keccak256(
        ethers.solidityPacked(["bytes32", "bytes32"], [ref1, null1])
      );

      expect(await pointToken.claimed(claimKey)).to.be.false;

      await pointToken.mintForVoter(voter1.address, ref1, null1, ONE_POINT);

      expect(await pointToken.claimed(claimKey)).to.be.true;
    });
  });
});
