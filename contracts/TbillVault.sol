// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./SafeMath.sol";

/**
 * @title TBillStaking
 * @dev This contract allows users to stake their cUSD tokens and receive TBILL tokens in return.
 * Users can withdraw their staked tokens after a 7-day maturity period, subject to service and penalty fees.
 * The contract also provides functions to manage the service and penalty fees, as well as transfer ownership.
 */
contract TBillStaking is ReentrancyGuard, ERC20 {
    using SafeMath for uint256;

    // Structure to store staking details for each user
    struct Stake {
        bytes32 stakeId;  // Unique identifier for the stake
        uint256 amount;   // Amount of cUSD staked
        uint256 maturityValue; // Value of TBILL tokens to be received upon withdrawal
        uint256 maturityDate;  // Date when the stake matures and can be withdrawn
        uint256 yield;    // Yield rate for the stake
    }

    IERC20 public cUSD;   // ERC20 contract for the cUSD token
    address public owner; // Address of the contract owner
    uint256 public serviceFee; // Percentage fee charged for withdrawing a stake
    uint256 public penaltyFee; // Percentage fee charged for withdrawing a stake before maturity
    uint256 internal immutable SEVEN_DAYS = 7 days; // Duration of the staking period

    // Mapping to store the stakes for each user
    mapping(address => Stake[]) internal stakes;

    /**
     * @dev Constructor that initializes the contract with the cUSD token address,
     * mints 1,000,000 TBILL tokens to the contract owner, and sets the initial service and penalty fees.
     * @param _cUSD Address of the cUSD token contract
     */
    constructor(address _cUSD) ERC20("TBILL Token", "TBILL") {
        _mint(msg.sender, 1000000 *10 ** decimals());
        cUSD = ERC20(_cUSD);
        owner = msg.sender;
        serviceFee = 3;
        penaltyFee = 5;
    }

    /**
     * @dev Function that allows users to stake their cUSD tokens and receive TBILL tokens in return.
     * @param _amount Amount of cUSD tokens to be staked
     * @param _yield Yield rate for the stake
     * @param _maturityValue The value of TBILL tokens to be received upon withdrawal
     * @param _stakeId Unique identifier for the stake
     */
    function stake(uint256 _amount, uint256 _yield, uint256 _maturityValue, bytes32 _stakeId) public nonReentrant {
        // Perform input validations
        require(msg.sender != address(0), "Zero address not allowed");
        require(_amount > 0, "Stake amount must be greater than zero");

        // Calculate the maturity date for the stake (7 days from now)
        uint256 currentTime = block.timestamp;
        uint256 sevenDaysLater = currentTime + SEVEN_DAYS;

        // Check if the user has enough cUSD allowance for the staking amount
        uint256 currentAllowance = cUSD.allowance(msg.sender, address(this));
        require(currentAllowance >= _amount, "Insufficient cUSD allowance");

        // Transfer the cUSD tokens from the user to the contract
        require(cUSD.transferFrom(msg.sender, address(this), _amount), "cUSD transfer failed");

        // Create a new stake and add it to the user's stakes
        Stake memory newStake = Stake({
            stakeId: _stakeId,
            amount: _amount,
            maturityValue: _maturityValue,
            maturityDate: sevenDaysLater,
            yield: _yield
        });

        stakes[msg.sender].push(newStake);
        _mint(msg.sender, _maturityValue); // Mint the TBILL tokens to the user
    }

    /**
     * @dev Function that allows users to withdraw their staked cUSD and TBILL tokens.
     * If the stake is withdrawn before maturity, a penalty fee is charged.
     * @param _stakeId Unique identifier for the stake to be withdrawn
     */
    function withdraw(bytes32 _stakeId) public nonReentrant {
        require(msg.sender != address(0), "Zero address not allowed");
        Stake[] storage userStakes = stakes[msg.sender];
        require(userStakes.length > 0, "No stakes to withdraw");

        uint256 gasLimit = gasleft();
        for (uint256 i = 0; i < userStakes.length && gasLimit > 21000; i++) {
            Stake storage staked = userStakes[i];
            require(staked.stakeId == _stakeId, "Stake with ID not found to withdraw");

            // Calculate the penalty charge if the stake is withdrawn before maturity
            uint256 penaltyCharge = 0;
            if (staked.maturityDate > block.timestamp) {
                penaltyCharge = calculatefees(staked.maturityValue, penaltyFee);
            }

            // Calculate the service charge for the withdrawal
            uint256 serviceCharge = calculatefees(staked.maturityValue, serviceFee);

            // Calculate the final maturity value after deducting the fees
            uint256 maturityValue = staked.maturityValue.sub(serviceCharge).sub(penaltyCharge);

            // Burn the TBILL tokens held by the user
            _burn(msg.sender, staked.maturityValue);

            // Swap the last element with the element being removed
            uint256 lastIndex = userStakes.length - 1;
            if (i != lastIndex) {
                userStakes[i] = userStakes[lastIndex];
            }
            // Pop the last element
            userStakes.pop();

            // Transfer the maturity value (after fees) to the user
            require(cUSD.transfer(msg.sender, maturityValue), "cUSD transfer failed");

            gasLimit = gasleft();
        }
    }

    // Modifier to restrict access to the owner-only functions
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    /**
     * @dev Function to transfer ownership of the contract to a new address.
     * Can only be called by the current owner.
     * @param newOwner The new owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    /**
     * @dev Function to retrieve the stakes for a given user.
     * @param _user The address of the user whose stakes are to be retrieved
     * @return Stake[] memory The array of stakes for the specified user
     */
    function getStakes(address _user) public view returns (Stake[] memory) {
        return stakes[_user];
    }

    /**
     * @dev Function to retrieve a specific stake by its ID.
     * @param _stakeId The unique identifier of the stake to be retrieved
     * @return Stake memory The details of the specified stake
     */
    function getStakeByID(bytes32 _stakeId) public view returns (Stake memory) {
        require(msg.sender != address(0), "Zero address not allowed");
        Stake[] storage userStakes = stakes[msg.sender];
        require(userStakes.length > 0, "No stakes to withdraw");

        uint256 gasLimit = gasleft();
        for (uint256 i = 0; i < userStakes.length && gasLimit > 21000; i++) {
            Stake storage staked = userStakes[i];
            if (staked.stakeId == _stakeId) {
                return staked;
            }
            gasLimit = gasleft();
        }
        revert("Stake with ID not found");
    }

    /**
     * @dev Function to set the service fee for withdrawing a stake.
     * Can only be called by the contract owner.
     * @param _fee The new service fee percentage
     */
    function setServiceFee(uint256 _fee) public onlyOwner {
        serviceFee = _fee;
    }

    /**
     * @dev Function to set the penalty fee for withdrawing a stake before maturity.
     * Can only be called by the contract owner.
     * @param _fee The new penalty fee percentage
     */
    function setPenaltyFee(uint256 _fee) public onlyOwner {
        penaltyFee = _fee;
    }

    /**
     * @dev Internal function to calculate the fee based on the maturity value and the fee percentage.
     * @param _maturityValue The maturity value of the stake
     * @param _fee The fee percentage
     * @return uint256 The calculated fee amount
     */
    function calculatefees(uint256 _maturityValue, uint256 _fee) internal pure returns (uint256) {
        uint256 fee = _maturityValue.mul(_fee).div(1000);
        return fee;
    }
}