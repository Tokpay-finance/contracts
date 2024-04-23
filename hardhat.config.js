require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomicfoundation/hardhat-ignition-ethers");

const { TESTNET_API_URL,MAINNET_API_URL, PRIVATE_KEY,CHAIN_ID } = process.env || ""

module.exports = {

  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    celo: {
      url:MAINNET_API_URL,
      accounts: [PRIVATE_KEY],
    },
    alfajores:{
      url: TESTNET_API_URL,
      accounts: [PRIVATE_KEY],
    }
  },
  // etherscan: {
  //   apiKey: ETHERSCAN_API_KEY,
  // },
  sourcify: {
    enabled: true,
  },  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  mocha: {
    timeout: 40000,
  },
};



