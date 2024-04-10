
const {verify} = require("./verify.js");
const { ethers, run, network } = require("hardhat");


async function main() {
  
  const TBILLToken = "0xE02FE869AE80ea475439734Bd29e937aD774BbFC"
  const token = "0x874069fa1eb16d44d622f2e0ca25eea172369bc1"
  
  //TbillVault  contract deployed to 0x5e85Ee1c67d4486493A1931bEf5191157B5FA394


  const TbillVault  = await ethers.deployContract("TbillVault",[ TBILLToken, token]); 
  await TbillVault.waitForDeployment();
  
  console.log(
    `TbillVault  contract deployed to ${TbillVault.target}`
  );
}
   
  main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
