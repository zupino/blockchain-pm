// https://github.com/zupino/blockchain-pm

pragma solidity ^0.6.2;

import './Task.sol';
import './Drop.sol';

contract Project {

	Drop drp;

    mapping (uint => address) tasks;
    mapping (address => uint) payroll;
    uint[] taskIds;
    address payable owner;
    uint projectStatus;             // 0: new       1: Open     2: Closed
    
    event compensationReleased(address _to, uint _amount);
    event fundsWithdrawn(address _to, uint _amount);
    
	// Ether are converted to DRP and assigned as prj budget
    constructor() public payable {
	    owner = msg.sender;
		drp = new Drop(msg.value);
		
    }
    
    // for debug, maybe not needed
    function getProject() public view returns (Project) {
        require(
            msg.sender == owner,
            "Only Project Owner get project details, for the moment"
        );
        return this;
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
    
    function addTask(
                        uint _id, 
                        uint _compensationAssignee,
                        address _oracle,
                        uint _deadlineAssignment,
                        uint _deadlineDelivery,
                        address _assignee,
                        uint _compensationOracle,
                        uint _depositOracle,
                        uint _depositAssignee
                    ) public {
        require(
            msg.sender == owner,
            "Only Project Owner can add tasks"
        );
        
        if (
            (
                (_deadlineAssignment <= now) || (_deadlineDelivery <= now)
            ) || 
            (
                (_compensationAssignee + _compensationOracle) > projectBudget
            )
        ) {
            revert();
        }
        else
        {
            tasks[_id] = Task( {
                            compensationAssignee: _compensationAssignee,
                            compensationOracle: _compensationOracle,
                            oracle: _oracle,
                            deadlineAssignment: _deadlineAssignment,
                            deadlineDelivery: _deadlineDelivery,
                            assignee: _assignee,
                            depositOracle: _depositOracle,
                            depositAssignee: _depositAssignee,
                            status: 0
                        });
        
            taskIds.push(_id);
            projectBudget = projectBudget - (_compensationAssignee + _compensationOracle);
            projectStatus = 1;
        }
            
    }
    // Resolve project happens when all the project
    // tasks are CLOSED, and Oracle get payed
    function resolveProject() public {
        require(
            msg.sender == owner,
            "Only Project Owner can resolve project"
        );
        
        uint closedTask = 0;
        uint totalPayout = 0;
        
        for(uint i=0; i<taskIds.length; i++){
            if(tasks[taskIds[i]].status == 3) {
                closedTask = closedTask + 1;
                totalPayout += tasks[taskIds[i]].compensationOracle;
            }
            
        }
        
        if(closedTask == taskIds.length && totalPayout <= projectBudget) {
            projectStatus = 2;
            for(uint i=0; i<taskIds.length; i++){
                payroll[tasks[taskIds[i]].oracle] += tasks[taskIds[i]].compensationOracle;
            }
        }
    }
    
    
    function withdrawTask() public {
        uint amount = payroll[msg.sender];
        payroll[msg.sender] = 0;
        msg.sender.transfer(amount);
    }

    function startWorkingOnTask(uint _id) public payable {
        require(
            (msg.sender == tasks[_id].oracle || msg.sender == tasks[_id].assignee),
            "Only Oracle or Assignee can agree on tasks assignement"
        );
        
        if (msg.sender == tasks[_id].oracle) {
            if(msg.value == tasks[_id].depositOracle) {
                tasks[_id].depositOracle -= msg.value;
            } else {
                revert();
            }
            
        } else { // given the "require" assumption, this is Assignee
            if(msg.value == tasks[_id].depositAssignee) {
                tasks[_id].depositAssignee -= msg.value;
            } else {
                revert();
            }
        }
        
        if(((tasks[_id].depositAssignee + tasks[_id].depositOracle) == 0)
            && tasks[_id].status == 0
            ) {
            tasks[_id].status = 1;
        }
        
    }
    
    // only Oracle or Owner can change the status
    function resolveTask(uint _id) public {
        require(
            (msg.sender == tasks[_id].assignee && tasks[_id].status == 1),
            "Only Assignee can resolve tasks, and Task must be assigned"
        );
        tasks[_id].status = 2;
    }
    
    // only Oracle or Owner can change the status
    function closeTask(uint _id) public {
        require(
            (msg.sender == tasks[_id].oracle && tasks[_id].status == 2),
            "Only Oracle can close tasks, and Task must be Resolved"
        );
        // Check task current status and project balance
        // TODO Clarify what is better, this.balance
        // or our own state var
        if(tasks[_id].compensationAssignee < projectBudget) {
            tasks[_id].status = 3;
            payroll[tasks[_id].assignee] += tasks[_id].compensationAssignee;
            projectBudget -= tasks[_id].compensationAssignee;
        } else {
            revert();
        }
    }
    
    function setStatusOnHold(uint _id) public {
        require(
            msg.sender == tasks[_id].assignee || msg.sender == tasks[_id].oracle,
            "Only Assignee or Oracle can set tasks On Hold"
        );
        
        tasks[_id].status = 5;
    }
    
    function cancelTask(uint _id) public {
        
    }
}

