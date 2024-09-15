// truffle-config.js

const path = require("path");
require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

/**
 * @notice Truffle configuration file for the Crowdfunding DApp.
 * @dev This configuration allows deployment to local development network,
 *      as well as public testnets like Ropsten and Rinkeby.
 */

module.exports = {
  // Specify the directory where compiled contracts will be stored
  contracts_build_directory: path.join(__dirname, "build/contracts"),

  // Networks define how you connect to your Ethereum client or network
  networks: {
    // Local development network (Ganache)
    development: {
      host: "127.0.0.1",     // Localhost
      port: 8545,            // Standard Ethereum port for Ganache
      network_id: "*",       // Match any network id
    },

    // Ropsten test network
    ropsten: {
      provider: () => new HDWalletProvider(
        process.env.PRIVATE_KEY,             // Private key of the deployer account
        `https://ropsten.infura.io/v3/${process.env.INFURA_PROJECT_ID}` // Infura endpoint
      ),
      network_id: 3,       // Ropsten's network id
      gas: 5500000,        // Gas limit
      confirmations: 2,    // # of confirmations to wait between deployments
      timeoutBlocks: 200,  // # of blocks before deployment times out
      skipDryRun: true     // Skip dry run before migrations
    },

    // Rinkeby test network
    rinkeby: {
      provider: () => new HDWalletProvider(
        process.env.PRIVATE_KEY,             // Private key of the deployer account
        `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}` // Infura endpoint
      ),
      network_id: 4,       // Rinkeby's network id
      gas: 5500000,        // Gas limit
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },

    // Main Ethereum network (Mainnet)
    mainnet: {
      provider: () => new HDWalletProvider(
        process.env.PRIVATE_KEY,             // Private key of the deployer account
        `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}` // Infura endpoint
      ),
      network_id: 1,       // Mainnet's network id
      gas: 5500000,
      gasPrice: 10000000000, // 10 Gwei
      confirmations: 2,
      timeoutBlocks: 500,
      skipDryRun: false
    },
  },

  // Set default mocha options here, use special reporters, etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.0",    // Fetch exact version from solc-bin
      settings: {
        optimizer: {
          enabled: true,   // Enable optimization
          runs: 200        // Optimize for how many times you intend to run the code
        },
        evmVersion: "istanbul" // EVM version to compile for
      }
    }
  },

  // Truffle DB is currently disabled by default; to enable it, change enabled: false to enabled: true
  db: {
    enabled: false
  }
};

