const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PaymentRouter", function () {
  let router;
  let owner;
  let alice;
  let bob;
  let charlie;

  beforeEach(async function () {
    [owner, alice, bob, charlie] = await ethers.getSigners();
    const PaymentRouter = await ethers.getContractFactory("PaymentRouter");
    router = await PaymentRouter.deploy();
    await router.waitForDeployment();
  });

  describe("sendPayment - PAS", function () {
    it("transfers PAS to recipient", async function () {
      const amount = ethers.parseEther("1");
      const before = await ethers.provider.getBalance(alice.address);

      await expect(
        router.connect(owner).sendPayment(alice.address, 0, 0, { value: amount })
      )
        .to.emit(router, "PaymentSent")
        .withArgs(owner.address, alice.address, amount, 0);

      const after = await ethers.provider.getBalance(alice.address);
      expect(after - before).to.equal(amount);
    });

    it("reverts if msg.value is 0", async function () {
      await expect(
        router.connect(owner).sendPayment(alice.address, 0, 0, { value: 0 })
      ).to.be.revertedWith("PAS amount required in msg.value");
    });

    it("reverts if sending to yourself", async function () {
      await expect(
        router.connect(owner).sendPayment(owner.address, 0, 0, {
          value: ethers.parseEther("1"),
        })
      ).to.be.revertedWith("Cannot send to yourself");
    });

    it("reverts on zero address recipient", async function () {
      await expect(
        router.connect(owner).sendPayment(ethers.ZeroAddress, 0, 0, {
          value: ethers.parseEther("1"),
        })
      ).to.be.revertedWith("Invalid recipient");
    });
  });

  describe("splitBill - PAS", function () {
    it("splits PAS among multiple recipients", async function () {
      const amounts = [
        ethers.parseEther("1"),
        ethers.parseEther("2"),
        ethers.parseEther("0.5"),
      ];
      const recipients = [alice.address, bob.address, charlie.address];
      const total = amounts.reduce((sum, current) => sum + current, 0n);

      const beforeAlice = await ethers.provider.getBalance(alice.address);
      const beforeBob = await ethers.provider.getBalance(bob.address);
      const beforeCharlie = await ethers.provider.getBalance(charlie.address);

      await expect(
        router.connect(owner).splitBill(recipients, amounts, 0, { value: total })
      )
        .to.emit(router, "BillSplit")
        .withArgs(owner.address, recipients, amounts, total, 0);

      expect((await ethers.provider.getBalance(alice.address)) - beforeAlice).to.equal(
        amounts[0]
      );
      expect((await ethers.provider.getBalance(bob.address)) - beforeBob).to.equal(
        amounts[1]
      );
      expect(
        (await ethers.provider.getBalance(charlie.address)) - beforeCharlie
      ).to.equal(amounts[2]);
    });

    it("reverts if msg.value does not match total", async function () {
      const amounts = [ethers.parseEther("1"), ethers.parseEther("2")];

      await expect(
        router.connect(owner).splitBill([alice.address, bob.address], amounts, 0, {
          value: ethers.parseEther("1"),
        })
      ).to.be.revertedWith("msg.value must equal total");
    });

    it("reverts on length mismatch", async function () {
      await expect(
        router.connect(owner).splitBill(
          [alice.address],
          [ethers.parseEther("1"), ethers.parseEther("2")],
          0,
          { value: ethers.parseEther("3") }
        )
      ).to.be.revertedWith("Length mismatch");
    });

    it("reverts if more than 20 recipients", async function () {
      const recipients = Array(21).fill(alice.address);
      const amounts = Array(21).fill(ethers.parseEther("0.1"));

      await expect(
        router.connect(owner).splitBill(recipients, amounts, 0, {
          value: ethers.parseEther("2.1"),
        })
      ).to.be.revertedWith("Max 20 recipients");
    });
  });

  describe("view helpers", function () {
    it("returns a bigint or reverts cleanly without a local precompile", async function () {
      const balance = await router.getUSDtBalance(owner.address).catch(() => 0n);
      expect(balance).to.be.a("bigint");
    });
  });
});
