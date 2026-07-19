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
  console.log("Production effort difficulty:", (await nexus.EFFORT_DIFFICULTY()).toString());
  console.log("Block:", await ethers.provider.getBlockNumber());
  console.log("Deployment complete.");
  console.log("No presence or data transaction was submitted automatically.");
  console.log("Run the local Hardhat test suite before manual interaction.");
  console.log("=== NEXUS_11 DEPLOYMENT: PASSED ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
