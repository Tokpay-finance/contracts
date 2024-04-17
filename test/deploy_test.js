const { expect } = require("chai");
const { ethers, utils } = require("hardhat");

describe("TBillStaking Deployment Test", () => {
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

  it("should revert on invalid input", async function () {
    // Assign a zero address
    const zero_address = "0x0000000000000000000000000000000000000000";

    // initialize an impersonating zero's account
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [zero_address],
    });

    //  make zero the signer
    const fakeSigner = await ethers.getSigner(zero_address);
    // Fund the zero address with 1 ether for gas
    await owner.sendTransaction({
      to: fakeSigner.address,
      value: ethers.parseEther("1.0"), // Sends exactly 1.0 ether
    });

    // create a byte32 stakeId
    const stakeID = ethers.encodeBytes32String("Firststake");

    // Attempt to stake zero amount
    await expect(
      tBillStaking.connect(fakeSigner).stake(950, 10, 1000, stakeID)
    ).to.be.revertedWith("Zero address not allowed");
  });
});
