pragma solidity ^0.6.2;

import './Task.sol';
import './Drop.sol';

contract ProjectExternalTask {

	Drop 					drp;
	// TODO [check] We assume the Task IDs are unique per project
	// and handled outside of blockchain
	mapping (uint => address)	tasks;

	constructor(address _drp) public {
		drp = Drop(_drp);
	}

	function createTask(uint _id, string memory _title, uint _assigneeReward) public {
		Task t = new Task(_title, address(this), _id);

		// we transfer to the Task the amount of DRP we need for the Assignee reward
		drp.transfer(address(t), _assigneeReward);

		tasks[_id] = address(t);
	}

	function getTaskAddress(uint _id) public view returns (address taskAddress) {
		return tasks[_id];
	}

	// Send caution to New task to set it to `1: accepted`
	// Implementing option 1 (Native Ether) for Task deposit
	// This allows the best UI and the drawback of using native
	// Ether is not really a drawback, since they need to be 
	// used for Gas anyway
	// TODO confirm the last hypothesis and prepare documentation
	// on the 3 options and the need for Task Deposit itself
	function openTask(uint _id) taskWorkers(_id) public payable {
		Task t = Task(tasks[_id]);
		require(msg.value == t.depositAssignee(), "Need the Ether deposit.");
		
		t.openTask();
		
	}



	// Modifiers
	modifier taskWorkers(uint _id) {
		Task t = Task(tasks[_id]);
		require((msg.sender == t.assignee()) || (msg.sender == t.oracle()));
		_;
	}

}
