# blockchain-pm
Blockchain-based project management, focus on product and automate processes

# Motivation
Project management involve too much burocracy, this project is an attempt to automate as much as possible the steps required to track project execution, including payment transaction and acceptance. Human work is focused on verifying quality of deliverables rather then ensure payment are done or commercial agreement are honored.

# User Journey and main functionalities
The main idea is to define the scope of a Project, split it in Task and assign each Task to an Assignee and an Oracle. Assignee are expert assigned to execute the task and generate the deliverables; Oracles are expert in the same domain, but responsible to describe, quaify and accept the deliverables. 

The Project Owner creates the project and assign project budget. Also, he creates the list of Tasks, defining Task budget for each of them. Task budget will be used for both Assignee and Oracle compensation. 

Assignment is accepted by both by transfer of a small deposit. At this point, Assignee and Oracles agreed on the details of deliverables, deadlines and qualification procedure. 

Once Assignee is done with his tasks and he believe quality of deliverables is high enough for acceptance, Task is set to Resolved and Oracle is notified. 

Oracle verify the quality of the deliverables and eventually Close the Task, including releasing the task compensation for the Assignee. 

In case of problems, like disagreement on deliverables or need to review Task budget or deadlines, the Task can be set to On Hold, and resolution with the project owner is triggered. 

Once all the Tasks in the Project are Closed, the whole project is set as Closed and all Tasks deliverables are qualified and eventually accepted by the Project Owner. 

# Testing
The easiest way to play with the contract is to use the Remix console at http://remix.ethereum.org. In particular, have a look about the Remix Editor quick start with Javascript VM https://remix.readthedocs.io/en/latest/quickstart_javascript_vm.html

Basically copy and paste the solidity code in this project in the Solidity Editor

![Remix IDE - Editor][remix]

compile and then deploy on a local simulation of the Ethereum Virtual Machine running locally (provided by Remix, very comfortable for quick tests). You can do that by selecting "JavaScript VM" as Environment in the Run tab of the Remix IDE.

![select JavaScript VM as environment][jsvm]

This give you few default accounts with 100 test-ether. Different accounts can be used for roles of Project Owner, Oracle and Assignee to make the actual contract transactions. I usually take the firrst address as Project Owner, the second as Oracle and the third as Assignee.
Remember to switch to the right address before making call to contract methods, methods check for sender address before executing.

Select the address that you want to use as Project Owner and set the Value for the transaction, which will be the project budget.

![addresses and value fields][addresses]

Now the contract is deployed and we can use Remix IDE to call methods method. Remember to set correct account and to set the amount when a transfer is required by the method.

![list of contract methods][methods]

The user journey above is described here in terms of contract calls:

1. Deploy the contract with a specific amount of eth as project budget. 

2. With the same address, call addTask using the following parameters (you can add several Tasks):

```
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
```

And this is a compact form that you can copy and paste in the Remix method call, to make it faster. Remember to replace the addresses and the timestamps for deadlines, or contract constructor will fail.

```
"1","20000000000000000","0x14723a09acff6d2a60dcdf7aa4aff308fddc160c","1574082855","1571404455","0x4b0897b0513fdc7c541b6d9d7e929c4e5364d2db","10000000000000000","20000000000000000","20000000000000000"
```

3. Now, for each Task, Assignee and Oracle needs to accept the assignment. This is done by calling the `startWorkingOnTask()`, passing the corresponding Task id as parameter (the same used when Task was created). 
The call should also transfer exactly the amount mentioned in Task.depositOracle and Task.depositAssignee respectivelly, so make sure value and sender address are correctly set in Remix IDE. 2 transaction (ne from Assignee and one from Oracle) are needed to change the Task state to Accepted.

4. This is the moment when the Assignee work on his Task. Eventually he will finish and feel comfortable that Oracle will accept the deliverables, so she set the Task status to Resolved, by calling the method `resolveTask()`, again using the Task id as parameter. Note that this call does not require any amount being sent to the contract, but can only be called by the Assignee. 

5. Oracle get notified, review the deliverables and eventually accept them by calling `closeTask()` with the Task id. At this point the compensation for the Assignee is allocated to the payroll, and made available for the Assignee to withdraw. 

6. Assignee can withdraw his compensation by calling `withdrawTask()`. Oracle compensation passes to a similar flow, where Task is qualified by Project Owner and entire project set to resovled. 









[remix]: http://www.marcozunino.it/blockchain-pm-images/1RemixEditor.png "Remix Editor"
[jsvm]: http://www.marcozunino.it/blockchain-pm-images/2SelectJSVM.png "select JavaScript VM as environment"
[addresses]: http://www.marcozunino.it/blockchain-pm-images/3Addresses.png "select the correct address before calling methods"
[methods]: http://www.marcozunino.it/blockchain-pm-images/4ContractMethods.png "list of contract methods"













