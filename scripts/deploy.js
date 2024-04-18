// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");


async function main() {
const ALfajoresCUSD="0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"
const MainNetCUSD=""

  const TbillVault  = await hre.ethers.deployContract("TBillStaking",[ALfajoresCUSD]); 
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
