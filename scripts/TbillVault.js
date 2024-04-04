
const {verify} = require("./verify.js");
const { ethers, run, network } = require("hardhat");


async function main() {
  
 const TokenAddress = "0xE02FE869AE80ea475439734Bd29e937aD774BbFC";
  const TbillVault = await ethers.deployContract("TbillVault",[TokenAddress]); 
  
  if (network.config.chainId === 44787 && process.env.ETHERSCAN_API_KEY) {

    await TbillVault.waitForDeployment(1);
    await verify(TbillVault.target, [TokenAddress])

  } else {
    console.log("Contract cannot be verified on Hardhat Network")
  }

  console.log(
    `TbillVault contract deployed to ${TbillVault.target}`
  );
}
  main()
   .then(() => process.exit(0))
   .catch(error => {
     console.error(error);
     process.exit(1);
   });


