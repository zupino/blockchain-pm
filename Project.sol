// https://github.com/zupino/blockchain-pm

pragma solidity ^0.4.0;

contract Project {
    
    struct Task {
        int8 status;                // 0: new           3: closed
                                    // 1: accepted      4: cancelled
                                    // 2: resolved      5: onhold
        address oracle;             // has authority to change status
        address assignee;           // has accountability on task, can start Tasks
        uint deadlineAssignment;    // unix epoch timestamp of deadline
        uint deadlineDelivery;      // unix epoch timestamp of deadline
        uint compensationOracle;
        uint compensationAssignee;  // estimated compensation
        uint depositOracle;         // Oracle lock a deposit until task is completed
        uint depositAssignee;       // Assignee too
    }

    mapping (uint => Task) tasks;
    mapping (address => uint) payroll;
    uint[] taskIds;
    address owner;
    uint projectBudget;
    uint projectStatus;             // 0: new       1: Open     2: Closed
    
    event compensationReleased(address _to, uint _amount);
    event fundsWithdrawn(address _to, uint _amount);
    
    function Project() payable {
        owner = msg.sender;
        addProjectBudget(msg.value);
    }
    
    // for debug, maybe not needed
    function getProject() constant returns (Project) {
        require(
            msg.sender == owner,
            "Only Project Owner get project details, for the moment"
        );
        return this;
    }
    
    // TODO So far only constructor can add funds
    function addProjectBudget(uint _amount) internal {
        require(
            (msg.sender == owner && msg.value > 0),
            "Only Project Owner can add budget, for the moment"
        );
        
        /*
        If I get it right, no need to process
        the amount, unless we want to keep it
        tracked in a variable for convenience
        */
        
        projectBudget += _amount;
    }
    
    function getProjectBudget() constant returns (uint) {
        require(
            msg.sender == owner,
            "Only Project Owner can check the budget, for the moment"
        );
        
        return this.balance;
        
    }
    
    function withdrawProjectBudget() public {
        require(
            msg.sender == owner,
            "Only Project Owner can withdraw funds, for the moment"
        );
        if (owner.send(this.balance)) {
                fundsWithdrawn(owner, this.balance);    
        } else {
            throw;
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
                    ) {
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
            throw;
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
    function resolveProject() {
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
            for(i=0; i<taskIds.length; i++){
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
                throw;
            }
            
        } else { // given the "require" assumption, this is Assignee
            if(msg.value == tasks[_id].depositAssignee) {
                tasks[_id].depositAssignee -= msg.value;
            } else {
                throw;
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
            throw;
        }
    }
    
    function setStatusOnHold(uint _id) {
        require(
            msg.sender == tasks[_id].assignee || msg.sender == tasks[_id].oracle,
            "Only Assignee or Oracle can set tasks On Hold"
        );
        
        tasks[_id].status = 5;
    }
    
    function cancelTask(uint _id) {
        
    }
    
}
