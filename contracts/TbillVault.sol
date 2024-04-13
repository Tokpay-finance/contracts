// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./TBILLToken.sol";
import "./SafeMath.sol";

contract TbillVault is ReentrancyGuard {
    
    using SafeMath for uint256;
    TBILLToken tToken;
    address public owner;
    ERC20 cUSDToken; // Update to ERC20 type
    uint256 public cToken;
    uint256 public liquidityToken;
    uint256 public yieldRate = 5 * 10 ** 16; // 0.5% represented in 18 decimal places
    uint256 public constant maturityDuration = 30 days;
   //mapping(uint8 => uint256) public monthsToSeconds;

    struct Staker {
        uint256 stakedAmount;
        uint256 yieldEarned;
        uint256 lastYieldUpdate;
        uint256 liquidityToken;
    }

    // Define a mapping to track the amount deposited by each user
    mapping(address => uint256) public userDeposits;
    mapping(address => Staker) public stakers;
    mapping(address => mapping(address => uint256)) public allowances; // Mapping for allowances

    address[] public stakerAddresses;

    event Staked(address indexed account,uint256 amount, uint256 liquidityTokens, uint256 stakingTokensMinted );
    event Withdrawn(address indexed account,uint256 amount, uint256 liquidityTokens, uint256 stakingTokensBurned, uint256 yieldEarned);
    event YieldUpdated(uint256 newRate);
    event Approval(address indexed owner, address indexed spender, uint256 value); // Event for Approval

    constructor(address _tbillToken, address _cUSDToken) {
        tToken = TBILLToken(_tbillToken);
        cUSDToken = ERC20(_cUSDToken); // Initialize cUSD token contract
        owner = msg.sender; // Set the deployer as the owner

       //monthsToSeconds[1] = 2626560;  // One month
       // monthsToSeconds[3] = 7879680;  // Three months
       // monthsToSeconds[6] = 15759360; // Six months
    }


//TODO Add the logic for the parameters
//change the variable name lastYieldUpdate to yield because the yield cannot be updated
/**
 * @param amount 
 * @param duration  // The duration will come as 30 for 1 month, 90 for 3 months 180 for 6 months
 * @param yield 
 * @param maturityValue // This is the value the staker will recieve after duration is completed
 */
    function stake(uint256 amount,uint8 duration,uint256 yield, uint256 maturityValue) external payable nonReentrant {
        require(amount > 0, "Stake amount must be greater than zero");


       // Validate input
       // require(monthsToSeconds[duration] > 0, "Supported values are 1, 3, and 6 months.");
       // Get time to add from mapping
       // uint256 timeToAdd = monthsToSeconds[duration];

       // Get current timestamp
       // uint256 currentTime = block.timestamp;

    // Calculate future timestamp
    uint256 futureTime = currentTime.add(timeToAdd);
        // Transfer cUSD tokens from user to this contract
        require(cUSDToken.transferFrom(msg.sender, address(this), amount), "cUSD transfer failed");
        
        // Update staker's state
        Staker storage staker = stakers[msg.sender];
        staker.stakedAmount = staker.stakedAmount.add(amount);
        staker.lastYieldUpdate = block.timestamp; //change the value to yield param

        //staker.stakeDuration = currentTime.add(timeToAdd);
        //staker.maturityValue = maturityValue;

        userDeposits[msg.sender] += amount;
        tToken.mint(msg.sender, amount);

        // Emit event
        emit Staked(msg.sender, amount, 0, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Withdrawal amount must be greater than zero");
        require(stakers[msg.sender].stakedAmount >= amount, "Insufficient staked amount");
        Staker storage staker = stakers[msg.sender];
        
        uint256 yield = calculateYield(staker.stakedAmount, staker.lastYieldUpdate);
        // Update state before any external calls
        uint256 withdrawAmount = amount;
        staker.stakedAmount = staker.stakedAmount.sub(amount); // Adjust staked amount
        uint256 totalWithdrawAmount = withdrawAmount + yield;

        // Update yieldEarned
        staker.yieldEarned = staker.yieldEarned.add(yield);
        staker.lastYieldUpdate = block.timestamp; // Update last yield update timestamp

        // Transfer accrued yield along with the withdrawal amount
        require(cUSDToken.transfer(msg.sender, totalWithdrawAmount), "cUSD transfer failed");

        // Emit event
        emit Withdrawn(msg.sender, withdrawAmount, 0, withdrawAmount, yield);
    }

    function getStakeAmount(address stakerAddr) internal view returns(uint _staked){
        Staker storage _staker = stakers[stakerAddr];
        _staked = _staker.stakedAmount;
    }

    // function transferOwner(address newOwner) external onlyOwner {
    //     require(newOwner != address(0), "Invalid new owner address");
    //     owner = newOwner;
    // }

    function updateYield() internal nonReentrant {
        uint256 gasLeft = gasleft(); 
        for (uint256 i = 0; i < stakerAddresses.length; i++) {
            calculateAndUpdateYield(stakerAddresses[i]);
            if (gasleft() < gasLeft / 10) // Check if gas is running low
                break;
        }
    }

    function calculateYield(uint256 initialStakedAmount, uint256 lastUpdateTimestamp) internal view returns (uint256) {
        uint256 stakedDuration = block.timestamp - lastUpdateTimestamp;
        if (stakedDuration >= maturityDuration) {
            return initialStakedAmount * yieldRate * stakedDuration / 1 days;
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

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool) {
        require(allowances[sender][msg.sender] >= amount, "Insufficient allowance");
        allowances[sender][msg.sender] -= amount;
        _transfer(sender, recipient, amount);
        return true;
    }

    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "Transfer from the zero address");
        require(recipient != address(0), "Transfer to the zero address");

        uint256 senderBalance = cUSDToken.balanceOf(sender);
        require(senderBalance >= amount, "Insufficient balance");

        cUSDToken.transfer(recipient, amount);
    }
}
