
const {verify} = require("./verify.js");
const { ethers, run, network } = require("hardhat");


async function main() {
  
  const TBILLToken = "0xe8765FDBf60659BF5e5C3C55A989a1771aAfAaE7"
  const token = "0x874069fa1eb16d44d622f2e0ca25eea172369bc1"
  
  //TBILLToken  contract deployed to 0xe8765FDBf60659BF5e5C3C55A989a1771aAfAaE7
  //TbillVault  contract deployed to 0x641B8a631f50c6540fdA1C713D64b0D56ee0b1Fc


  // const TBILLToken  = await ethers.deployContract("TBILLToken",[]); 
  // await TBILLToken.waitForDeployment();
  
  // console.log(
  //   `TBILLToken  contract deployed to ${TBILLToken.target}`
  // );

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
