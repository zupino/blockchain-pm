pragma solidity ^0.6.2;

import "./token/ERC20/ERC20.sol";

contract Drop is ERC20 {

	constructor(uint256 initialSupply) ERC20("Drop", "DRP") public {
		// Initial supply of token is assigned to contract deployer
        _mint(msg.sender, initialSupply);
    }

}
