const hre = require("hardhat");

async function main() {
  const name = "NFTMarketplace"; // Name of the NFT contract
  const TBILLToken = "0xE02FE869AE80ea475439734Bd29e937aD774BbFC"
  const TokenAddress = "0x874069fa1eb16d44d622f2e0ca25eea172369bc1"
  //TbillVault  contract deployed to 0x5F9cf1Aecf388d23c0f710f4a64C8458545B4248

  const TbillVault  = await ethers.deployContract("TbillVault",[TokenAddress,TBILLToken]); 
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
