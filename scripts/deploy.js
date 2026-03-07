const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  const PaymentRouter = await ethers.getContractFactory("PaymentRouter");
  const paymentRouter = await PaymentRouter.deploy();
  await paymentRouter.waitForDeployment();

  const address = await paymentRouter.getAddress();
  console.log("PaymentRouter deployed to:", address);
  console.log("Set NEXT_PUBLIC_PAYMENT_ROUTER_ADDRESS in frontend/.env.local");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
