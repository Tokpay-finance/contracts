// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./SafeMath.sol";

contract TBillStaking is ReentrancyGuard,ERC20 {
    using SafeMath for uint256;
    struct Stake {
        bytes32 stakeId;
        uint256 amount;
        uint256 maturityValue;
        uint256 maturityDate;
        uint256 yield;
    }


    IERC20 public cUSD;
    address public owner;
    uint256 public serviceFee; 
    uint256 public penaltyFee; 
    uint256 internal immutable SEVEN_DAYS = 7 days;


  
    mapping(address => Stake[]) internal stakes;

    constructor( address _cUSD)ERC20("TBILL Token", "TBILL") {
        _mint(msg.sender, 1000000);
        cUSD = ERC20(_cUSD);
        owner = msg.sender;
        serviceFee = 3;
        penaltyFee = 5;
    }

    function stake(
        uint256 _amount,
        uint256 _yield,
        uint256 _maturityValue,
        bytes32 _stakeId
    ) public nonReentrant {
        require(msg.sender != address(0), "Zero address not allowed");
        require(_amount > 0, "Stake amount must be greater than zero");
        uint256 currentTime = block.timestamp;
        uint256 sevenDaysLater = currentTime + SEVEN_DAYS;
  
        uint256 currentAllowance = cUSD.allowance(msg.sender, address(this));
        require(currentAllowance >= _amount, "Insufficient cUSD allowance");
        // Transfer cUSD tokens from user to this contract
        require(
            cUSD.transferFrom(msg.sender, address(this), _amount),
            "cUSD transfer failed"
        );
        // Get time to add from mapping

       
        

        Stake memory newStake = Stake({
            stakeId:_stakeId,
            amount: _amount,
            maturityValue: _maturityValue,
            maturityDate: sevenDaysLater,
            yield: _yield
        });

        stakes[msg.sender].push(newStake);
      _mint(msg.sender, _maturityValue);
    }


    function withdraw(bytes32 _stakeId) public nonReentrant {
        require(msg.sender != address(0), "Zero address not allowed");
        Stake[] storage userStakes = stakes[msg.sender];
        require(userStakes.length > 0, "No stakes to withdraw");

        uint256 gasLimit = gasleft();
        for (uint256 i = 0; i < userStakes.length && gasLimit > 21000; i++) {
             Stake storage staked = userStakes[i];
             require(staked.stakeId==_stakeId, "Stake with ID not found to withdraw");
 

            uint256 penaltyCharge = 0;
            if (staked.maturityDate > block.timestamp) {
                penaltyCharge  = calculatefees(
                    staked.maturityValue,
                    penaltyFee
                );
             
            }
            uint256 serviceCharge = calculatefees(staked.maturityValue, serviceFee);
            uint256 maturityValue = staked.maturityValue.sub(serviceCharge).sub(penaltyCharge);
    
            _burn(msg.sender, staked.maturityValue);
            // Swap the last element with the element being removed
            uint256 lastIndex = userStakes.length - 1;
            if (i != lastIndex) {
                userStakes[i] = userStakes[lastIndex];
            }
            // Pop the last element
            userStakes.pop();

     
            require(
                cUSD.transfer(msg.sender, maturityValue),
                "cUSD transfer failed"
            );

           
             
            gasLimit = gasleft();
        }
    }
   

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    function transferOwnership (address newOwner)external  onlyOwner{
        owner= newOwner;

    }

    function getStakes(address _user) public view returns (Stake[] memory) {
        return stakes[_user];
    }

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

    function setServiceFee(uint256 _fee) public onlyOwner {
        serviceFee = _fee;
    }


    function setPenaltyFee(uint256 _fee) public onlyOwner {
        penaltyFee = _fee;
    }

    function calculatefees(uint256 _maturityValue, uint256 _fee)
        internal
        pure
        returns (uint256)
    {
        uint256 fee = _maturityValue.mul(_fee).div(1000);
        return fee;
    }
}
