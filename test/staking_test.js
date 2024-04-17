const { expect } = require("chai");
const { ethers } = require("hardhat");
require("@atixlabs/hardhat-time-n-mine");

describe("TBillStaking Staking Test", () => {
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

  it("should fail if users stakes 0 amount", async function () {
    // Transfer cUSD tokens to user1
    await cUSDToken.connect(owner).transfer(user1.address, 1000);

    // Approve cUSD tokens for user1 to be used by the TBillStaking contract
    await cUSDToken.connect(user1).approve(tBillStaking.target, 950);

    // Create a byte32 string of the stakeId for the stake transaction
    const stakeID = ethers.encodeBytes32String("Firststake");

    // Revert as failed for a zero amount
    await expect(
      tBillStaking.connect(user1).stake(0, 10, 1000, stakeID)
    ).to.be.revertedWith("Stake amount must be greater than zero");
  });

  it("should allow users to stake tokens", async function () {
    // Transfer cUSD tokens to user1
    await cUSDToken.connect(owner).transfer(user1.address, 1000);

    // Approve cUSD tokens for user1 to be used by the TBillStaking contract
    await cUSDToken.connect(user1).approve(tBillStaking.target, 950);

    // Create a byte32 string of the stakeId for the stake transaction
    const stakeID = ethers.encodeBytes32String("Firststake");

    // Stake tokens for user1
    await tBillStaking.connect(user1).stake(950, 10, 1000, stakeID);

    // Check user1's stakes
    const user1Stakes = await tBillStaking.getStakes(user1.address);

    expect(user1Stakes.length).to.equal(1);
    expect(user1Stakes[0].amount).to.equal(950);
    expect(user1Stakes[0].maturityValue).to.equal(1000);
    expect(user1Stakes[0].yield).to.equal(10);
  });

  it("should reduce CUSD balance of user after staking", async function () {
    // Transfer cUSD tokens to user1
    await cUSDToken.connect(owner).transfer(user1.address, 1000);

    // Check user1's cUSD balance
    const user1BeforecUSDBalance = await cUSDToken.balanceOf(user1.address);

    // Approve Stake tokens for user1
    await cUSDToken.connect(user1).approve(tBillStaking.target, 950);

    // Create a byte32 string of the stakeId for the stake transaction
    const stakeID = ethers.encodeBytes32String("Firststake");

    // Stake tokens for user1
    await tBillStaking.connect(user1).stake(950, 10, 1000, stakeID);

    // Check user1's cUSD balance
    const user1AftercUSDBalance = await cUSDToken.balanceOf(user1.address);

    // Verify that the balance has reduced
    expect(user1BeforecUSDBalance).to.not.equal(user1AftercUSDBalance);
  });

  it("should mint TBILL token to user1", async function () {
    // Get user1's TBILLToken balance before begining transaction
    const user1BeforeTBILLTokenBalance = await tBillToken.balanceOf(
      user1.address
    );

    // Transfer cUSD tokens to user1
    await cUSDToken.connect(owner).transfer(user1.address, 1000);

    // Approve Stake tokens for user1
    await cUSDToken.connect(user1).approve(tBillStaking.target, 950);

    // Create a byte32 string of the stakeId for the stake transaction
    const stakeID = ethers.encodeBytes32String("Firststake");

    // Stake tokens for user1
    await tBillStaking.connect(user1).stake(950, 10, 1000, stakeID);

    // Get user1's Tbill balance after the transaction
    const user1AfterTBILLTokenBalance = await tBillToken.balanceOf(
      user1.address
    );

    // Verify that TBILLTokens have been minted to user1 address by comparing
    expect(user1BeforeTBILLTokenBalance).to.not.equal(
      user1AfterTBILLTokenBalance
    );

    // Verify that TBILLTokens minted to user1 address is excatly the amount of ROI for the stake
    expect(user1AfterTBILLTokenBalance).to.equal(1000);
  });

  it("should update stake contract CUSD balance", async function () {
    // Transfer cUSD tokens to user1
    await cUSDToken.connect(owner).transfer(user1.address, 1000);

   // Approve Stake tokens for user1
    await cUSDToken.connect(user1).approve(tBillStaking.target, 950);

    // Create a byte32 string of the stakeId for the stake transaction
    const stakeID = ethers.encodeBytes32String("Firststake");

    // Stake tokens for user1
    await tBillStaking.connect(user1).stake(950, 10, 1000, stakeID);

    // Check the TBillStaking contract's cUSD balance
    const stakingcUSDBalance = await cUSDToken.balanceOf(tBillStaking.target);

    //Verify that it is now updated to the staked amount
    expect(stakingcUSDBalance).to.equal(950);
  });

  it("should allow users to stake multiple times", async function () {
    // Transfer cUSD tokens to user1
    await cUSDToken.connect(owner).transfer(user1.address, 2000);

     // Approve Stake tokens for user1
    await cUSDToken.connect(user1).approve(tBillStaking.target, 950);

       // Create a byte32 string of the stakeId for the stake transaction
    const stakeID = ethers.encodeBytes32String("Firststake");

    // Stake tokens for user1
    await tBillStaking.connect(user1).stake(950, 10, 1000, stakeID);

  // Approve another tokens for user1
    await cUSDToken.connect(user1).approve(tBillStaking.target, 500);

       // Create a byte32 string of the stakeId for another stake transaction
    const stakeID2 = ethers.encodeBytes32String("Secondstake");

    // Stake another tokens for user1
    await tBillStaking.connect(user1).stake(500, 5, 1500, stakeID2);

    // Check user1's stakes
    const user1Stakes = await tBillStaking.getStakes(user1.address);
    expect(user1Stakes.length).to.equal(2);
    expect(user1Stakes[0].amount).to.equal(950);
    expect(user1Stakes[0].maturityValue).to.equal(1000);
    expect(user1Stakes[0].yield).to.equal(10);
    expect(user1Stakes[1].amount).to.equal(500);
    expect(user1Stakes[1].maturityValue).to.equal(1500);
    expect(user1Stakes[1].yield).to.equal(5);

    // Check user1's TBILL token balance to be equal to sum of expected returns
    const user1TBILLBalance = await tBillToken.balanceOf(user1.address);
    expect(user1TBILLBalance).to.equal(2500);
  });
});
