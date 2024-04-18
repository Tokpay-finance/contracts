const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("tBillStakingContract Withdrawal Test", () => {
  let tBillStakingContract, tBillToken, cUSDToken, owner, user1, user2;

  // Set up the test environment before each test case
  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy cUSD token contract
    const CUSDToken = await ethers.getContractFactory("CUSDToken");
    cUSDToken = await CUSDToken.deploy();

    // Deploy TBillStaking contract
    const TBillStaking = await ethers.getContractFactory("TBillStaking");
    tBillStakingContract = await TBillStaking.deploy(cUSDToken.target);

    // Inherit the TBIllToken from Deployed TBillStaking contract
    tBillToken = tBillStakingContract;
  });


  it("should allow users to withdraw their stakes", async function () {
    // Transfer cUSD tokens to user1
    await cUSDToken.connect(owner).transfer(user1.address, 1000);

    // Transfer cUSD tokens to the tBillStakingContract contract
    await cUSDToken.connect(owner).transfer(tBillStakingContract.target, 2000);

    // Approve CUSD tokens from user1 to stakingContract
    await cUSDToken.connect(user1).approve(tBillStakingContract.target, 950);

     // Create byte32 of stakeID
    const stakeID= ethers.encodeBytes32String("Firststake")

     // Stake CUSD from user1 to stakingContract
    await tBillStakingContract.connect(user1).stake(950, 10, 1000,stakeID);

    // Get the current timestamp
    const currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

    // Increase the timestamp by one week (604800 seconds)
    const newTimestamp = currentTimestamp + 604800;

    // Set the next block timestamp
    await ethers.provider.send("evm_setNextBlockTimestamp", [newTimestamp]);

    // Withdraw stakes
    await tBillStakingContract.connect(user1).withdraw(stakeID);

    // Check user1's cUSD balance
    const user1cUSDBalance = await cUSDToken.balanceOf(user1.address);
    expect(user1cUSDBalance).to.equal(1047); // Maturity value minus service fee
  });

  it("should penalize withdrawals before maturity date", async function () {
    // Transfer cUSD tokens to user1
    await cUSDToken.connect(owner).transfer(user1.address, 1000);

    // Transfer cUSD tokens to the tBillStakingContract contract
    await cUSDToken.connect(owner).transfer(tBillStakingContract.target, 2000);

    // Stake tokens for user1
    await cUSDToken.connect(user1).approve(tBillStakingContract.target, 950);
     // Create a byte32 string of the stakeId for the stake transaction
    const stakeID= ethers.encodeBytes32String("Firststake")
    await tBillStakingContract.connect(user1).stake(950, 10, 1000,stakeID);

    // Withdraw stakes (before the maturity date)
    await tBillStakingContract.connect(user1).withdraw(stakeID);

    // Check user1's cUSD balance
    const user1cUSDBalance = await cUSDToken.balanceOf(user1.address);
    expect(user1cUSDBalance).to.equal(1042); // Maturity value minus service fee
  });

  it("should burn TBILLToken after withdrawal", async function () {
    // Transfer cUSD tokens to user1
    await cUSDToken.connect(owner).transfer(user1.address, 1000);

    // Transfer cUSD tokens to the tBillStakingContract contract
    await cUSDToken.connect(owner).transfer(tBillStakingContract.target, 2000);

    // Stake tokens for user1
    await cUSDToken.connect(user1).approve(tBillStakingContract.target, 1000);
    const stakeID= ethers.encodeBytes32String("Firststake")
    await tBillStakingContract.connect(user1).stake(950,  10, 1000,stakeID);

    // Check user1's TBILL token balance before withdrawal
    const user1BeforeTBILLTokenBalance = await tBillToken.balanceOf(
      user1.address
    );
   
    expect(user1BeforeTBILLTokenBalance).to.equal(1000);

    // Get the current timestamp
    const currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

    // Increase the timestamp by one week (604800 seconds)
    const newTimestamp = currentTimestamp + 604800;

    // Set the next block timestamp
    await ethers.provider.send("evm_setNextBlockTimestamp", [newTimestamp]);

    // Withdraw stakes
    await tBillStakingContract.connect(user1).withdraw(stakeID);

    // Check user1's TBILL token balance after withdrawal
    const user1AfterTBILLTokenBalance = await tBillToken.balanceOf(
      user1.address
    );

    expect(user1AfterTBILLTokenBalance).to.equal(0);

    // Check user1's cUSD balance
    const user1cUSDBalance = await cUSDToken.balanceOf(user1.address);
    expect(user1cUSDBalance).to.equal(1047); // Maturity value minus service fee
  });

  it("should allow users to withdraw from multiple stakes", async function () {
    // Transfer cUSD tokens to user1
    await cUSDToken.connect(owner).transfer(user1.address, 2000);
  
    // Transfer cUSD tokens to the tBillStakingContract contract
    await cUSDToken.connect(owner).transfer(tBillStakingContract.target, 2000);
  
    // Stake tokens for user1 multiple times
    await cUSDToken.connect(user1).approve(tBillStakingContract.target, 2000);
    const stakeID= ethers.encodeBytes32String("Firststake")
    const stakeID2= ethers.encodeBytes32String("Secondstake")
    await tBillStakingContract.connect(user1).stake(1450, 10, 1500,stakeID);
    await tBillStakingContract.connect(user1).stake(450, 5, 500,stakeID2);
  
    // Get the current timestamp
    const currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
  
    // Increase the timestamp by one week (604800 seconds)
    const newTimestamp = currentTimestamp + 604800;
  
    // Set the next block timestamp
    await ethers.provider.send("evm_setNextBlockTimestamp", [newTimestamp]);
    // Check user1's TBILL token balance
    const user1TBILLBalance = await tBillToken.balanceOf(user1.address);
    expect(user1TBILLBalance).to.equal(2000);

    // Withdraw from multiple stakes
    await tBillStakingContract.connect(user1).withdraw(stakeID);
  
    // Check user1's cUSD balance
    const user1cUSDBalance = await cUSDToken.balanceOf(user1.address);
    expect(user1cUSDBalance).to.equal(1596); // Maturity value minus service fee

    const newuser1TBILLBalance = await tBillToken.balanceOf(user1.address);
    expect(newuser1TBILLBalance).to.equal(500);
    await tBillStakingContract.connect(user1).withdraw(stakeID2);
     // Check user1's cUSD balance
     const updateduser1cUSDBalance = await cUSDToken.balanceOf(user1.address);
     expect(updateduser1cUSDBalance).to.equal(2095); // Maturity value minus service fee

     const latestuser1TBILLBalance = await tBillToken.balanceOf(user1.address);
     expect(latestuser1TBILLBalance).to.equal(0);
  });


});