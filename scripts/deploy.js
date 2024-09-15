// scripts/deploy.js

const hre = require("hardhat");

async function main() {
  // Get the ContractFactory for each contract
  const CampaignFactory = await hre.ethers.getContractFactory("CampaignFactory");
  const Crowdfunding = await hre.ethers.getContractFactory("Crowdfunding");

  // Deploy the CampaignFactory contract
  const campaignFactory = await CampaignFactory.deploy();
  await campaignFactory.deployed();
  console.log("CampaignFactory deployed to:", campaignFactory.address);

  // Deploy the Crowdfunding contract, passing the address of the deployed CampaignFactory
  const crowdfunding = await Crowdfunding.deploy(campaignFactory.address);
  await crowdfunding.deployed();
  console.log("Crowdfunding deployed to:", crowdfunding.address);

  // Optional: Transfer ownership of the CampaignFactory to the Crowdfunding contract
  // Uncomment the following lines if you want the Crowdfunding contract to have administrative control over the CampaignFactory

  // const transferTx = await campaignFactory.transferOwnership(crowdfunding.address);
  // await transferTx.wait();
  // console.log("CampaignFactory ownership transferred to Crowdfunding contract");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deploying contracts:", error);
    process.exit(1);
  });

