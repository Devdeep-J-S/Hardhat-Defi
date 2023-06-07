const { version } = require("chai");

require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("prettier-plugin-solidity");

// here we add or so no error occurs and give clear idea of what is going on
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "http://";
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY || "0x";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "0x";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "0x";
const MAINET_RPC_URL = process.env.MAINET_RPC_URL || "http://";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.18" },
      { version: "0.6.12" },
      { version: "0.4.19" },
    ],
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      forking: {
        url: MAINET_RPC_URL,
      },
    },
    sepolia: {
      url: SEPOLIA_RPC_URL, // alchemy
      accounts: [SEPOLIA_PRIVATE_KEY],
      chainId: 11155111, // chainlink id get it from chainlist.org
      blockConfirmations: 5, // wait for 5 block confirmation
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    // gasPrice: 100,
    currency: "USD",
    // coin market cap to get api to get current usd value for gas
    outputFile: "gas-report.txt",
    enabled: true,
    noColors: true, // because it can mess up in txt file
    coinmarketcap: COINMARKETCAP_API_KEY, // to get usd coversation real time
  },
  mocha: {
    timeout: 300000, // 300 seconds
  },
};
