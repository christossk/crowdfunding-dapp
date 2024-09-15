// test/Crowdfunding.test.js

const Crowdfunding = artifacts.require("Crowdfunding");
const CampaignFactory = artifacts.require("CampaignFactory");
const Campaign = artifacts.require("Campaign");
const truffleAssert = require("truffle-assertions");

contract("Crowdfunding", (accounts) => {
  let crowdfundingInstance;
  let campaignFactoryInstance;
  let campaignInstance;

  const owner = accounts[0]; // Owner of the platform
  const user1 = accounts[1]; // Regular user
  const user2 = accounts[2]; // Another user

  before(async () => {
    // Deploy the CampaignFactory contract
    campaignFactoryInstance = await CampaignFactory.new({ from: owner });

    // Deploy the Crowdfunding contract with the address of the CampaignFactory
    crowdfundingInstance = await Crowdfunding.new(campaignFactoryInstance.address, {
      from: owner,
    });

    // Optional: Transfer ownership of the CampaignFactory to the Crowdfunding contract
    // await campaignFactoryInstance.transferOwnership(crowdfundingInstance.address, { from: owner });
  });

  describe("Deployment", () => {
    it("should deploy the Crowdfunding contract correctly", async () => {
      assert(crowdfundingInstance.address !== "");
    });

    it("should set the correct CampaignFactory address", async () => {
      const factoryAddress = await crowdfundingInstance.campaignFactory();
      assert.equal(factoryAddress, campaignFactoryInstance.address);
    });
  });

  describe("Campaign Reporting and Moderation", () => {
    let campaignAddress;

    before(async () => {
      // User1 creates a new campaign
      const tx = await campaignFactoryInstance.createCampaign(
        "Test Campaign",
        "This is a test campaign.",
        web3.utils.toWei("10", "ether"),
        3600, // 1 hour
        { from: user1 }
      );

      // Get the campaign address from the emitted event
      const event = tx.logs.find((log) => log.event === "CampaignCreated");
      campaignAddress = event.args.campaignAddress;

      // Verify that the campaign was created
      const allCampaigns = await campaignFactoryInstance.getAllCampaigns();
      assert.include(allCampaigns, campaignAddress);
    });

    it("should allow a user to report a campaign", async () => {
      const reason = "Suspicious activity";

      const tx = await crowdfundingInstance.reportCampaign(campaignAddress, reason, {
        from: user2,
      });

      // Verify that the CampaignReported event was emitted
      truffleAssert.eventEmitted(tx, "CampaignReported", (ev) => {
        return (
          ev.campaignAddress === campaignAddress &&
          ev.reporter === user2 &&
          ev.reason === reason
        );
      });

      // Check that the campaign is marked as reported
      const isReported = await crowdfundingInstance.reportedCampaigns(campaignAddress);
      assert.isTrue(isReported);
    });

    it("should not allow reporting the same campaign twice", async () => {
      const reason = "Duplicate report";

      await truffleAssert.reverts(
        crowdfundingInstance.reportCampaign(campaignAddress, reason, { from: user2 }),
        "Campaign already reported"
      );
    });

    it("should allow the owner to remove a reported campaign", async () => {
      const tx = await crowdfundingInstance.removeCampaign(campaignAddress, {
        from: owner,
      });

      // Verify that the CampaignRemoved event was emitted
      truffleAssert.eventEmitted(tx, "CampaignRemoved", (ev) => {
        return ev.campaignAddress === campaignAddress;
      });

      // Verify that the campaign is no longer reported
      const isReported = await crowdfundingInstance.reportedCampaigns(campaignAddress);
      assert.isFalse(isReported);

      // Verify that the campaign was removed from the factory
      const allCampaigns = await campaignFactoryInstance.getAllCampaigns();
      assert.notInclude(allCampaigns, campaignAddress);
    });

    it("should allow the owner to approve a reported campaign", async () => {
      // User1 creates another campaign
      const tx = await campaignFactoryInstance.createCampaign(
        "Second Test Campaign",
        "Another test campaign.",
        web3.utils.toWei("5", "ether"),
        3600, // 1 hour
        { from: user1 }
      );

      // Get the campaign address from the emitted event
      const event = tx.logs.find((log) => log.event === "CampaignCreated");
      const secondCampaignAddress = event.args.campaignAddress;

      // User2 reports the second campaign
      await crowdfundingInstance.reportCampaign(
        secondCampaignAddress,
        "Inappropriate content",
        { from: user2 }
      );

      // Owner approves the reported campaign
      const approveTx = await crowdfundingInstance.approveCampaign(secondCampaignAddress, {
        from: owner,
      });

      // Verify that the CampaignApproved event was emitted
      truffleAssert.eventEmitted(approveTx, "CampaignApproved", (ev) => {
        return ev.campaignAddress === secondCampaignAddress;
      });

      // Verify that the campaign is no longer reported
      const isReported = await crowdfundingInstance.reportedCampaigns(secondCampaignAddress);
      assert.isFalse(isReported);

      // Verify that the campaign is still in the factory
      const allCampaigns = await campaignFactoryInstance.getAllCampaigns();
      assert.include(allCampaigns, secondCampaignAddress);
    });

    it("should not allow non-owners to remove or approve campaigns", async () => {
      // Attempt to remove a campaign as a non-owner
      await truffleAssert.reverts(
        crowdfundingInstance.removeCampaign(campaignAddress, { from: user2 }),
        "Ownable: caller is not the owner"
      );

      // Attempt to approve a campaign as a non-owner
      await truffleAssert.reverts(
        crowdfundingInstance.approveCampaign(campaignAddress, { from: user2 }),
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("Fetching Campaigns", () => {
    it("should retrieve all campaigns from the factory", async () => {
      const allCampaigns = await crowdfundingInstance.getAllCampaigns();
      const factoryCampaigns = await campaignFactoryInstance.getAllCampaigns();
      assert.deepEqual(allCampaigns, factoryCampaigns);
    });

    it("should retrieve campaigns created by a specific user", async () => {
      const userCampaigns = await crowdfundingInstance.getUserCampaigns(user1);
      const factoryUserCampaigns = await campaignFactoryInstance.getUserCampaigns(user1);
      assert.deepEqual(userCampaigns, factoryUserCampaigns);
    });

    it("should retrieve the list of reported campaigns", async () => {
      const reportedCampaigns = await crowdfundingInstance.getReportedCampaigns();
      assert.isArray(reportedCampaigns);
      // Since we approved and removed previous reports, the list should be empty
      assert.equal(reportedCampaigns.length, 0);
    });
  });

  describe("Error Handling", () => {
    it("should not allow reporting an invalid campaign address", async () => {
      const invalidAddress = "0x0000000000000000000000000000000000000000";
      await truffleAssert.reverts(
        crowdfundingInstance.reportCampaign(invalidAddress, "Invalid campaign", {
          from: user2,
        }),
        "Invalid campaign address"
      );
    });

    it("should not allow reporting without a reason", async () => {
      // User1 creates a new campaign
      const tx = await campaignFactoryInstance.createCampaign(
        "Third Test Campaign",
        "Yet another test campaign.",
        web3.utils.toWei("8", "ether"),
        3600, // 1 hour
        { from: user1 }
      );

      // Get the campaign address from the emitted event
      const event = tx.logs.find((log) => log.event === "CampaignCreated");
      const thirdCampaignAddress = event.args.campaignAddress;

      await truffleAssert.reverts(
        crowdfundingInstance.reportCampaign(thirdCampaignAddress, "", {
          from: user2,
        }),
        "Report reason cannot be empty"
      );
    });

    it("should not allow removing a campaign that is not reported", async () => {
      // Attempt to remove a campaign that hasn't been reported
      await truffleAssert.reverts(
        crowdfundingInstance.removeCampaign(campaignAddress, { from: owner }),
        "Campaign not reported"
      );
    });

    it("should not allow approving a campaign that is not reported", async () => {
      // Attempt to approve a campaign that hasn't been reported
      await truffleAssert.reverts(
        crowdfundingInstance.approveCampaign(campaignAddress, { from: owner }),
        "Campaign not reported"
      );
    });
  });
});

