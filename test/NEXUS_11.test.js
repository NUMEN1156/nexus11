const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("NEXUS_11 v0.6.3 preservation baseline", function () {
  const SLOT = 1n;
  const SECRET = ethers.encodeBytes32String("LOCAL_TEST");
  const SECRET_NONCE = 12345n;

  let nexus;
  let writer;
  let stranger;

  async function mineBlocks(count) {
    for (let i = 0; i < count; i++) {
      await network.provider.send("evm_mine");
    }
  }

  async function mineEffort(sender, slot, data) {
    const dataHash = ethers.keccak256(data);
    for (let nonce = 0n; ; nonce++) {
      const hash = ethers.solidityPackedKeccak256(
        ["uint256", "address", "uint256", "bytes32"],
        [nonce, sender, slot, dataHash]
      );
      if (hash.startsWith("0x00")) return nonce;
    }
  }

  async function commitPresence(
    signer = writer,
    slot = SLOT,
    secret = SECRET,
    secretNonce = SECRET_NONCE
  ) {
    return nexus.connect(signer).commitPresence(slot, secret, secretNonce);
  }

  async function commitData({
    signer = writer,
    slot = SLOT,
    text = "ABC123+/abc",
    previousHash = ethers.ZeroHash,
    secret = SECRET,
    secretNonce = SECRET_NONCE
  } = {}) {
    const data = ethers.toUtf8Bytes(text);
    const nonce = await mineEffort(signer.address, slot, data);
    return nexus.connect(signer).commitData(
      slot,
      data,
      previousHash,
      nonce,
      secret,
      secretNonce
    );
  }

  async function firstCommit(text = "ABC123+/abc") {
    await commitPresence();
    await mineBlocks(5);
    await commitData({ text });
    return ethers.keccak256(ethers.toUtf8Bytes(text));
  }

  async function updateOwnSlot(previousHash, text) {
    await commitPresence();
    await mineBlocks(10);
    await commitData({ text, previousHash });
  }

  beforeEach(async function () {
    [writer, stranger] = await ethers.getSigners();
    const Harness = await ethers.getContractFactory("NEXUS_11TestHarness");
    nexus = await Harness.deploy();
    await nexus.waitForDeployment();
  });

  describe("production and harness difficulty", function () {
    it("keeps production difficulty fixed at four", async function () {
      const Production = await ethers.getContractFactory("NEXUS_11");
      const production = await Production.deploy();
      expect(await production.EFFORT_DIFFICULTY()).to.equal(4);
    });

    it("keeps the production contract parameterless", async function () {
      const Production = await ethers.getContractFactory("NEXUS_11");
      expect(Production.interface.deploy.inputs).to.have.length(0);
    });

    it("allows practical local proof-of-effort through the harness", async function () {
      const data = ethers.toUtf8Bytes("A");
      const nonce = await mineEffort(writer.address, SLOT, data);
      const [valid] = await nexus.checkEffort(
        nonce,
        writer.address,
        SLOT,
        ethers.keccak256(data)
      );
      expect(valid).to.equal(true);
    });
  });

  describe("presence flow", function () {
    it("stores the deterministic commitment and block", async function () {
      const tx = await commitPresence();
      const receipt = await tx.wait();
      const presence = await nexus.getPresence(SLOT, writer.address);
      const expected = ethers.solidityPackedKeccak256(
        ["bytes32", "uint256", "address", "uint256"],
        [SECRET, SECRET_NONCE, writer.address, SLOT]
      );
      expect(presence.commitHash).to.equal(expected);
      expect(presence.commitBlock).to.equal(receipt.blockNumber);
      expect(presence.revealed).to.equal(false);
    });

    it("rejects replacement of an active commitment", async function () {
      await commitPresence();
      await expect(commitPresence()).to.be.revertedWith("Active presence commit");
    });

    it("rejects commitData without presence", async function () {
      await expect(commitData()).to.be.revertedWith("No presence commit");
    });

    it("rejects reveal before five blocks", async function () {
      await commitPresence();
      await expect(commitData()).to.be.revertedWith("Presence delay not met");
    });

    it("accepts a valid reveal after five blocks", async function () {
      await commitPresence();
      await mineBlocks(5);
      await expect(commitData()).to.emit(nexus, "PresenceRevealed");
    });

    it("prevents reuse of a consumed presence proof", async function () {
      await firstCommit();
      await mineBlocks(10);
      const hash = (await nexus.verifyWaterline(SLOT))[0];
      await expect(
        commitData({ text: "NEW", previousHash: hash })
      ).to.be.revertedWith("Already revealed");
    });

    it("allows a new commitment after consumption", async function () {
      await firstCommit();
      await expect(commitPresence()).to.emit(nexus, "PresenceCommitted");
    });
  });

  describe("slot writer controls", function () {
    it("assigns the first successful writer", async function () {
      await firstCommit();
      const metadata = await nexus.getSlotMetadata(SLOT);
      expect(metadata.slotWriter).to.equal(writer.address);
    });

    it("allows the writer to update its slot", async function () {
      const oldHash = await firstCommit();
      await updateOwnSlot(oldHash, "UPDATED");
      expect((await nexus.verifyWaterline(SLOT))[0]).to.equal(
        ethers.keccak256(ethers.toUtf8Bytes("UPDATED"))
      );
    });

    it("rejects foreign updates", async function () {
      const oldHash = await firstCommit();
      await commitPresence(stranger);
      await mineBlocks(10);
      await expect(
        commitData({ signer: stranger, text: "FOREIGN", previousHash: oldHash })
      ).to.be.revertedWith("Not slot writer");
    });

    it("rejects foreign clearing", async function () {
      await firstCommit();
      await expect(
        nexus.connect(stranger).clearSlot(SLOT)
      ).to.be.revertedWith("Not slot writer");
    });

    it("rejects foreign selfHeal", async function () {
      await firstCommit();
      await expect(
        nexus.connect(stranger).selfHeal(SLOT)
      ).to.be.revertedWith("Not slot writer");
    });

    it("exposes no global owner or administrator function", async function () {
      const names = nexus.interface.fragments
        .filter((fragment) => fragment.type === "function")
        .map((fragment) => fragment.name);
      expect(names).not.to.include.members([
        "owner",
        "admin",
        "transferOwnership",
        "setAdmin"
      ]);
    });
  });

  describe("chunk security", function () {
    it("contains no external commitChunk function", async function () {
      expect(nexus.interface.hasFunction("commitChunk")).to.equal(false);
    });

    it("does not change chunks when a foreign update fails", async function () {
      const oldHash = await firstCommit("A".repeat(33));
      const before = await nexus.getChunk(SLOT, 0);
      await commitPresence(stranger);
      await mineBlocks(10);
      await expect(
        commitData({ signer: stranger, text: "B", previousHash: oldHash })
      ).to.be.revertedWith("Not slot writer");
      expect(await nexus.getChunk(SLOT, 0)).to.equal(before);
    });

    it("deletes stale chunks after a shorter replacement", async function () {
      const oldHash = await firstCommit("A".repeat(33));
      expect(await nexus.getChunk(SLOT, 1)).not.to.equal(ethers.ZeroHash);
      await updateOwnSlot(oldHash, "B");
      expect(await nexus.getChunk(SLOT, 1)).to.equal(ethers.ZeroHash);
    });
  });

  describe("exact length and integrity", function () {
    for (const length of [1, 11, 32, 33]) {
      it(`reconstructs exactly ${length} byte data`, async function () {
        const text = "A".repeat(length);
        await firstCommit(text);
        expect(await nexus.reconstructData(SLOT)).to.equal(
          ethers.hexlify(ethers.toUtf8Bytes(text))
        );
      });

      it(`verifies integrity for ${length} byte data`, async function () {
        await firstCommit("A".repeat(length));
        expect(await nexus.verifyIntegrity(SLOT, ethers.ZeroHash)).to.equal(true);
      });
    }

    it("returns false for an incorrect expected hash", async function () {
      await firstCommit("ABC");
      const wrongHash = ethers.keccak256(ethers.toUtf8Bytes("WRONG"));
      expect(await nexus.verifyIntegrity(SLOT, wrongHash)).to.equal(false);
    });

    it("returns false from selfHeal for intact data", async function () {
      await firstCommit("ABC123+/abc");
      expect(await nexus.selfHeal.staticCall(SLOT)).to.equal(false);
    });

    it("does not delete valid non-aligned data through selfHeal", async function () {
      await firstCommit("A".repeat(11));
      await nexus.selfHeal(SLOT);
      expect(await nexus.verifyIntegrity(SLOT, ethers.ZeroHash)).to.equal(true);
    });

    it("returns original length and writer through metadata", async function () {
      await firstCommit("A".repeat(11));
      const metadata = await nexus.getSlotMetadata(SLOT);
      expect(metadata.originalLength).to.equal(11);
      expect(metadata.slotWriter).to.equal(writer.address);
    });
  });

  describe("protocol invariants", function () {
    it("rejects invalid Base44 data", async function () {
      await commitPresence();
      await mineBlocks(5);
      await expect(commitData({ text: "INVALID!" })).to.be.revertedWith(
        "Invalid Base44 data"
      );
    });

    it("rejects empty data", async function () {
      await commitPresence();
      await mineBlocks(5);
      await expect(commitData({ text: "" })).to.be.revertedWith("Empty data");
    });

    it("rejects a wrong previous hash", async function () {
      await firstCommit();
      await commitPresence();
      await mineBlocks(10);
      await expect(
        commitData({
          text: "UPDATED",
          previousHash: ethers.keccak256(ethers.toUtf8Bytes("WRONG"))
        })
      ).to.be.revertedWith("Invalid state proof");
    });

    it("enforces the ten-block rate limit", async function () {
      const oldHash = await firstCommit();
      await commitPresence();
      await mineBlocks(5);
      await expect(
        commitData({ text: "UPDATED", previousHash: oldHash })
      ).to.be.revertedWith("Rate limit: Wait more blocks");
    });

    it("keeps checkEffort consistent with commitData", async function () {
      const data = ethers.toUtf8Bytes("CONSISTENT");
      const nonce = await mineEffort(writer.address, SLOT, data);
      const [valid] = await nexus.checkEffort(
        nonce,
        writer.address,
        SLOT,
        ethers.keccak256(data)
      );
      expect(valid).to.equal(true);
      await commitPresence();
      await mineBlocks(5);
      await expect(
        nexus.commitData(
          SLOT,
          data,
          ethers.ZeroHash,
          nonce,
          SECRET,
          SECRET_NONCE
        )
      ).to.emit(nexus, "DataCommitted");
    });

    it("preserves the four-value verifyWaterline ABI", async function () {
      await firstCommit();
      expect(await nexus.verifyWaterline(SLOT)).to.have.length(4);
    });
  });
});
