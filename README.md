Crowdfunding DApp
=================

A decentralized crowdfunding platform built on Ethereum, allowing users to create campaigns, contribute to projects, and manage fundraising activities securely and transparently.

Table of Contents
-----------------

*   [Introduction](#introduction)
*   [Features](#features)
*   [Technology Stack](#technology-stack)
*   [Project Structure](#project-structure)
*   [Prerequisites](#prerequisites)
*   [Installation](#installation)
*   [Compilation](#compilation)
*   [Deployment](#deployment)
*   [Testing](#testing)
*   [Usage](#usage)
*   [Contracts Overview](#contracts-overview)
*   [Interacting with the DApp](#interacting-with-the-dapp)
*   [Deployment to Public Networks](#deployment-to-public-networks)
*   [Security Considerations](#security-considerations)
*   [Contributing](#contributing)
*   [License](#license)
*   [Acknowledgments](#acknowledgments)
*   [Contact](#contact)

* * *

Introduction
------------

The Crowdfunding DApp is a decentralized application that enables users to create and manage crowdfunding campaigns on the Ethereum blockchain. It provides a transparent and secure platform for campaign creators to raise funds and for contributors to support projects they believe in.

* * *

Features
--------

*   **Campaign Creation**: Users can create crowdfunding campaigns with specific goals, durations, and descriptions.
*   **Contributions**: Supporters can contribute Ether to campaigns they wish to fund.
*   **Reward Tiers**: Campaign creators can set up reward tiers for different contribution levels.
*   **Refunds**: If a campaign does not meet its funding goal by the deadline, contributors can receive refunds.
*   **Withdrawal**: Campaign creators can withdraw funds once the funding goal is met and the campaign duration has ended.
*   **Comments and Updates**: Users can add comments to campaigns, and creators can post updates.
*   **Campaign Management**: An admin can manage reported campaigns, removing or approving them as necessary.

* * *

Technology Stack
----------------

*   **Solidity**: Smart contract programming language.
*   **Truffle**: Development framework for Ethereum.
*   **Ganache**: Personal blockchain for Ethereum development.
*   **OpenZeppelin**: Secure smart contract library.
*   **Node.js** and **npm**: JavaScript runtime and package manager.
*   **Mocha** and **Chai**: Testing frameworks.
*   **MetaMask**: Ethereum wallet and browser extension.

* * *

Project Structure
-----------------
```plaintext
crowdfunding-dapp/
├── contracts/
│   ├── Campaign.sol
│   ├── CampaignFactory.sol
│   ├── Crowdfunding.sol
│   ├── interfaces/
│   │   └── ICampaign.sol
│   └── utils/
│       └── Ownable.sol
├── migrations/
│   └── 1_deploy_contracts.js
├── test/
│   ├── Campaign.test.js
│   └── Crowdfunding.test.js
├── scripts/
│   └── deploy.js
├── truffle-config.js
├── package.json
├── .env
└── README.md
```
* * *

Prerequisites
-------------

Before you begin, ensure you have met the following requirements:

*   **Node.js** and **npm** installed.
    
*   **Truffle** installed globally:
    
    `npm install -g truffle`
    
*   **Ganache** for local blockchain development (optional but recommended).
    
*   **MetaMask** browser extension for interacting with the DApp on testnets or mainnet.
    

* * *

Installation
------------

1.  **Clone the Repository**
    
    `git clone https://github.com/christossk/crowdfunding-dapp.git cd crowdfunding-dapp`
    
2.  **Install Dependencies**
    
    `npm install`
    

* * *

Compilation
-----------

Compile the smart contracts using Truffle:

`truffle compile`

* * *

Deployment
----------

### Local Development Network (Ganache)

1.  **Start Ganache**
    
    Open Ganache and start a new workspace or quickstart.
    
2.  **Deploy Contracts**
    
    `truffle migrate --network development`
    

### Public Test Networks

To deploy to networks like Ropsten or Rinkeby, follow these steps:

1.  **Create an Infura Account**
    
    Sign up at [Infura](https://infura.io/) and create a new project to obtain a Project ID.
    
2.  **Set Up Environment Variables**
    
    Create a `.env` file in the project root:
    
    `PRIVATE_KEY=your_private_key_without_0x_prefix INFURA_PROJECT_ID=your_infura_project_id`
    
    **Important:** Do not commit `.env` to version control. Add it to `.gitignore`.
    
3.  **Configure `truffle-config.js`**
    
    Ensure the network configurations for the testnet you wish to deploy to are correctly set up.
    
4.  **Deploy to Testnet**
    
    `truffle migrate --network ropsten`
    

* * *

Testing
-------

Run the test suites to ensure all contracts behave as expected:

`truffle test`

* * *

Usage
-----

### Interacting with the DApp

After deploying the contracts, you can interact with them using Truffle Console or integrate them into a frontend application.

#### Using Truffle Console

`truffle console --network development`

**Example Commands:**

*   **Create a Campaign**

    `let factory = await CampaignFactory.deployed(); await factory.createCampaign("My Campaign", "Support my project", web3.utils.toWei("10", "ether"), 604800, { from: "0xYourAccountAddress" });`
    
*   **Get All Campaigns**

    `let campaigns = await factory.getAllCampaigns();`
    
*   **Interact with a Campaign**

    `let campaignAddress = campaigns[0]; let campaign = await Campaign.at(campaignAddress); await campaign.contribute({ from: "0xContributorAddress", value: web3.utils.toWei("1", "ether") });`
    

* * *

Contracts Overview
------------------

### Campaign.sol

Represents an individual crowdfunding campaign with functionalities such as contributing, withdrawing funds, issuing refunds, posting updates, and adding comments.

### CampaignFactory.sol

Creates and manages `Campaign` contracts, keeping track of all campaigns and those created by individual users.

### Crowdfunding.sol

Manages platform-level functionalities, such as reporting campaigns, admin moderation, and fetching lists of campaigns.

### ICampaign.sol

Interface for the `Campaign` contract, allowing other contracts and external applications to interact with it consistently.

### Ownable.sol

An OpenZeppelin contract that provides basic access control, where there is an account (an owner) that can be granted exclusive access to specific functions.

* * *

Interacting with the DApp
-------------------------

### Using MetaMask and a Frontend

To interact with the DApp through a frontend, you'll need to:

1.  **Set Up MetaMask**
    
    *   Install the MetaMask extension for your browser.
    *   Import the account(s) you're using for testing or create new ones.
    *   Connect to the desired network (e.g., Localhost 8545, Ropsten).
2.  **Develop the Frontend**
    
    *   Use frameworks like **React** or **Vue.js** to build the user interface.
    *   Integrate **Web3.js** or **Ethers.js** to interact with the smart contracts.
    *   Connect to the deployed contract addresses and ABIs.
3.  **Interact with Smart Contracts**
    
    *   Allow users to create campaigns, contribute, post comments, etc.
    *   Ensure all interactions are properly signed and sent via MetaMask.

* * *

Deployment to Public Networks
-----------------------------

### Mainnet Deployment

**Caution:** Deploying to the Ethereum mainnet requires real Ether and is subject to gas costs.

1.  **Fund Your Deployment Account**
    
    *   Ensure your account has enough Ether to cover deployment and transaction fees.
2.  **Update `truffle-config.js`**
    
    *   Ensure the `mainnet` configuration is correct and includes gas price adjustments as needed.
3.  **Deploy**

    `truffle migrate --network mainnet`
    

* * *

Security Considerations
-----------------------

*   **Auditing**
    
    *   Before deploying to mainnet, consider having your smart contracts audited by a professional security firm.
*   **Testing**
    
    *   Thoroughly test all functionalities and edge cases.
    *   Use tools like **MythX** or **Slither** for static analysis.
*   **Private Keys**
    
    *   Never expose your private keys. Use environment variables and secure key management practices.
*   **Upgradability**
    
    *   Plan for contract upgrades by using proxy patterns if necessary.

* * *

Contributing
------------

Contributions are welcome! Please follow these steps:

1.  **Fork the Repository**
    
    Click the "Fork" button at the top right of the repository page.
    
2.  **Clone Your Fork**

    `git clone https://github.com/christossk/crowdfunding-dapp.git cd crowdfunding-dapp`
    
3.  **Create a Branch**
 
    `git checkout -b feature/your-feature-name`
    
4.  **Make Changes**
    
    Implement your feature or fix.
    
5.  **Commit Changes**

    `git commit -m "Add your commit message"`
    
6.  **Push to Your Fork**

    `git push origin feature/your-feature-name`
    
7.  **Create a Pull Request**
    
    Go to the original repository and create a pull request from your fork.
    

* * *

License
-------

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

* * *

Acknowledgments
---------------

*   **OpenZeppelin**: For providing secure and community-reviewed smart contract libraries.
*   **Truffle Suite**: For offering an excellent development environment.
*   **Ethereum Community**: For continuous support and resources.
*   **Contributors**: Thanks to all who have contributed to this project.

* * *

Contact
-------

For any inquiries or support, please contact:

*   **Email**: chris.skatharoudis@gmail.com
*   **GitHub**: [christossk](https://github.com/christossk)
*   **LinkedIn**: [Christos Skatharoudis](https://linkedin.com/in/cskatharoudis)

* * *

Additional Resources
--------------------

*   **Truffle Documentation**: https://www.trufflesuite.com/docs
*   **OpenZeppelin Documentation**: https://docs.openzeppelin.com/contracts
*   **Solidity Documentation**: https://docs.soliditylang.org
*   **Ethereum Development Tools List**: [https://github.com/ConsenSys/ethereum-developer-tools-list](https://github.com/ConsenSys/ethereum-developer-tools-list)

* * *

FAQ
---

### How do I report a bug or request a feature?

*   Open an issue on the GitHub repository with detailed information.

### Can I use this project commercially?

*   Yes, it's licensed under the MIT License, which allows commercial use.

* * *

Thank you for your interest in the Crowdfunding DApp! Your contributions and feedback are highly appreciated.
