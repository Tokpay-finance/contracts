require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");

/** @type import('hardhat/config').HardhatUserConfig */

const { API_URL, PRIVATE_KEY } = process.env || ""

module.exports = {
  solidity: "0.8.24",
  defaultNetwork: "hardhat",
  networks: {
    alfajores: {
      url: API_URL,
      accounts: [PRIVATE_KEY],
      chainId: 44787,
    },
  },
  // etherscan: {
  //   apiKey: ETHERSCAN_API_KEY,
  // },
  sourcify: {
    enabled: true,
  },
};



