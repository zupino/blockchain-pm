pragma solidity ^0.6.2;

contract Task {

	uint 	id;
	address	project;
	address	assignee;
	address	oracle;
	
	// TODO might not be necessary
	string	name;

	constructor(string memory _name, address _project, uint _id) public {
		name = _name;
		id = _id;
		project = _project;
	}

}
