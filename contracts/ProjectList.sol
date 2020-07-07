pragma solidity ^0.6.2;

import "./Project.sol";

contract ProjectList {

	mapping (uint => address) projects;

	constructor() public {
		
    }

	function getProjectAddress(uint prjId) public view returns (address) {
		return projects[prjId]; 
	}

	function setProjectAddress(uint prjId, address prjAddress) public {
		projects[prjId] = prjAddress;
	}

}
