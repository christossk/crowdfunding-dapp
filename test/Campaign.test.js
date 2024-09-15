// test/Campaign.test.js

const Campaign = artifacts.require("Campaign");
const truffleAssert = require("truffle-assertions");

contract("Campaign", (accounts) => {
  let campaignInstance;

  const owner = accounts[0]; // Campaign creator
  const contributor1 = accounts[1];
  const contributor2 = accounts[2];
  const nonContributor = accounts[3];

  const campaignTitle = "Test Campaign";
  const campaignDescription = "This is a test campaign.";
  const goalAmount = web3.utils.toWei("5", "ether"); // Funding goal of 5 ETH
  const duration = 3600; // Duration of 1 hour (in seconds)

  beforeEach(async () => {
    // Deploy a new Campaign contract before each test
    campaignInstance = await Campaign.new(
      owner,
      campaignTitle,
      campaignDescription,
      goalAmount,
      duration,
      { from: owner }
    );
  });

  describe("Initialization", () => {
    it("should initialize the campaign with correct parameters", async () => {
      const title = await campaignInstance.title();
      const description = await campaignInstance.description();
      const goal = await campaignInstance.goalAmount();
      const deadline = await campaignInstance.deadline();
      const isOpen = await campaignInstance.isOpen();

      assert.equal(title, campaignTitle);
      assert.equal(description, campaignDescription);
      assert.equal(goal.toString(), goalAmount);
      assert.isTrue(isOpen);
      assert.isFalse(await campaignInstance.isCanceled());
      assert.equal(await campaignInstance.owner(), owner);
    });
  });

  describe("Contributions", () => {
    it("should accept contributions from users", async () => {
      const contributionAmount = web3.utils.toWei("1", "ether");

      const tx = await campaignInstance.contribute({
        from: contributor1,
        value: contributionAmount,
      });

      // Verify ContributionReceived event
      truffleAssert.eventEmitted(tx, "ContributionReceived", (ev) => {
        return (
          ev.contributor === contributor1 &&
          ev.amount.toString() === contributionAmount
        );
      });

      // Verify contributions mapping
      const contribution = await campaignInstance.contributions(contributor1);
      assert.equal(contribution.toString(), contributionAmount);

      // Verify fundsRaised
      const fundsRaised = await campaignInstance.fundsRaised();
      assert.equal(fundsRaised.toString(), contributionAmount);

      // Verify contributors array
      const contributorsCount = await campaignInstance.getContributorsCount();
      assert.equal(contributorsCount.toNumber(), 1);
    });

    it("should prevent contributions after campaign is closed", async () => {
      // Close the campaign by reaching the goal amount
      await campaignInstance.contribute({
        from: contributor1,
        value: goalAmount,
      });

      // Attempt to contribute after campaign is closed
      await truffleAssert.reverts(
        campaignInstance.contribute({
          from: contributor2,
          value: web3.utils.toWei("1", "ether"),
        }),
        "Campaign is not active."
      );
    });

    it("should prevent contributions of zero value", async () => {
      await truffleAssert.reverts(
        campaignInstance.contribute({ from: contributor1, value: 0 }),
        "Contribution must be greater than zero."
      );
    });

    it("should prevent contributions after the deadline", async () => {
      // Increase time beyond the deadline
      await increaseTime(duration + 1);

      await truffleAssert.reverts(
        campaignInstance.contribute({
          from: contributor1,
          value: web3.utils.toWei("1", "ether"),
        }),
        "Deadline has passed."
      );
    });
  });

  describe("Withdrawals", () => {
    it("should allow the owner to withdraw funds after goal is met", async () => {
      // Contribute to meet the goal
      await campaignInstance.contribute({
        from: contributor1,
        value: goalAmount,
      });

      // Increase time to pass the deadline
      await increaseTime(duration + 1);

      const initialBalance = web3.utils.toBN(
        await web3.eth.getBalance(owner)
      );

      const tx = await campaignInstance.withdrawFunds({ from: owner });

      // Verify FundsWithdrawn event
      truffleAssert.eventEmitted(tx, "FundsWithdrawn", (ev) => {
        return (
          ev.creator === owner && ev.amount.toString() === goalAmount
        );
      });

      // Verify fundsRaised is reset to zero
      const fundsRaised = await campaignInstance.fundsRaised();
      assert.equal(fundsRaised.toString(), "0");

      // Verify owner's balance increased (approximate due to gas costs)
      const finalBalance = web3.utils.toBN(await web3.eth.getBalance(owner));
      assert.isTrue(finalBalance.sub(initialBalance).gte(web3.utils.toBN(goalAmount).sub(web3.utils.toBN(web3.utils.toWei("0.1", "ether")))));
    });

    it("should prevent withdrawals before goal is met", async () => {
      // Contribute less than the goal amount
      await campaignInstance.contribute({
        from: contributor1,
        value: web3.utils.toWei("1", "ether"),
      });

      // Increase time to pass the deadline
      await increaseTime(duration + 1);

      await truffleAssert.reverts(
        campaignInstance.withdrawFunds({ from: owner }),
        "Funding goal not reached."
      );
    });

    it("should prevent non-owners from withdrawing funds", async () => {
      // Contribute to meet the goal
      await campaignInstance.contribute({
        from: contributor1,
        value: goalAmount,
      });

      // Increase time to pass the deadline
      await increaseTime(duration + 1);

      await truffleAssert.reverts(
        campaignInstance.withdrawFunds({ from: contributor1 }),
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("Refunds", () => {
    it("should allow contributors to receive refunds if goal not met", async () => {
      const contributionAmount = web3.utils.toWei("1", "ether");

      // Contributor1 contributes
      await campaignInstance.contribute({
        from: contributor1,
        value: contributionAmount,
      });

      // Increase time to pass the deadline
      await increaseTime(duration + 1);

      const initialBalance = web3.utils.toBN(
        await web3.eth.getBalance(contributor1)
      );

      const tx = await campaignInstance.issueRefunds({ from: contributor1 });

      // Verify RefundIssued event
      truffleAssert.eventEmitted(tx, "RefundIssued", (ev) => {
        return (
          ev.contributor === contributor1 &&
          ev.amount.toString() === contributionAmount
        );
      });

      // Verify contributions mapping is reset
      const contribution = await campaignInstance.contributions(contributor1);
      assert.equal(contribution.toString(), "0");

      // Verify fundsRaised is reset to zero
      const fundsRaised = await campaignInstance.fundsRaised();
      assert.equal(fundsRaised.toString(), "0");

      // Verify contributor's balance increased (approximate due to gas costs)
      const finalBalance = web3.utils.toBN(
        await web3.eth.getBalance(contributor1)
      );
      assert.isTrue(
        finalBalance.sub(initialBalance).gte(
          web3.utils.toBN(contributionAmount).sub(web3.utils.toBN(web3.utils.toWei("0.1", "ether")))
        )
      );
    });

    it("should prevent refunds if goal is met", async () => {
      // Contribute to meet the goal
      await campaignInstance.contribute({
        from: contributor1,
        value: goalAmount,
      });

      // Increase time to pass the deadline
      await increaseTime(duration + 1);

      await truffleAssert.reverts(
        campaignInstance.issueRefunds({ from: contributor1 }),
        "Funding goal was reached."
      );
    });

    it("should prevent issuing refunds more than once", async () => {
      const contributionAmount = web3.utils.toWei("1", "ether");

      // Contributor1 contributes
      await campaignInstance.contribute({
        from: contributor1,
        value: contributionAmount,
      });

      // Increase time to pass the deadline
      await increaseTime(duration + 1);

      // First refund attempt
      await campaignInstance.issueRefunds({ from: contributor1 });

      // Second refund attempt should fail
      await truffleAssert.reverts(
        campaignInstance.issueRefunds({ from: contributor1 }),
        "Refunds already issued or campaign canceled."
      );
    });
  });

  describe("Campaign Cancellation", () => {
    it("should allow owner to cancel campaign before any contributions", async () => {
      const tx = await campaignInstance.cancelCampaign({ from: owner });

      // Verify CampaignCanceled event
      truffleAssert.eventEmitted(tx, "CampaignCanceled", (ev) => {
        return ev.creator === owner;
      });

      // Verify campaign is canceled
      const isCanceled = await campaignInstance.isCanceled();
      assert.isTrue(isCanceled);
      const isOpen = await campaignInstance.isOpen();
      assert.isFalse(isOpen);
    });

    it("should prevent cancellation after contributions have been made", async () => {
      // Contributor1 contributes
      await campaignInstance.contribute({
        from: contributor1,
        value: web3.utils.toWei("1", "ether"),
      });

      await truffleAssert.reverts(
        campaignInstance.cancelCampaign({ from: owner }),
        "Cannot cancel after receiving contributions."
      );
    });

    it("should prevent non-owners from canceling the campaign", async () => {
      await truffleAssert.reverts(
        campaignInstance.cancelCampaign({ from: contributor1 }),
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("Campaign Updates and Comments", () => {
    it("should allow owner to post updates", async () => {
      const message = "Campaign update message.";

      const tx = await campaignInstance.postUpdate(message, { from: owner });

      // Verify UpdatePosted event
      truffleAssert.eventEmitted(tx, "UpdatePosted", (ev) => {
        return ev.message === message;
      });

      // Verify updates array
      const updatesCount = await campaignInstance.getUpdatesCount();
      assert.equal(updatesCount.toNumber(), 1);

      const update = await campaignInstance.getUpdate(0);
      assert.equal(update.message, message);
    });

    it("should prevent non-owners from posting updates", async () => {
      await truffleAssert.reverts(
        campaignInstance.postUpdate("Unauthorized update", { from: contributor1 }),
        "Ownable: caller is not the owner"
      );
    });

    it("should allow users to add comments", async () => {
      const message = "This is a comment.";

      const tx = await campaignInstance.addComment(message, {
        from: contributor1,
      });

      // Verify CommentAdded event
      truffleAssert.eventEmitted(tx, "CommentAdded", (ev) => {
        return ev.commenter === contributor1 && ev.message === message;
      });

      // Verify comments array
      const commentsCount = await campaignInstance.getCommentsCount();
      assert.equal(commentsCount.toNumber(), 1);

      const comment = await campaignInstance.getComment(0);
      assert.equal(comment.commenter, contributor1);
      assert.equal(comment.message, message);
    });

    it("should prevent empty comments", async () => {
      await truffleAssert.reverts(
        campaignInstance.addComment("", { from: contributor1 }),
        "Comment cannot be empty."
      );
    });
  });

  describe("Reward Tiers", () => {
    it("should allow owner to add reward tiers", async () => {
      const amount = web3.utils.toWei("1", "ether");
      const description = "Reward for 1 ETH contribution.";

      const tx = await campaignInstance.addReward(amount, description, {
        from: owner,
      });

      // Verify RewardAdded event
      truffleAssert.eventEmitted(tx, "RewardAdded", (ev) => {
        return ev.amount.toString() === amount && ev.description === description;
      });

      // Verify rewards array
      const rewardsCount = await campaignInstance.getRewardsCount();
      assert.equal(rewardsCount.toNumber(), 1);

      const reward = await campaignInstance.getReward(0);
      assert.equal(reward.amount.toString(), amount);
      assert.equal(reward.description, description);
    });

    it("should prevent non-owners from adding rewards", async () => {
      await truffleAssert.reverts(
        campaignInstance.addReward(
          web3.utils.toWei("1", "ether"),
          "Unauthorized reward",
          { from: contributor1 }
        ),
        "Ownable: caller is not the owner"
      );
    });

    it("should prevent adding rewards with zero amount or empty description", async () => {
      await truffleAssert.reverts(
        campaignInstance.addReward(0, "Zero amount reward", { from: owner }),
        "Reward amount must be greater than zero."
      );

      await truffleAssert.reverts(
        campaignInstance.addReward(web3.utils.toWei("1", "ether"), "", {
          from: owner,
        }),
        "Reward description cannot be empty."
      );
    });

    it("should correctly assign rewards based on contributions", async () => {
      // Add reward tiers
      await campaignInstance.addReward(web3.utils.toWei("1", "ether"), "Bronze Reward", {
        from: owner,
      });
      await campaignInstance.addReward(web3.utils.toWei("3", "ether"), "Silver Reward", {
        from: owner,
      });
      await campaignInstance.addReward(web3.utils.toWei("5", "ether"), "Gold Reward", {
        from: owner,
      });

      // Contributor1 contributes 2 ETH
      await campaignInstance.contribute({
        from: contributor1,
        value: web3.utils.toWei("2", "ether"),
      });

      // Contributor2 contributes 5 ETH
      await campaignInstance.contribute({
        from: contributor2,
        value: web3.utils.toWei("5", "ether"),
      });

      // Get rewards
      const reward1 = await campaignInstance.getContributorReward(contributor1);
      const reward2 = await campaignInstance.getContributorReward(contributor2);

      assert.equal(reward1, "Bronze Reward");
      assert.equal(reward2, "Gold Reward");
    });
  });

  describe("Updating Campaign Information", () => {
    it("should allow owner to update campaign info before contributions", async () => {
      const newTitle = "Updated Campaign Title";
      const newDescription = "Updated campaign description.";

      const tx = await campaignInstance.updateCampaignInfo(newTitle, newDescription, {
        from: owner,
      });

      // Verify CampaignUpdated event
      truffleAssert.eventEmitted(tx, "CampaignUpdated", (ev) => {
        return ev.newTitle === newTitle && ev.newDescription === newDescription;
      });

      // Verify updated title and description
      const title = await campaignInstance.title();
      const description = await campaignInstance.description();

      assert.equal(title, newTitle);
      assert.equal(description, newDescription);
    });

    it("should prevent updating campaign info after contributions", async () => {
      // Contributor1 contributes
      await campaignInstance.contribute({
        from: contributor1,
        value: web3.utils.toWei("1", "ether"),
      });

      await truffleAssert.reverts(
        campaignInstance.updateCampaignInfo("New Title", "New Description", {
          from: owner,
        }),
        "Cannot update after receiving contributions."
      );
    });

    it("should prevent non-owners from updating campaign info", async () => {
      await truffleAssert.reverts(
        campaignInstance.updateCampaignInfo("New Title", "New Description", {
          from: contributor1,
        }),
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("Fallback Function", () => {
    it("should accept Ether sent directly to the contract", async () => {
      const contributionAmount = web3.utils.toWei("1", "ether");

      const tx = await web3.eth.sendTransaction({
        from: contributor1,
        to: campaignInstance.address,
        value: contributionAmount,
      });

      // Verify ContributionReceived event (captured in contract logs)
      const logs = await campaignInstance.getPastEvents("ContributionReceived", {
        fromBlock: tx.blockNumber,
        toBlock: tx.blockNumber,
      });

      assert.equal(logs.length, 1);
      assert.equal(logs[0].args.contributor, contributor1);
      assert.equal(logs[0].args.amount.toString(), contributionAmount);

      // Verify contributions mapping
      const contribution = await campaignInstance.contributions(contributor1);
      assert.equal(contribution.toString(), contributionAmount);
    });
  });

  // Utility function to increase time in the EVM
  function increaseTime(duration) {
    const id = Date.now();

    return new Promise((resolve, reject) => {
      web3.currentProvider.send(
        {
          jsonrpc: "2.0",
          method: "evm_increaseTime",
          params: [duration],
          id: id,
        },
        (err1) => {
          if (err1) return reject(err1);

          web3.currentProvider.send(
            {
              jsonrpc: "2.0",
              method: "evm_mine",
              id: id + 1,
            },
            (err2, res) => {
              return err2 ? reject(err2) : resolve(res);
            }
          );
        }
      );
    });
  }
});

