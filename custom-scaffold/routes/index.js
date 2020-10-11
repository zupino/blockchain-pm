const web3 = require('web3');
const util = require('util');

const prjContractInt = require('../public/contract-interface/Project.json');
const drpContractInt = require('../public/contract-interface/Drop.json');
const prjListContractInt = require('../public/contract-interface/ProjectList.json');

// Importing list of users with their addresses
const user = require('../public/js/userModule.js');
const constants = require('../public/js/constants.js');
 
var tk = "";
var userId = "";

// Web3 settings

// Local HttpProvider Endpoint
// public visible HTTP Provider: https://7ae55b3af41c.ngrok.io/provider
// let web3js = new web3(new web3.providers.HttpProvider("http://172.18.0.3:8545"));
const web3js = new web3(new web3.providers.WebsocketProvider("ws://172.18.0.3:8546", 
	{
      headers: [{
        name: 'Access-Control-Allow-Origin',
        value: 'ngrok.io'
      }]
    }
));
const provider = web3js.currentProvider;
provider.on("connect", function(){
	console.log("Web3 WebSocket provider connected.")
});
provider.on("error", function(error){
	console.error("Problem Websocket provider connection: " + error)
});
web3js.eth.net.isListening( function(error, result)  {
	if(error) {
		console.error(error);
	} else {
		console.log("Websocket provider is listening.")
	}
})

// User account
var userAccount = "";

// TODO ProjectList contract is currently hardcoded, but still part 
// of truffle migrate, ideally we should store the address of this
// contract once deployed somewhere for the system to retrieve.
// Maybe not an issue as this contract is intended to stay fixed, need
// further thoughts.
var prjListContractAddress = "0xA498730423825C107497E491b6C8Bca67BF65e0B";
var prjContractAddress = "";
var drpContractAddress = "";

var Project = null;
var Drop = null;

export default function routes(app, addon) {
    
	// ==>  Redirect root path to /atlassian-connect.json,
    app.get('/', (req, res) => {
        res.redirect('/atlassian-connect.json');
    });

    // Hello-world example, kept for reference .
    app.get('/hello-world', addon.authenticate(), (req, res) => {
        // Rendering a template is easy; the render method takes two params:
        // name of template and a json object to pass the context in.
        res.render('hello-world', {
            title: 'Atlassian Connect'
            //issueId: req.query['issueId']
        });
    });

    // ==> Webhook for project creation
	app.post('/project-created', addon.authenticate(), function(req,res) {
    // start with retrieving current user address
	// TODO this method is un-secure (read JWT claim without verifying signature)
	// and also not the best, in general user addresses should be a JIRA user property
	// or something. I am using this approach only in the prototype
	tk = req.header('Authorization').split(' ')[1];
	console.log("Token from POST Headers: ", tk);
    console.log("Decoded token: ", addon._jwt.decode(tk, null, true));

	userId = addon._jwt.decode(tk, null, true).sub;
	userAccount = user.getUserAddress(userId);

	// We check the project name instead of dedicated property
    // if project name starts with BPM, then we create the corresponding
    // Blockchain contract
	// TODO just prototype validation based on project name and \
	// hardcoded project lead user-id. Need project template approach 
	// or different.
	
	// Get an instance of the ACE httpClient (which also handle JWT Auth for REST API requests)
	var httpClient = addon.httpClient(req);
	
    // basic checks
    var prjName = req.body.project.name;
    var prjLead = req.body.project.projectLead.accountId;
	var prjId 	= req.body.project.id; 

    if((prjName.substring(0,3) == "BPM") && (prjLead == "557058:d26095ad-03ff-4c8b-886a-0662adc8dbdc") ) {


		// <project-contract-creation>


		console.log("Entering Project contract creation.");
		// Preparing the contract for ProjectList, to keep track
		// of deployment address for Project contract
		var ProjectList = new web3js.eth.Contract(prjListContractInt.abi, prjListContractAddress, {from: userAccount});
		
		ProjectList.methods.getProjectAddress(prjId).call().then( function(result) {
			console.log("Project List created, should have address null: ", result);
		})

		// Creation of Project contract instance on blockchain
		var prjTemp = new web3js.eth.Contract(prjContractInt.abi);
	    prjTemp.deploy({
    	    data: prjContractInt.bytecode,
        	arguments: []
	    })
		.send({from: userAccount, value: 25000})
		.on('error', function(error) { console.log(error)})
		.on('receipt', function(receipt) { console.log("Receipt says: " + receipt.contractAddress)})
		.then(function(newContractInstance) {
			console.log("New project contract address: " + newContractInstance.options.address);

			// TODO 3 Should be enough to `update` Project with newContractInstance, but
	        // addTask() fails if I do not set at Contract creation time the default accounts
    	    Project = new web3js.eth.Contract(prjContractInt.abi, newContractInstance.options.address, {from: userAccount});
			prjContractAddress = newContractInstance.options.address;

			// Adding this Project contract instance address to ProjectList contract
			// for other component to retrieve later
			ProjectList.methods.setProjectAddress(prjId, prjContractAddress).send({from: userAccount})
				.on('receipt', function(receipt) {
					console.log("New Project id " + prjId + " has been added to ProjectList, address: " + prjContractAddress);
				})
				.on('error', function(error) {
					console.log("Error happened while storing new project address: ", error);
				})

			// Refresh also corresponding Drop contract address
			Project.methods.getDropAddress().call().then( function(result) {
	            drpContractAddress = result;
    	        Drop = new web3js.eth.Contract(drpContractInt.abi, drpContractAddress, {from: userAccount});
	        });

			// Add listener for taskStatusChanged() event
			Project.events.taskStatusChanged( {fromBlock: 0}, function(error, event) { 
				

				console.log(event) 
			});

			
			// Project.events.taskAdded();

				Project.events.taskStatusChanged()
				.on('data', function(event){

				// Blockchain Task status are
				// 0: new           3: closed
				// 1: accepted      4: cancelled
    			// 2: resolved      5: onhold
				
				// If Task is accepted, we change JIRA Issue
				// status to 11 (In progress)
				
				if(event.returnValues._status == 1) {
					console.log("Received event taskStatusChanged with Accepted status.")
					console.log("Data from event.returnValues: ", event.returnValues._id, event.returnValues._status);
	
					// Transition id is found in JIRA Worflow
					var bodyData = {  
   		    	    	'transition': {
	    	            'id': '11'
    	    	    	}
			        };

		    	    // Use the ACE provided httpClient instead of Axios
	    	    	httpClient.post({
		    	        headers: { 'Content-type': 'application/json'},
    			        url: '/rest/api/2/issue/' +  event.returnValues._id + '/transitions',
		        	    body: JSON.stringify(bodyData)
	    		    }, function(err, httpResponse, body) {
			            if(err) {
		    	            console.error("Problem in handling REST API request: ", err);
			            }
			            console.log("All good with REST API call. Full response object is omitted");
			            console.log("Response body: ", body);
			        }
			        );


				}

				})

	



/*
function(error, event) {

				// Retrieve IssueID from the event
				var iid = event.returnValues._id;
				var status = event.returnValues._status;
				console.log("Received blockchain taskStatusChanged event for issue id ", iid);

				// Call the PUT /rest/api/2/issue/{IssueIdorKey} API
				var reqBody = {
					'fields' : {
						"customfield_10039" : 1
					},
					'labels' : [
						{
							'add' : 'blockchainSync'
						}
					]
				};

				httpClient.put({
					headers: { 'Content-type': 'application/json' },
					url: '/rest/api/2/issue/' + iid,
					body: JSON.stringify(reqBody)
				}, function (err, httpResponse, body) {
					if(err) {
						console.error("Problem handling REST API call for taskStatusChanged event.", err);
					}
					console.log("REST API call to update Issue " + iid + " succesfully executed.");
						console.log("Response body: ", body);
				}
				);
				
			}
*/
			

		})


		// </project-contract-creation>
		
        // Conditions are met, we create an Issue Webhook
        console.log("Project conditions are met, creating the POST request for the Issue webhook");
		console.log("The current ngrok URI is: ", constants.getNgrokURI());

		// TODO	Important: currently (after 02.08.2020) the webhook for issue-created
		//		has been added to the app descriptor. The one in the app descriptor has 
		//		hardcoded filter on the BPMZupo65 project. 
		//		In short, we still need the REST API programmatic creation of 
		//		new issue-created webhooks when a new project is created, but 
		//		we should rather rework into something like updating the filter
		//		of the existing webhook rather then creating a new one.

		// 		Update: 29.09.2020 
		//		The webhook on project-update has been added to the json app descriptor
		//		and there is no filtering on project name, to simplify development.
		//		The main reason is that Atlassian removed the possibility to 
		//		create new project and associated existing project configuration
		//		(only available on Pro version) 

        var data = {
            'url': constants.getNgrokURI() + '/issue-created',
            'webhooks': [
                {
                    'jqlFilter': "project = " + prjName,
                    'events': ["jira:issue_created", "jira:issue_updated"]
                }
            ]
        };

		// Use the ACE provided httpClient instead of Axios
		httpClient.post({
			headers: { 'Content-type': 'application/json'},
			url: '/rest/api/2/webhook',
			body: JSON.stringify(data)
		}, function(err, httpResponse, body) {
			if(err) {
				console.error("Problem in handling REST API request: ", err);
			}
			console.log("All good with REST API call. Full response object is omitted");
			console.log("Response body: ", body);
		}
		);

    } else {
        // Created project conditions are not met
        res.sendStatus(204);
    }

	});

	// ==> Webhook for Issue created
	app.post('/issue-created', addon.authenticate(), function(req, res) {

		// TODO Retrieving the current logged-in user is not 
		// reliable from JWT, the `sub` field which contains the 
		// JIRA user-id is optional, and not always there. 
		// This makes sense as webhooks are called by JIRA engine
		// and webhook calls are not related 1 to 1 with JIRA users
		// For this case (webhook issue-created) might makes more sense
		// to retrieve the reporter of the Issue
		
		// TODO again, unsecure retrieval of user-id from
		// JWT, no verification of signature in place

		var reporter = req.body.issue.fields.creator.accountId;

		tk = req.header('Authorization').split(' ')[1];
		console.log("Token from POST header: ", tk);
		console.log("Decoded token: ", addon._jwt.decode(tk, null, true));
	    userId = addon._jwt.decode(tk, null, true).sub;

		if(!(userId))
			userId = reporter;
			
    	userAccount = user.getUserAddress(userId);

		var prjId = req.body.issue.fields.project.id;
		var prjName = req.body.issue.fields.project.name;
		
		console.log("Current value userAccount: ", userAccount);
		console.log("Current value userId (from JWT)", userId);

		/*
        *   Issues custom fields
        *   
        *       - Oracle address:   req.body.issue.fields.customfield_10034.value
        *       - Assignee address: req.body.issue.fields.customfield_10035.value
        *       - Oracle reward:    req.body.issue.fields.customfield_10037
        *       - Assignee reward:  req.body.issue.fields.customfield_10038
				- Issue reporter	req.body.issue.fields.creator.accountId
        *       
        *       - Project Key:      req.body.issue.fields.project.key
        *       - Issue summary:    req.body.issue.fields.summary
        *
        */
        console.log("Entering addTask for: " + req.body.issue.key);
        console.log(req.body.issue.fields.customfield_10034.value);

        var oracle = req.body.issue.fields.customfield_10034.value;
        var assignee = req.body.issue.fields.customfield_10035.value;
        var oracleReward = req.body.issue.fields.customfield_10037;
        var assigneeReward = req.body.issue.fields.customfield_10038;
        var tid = req.body.issue.id;

		// TODO MAS: I think I need to update Project contract instance
        // here, in case there was no project creation in JIRA, but
        // the current Issue project is a BPM Project
        // This should also take line 204 into account,
        // by removing the filter on currently created project.
		var ProjectList = new web3js.eth.Contract(prjListContractInt.abi, prjListContractAddress, {from: userAccount});
		var Project = "";
        ProjectList.methods.getProjectAddress(prjId).call().then( function(result) {
            console.log("Project List created, address for " + prjName  + " : " + result);
	        Project = new web3js.eth.Contract(prjContractInt.abi, result, {from: userAccount});

			// Create new task in this project
	        Project.methods.addTask( "[" + req.body.issue.key + "] " + req.body.issue.summary, tid ).send({from: userAccount})
            .on('receipt', function(receipt) {
                console.log("Issue [" + tid + "] created.");
                Project.methods.setTaskAssignee( tid, assignee, assigneeReward).send({from: userAccount})
                    .on('receipt', function(receipt) {
                        console.log("Assignee assigned to task [" + tid + "].");

                        Project.methods.setTaskOracle( tid, oracle, oracleReward).send({from: userAccount})
                            .on('receipt', function(receipt) {
                                console.log("Oracle assigned to task [" + tid + "].");
                                res.sendStatus(200);
                            })
                            .on('error', function(error) {
                                console.log("Error oracle assignment: " + error);
                                res.sendStatus(500);
                            })

                    })
                    .on('error', function(error) {
                        console.log("Error assignee assignment: " + error);
                        res.sendStatus(500);
                    })

            })
            .on('error', function(error) {
                console.log("Error creation Task: " + error);
                res.sendStatus(500);
            })

			// TODO	Review
			// context: adding here the event subscription, when a task change status, 
			// 			the callback will be executed. This should be set at plugin
			//			installation time, but need to clarify the JIRA/Blockchain
			//			porject lifecycle. Until then I place it here to test the feature.
			//
			//			We have exact same function on Project creation hook.

			// Get an instance of the ACE httpClient (which also handle JWT Auth for REST API requests)
	        var httpClient = addon.httpClient(req);

			// Add listener for taskStatusChanged() event
            Project.events.taskStatusChanged( {fromBlock: 0}, function(error, event) { 
                console.log(event)
            });

			// << start taskStatusChanged callback
            Project.events.taskStatusChanged()
            .on('data', function(event){

                // Blockchain Task status are
                // 0: new           3: closed
                // 1: accepted      4: cancelled
                // 2: resolved      5: onhold

                // If Task is accepted, we change JIRA Issue
                // status to 2 (In progress)

				// IN blockchain-pm.atlassian.net the workflow is BPM

                if(event.returnValues._status == 1) {
                    console.log("Received event taskStatusChanged with Accepted status (id 1).")
                    console.log("Data from event.returnValues: ", event.returnValues._id, event.returnValues._status);

                    // Transition id is found in JIRA Worflow
                    var bodyData = {
                        'transition': {
                        'id': '11'
                        }
                    };

                    // Use the ACE provided httpClient instead of Axios
                    httpClient.post({
                        headers: { 'Content-type': 'application/json'},
                        url: '/rest/api/2/issue/' +  event.returnValues._id + '/transitions',
                        body: JSON.stringify(bodyData)
                    }, function(err, httpResponse, body) {
                        if(err) {
                            console.error("Problem in handling REST API request: ", err);
                        }
                        console.log("JIRA Issue state changed via REST API");
                        console.log("Response body: ", body);
                    }
                    );


                }

                })
			// end tastStatusChanged callback >>

        })

	});

	// ==> Webhook for jira:issue_updated

	/*
	*	Blockchain Task status are

		0: new           3: closed
		1: accepted      4: cancelled
		2: resolved      5: onhold

		JIRA Workflow (BPM) 
		!!  This looks just wrong, BPM and State ID in the POST webhook 
			requests are not matching

        1: Open			 3: In Progress
		5: Resolved		 5: Deleted
		6: Cancelled

		JIRA Transactions

		11: accept (1 -> 2)		21: execute (2 -> 4)
		31: accepted (4 -> C)	51: Cancelled (* -> 6)

	*/

	app.post('/issue-updated', addon.authenticate(), function(req,res) {
		console.log(">>> Received event of an issue being updated");
		console.log("Search the ngrok network traces to check body content.");

		let itemsChanged = req.body.changelog.items;
		let issueId = req.body.issue.id;
		let prjId = req.body.issue.fields.project.id;
		let i = 0;

		for (; i < itemsChanged.length; i++) {
			var obj = itemsChanged[i];
            console.log("debug: current field checked " + obj.field);
			if( obj.field == 'status') {
				if (obj.from == 3 && obj.to == 5) {
					// Issue is being resolved by Assignee
					console.log("Issue status changed to Resolved, Oracle to approve it.");

					var ProjectList = new web3js.eth.Contract(prjListContractInt.abi, prjListContractAddress, {from: userAccount});
			        var Project = "";
			        ProjectList.methods.getProjectAddress(prjId).call().then( function(result) {
						console.log("Project List created, address for " + prjName  + " : " + result);
			            Project = new web3js.eth.Contract(prjContractInt.abi, result, {from: userAccount});

						Project.methods.resolveTask(issueId).send({from: userAccount})
							.on('receipt', function(receipt) {
								console.log("Task resolved on blockchain.");
							});
					});






				}
			}
		}




		res.send("All right, got the request.")
	});

	// ==> Content of Accept Assignment Panel
	app.get('/accept-assignment-panel', addon.authenticate(), function(req, res) {
		// TODO This is totally unsafe, use just for prototype.
		// the `null` parameter in the following decode() call 
		// indicates a decoding of the JWT without the verification of 
		// the signature, which defeat the scope of JWT in the first place
		console.log(">>> UserId: ", addon._jwt.decode(req.query.jwt, null, true).sub );
		console.log("Request for acceptance web-panel received: " + req.body);
		res.render('accept-assignment-panel', {id : req.query['id'], prjId : req.query['prjId']});
	});

}
