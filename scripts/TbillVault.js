const hre = require("hardhat");

async function main() {
  const name = "NFTMarketplace"; // Name of the NFT contract
  const TBILLToken = "0xE02FE869AE80ea475439734Bd29e937aD774BbFC"
  const TokenAddress = "0x874069fa1eb16d44d622f2e0ca25eea172369bc1"
  
  
//TbillVault  contract deployed to 0xC91BE0a1E7E2A4dd7Ec1e8EC6698E0345b112Fe0

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
