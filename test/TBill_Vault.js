const { expect } = require("chai");
const { ethers } = require("hardhat");
require("@atixlabs/hardhat-time-n-mine")

describe("TBillStaking", () => {
  let tBillStaking, tBillToken, cUSDToken, owner, user1, user2;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy cUSD token contract (you'll need to create this contract)
    const CUSDToken = await ethers.getContractFactory("CUSDToken");
    cUSDToken = await CUSDToken.deploy();

    // Deploy TBillStaking contract
    const TBillStaking = await ethers.getContractFactory("TBillStaking");
    tBillStaking = await TBillStaking.deploy(
      cUSDToken.target
    );

    tBillToken= tBillStaking;
  });

  it("should allow users to stake tokens", async function () {
    await cUSDToken.connect(owner).transfer(user1.address, 1000);
    // Approve cUSD tokens for user1
    await cUSDToken.connect(user1).approve(tBillStaking.target, 950);

    // Stake tokens
    await tBillStaking.connect(user1).stake(950, 10, 1000);

    // Check user1's stakes
    const user1Stakes = await tBillStaking.getStakes(user1.address);
    expect(user1Stakes.length).to.equal(1);
    expect(user1Stakes[0].amount).to.equal(950);
    expect(user1Stakes[0].maturityValue).to.equal(1000);
    expect(user1Stakes[0].yield).to.equal(10);
  });

  it("should reduce CUSD balance of user after staking", async function () {
    await cUSDToken.connect(owner).transfer(user1.address, 1000);

    // Check user1's cUSD balance
    const user1BeforecUSDBalance = await cUSDToken.balanceOf(user1.address);
    // Stake tokens for user1
    await cUSDToken.connect(user1).approve(tBillStaking.target, 950);
    await tBillStaking.connect(user1).stake(950, 10, 1000);

    // Check user1's cUSD balance
    const user1AftercUSDBalance = await cUSDToken.balanceOf(user1.address);
    expect(user1BeforecUSDBalance).to.not.equal(user1AftercUSDBalance); // Maturity value minus service fee
  });

  it("should mint TBILL token to user1", async function () {
    // Check user1's cUSD balance
    const user1BeforeTBILLTokenBalance = await tBillToken.balanceOf(
      user1.address
    );

   
    await cUSDToken.connect(owner).transfer(user1.address, 1000);

    
    // Stake tokens for user1
    await cUSDToken.connect(user1).approve(tBillStaking.target, 950);
    await tBillStaking.connect(user1).stake(950, 10, 1000);

    // Check user1's cUSD balance
    const user1AfterTBILLTokenBalance = await tBillToken.balanceOf(
      user1.address
    );

    expect(user1BeforeTBILLTokenBalance).to.not.equal(user1AfterTBILLTokenBalance);
    expect(user1AfterTBILLTokenBalance).to.equal(1000);
  });

  it("should update stake contract CUSD balance", async function () {
    await cUSDToken.connect(owner).transfer(user1.address, 1000);
    // Stake tokens for user1
    await cUSDToken.connect(user1).approve(tBillStaking.target, 950);
    await tBillStaking.connect(user1).stake(950, 10, 1000);
    const stakingcUSDBalance = await cUSDToken.balanceOf(tBillStaking.target);
    expect(stakingcUSDBalance).to.equal(950);
  });

  it("should allow users to withdraw their stakes", async function () {
   

    await cUSDToken.connect(owner).transfer(user1.address, 1000);


    await cUSDToken.connect(owner).transfer(tBillStaking.target, 2000);
    // Stake tokens for user1
    await cUSDToken.connect(user1).approve(tBillStaking.target, 950);
    await tBillStaking.connect(user1).stake(950, 10, 1000);


    // Get the current timestamp
    const currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

    // Increase the timestamp by one day (86400 seconds)
    const newTimestamp = currentTimestamp + 604800;

    // Set the next block timestamp
    await ethers.provider.send("evm_setNextBlockTimestamp", [newTimestamp]);

    // Withdraw stakes
    await tBillStaking.connect(user1).withdraw();
    const user1cUSDBalance = await cUSDToken.balanceOf(user1.address);
    expect(user1cUSDBalance).to.equal(1047); // Maturity value minus service fee
  });

  it("should penalize withdrawal before maturity date", async function () {
    await cUSDToken.connect(owner).transfer(user1.address, 1000);

    await cUSDToken.connect(owner).transfer(tBillStaking.target, 2000);
    // Stake tokens for user1
    await cUSDToken.connect(user1).approve(tBillStaking.target, 950);
    await tBillStaking.connect(user1).stake(950, 10, 1000);

    // Withdraw stakes
    await tBillStaking.connect(user1).withdraw();

    // Check user1's cUSD balance
    const user1cUSDBalance = await cUSDToken.balanceOf(user1.address);
    console.log(user1cUSDBalance)
    expect(user1cUSDBalance).to.equal(1047); // Maturity value minus service fee
  });

  it("should burn TBILLToken after withdrawal", async function () {
    await cUSDToken.connect(owner).transfer(user1.address, 1000);

    await cUSDToken.connect(owner).transfer(tBillStaking.target, 2000);
    // Stake tokens for user1
    await cUSDToken.connect(user1).approve(tBillStaking.target, 1000);
    await tBillStaking.connect(user1).stake(950,  10, 1000);

    const user1BeforeTBILLTokenBalance = await tBillToken.balanceOf(
      user1.address
    );
   
    expect(user1BeforeTBILLTokenBalance).to.equal(1000);

    // Get the current timestamp
    const currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

    // Increase the timestamp by one day (86400 seconds)
    const newTimestamp = currentTimestamp + 604800;

    // Set the next block timestamp
    await ethers.provider.send("evm_setNextBlockTimestamp", [newTimestamp]);
    // Withdraw stakes
   
    await tBillStaking.connect(user1).withdraw();

    const user1AfterTBILLTokenBalance = await tBillToken.balanceOf(
      user1.address
    );

    expect(user1AfterTBILLTokenBalance).to.equal(0);

    // Check user1's cUSD balance
    const user1cUSDBalance = await cUSDToken.balanceOf(user1.address);
    expect(user1cUSDBalance).to.equal(1047); // Maturity value minus service fee
  });

  // Add more test cases as needed
});
