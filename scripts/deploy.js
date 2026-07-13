const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const NEXUS_11 = await ethers.getContractFactory("NEXUS_11");
  const nexus = await NEXUS_11.deploy();
  await nexus.waitForDeployment();

  const address = await nexus.getAddress();
  console.log("NEXUS_11 deployed to:", address);
  console.log("Block:", await ethers.provider.getBlockNumber());

  // Post-Deploy Sanity-Check
  const slot = 1;
  const secret = ethers.encodeBytes32String("INIT");
  const secretNonce = 12345;
  
  console.log("\n--- Post-Deploy Test ---");
  console.log("1. commitPresence...");
  const tx1 = await nexus.commitPresence(slot, secret, secretNonce);
  await tx1.wait();
  console.log("   OK. Block:", await ethers.provider.getBlockNumber());
  
  console.log("2. Mining effort nonce...");
  const data = ethers.toUtf8Bytes("ABC123+/abc");
  const dataHash = ethers.keccak256(data);
  let nonce = 0;
  let valid = false;
  while (!valid) {
    const hash = ethers.keccak256(
      ethers.solidityPacked(["uint256", "address", "uint256", "bytes32"], 
      [nonce, deployer.address, slot, dataHash])
    );
    if (hash.startsWith("0x00000000")) { valid = true; break; }
    nonce++;
    if (nonce % 50000 === 0) process.stdout.write(`\r   Tried: ${nonce}...`);
  }
  console.log(`\n   Nonce found: ${nonce}`);
  
  console.log("4. commitData...");
  const tx2 = await nexus.commitData(slot, data, ethers.ZeroHash, nonce, secret, secretNonce);
  await tx2.wait();
  console.log("   OK. Data committed.");
  
  console.log("5. verifyWaterline...");
  const wl = await nexus.verifyWaterline(slot);
  console.log("   Hash:", wl[0]);
  console.log("   Chunks:", wl[1].toString());
  
  console.log("\n=== DEPLOYMENT + SANITY CHECK: PASSED ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});