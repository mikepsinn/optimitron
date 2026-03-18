import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("VoteToken", function () {
  const ONE_VOTE = ethers.parseEther("1"); // 1e18

  async function deployFixture() {
    const [owner, voter1, voter2, voter3, nonOwner] =
      await ethers.getSigners();

    const VoteToken = await ethers.getContractFactory("VoteToken");
    const voteToken = await VoteToken.deploy();

    // Sample referendum IDs and nullifier hashes
    const ref1 = ethers.keccak256(ethers.toUtf8Bytes("referendum-1"));
    const ref2 = ethers.keccak256(ethers.toUtf8Bytes("referendum-2"));
    const null1 = ethers.keccak256(ethers.toUtf8Bytes("nullifier-voter1"));
    const null2 = ethers.keccak256(ethers.toUtf8Bytes("nullifier-voter2"));
    const null3 = ethers.keccak256(ethers.toUtf8Bytes("nullifier-voter3"));

    return {
      voteToken,
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
      const { voteToken } = await loadFixture(deployFixture);

      expect(await voteToken.name()).to.equal("Optimitron Vote");
      expect(await voteToken.symbol()).to.equal("VOTE");
      expect(await voteToken.decimals()).to.equal(18n);
    });

    it("starts with zero supply", async function () {
      const { voteToken } = await loadFixture(deployFixture);
      expect(await voteToken.totalSupply()).to.equal(0n);
    });

    it("sets deployer as owner", async function () {
      const { voteToken, owner } = await loadFixture(deployFixture);
      expect(await voteToken.owner()).to.equal(owner.address);
    });
  });

  describe("mintForVoter", function () {
    it("mints VOTE tokens to a verified voter", async function () {
      const { voteToken, voter1, ref1, null1 } =
        await loadFixture(deployFixture);

      await expect(
        voteToken.mintForVoter(voter1.address, ref1, null1, ONE_VOTE)
      )
        .to.emit(voteToken, "VoteMinted")
        .withArgs(voter1.address, ref1, null1, ONE_VOTE);

      expect(await voteToken.balanceOf(voter1.address)).to.equal(ONE_VOTE);
      expect(await voteToken.totalSupply()).to.equal(ONE_VOTE);
    });

    it("allows same voter to mint for different referendums", async function () {
      const { voteToken, voter1, ref1, ref2, null1 } =
        await loadFixture(deployFixture);

      await voteToken.mintForVoter(voter1.address, ref1, null1, ONE_VOTE);
      await voteToken.mintForVoter(voter1.address, ref2, null1, ONE_VOTE);

      expect(await voteToken.balanceOf(voter1.address)).to.equal(
        ONE_VOTE * 2n
      );
    });

    it("allows different voters on same referendum", async function () {
      const { voteToken, voter1, voter2, ref1, null1, null2 } =
        await loadFixture(deployFixture);

      await voteToken.mintForVoter(voter1.address, ref1, null1, ONE_VOTE);
      await voteToken.mintForVoter(voter2.address, ref1, null2, ONE_VOTE);

      expect(await voteToken.balanceOf(voter1.address)).to.equal(ONE_VOTE);
      expect(await voteToken.balanceOf(voter2.address)).to.equal(ONE_VOTE);
    });

    it("prevents double-mint for same referendum + nullifier", async function () {
      const { voteToken, voter1, ref1, null1 } =
        await loadFixture(deployFixture);

      await voteToken.mintForVoter(voter1.address, ref1, null1, ONE_VOTE);

      await expect(
        voteToken.mintForVoter(voter1.address, ref1, null1, ONE_VOTE)
      ).to.be.revertedWith("VoteToken: already claimed");
    });

    it("rejects zero voter address", async function () {
      const { voteToken, ref1, null1 } = await loadFixture(deployFixture);

      await expect(
        voteToken.mintForVoter(ethers.ZeroAddress, ref1, null1, ONE_VOTE)
      ).to.be.revertedWith("VoteToken: zero voter");
    });

    it("rejects zero amount", async function () {
      const { voteToken, voter1, ref1, null1 } =
        await loadFixture(deployFixture);

      await expect(
        voteToken.mintForVoter(voter1.address, ref1, null1, 0n)
      ).to.be.revertedWith("VoteToken: zero amount");
    });

    it("only owner can mint", async function () {
      const { voteToken, voter1, nonOwner, ref1, null1 } =
        await loadFixture(deployFixture);

      await expect(
        voteToken
          .connect(nonOwner)
          .mintForVoter(voter1.address, ref1, null1, ONE_VOTE)
      ).to.be.revertedWithCustomError(voteToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("batchMintForVoters", function () {
    it("mints for multiple voters in one transaction", async function () {
      const { voteToken, voter1, voter2, voter3, ref1, null1, null2, null3 } =
        await loadFixture(deployFixture);

      await voteToken.batchMintForVoters(
        [voter1.address, voter2.address, voter3.address],
        [ref1, ref1, ref1],
        [null1, null2, null3],
        [ONE_VOTE, ONE_VOTE, ONE_VOTE]
      );

      expect(await voteToken.balanceOf(voter1.address)).to.equal(ONE_VOTE);
      expect(await voteToken.balanceOf(voter2.address)).to.equal(ONE_VOTE);
      expect(await voteToken.balanceOf(voter3.address)).to.equal(ONE_VOTE);
      expect(await voteToken.totalSupply()).to.equal(ONE_VOTE * 3n);
    });

    it("reverts on length mismatch", async function () {
      const { voteToken, voter1, ref1, null1 } =
        await loadFixture(deployFixture);

      await expect(
        voteToken.batchMintForVoters(
          [voter1.address],
          [ref1, ref1], // length 2 vs 1
          [null1],
          [ONE_VOTE]
        )
      ).to.be.revertedWith("VoteToken: length mismatch");
    });

    it("reverts entire batch if one entry is duplicate", async function () {
      const { voteToken, voter1, voter2, ref1, null1, null2 } =
        await loadFixture(deployFixture);

      // Pre-mint for voter1
      await voteToken.mintForVoter(voter1.address, ref1, null1, ONE_VOTE);

      // Batch includes voter1 (already claimed) + voter2
      await expect(
        voteToken.batchMintForVoters(
          [voter1.address, voter2.address],
          [ref1, ref1],
          [null1, null2],
          [ONE_VOTE, ONE_VOTE]
        )
      ).to.be.revertedWith("VoteToken: already claimed");
    });

    it("only owner can batch mint", async function () {
      const { voteToken, voter1, nonOwner, ref1, null1 } =
        await loadFixture(deployFixture);

      await expect(
        voteToken
          .connect(nonOwner)
          .batchMintForVoters(
            [voter1.address],
            [ref1],
            [null1],
            [ONE_VOTE]
          )
      ).to.be.revertedWithCustomError(voteToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("ERC20 Transferability", function () {
    it("VOTE tokens are transferable", async function () {
      const { voteToken, voter1, voter2, ref1, null1 } =
        await loadFixture(deployFixture);

      await voteToken.mintForVoter(voter1.address, ref1, null1, ONE_VOTE);

      await voteToken
        .connect(voter1)
        .transfer(voter2.address, ONE_VOTE / 2n);

      expect(await voteToken.balanceOf(voter1.address)).to.equal(
        ONE_VOTE / 2n
      );
      expect(await voteToken.balanceOf(voter2.address)).to.equal(
        ONE_VOTE / 2n
      );
    });

    it("supports approve + transferFrom", async function () {
      const { voteToken, voter1, voter2, ref1, null1 } =
        await loadFixture(deployFixture);

      await voteToken.mintForVoter(voter1.address, ref1, null1, ONE_VOTE);
      await voteToken.connect(voter1).approve(voter2.address, ONE_VOTE);

      await voteToken
        .connect(voter2)
        .transferFrom(voter1.address, voter2.address, ONE_VOTE);

      expect(await voteToken.balanceOf(voter2.address)).to.equal(ONE_VOTE);
    });
  });

  describe("setPrizeTreasury", function () {
    it("sets the prize treasury address", async function () {
      const { voteToken, voter1 } = await loadFixture(deployFixture);

      await expect(voteToken.setPrizeTreasury(voter1.address))
        .to.emit(voteToken, "PrizeTreasurySet")
        .withArgs(voter1.address);

      expect(await voteToken.prizeTreasury()).to.equal(voter1.address);
    });

    it("rejects zero address", async function () {
      const { voteToken } = await loadFixture(deployFixture);

      await expect(
        voteToken.setPrizeTreasury(ethers.ZeroAddress)
      ).to.be.revertedWith("VoteToken: zero treasury");
    });

    it("only owner can set", async function () {
      const { voteToken, voter1, nonOwner } =
        await loadFixture(deployFixture);

      await expect(
        voteToken.connect(nonOwner).setPrizeTreasury(voter1.address)
      ).to.be.revertedWithCustomError(voteToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Claim key tracking", function () {
    it("correctly tracks claimed keys", async function () {
      const { voteToken, voter1, ref1, null1 } =
        await loadFixture(deployFixture);

      const claimKey = ethers.keccak256(
        ethers.solidityPacked(["bytes32", "bytes32"], [ref1, null1])
      );

      expect(await voteToken.claimed(claimKey)).to.be.false;

      await voteToken.mintForVoter(voter1.address, ref1, null1, ONE_VOTE);

      expect(await voteToken.claimed(claimKey)).to.be.true;
    });
  });
});
