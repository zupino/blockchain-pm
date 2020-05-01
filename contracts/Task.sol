pragma solidity ^0.6.2;

contract Task {

	uint	id;
	// TODO not necessary, just for now
	string 	name;
	// 0: new           3: closed
	// 1: accepted      4: cancelled
	// 2: resolved      5: onhold

	uint public 	status; 
	address			project;
	address	public	assignee;
	address	public	oracle;

	uint deadlineAssignment;    // unix epoch timestamp of deadline
	uint deadlineDelivery;      // unix epoch timestamp of delivery
	uint public compensationOracle;
	uint public compensationAssignee;  // estimated compensation
	uint public depositOracle;  // Oracle lock a deposit until task is completed
	uint public depositAssignee;       // Assignee too

	constructor(string memory _name, address _project, uint _id) public {
		name = _name;
		id = _id;
		project = _project;
	}

	// TODO change visibility of all the set functions below
	function setAssignee(address _assignee) public {
		assignee = _assignee;
	}
	
	function setOracle(address _oracle) public {
		oracle = _oracle;
	}

	function setCompensationOracle(uint _compensation) public {
        compensationOracle = _compensation;
    }

	function setCompensationAssignee(uint _compensation) public {
		compensationAssignee = _compensation;
	}

	// TODO next 2 function might not be needed, can 
	// I have a fixed deposit amount?
	function setDepositAssignee(uint _deposit) public {
		depositAssignee = _deposit;
	}

	function setDepositOracle(uint _deposit) public {
		depositOracle = _deposit;
	}

	// Task status functions

	function openTask() taskWorkersOnly public {
		status = 1;
	}

	function resolveTask() assigneeOnly public {
		status = 2;
	}

	// TODO project only, maybe better explicit
	// permission, see modifier TODO
	function closeTask() projectOnly public {
		status = 3;
	} 

	function holdTask() projectOnly public {
		status = 5;
	}

	// MODIFIERS

	// TODO this might be the only necessary one, 
	// as all Task operations are triggered by 
	// the Project contract
	modifier projectOnly() {
		require(msg.sender == project, "Only project contract can.");
		_;
	}

	modifier taskWorkersOnly() {
		require(
					(msg.sender == assignee) || 
					(msg.sender == oracle) ||
					(msg.sender == project)
		, "Only Task workers or Project contract can accept tasks");
		_;
	}

	modifier assigneeOnly() {
		require	(
					msg.sender == assignee ||
					msg.sender == project
			 	, "Only assignee or Project can resolve");
		_;
	}

}
