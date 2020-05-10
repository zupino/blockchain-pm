// https://github.com/zupino/blockchain-pm

pragma solidity ^0.6.2;

import './Task.sol';
import './Drop.sol';

contract Project {

	Drop public drp;

    mapping (uint => address) tasks;
    mapping (address => uint) payroll;
    uint[] taskIds;
    address payable owner;
    uint projectStatus;             // 0: new       1: Open     2: Closed
    
    event compensationReleased(address _to, uint _amount);
    event fundsWithdrawn(address _to, uint _amount);

	// Task acceptance deposit for both Oracle and Assignee
	uint public defaultDeposit = 5;
    
	// Ether are converted to DRP and assigned as prj budget
    constructor() public payable {
	    owner = msg.sender;
		drp = new Drop(msg.value);
		
    }
    
    function getProjectBudget() public view returns (uint) {
        require(
            msg.sender == owner,
            "Only Project Owner can check the budget, for the moment"
        );
        
        return address(this).balance;
        
    }
    
    function withdrawProjectBudget() public {
        require(
            msg.sender == owner,
            "Only Project Owner can withdraw funds, for the moment"
        );
        if (owner.send(address(this).balance)) {
            emit fundsWithdrawn(owner, address(this).balance);    
        } else {
            revert();
        }
    }
    
    function addTask(string memory _title, uint _id) ownerOnly public {
		Task t = new Task(_title, address(this), _id);

		t.setDepositAssignee(defaultDeposit);
		t.setDepositOracle(defaultDeposit);

		tasks[_id] = address(t);
		taskIds.push(_id);
    }

	function setTaskAssignee(uint _id, address _assignee, uint _compensation) 
	 ownerOnly public {
		Task t = Task(address(tasks[_id]));
		t.setAssignee(_assignee);
		drp.transfer(address(t), _compensation);
		t.setCompensationAssignee(_compensation);
	}

	function setTaskOracle(uint _id, address _oracle, uint _compensation)
	ownerOnly public {
		Task t = Task(address(address(tasks[_id])));
		t.setOracle(_oracle);
		drp.transfer(address(t), _compensation);
		t.setCompensationOracle(_compensation);
	}

    // Resolve project when all the project
    // tasks are CLOSED, Oracle get payed
    function resolveProject() ownerOnly public {

		Task t;

        uint closedTask = 0;
        uint totalPayout = 0;
        
        for(uint i=0; i<taskIds.length; i++){
            t = Task(address(tasks[taskIds[i]]));
			if(t.status() == 3) {
                closedTask = closedTask + 1;
                totalPayout += t.compensationOracle();
            }
            
        }
        
        if(closedTask == taskIds.length && totalPayout <= drp.balanceOf(address(this))) {
            projectStatus = 2;
            for(uint i=0; i<taskIds.length; i++){
                t = Task(address(tasks[taskIds[i]]));
				payroll[t.oracle()] += t.compensationOracle();
            }
        }
    }
    
    // TODO refactor
    function withdrawTask() public {
        uint amount = payroll[msg.sender];
        payroll[msg.sender] = 0;
        msg.sender.transfer(amount);
    }

    function startWorkingOnTask(uint _id) public payable {
        Task t = Task(address(tasks[_id]));
		require(
            (msg.sender == t.oracle() || msg.sender == t.assignee()),
            "Only Oracle or Assignee can agree on tasks assignement"
        );
        
        if (msg.sender == t.oracle()) {
            if(msg.value == t.depositOracle()) {
                t.setDepositOracle( 0 );
            } else {
                revert();
            }
            
        } else { // given the "require" assumption, this is Assignee
            if(msg.value == t.depositAssignee()) {
                t.setDepositAssignee( 0 );
            } else {
                revert();
            }
        }
        
        if(((t.depositAssignee() + t.depositOracle()) == 0)
            && t.status() == 0
            ) {
            t.openTask();
        }
        
    }
    
    // only Oracle or Owner can change the status
    function resolveTask(uint _id) public {
        Task t = Task(address(tasks[_id]));
		require(
            (msg.sender == t.assignee() && t.status() == 1),
            "Only Assignee can resolve tasks, and Task must be assigned"
        );
        t.resolveTask();
    }
    
    // only Oracle or Owner can change the status
    function closeTask(uint _id) public {
		Task t = Task(address(tasks[_id]));
        require(
            (msg.sender == t.oracle() && t.status() == 2),
            "Only Oracle can close tasks"
        );
		require(t.status() == 2, "Tasks must be Resolved");

        t.closeTask();
    	drp.transfer(t.assignee(), t.compensationAssignee());
	}
    
    function setStatusOnHold(uint _id) public {
		Task t = Task(address(tasks[_id]));
        require(
            msg.sender == t.assignee() || msg.sender == t.oracle(),
            "Only Assignee or Oracle can set tasks On Hold"
        );
        
        t.holdTask();
    }
    
    function cancelTask(uint _id) public {
		// TBD        
    }

	// Modifiers

	modifier ownerOnly() {
		require(msg.sender == owner, "Only owner can do this");
		_;
	}

	// DEBUG convenience functions
	function getTaskAddress(uint _id) public view returns (address) {
		return tasks[_id];
	}
}

