const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  const GroupSplit = await ethers.getContractFactory("GroupSplit");
  const groupSplit = await GroupSplit.deploy();
  await groupSplit.waitForDeployment();

  const address = await groupSplit.getAddress();
  console.log("GroupSplit deployed to:", address);
  console.log("Add to frontend/utils/constants.ts:");
  console.log(`export const GROUP_SPLIT_ADDRESS = "${address}" as \`0x\${string}\`;`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
