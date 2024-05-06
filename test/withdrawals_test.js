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

    // Create stakeID
    const stakeID = "Firststake";

    // Stake CUSD from user1 to stakingContract
    await tBillStakingContract.connect(user1).stake(950, 10, 1000, stakeID, 7);

    // Get the current timestamp
    const currentTimestamp = (await ethers.provider.getBlock("latest"))
      .timestamp;

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
    // Create the stakeId for the stake transaction
    const stakeID = "Firststake";
    await tBillStakingContract.connect(user1).stake(950, 10, 1000, stakeID, 7);

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
    const stakeID = "Firststake";
    await tBillStakingContract.connect(user1).stake(950, 10, 1000, stakeID, 7);

    // Check user1's TBILL token balance before withdrawal
    const user1BeforeTBILLTokenBalance = await tBillToken.balanceOf(
      user1.address
    );

    expect(user1BeforeTBILLTokenBalance).to.equal(1000);

    // Get the current timestamp
    const currentTimestamp = (await ethers.provider.getBlock("latest"))
      .timestamp;

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
    await cUSDToken.connect(owner).transfer(user1.address, 1900);

    // Transfer cUSD tokens to the tBillStakingContract contract
    await cUSDToken.connect(owner).transfer(tBillStakingContract.target, 40000);

    // Stake tokens for user1 multiple times
    await cUSDToken.connect(user1).approve(tBillStakingContract.target, 1900);
    const stakeID = "Firststake";
    const stakeID2 = "Secondstake";
    await tBillStakingContract.connect(user1).stake(1450, 10, 1500, stakeID, 7);
    await tBillStakingContract.connect(user1).stake(450, 5, 500, stakeID2, 7);

    // Get the current timestamp
    const currentTimestamp = (await ethers.provider.getBlock("latest"))
      .timestamp;

    // Increase the timestamp by one week (604800 seconds)
    const newTimestamp = currentTimestamp + 604800;

    // Set the next block timestamp
    await ethers.provider.send("evm_setNextBlockTimestamp", [newTimestamp]);
    // Check user1's TBILL token balance
    const user1TBILLBalance = await tBillToken.balanceOf(user1.address);
    expect(user1TBILLBalance).to.equal(2000);

    const beforeWithdrawuser1cUSDBalance = await cUSDToken.balanceOf(
      user1.address
    );
    expect(beforeWithdrawuser1cUSDBalance).to.equal(0);

    // Withdraw from multiple stakes
    await tBillStakingContract.connect(user1).withdraw(stakeID);

    // Check user1's cUSD balance
    const user1cUSDBalance = await cUSDToken.balanceOf(user1.address);
    expect(user1cUSDBalance).to.equal(1496); // Maturity value minus service fee

    const newuser1TBILLBalance = await tBillToken.balanceOf(user1.address);
    expect(newuser1TBILLBalance).to.equal(500);
    await tBillStakingContract.connect(user1).withdraw(stakeID2);
    // Check user1's cUSD balance
    const updateduser1cUSDBalance = await cUSDToken.balanceOf(user1.address);
    expect(updateduser1cUSDBalance).to.equal(1995); // Maturity value minus service fee

    const latestuser1TBILLBalance = await tBillToken.balanceOf(user1.address);
    expect(latestuser1TBILLBalance).to.equal(0);
  });

  it("should allow users to withdraw from multiple stakes of different periods", async function () {
    // Transfer cUSD tokens to user1
    await cUSDToken.connect(owner).transfer(user1.address, 1900);

    // Transfer cUSD tokens to the tBillStakingContract contract
    await cUSDToken.connect(owner).transfer(tBillStakingContract.target, 40000);

    // Stake tokens for user1 multiple times
    await cUSDToken.connect(user1).approve(tBillStakingContract.target, 1900);
    const stakeID = "Firststake";
    const stakeID2 = "Secondstake";
    //Make a one week duration stake
    await tBillStakingContract.connect(user1).stake(1450, 10, 1500, stakeID, 7);

    //Make a one month duration stake
    await tBillStakingContract.connect(user1).stake(450, 5, 500, stakeID2, 1);

    // Get the current timestamp
    const currentTimestamp = (await ethers.provider.getBlock("latest"))
      .timestamp;

    // Increase the timestamp by one week (604800 seconds)
    const newTimestamp = currentTimestamp + 604800;

    // Set the next block timestamp
    await ethers.provider.send("evm_setNextBlockTimestamp", [newTimestamp]);
    // Check user1's TBILL token balance
    const user1TBILLBalance = await tBillToken.balanceOf(user1.address);
    expect(user1TBILLBalance).to.equal(2000);

    const beforeWithdrawuser1cUSDBalance = await cUSDToken.balanceOf(
      user1.address
    );
    expect(beforeWithdrawuser1cUSDBalance).to.equal(0);

    // Withdraw from multiple stakes
    await tBillStakingContract.connect(user1).withdraw(stakeID);

    // Check user1's cUSD balance
    const user1cUSDBalance = await cUSDToken.balanceOf(user1.address);
    expect(user1cUSDBalance).to.equal(1496); // Maturity value minus service fee

    const newuser1TBILLBalance = await tBillToken.balanceOf(user1.address);
    expect(newuser1TBILLBalance).to.equal(500);

    // Increase the timestamp by one month (2419200 seconds)
    const newTimestampInOneMonth = currentTimestamp + 2419200;

    // Set the next block timestamp
    await ethers.provider.send("evm_setNextBlockTimestamp", [
      newTimestampInOneMonth,
    ]);
    await tBillStakingContract.connect(user1).withdraw(stakeID2);
    // Check user1's cUSD balance
    const updateduser1cUSDBalance = await cUSDToken.balanceOf(user1.address);
    expect(updateduser1cUSDBalance).to.equal(1995); // Maturity value minus service fee

    const latestuser1TBILLBalance = await tBillToken.balanceOf(user1.address);
    expect(latestuser1TBILLBalance).to.equal(0);
  });

  it("should withdraw all CUSD to owner wallet", async function () {
    // Transfer cUSD tokens to user1
    await cUSDToken.connect(owner).transfer(user1.address, 1000);

    // Transfer cUSD tokens to the tBillStakingContract contract
    await cUSDToken.connect(owner).transfer(tBillStakingContract.target, 2000);

    // Approve CUSD tokens from user1 to stakingContract
    await cUSDToken.connect(user1).approve(tBillStakingContract.target, 950);

    // Create stakeID
    const stakeID = "Firststake";

    // Stake CUSD from user1 to stakingContract
    await tBillStakingContract.connect(user1).stake(950, 10, 1000, stakeID, 7);

    // Get the current timestamp
    const currentTimestamp = (await ethers.provider.getBlock("latest"))
      .timestamp;

    // Increase the timestamp by one week (604800 seconds)
    const newTimestamp = currentTimestamp + 604800;

    // Set the next block timestamp
    await ethers.provider.send("evm_setNextBlockTimestamp", [newTimestamp]);

    // Check user1's cUSD balance
    const tbillcUSDBalance = await cUSDToken.balanceOf(
      tBillStakingContract.target
    );
    expect(tbillcUSDBalance).to.equal(2950);

    await tBillStakingContract.connect(owner).withdrawYield();

    const tbillcUSDBalanceAfter = await cUSDToken.balanceOf(
      tBillStakingContract.target
    );
    expect(tbillcUSDBalanceAfter).to.equal(0);
  });
});
