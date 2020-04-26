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

	function createTask(uint _id, string memory _title, uint _assigneeReward) public returns (address taskAddress) {
		Task t = new Task(_title, address(this), _id);

		// we transfer to the Task the amount of DRP we need for the Assignee reward
		drp.transfer(address(t), _assigneeReward);

		tasks[_id] = address(t);
	}

	function getTaskAddress(uint _id) public view returns (address taskAddress) {
		return tasks[_id];
	}
}
