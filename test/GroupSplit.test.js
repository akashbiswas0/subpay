const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("GroupSplit", function () {
  let groupSplit, owner, alice, bob, charlie;

  beforeEach(async function () {
    [owner, alice, bob, charlie] = await ethers.getSigners();
    const GroupSplit = await ethers.getContractFactory("GroupSplit");
    groupSplit = await GroupSplit.deploy();
    await groupSplit.waitForDeployment();
  });

  // -------------------------------------------------------------------------
  // Group creation
  // -------------------------------------------------------------------------

  describe("createGroup", function () {
    it("creates a group and adds creator as first member", async function () {
      await groupSplit.createGroup("Dinner", [alice.address, bob.address]);
      const members = await groupSplit.getGroupMembers(1);
      expect(members.length).to.equal(3);
      expect(members[0]).to.equal(owner.address);
      expect(members[1]).to.equal(alice.address);
      expect(members[2]).to.equal(bob.address);
    });

    it("increments groupCount", async function () {
      await groupSplit.createGroup("G1", [alice.address]);
      await groupSplit.createGroup("G2", [bob.address]);
      expect(await groupSplit.groupCount()).to.equal(2);
    });

    it("reverts with empty name", async function () {
      await expect(
        groupSplit.createGroup("", [alice.address])
      ).to.be.revertedWith("Name required");
    });

    it("reverts with more than 19 extra members", async function () {
      const extras = Array(20).fill(alice.address);
      await expect(
        groupSplit.createGroup("Big", extras)
      ).to.be.revertedWith("Max 20 members including creator");
    });

    it("reverts on duplicate member", async function () {
      await expect(
        groupSplit.createGroup("G", [alice.address, alice.address])
      ).to.be.revertedWith("Duplicate member");
    });
  });

  // -------------------------------------------------------------------------
  // Add member
  // -------------------------------------------------------------------------

  describe("addMember", function () {
    beforeEach(async function () {
      await groupSplit.createGroup("Trip", [alice.address]);
    });

    it("adds a new member", async function () {
      await groupSplit.addMember(1, bob.address);
      const members = await groupSplit.getGroupMembers(1);
      expect(members.length).to.equal(3);
    });

    it("reverts if non-member tries to add", async function () {
      await expect(
        groupSplit.connect(charlie).addMember(1, bob.address)
      ).to.be.revertedWith("Not a group member");
    });

    it("reverts on duplicate", async function () {
      await expect(
        groupSplit.addMember(1, alice.address)
      ).to.be.revertedWith("Already a member");
    });
  });

  // -------------------------------------------------------------------------
  // Equal expense
  // -------------------------------------------------------------------------

  describe("addExpenseEqual", function () {
    beforeEach(async function () {
      // Group: owner, alice, bob (3 members)
      await groupSplit.createGroup("Trip", [alice.address, bob.address]);
    });

    it("records equal debts for all members", async function () {
      const total = ethers.parseEther("3");
      await groupSplit.addExpenseEqual(1, total, 0, "Hotel");

      const aliceDebt = await groupSplit.getDebt(
        1, alice.address, owner.address, 0
      );
      const bobDebt = await groupSplit.getDebt(
        1, bob.address, owner.address, 0
      );

      expect(aliceDebt).to.equal(ethers.parseEther("1"));
      expect(bobDebt).to.equal(ethers.parseEther("1"));
    });

    it("payer has no debt to themselves", async function () {
      await groupSplit.addExpenseEqual(
        1, ethers.parseEther("3"), 0, "Food"
      );
      const ownerDebt = await groupSplit.getDebt(
        1, owner.address, owner.address, 0
      );
      expect(ownerDebt).to.equal(0);
    });

    it("records correct net balances", async function () {
      const total = ethers.parseEther("3");
      await groupSplit.addExpenseEqual(1, total, 0, "Hotel");

      // owner is owed 2 PAS (alice + bob each owe 1)
      const ownerBal = await groupSplit.getBalance(1, owner.address, 0);
      expect(ownerBal).to.equal(ethers.parseEther("2"));

      // alice owes 1 PAS
      const aliceBal = await groupSplit.getBalance(1, alice.address, 0);
      expect(aliceBal).to.equal(-ethers.parseEther("1"));
    });

    it("reverts with zero amount", async function () {
      await expect(
        groupSplit.addExpenseEqual(1, 0, 0, "Food")
      ).to.be.revertedWith("Amount must be > 0");
    });

    it("reverts with empty description", async function () {
      await expect(
        groupSplit.addExpenseEqual(1, ethers.parseEther("1"), 0, "")
      ).to.be.revertedWith("Description required");
    });

    it("reverts if non-member adds expense", async function () {
      await expect(
        groupSplit.connect(charlie).addExpenseEqual(
          1, ethers.parseEther("3"), 0, "Food"
        )
      ).to.be.revertedWith("Not a group member");
    });
  });

  // -------------------------------------------------------------------------
  // Custom expense
  // -------------------------------------------------------------------------

  describe("addExpenseCustom", function () {
    beforeEach(async function () {
      await groupSplit.createGroup("Trip", [alice.address, bob.address]);
    });

    it("records custom debts correctly", async function () {
      const total = ethers.parseEther("6");
      const participants = [owner.address, alice.address, bob.address];
      const shares = [
        ethers.parseEther("1"),
        ethers.parseEther("2"),
        ethers.parseEther("3"),
      ];
      await groupSplit.addExpenseCustom(
        1, total, 0, "Dinner", participants, shares
      );

      const aliceDebt = await groupSplit.getDebt(
        1, alice.address, owner.address, 0
      );
      const bobDebt = await groupSplit.getDebt(
        1, bob.address, owner.address, 0
      );

      expect(aliceDebt).to.equal(ethers.parseEther("2"));
      expect(bobDebt).to.equal(ethers.parseEther("3"));
    });

    it("reverts if shares do not sum to total", async function () {
      const participants = [owner.address, alice.address];
      const shares = [ethers.parseEther("1"), ethers.parseEther("1")];
      await expect(
        groupSplit.addExpenseCustom(
          1, ethers.parseEther("3"), 0, "Food", participants, shares
        )
      ).to.be.revertedWith("Shares must sum to totalAmount");
    });

    it("reverts if participant not in group", async function () {
      const participants = [owner.address, charlie.address];
      const shares = [ethers.parseEther("1"), ethers.parseEther("1")];
      await expect(
        groupSplit.addExpenseCustom(
          1, ethers.parseEther("2"), 0, "Food", participants, shares
        )
      ).to.be.revertedWith("Participant not in group");
    });

    it("reverts with only 1 participant", async function () {
      await expect(
        groupSplit.addExpenseCustom(
          1,
          ethers.parseEther("1"),
          0,
          "Solo",
          [owner.address],
          [ethers.parseEther("1")]
        )
      ).to.be.revertedWith("Need at least 2 participants");
    });

    it("reverts on length mismatch", async function () {
      await expect(
        groupSplit.addExpenseCustom(
          1,
          ethers.parseEther("2"),
          0,
          "Food",
          [owner.address, alice.address],
          [ethers.parseEther("2")]
        )
      ).to.be.revertedWith("Length mismatch");
    });
  });

  // -------------------------------------------------------------------------
  // Settle debt
  // -------------------------------------------------------------------------

  describe("settleDebt", function () {
    beforeEach(async function () {
      // Group: owner, alice — owner pays 2 PAS, alice owes 1 PAS
      await groupSplit.createGroup("Trip", [alice.address]);
      await groupSplit.addExpenseEqual(
        1, ethers.parseEther("2"), 0, "Food"
      );
    });

    it("settles full PAS debt and transfers to creditor", async function () {
      const ownerBefore = await ethers.provider.getBalance(owner.address);

      await groupSplit.connect(alice).settleDebt(
        1,
        owner.address,
        ethers.parseEther("1"),
        0,
        { value: ethers.parseEther("1") }
      );

      const ownerAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerAfter).to.be.gt(ownerBefore);

      const remainingDebt = await groupSplit.getDebt(
        1, alice.address, owner.address, 0
      );
      expect(remainingDebt).to.equal(0);
    });

    it("supports partial settlement", async function () {
      // alice owes 1 PAS, settles 0.5
      await groupSplit.connect(alice).settleDebt(
        1,
        owner.address,
        ethers.parseEther("0.5"),
        0,
        { value: ethers.parseEther("0.5") }
      );

      const remaining = await groupSplit.getDebt(
        1, alice.address, owner.address, 0
      );
      expect(remaining).to.equal(ethers.parseEther("0.5"));
    });

    it("reverts if no debt exists", async function () {
      await expect(
        groupSplit.connect(bob).settleDebt(
          1,
          owner.address,
          ethers.parseEther("1"),
          0,
          { value: ethers.parseEther("1") }
        )
      ).to.be.revertedWith("Not a group member");
    });

    it("reverts if amount exceeds debt", async function () {
      await expect(
        groupSplit.connect(alice).settleDebt(
          1,
          owner.address,
          ethers.parseEther("2"),
          0,
          { value: ethers.parseEther("2") }
        )
      ).to.be.revertedWith("Amount exceeds debt");
    });

    it("reverts if msg.value does not match amount for PAS", async function () {
      await expect(
        groupSplit.connect(alice).settleDebt(
          1,
          owner.address,
          ethers.parseEther("1"),
          0,
          { value: ethers.parseEther("0.5") }
        )
      ).to.be.revertedWith("msg.value must equal amount");
    });

    it("reverts if trying to settle with yourself", async function () {
      await expect(
        groupSplit.connect(alice).settleDebt(
          1,
          alice.address,
          ethers.parseEther("1"),
          0,
          { value: ethers.parseEther("1") }
        )
      ).to.be.revertedWith("Cannot settle with yourself");
    });
  });

  // -------------------------------------------------------------------------
  // View functions
  // -------------------------------------------------------------------------

  describe("getMyGroups", function () {
    it("returns correct groups for a member", async function () {
      await groupSplit.createGroup("G1", [alice.address]);
      await groupSplit.createGroup("G2", [bob.address]);
      await groupSplit.createGroup("G3", [alice.address]);

      const aliceGroups = await groupSplit.getMyGroups(alice.address);
      expect(aliceGroups.length).to.equal(2);

      const bobGroups = await groupSplit.getMyGroups(bob.address);
      expect(bobGroups.length).to.equal(1);
    });
  });

  describe("getExpense", function () {
    it("returns correct expense details", async function () {
      await groupSplit.createGroup("Trip", [alice.address]);
      await groupSplit.addExpenseEqual(
        1, ethers.parseEther("2"), 0, "Taxi"
      );

      const expense = await groupSplit.getExpense(1);
      expect(expense.description).to.equal("Taxi");
      expect(expense.paidBy).to.equal(owner.address);
      expect(expense.totalAmount).to.equal(ethers.parseEther("2"));
      expect(expense.tokenType).to.equal(0);
    });
  });
});
