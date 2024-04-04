// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TBILLToken is ERC20 {

    constructor() ERC20("TBILL Token", "TBILL") {
        _mint(msg.sender, 1000000000 * 10 **(decimals()));
    }

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external {
        _burn(account, amount);
    }
}