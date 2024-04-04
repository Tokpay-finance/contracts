
const {verify} = require("./verify.js");
const { ethers, run, network } = require("hardhat");


async function main() {
  
 
  const TBILLToken  = await ethers.deployContract("TBILLToken"); 
  
  if (network.config.chainId === 44787 && process.env.ETHERSCAN_API_KEY) {

    await TBILLToken.waitForDeployment(1);
    await verify(TBILLToken.target, [])

  } else {
    console.log("Contract cannot be verified on Hardhat Network")
  }

  console.log(
    `TBILLToken  contract deployed to ${TBILLToken.target}`
  );
}
  main()
   .then(() => process.exit(0))
   .catch(error => {
     console.error(error);
     process.exit(1);
   });


