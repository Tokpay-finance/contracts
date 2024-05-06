const { expect } = require("chai");
const { ethers } = require("hardhat");

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

    // Create  the stakeId for the stake transaction
    const stakeID = "Firststake";

    // Revert as failed for a zero amount
    await expect(
      tBillStaking.connect(user1).stake(0, 10, 1000, stakeID, 7)
    ).to.be.revertedWith("Stake amount must be greater than zero");
  });

  it("should allow users to stake tokens", async function () {
    // Transfer cUSD tokens to user1
    await cUSDToken.connect(owner).transfer(user1.address, 1000);

    // Approve cUSD tokens for user1 to be used by the TBillStaking contract
    await cUSDToken.connect(user1).approve(tBillStaking.target, 950);

    // Create the stakeId for the stake transaction
    const stakeID = "Firststake";

    // Stake tokens for user1
    await tBillStaking.connect(user1).stake(950, 10, 1000, stakeID, 7);

    // Check user1's stakes
    const user1Stakes = await tBillStaking.connect(user1).getStakes();

    expect(user1Stakes.length).to.equal(1);
    expect(user1Stakes[0].amount).to.equal(950);
    expect(user1Stakes[0].maturityValue).to.equal(1000);
    expect(user1Stakes[0].yield).to.equal(10);
  });


  it("should allow users to get stake by stake id", async function () {
    // Transfer cUSD tokens to user1
    await cUSDToken.connect(owner).transfer(user1.address, 1000);

    // Approve cUSD tokens for user1 to be used by the TBillStaking contract
    await cUSDToken.connect(user1).approve(tBillStaking.target, 950);

    // Create a byte32 string of the stakeId for the stake transaction
    const stakeID = "Firststake";

    // Stake tokens for user1
    await tBillStaking.connect(user1).stake(950, 10, 1000, stakeID, 7);

    // Check user1's stakes
    const user1Stakes = await tBillStaking.connect(user1).getStakeByID(stakeID);
    expect(user1Stakes).to.equal(stakeID);
 
  });

  it("should reduce CUSD balance of user after staking", async function () {
    // Transfer cUSD tokens to user1
    await cUSDToken.connect(owner).transfer(user1.address, 1000);

    // Check user1's cUSD balance
    const user1BeforecUSDBalance = await cUSDToken.balanceOf(user1.address);

    // Approve Stake tokens for user1
    await cUSDToken.connect(user1).approve(tBillStaking.target, 950);

    // Create the stakeId for the stake transaction
    const stakeID = "Firststake";

    // Stake tokens for user1
    await tBillStaking.connect(user1).stake(950, 10, 1000, stakeID, 7);

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

    // Create the stakeId for the stake transaction
    const stakeID = "Firststake";

    // Stake tokens for user1
    await tBillStaking.connect(user1).stake(950, 10, 1000, stakeID, 7);

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

    // Create the stakeId for the stake transaction
    const stakeID = "Firststake";

    // Stake tokens for user1
    await tBillStaking.connect(user1).stake(950, 10, 1000, stakeID, 7);

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

    // Create the stakeId for the stake transaction
    const stakeID = "Firststake";

    // Stake tokens for user1
    await tBillStaking.connect(user1).stake(950, 10, 1000, stakeID, 7);

    // Approve another tokens for user1
    await cUSDToken.connect(user1).approve(tBillStaking.target, 500);

    // Create the stakeId for another stake transaction
    const stakeID2 = "Secondstake";

    // Stake another tokens for user1
    await tBillStaking.connect(user1).stake(500, 5, 1500, stakeID2, 7);

    // Check user1's stakes
    const user1Stakes = await tBillStaking.connect(user1).getStakes();
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

  it("should allow users to stake multiple periods", async function () {
    // Transfer cUSD tokens to user1
    await cUSDToken.connect(owner).transfer(user1.address, 2000);

    // Approve Stake tokens for user1
    await cUSDToken.connect(user1).approve(tBillStaking.target, 950);

    // Create the stakeId for the stake transaction
    const stakeID = "Firststake";

    // Stake tokens for user1
    await tBillStaking.connect(user1).stake(950, 10, 1000, stakeID, 7);

    // Approve another tokens for user1
    await cUSDToken.connect(user1).approve(tBillStaking.target, 500);

    // Create the stakeId for another stake transaction
    const stakeID2 = "Secondstake";

    // Stake another tokens for user1
    await tBillStaking.connect(user1).stake(500, 5, 1500, stakeID2, 6);

    // Check user1's stakes
    const user1Stakes = await tBillStaking.connect(user1).getStakes();
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
  it("should allow users to stake on all periods", async function () {
    // Transfer cUSD tokens to user1
    await cUSDToken.connect(owner).transfer(user1.address, 2000);

    // Approve Stake tokens for user1
    await cUSDToken.connect(user1).approve(tBillStaking.target, 1000);

    // Create the stakeId for the one week stake transaction
    const stakeID = "Firststake";

    // Stake tokens for user1
    await tBillStaking.connect(user1).stake(150, 10, 200, stakeID, 7);

    // Create the one month stakeId for another stake transaction
    const stakeID2 = "Secondstake";

    // Stake another tokens for user1
    await tBillStaking.connect(user1).stake(450, 5, 500, stakeID2, 1);

    // Create the three months stakeId for another stake transaction
    const stakeID3 = "Thirdstake";

    // Stake another tokens for user1
    await tBillStaking.connect(user1).stake(150, 5, 200, stakeID3, 3);

    // Create the six months stakeId for another stake transaction
    const stakeID4 = "Fourthstake";

    // Stake another tokens for user1
    await tBillStaking.connect(user1).stake(250, 5, 300, stakeID4, 6);

    // Check user1's stakes
    const user1Stakes = await tBillStaking.connect(user1).getStakes();
    expect(user1Stakes.length).to.equal(4);
    expect(user1Stakes[0].amount).to.equal(150);
    expect(user1Stakes[0].maturityValue).to.equal(200);
    expect(user1Stakes[0].yield).to.equal(10);
    expect(user1Stakes[1].amount).to.equal(450);
    expect(user1Stakes[1].maturityValue).to.equal(500);
    expect(user1Stakes[1].yield).to.equal(5);
    expect(user1Stakes[2].amount).to.equal(150);
    expect(user1Stakes[2].maturityValue).to.equal(200);
    expect(user1Stakes[2].yield).to.equal(5);
    expect(user1Stakes[3].amount).to.equal(250);
    expect(user1Stakes[3].maturityValue).to.equal(300);
    expect(user1Stakes[3].yield).to.equal(5);

    // Check user1's TBILL token balance to be equal to sum of expected returns
    const user1TBILLBalance = await tBillToken.balanceOf(user1.address);
    expect(user1TBILLBalance).to.equal(1200);
  });

  it("should confirm that a one week stake period is accurate", async function () {
    // Transfer cUSD tokens to user1
    await cUSDToken.connect(owner).transfer(user1.address, 2000);

    // Approve Stake tokens for user1
    await cUSDToken.connect(user1).approve(tBillStaking.target, 1000);

    // Create the stakeId for the one week stake transaction
    const stakeID = "Firststake";
    // Get the current timestamp
    const currentTimestamp = (await ethers.provider.getBlock("latest"))
      .timestamp;
    // Increase the timestamp by one week (604800 seconds) +1 seconds to account for the time lapse in execution
    const newTimestamp = currentTimestamp + 604801;

    // Stake tokens for user1
    await expect(tBillStaking.connect(user1).stake(150, 10, 200, stakeID, 7))
      .to.emit(tBillStaking, "Staked")
      .withArgs(stakeID, 10, 150, 200, user1.address, newTimestamp);
  });
  it("should confirm that a one month stake period is accurate", async function () {
    // Transfer cUSD tokens to user1
    await cUSDToken.connect(owner).transfer(user1.address, 2000);

    // Approve Stake tokens for user1
    await cUSDToken.connect(user1).approve(tBillStaking.target, 1000);

    // Create the stakeId for the one week stake transaction
    const stakeID = "Firststake";
    // Get the current timestamp
    const currentTimestamp = (await ethers.provider.getBlock("latest"))
      .timestamp;
    // Get one month timestamp (2419200 seconds) +1 seconds to account for the time lapse in execution
    const newTimestamp = currentTimestamp + 2419201;

    // Stake tokens for user1
    await expect(tBillStaking.connect(user1).stake(150, 10, 200, stakeID, 1))
      .to.emit(tBillStaking, "Staked")
      .withArgs(stakeID, 10, 150, 200, user1.address, newTimestamp);
  });

  it("should confirm that a three month stake period is accurate", async function () {
    // Transfer cUSD tokens to user1
    await cUSDToken.connect(owner).transfer(user1.address, 2000);

    // Approve Stake tokens for user1
    await cUSDToken.connect(user1).approve(tBillStaking.target, 1000);

    // Create the stakeId for the one week stake transaction
    const stakeID = "Firststake";
    // Get the current timestamp
    const currentTimestamp = (await ethers.provider.getBlock("latest"))
      .timestamp;
    // Get three month timestamp (7257600 seconds) +1 seconds to account for the time lapse in execution
    const newTimestamp = currentTimestamp + 7257601;

    // Stake tokens for user1
    await expect(tBillStaking.connect(user1).stake(150, 10, 200, stakeID, 3))
      .to.emit(tBillStaking, "Staked")
      .withArgs(stakeID, 10, 150, 200, user1.address, newTimestamp);
  });

  it("should confirm that a six month stake period is accurate", async function () {
    // Transfer cUSD tokens to user1
    await cUSDToken.connect(owner).transfer(user1.address, 2000);

    // Approve Stake tokens for user1
    await cUSDToken.connect(user1).approve(tBillStaking.target, 1000);

    // Create the stakeId for the one week stake transaction
    const stakeID = "Firststake";
    // Get the current timestamp
    const currentTimestamp = (await ethers.provider.getBlock("latest"))
      .timestamp;
    // Get six month timestamp (14515200 seconds) +1 seconds to account for the time lapse in execution
    const newTimestamp = currentTimestamp + 14515201;

    // Stake tokens for user1
    await expect(tBillStaking.connect(user1).stake(150, 10, 200, stakeID, 6))
      .to.emit(tBillStaking, "Staked")
      .withArgs(stakeID, 10, 150, 200, user1.address, newTimestamp);
  });
});
