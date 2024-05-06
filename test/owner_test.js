const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("TBillStaking Ownership Test", () => {
  let tBillStaking, tBillToken, cUSDToken, owner, user1, user2;

  // Set up the test environment before each test case
  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy cUSD token contract
    const CUSDToken = await ethers.getContractFactory("CUSDToken");
    cUSDToken = await CUSDToken.deploy();

    // Deploy TBillStaking contract
    const TBillStaking = await ethers.getContractFactory("TBillStaking");
    tBillStaking = await TBillStaking.deploy(cUSDToken.target);

    // Inherit the TBIllToken from Deployed TBillStaking contract
    tBillToken = tBillStaking;
  });



  it("should allow the owner to set service fee and penalty fee", async function () {
    // Set the service fee to 5%
    await tBillStaking.connect(owner).setServiceFee(5);
  
    // Set the penalty fee to 10%
    await tBillStaking.connect(owner).setPenaltyFee(5);
  
    // Transfer cUSD tokens to user1
    await cUSDToken.connect(owner).transfer(user1.address, 1000);
  
    // Transfer cUSD tokens to the TBillStaking contract
    await cUSDToken.connect(owner).transfer(tBillStaking.target, 2000);
  
    // Stake tokens for user1
    await cUSDToken.connect(user1).approve(tBillStaking.target, 950);
    const stakeID= "Firststake"
    // Stake tokens for user1
    await tBillStaking.connect(user1).stake(950, 10, 1000,stakeID,7);
    
  
    // Get the current timestamp
    const currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
  
    // Increase the timestamp by one week (604800 seconds)
    const newTimestamp = currentTimestamp + 604800;
  
    // Set the next block timestamp
    await ethers.provider.send("evm_setNextBlockTimestamp", [newTimestamp]);
  
    // Withdraw stakes
    await tBillStaking.connect(user1).withdraw(stakeID);
  
    // Check user1's cUSD balance
    const user1cUSDBalance = await cUSDToken.balanceOf(user1.address);
    expect(user1cUSDBalance).to.equal(1045); // Maturity value minus service fee and penalty fee
  });

  it("should allow the owner to transfer ownership", async function () {
    // Transfer ownership to user2
    await tBillStaking.connect(owner).transferOwnership(user2.address);
  
    // Attempt to set the service fee as the original owner
    await expect(
      tBillStaking.connect(owner).setServiceFee(50)
    ).to.be.revertedWith("Only the owner can call this function");
  
    // Set the service fee as the new owner
    await tBillStaking.connect(user2).setServiceFee(50);
  
    // Verify the service fee was updated
    expect(await tBillStaking.serviceFee()).to.equal(50);
  });


  it("should allow only owner to withdraw all CUSD", async function () {
    // Transfer cUSD tokens to user1
    await cUSDToken.connect(owner).transfer(user1.address, 1000);

    // Transfer cUSD tokens to the tBillStakingContract contract
    await cUSDToken.connect(owner).transfer(tBillStaking.target, 2000);

    // Approve CUSD tokens from user1 to stakingContract
    await cUSDToken.connect(user1).approve(tBillStaking.target, 950);

     // Create byte32 of stakeID
    const stakeID= "Firststake"

     // Stake CUSD from user1 to stakingContract
    await tBillStaking.connect(user1).stake(950, 10, 1000,stakeID,7);

    // Get the current timestamp
    const currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

    // Increase the timestamp by one week (604800 seconds)
    const newTimestamp = currentTimestamp + 604800;

    // Set the next block timestamp
    await ethers.provider.send("evm_setNextBlockTimestamp", [newTimestamp]);

    // Check user1's cUSD balance
    const tbillcUSDBalance = await cUSDToken.balanceOf(tBillStaking.target);
    expect(tbillcUSDBalance).to.equal(2950);

    await expect( tBillStaking.connect(user1).withdrawYield()).to.be.revertedWith("Only the owner can call this function");

  });

});