// migrations/1_deploy_contracts.js

const CampaignFactory = artifacts.require("CampaignFactory");
const Crowdfunding = artifacts.require("Crowdfunding");

module.exports = async function (deployer, network, accounts) {
  // Deploy the CampaignFactory contract
  await deployer.deploy(CampaignFactory);
  const campaignFactoryInstance = await CampaignFactory.deployed();

  // Deploy the Crowdfunding contract, passing the address of the deployed CampaignFactory
  await deployer.deploy(Crowdfunding, campaignFactoryInstance.address);
  const crowdfundingInstance = await Crowdfunding.deployed();

  // Optional: Transfer ownership of the CampaignFactory to the Crowdfunding contract
  // This is only necessary if you want the Crowdfunding contract to have administrative control over the CampaignFactory
  // await campaignFactoryInstance.transferOwnership(crowdfundingInstance.address);

  // Log the addresses of the deployed contracts
  console.log("CampaignFactory deployed at:", campaignFactoryInstance.address);
  console.log("Crowdfunding deployed at:", crowdfundingInstance.address);
};
