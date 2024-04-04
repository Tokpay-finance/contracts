// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./TBILLToken.sol";
import "./SafeMath.sol";

contract TbillVault is ReentrancyGuard {
    using SafeMath for uint256;
    TBILLToken tToken;
    
    uint256 public liquidityToken;
    uint256 public yieldRate = 5 * 10 ** 16; // 0.5% represented in 18 decimal places
    uint256 public constant maturityDuration = 30 days;

    struct Staker {
        uint256 stakedAmount;
        uint256 yieldEarned;
        uint256 lastYieldUpdate;
        uint256 liquidityToken;
    }

    // Define a mapping to track the amount deposited by each user
    mapping(address => uint256) public userDeposits;
    mapping(address => Staker) public stakers;

    address[] public stakerAddresses;

    event Staked(address indexed account,uint256 amount, uint256 liquidityTokens, uint256 stakingTokensMinted );
    event Withdrawn(address indexed account,uint256 amount, uint256 liquidityTokens, uint256 stakingTokensBurned, uint256 yieldEarned);
    event YieldUpdated(uint256 newRate);


    constructor(address _tbillToken) {
        tToken = TBILLToken(_tbillToken);
    }

    function stake(uint256 amount) external payable nonReentrant {
        require(amount > 0, "Stake amount must be greater than zero");
        // Transfer TBILL tokens from user to this contract
        
        // Update staker's state
        Staker storage staker = stakers[msg.sender];
        staker.stakedAmount = staker.stakedAmount.add(amount);
        staker.lastYieldUpdate = block.timestamp;

        userDeposits[msg.sender] += amount;
        tToken.mint(msg.sender, amount);

        // Emit event
        emit Staked(msg.sender, amount, 0, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Withdrawal amount must be greater than zero");
        require(tToken.transferFrom(msg.sender, address(this), amount), "Token not approved.");
        require(stakers[msg.sender].stakedAmount >= amount, "Insufficient staked amount");
        Staker storage staker = stakers[msg.sender];
        
        uint256 yield = calculateYield(staker.stakedAmount,staker.lastYieldUpdate);
        // Update state before any external calls
        uint256 withdrawAmount = staker.stakedAmount.add(yield);
        staker.lastYieldUpdate = block.timestamp;
        // Calculate and transfer accrued yield
        
        staker.yieldEarned = withdrawAmount;

        // Transfer TBILL tokens to the user
        tToken.burn(msg.sender, amount);
        // Emit event
        emit Withdrawn(msg.sender, amount, 0, amount, yield);
    }

    function getStakeAmount(address stakerAddr) internal view returns(uint _staked){
        Staker storage _staker = stakers[stakerAddr];
        _staked = _staker.stakedAmount;
    }

    function calculateYield(uint256 initialStakedAmount, uint256 lastUpdateTimestamp) internal view returns (uint256) {
        uint256 stakedDuration = block.timestamp - lastUpdateTimestamp;
        if (stakedDuration >= maturityDuration) {
            return initialStakedAmount * yieldRate * stakedDuration /100;
        }
        return 0;
    }

    function calculateAndUpdateYield(address stakerAddress) internal nonReentrant {
        Staker storage staker = stakers[stakerAddress];
        require(staker.stakedAmount > 0, "Staker does not exist");

        uint256 yieldEarned = calculateYield(staker.stakedAmount, staker.lastYieldUpdate);
        staker.yieldEarned = staker.yieldEarned.add(yieldEarned);
        staker.lastYieldUpdate = block.timestamp;
    }

    function updateYield() internal nonReentrant {
        for (uint256 i = 0; i < stakerAddresses.length; i++) {
            calculateAndUpdateYield(stakerAddresses[i]);
        }
    }
}
