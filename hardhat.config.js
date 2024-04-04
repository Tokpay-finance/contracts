require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");


const { API_URL, PRIVATE_KEY } = process.env;

module.exports = {
  solidity: "0.8.24",
  networks: {     
    alfajores: {
      url: process.env.RPC,
      //@ts-ignore
      accounts: [process.env.PRIVATE_KEY],
      chainId: 44787,
    },
  }
}


