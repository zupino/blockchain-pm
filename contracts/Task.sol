pragma solidity ^0.6.2;

contract Task {

	uint	id;
	// TODO not necessary, just for now
	string 	name;
	// 0: new           3: closed
	// 1: accepted      4: cancelled
	// 2: resolved      5: onhold

	uint	status; 
	address	project;
	address	assignee;
	address	oracle;

	uint deadlineAssignment;    // unix epoch timestamp of deadline
	uint deadlineDelivery;      // unix epoch timestamp of delivery
	uint compensationOracle;
	uint compensationAssignee;  // estimated compensation
	uint depositOracle;         // Oracle lock a deposit until task is completed
	uint depositAssignee;       // Assignee too


	constructor(string memory _name, address _project, uint _id) public {
		name = _name;
		id = _id;
		project = _project;
	}

}
