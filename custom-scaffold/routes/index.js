const web3 = require('web3');
const axios = require('axios');
const util = require('util');

const prjContractInt = require('../public/contract-interface/Project.json');
const drpContractInt = require('../public/contract-interface/Drop.json');
const prjListContractInt = require('../public/contract-interface/ProjectList.json');

// Importing list of users with their addresses
const user = require('../public/js/userModule.js'); 
var tk = "";
var userId = "";

// Web3 settings

// Local HttpProvider Endpoint
// public visible HTTP Provider: https://7ae55b3af41c.ngrok.io/provider
let web3js = new web3(new web3.providers.HttpProvider("http://172.18.0.3:8545"));

// User account
var userAccount = "";

// TODO ProjectList contract is currently hardcoded, but still part 
// of truffle migrate, ideally we should store the address of this
// contract once deployed somewhere for the system to retrieve.
// Maybe not an issue as this contract is intended to stay fixed, need
// further thoughts.
var prjListContractAddress = "0xaA68c1EA80F76B84C6bbe6b6d474F5DE63e532Ff";
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

		// Preparing the contract for ProjectList, to keep track
		// of deployment address for Project contract
		var ProjectList = new web3js.eth.Contract(prjListContractInt.abi, prjListContractAddress, {from: userAccount});

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

		})
		// </project-contract-creation>
		

        // Conditions are met, we create an Issue Webhook
        console.log("Project conditions are met, creating the POST request for the Issue webhook");


        var data = {
            'url': 'https://7ae55b3af41c.ngrok.io/issue-created',
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

		// TODO again, unsecure retrieval of user-id from
		// JWT, no verification of signature in place
		tk = req.header('Authorization').split(' ')[1]
	    userId = addon._jwt.decode(tk, null, true).sub
    	userAccount = user.getUserAddress(userId);

        /*
        *   Issues custom fields
        *   
        *       - Oracle address:   req.body.issue.fields.customfield_10034.value
        *       - Assignee address: req.body.issue.fields.customfield_10035.value
        *       - Oracle reward:    req.body.issue.fields.customfield_10037
        *       - Assignee reward:  req.body.issue.fields.customfield_10038
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

        // Create new task in this project
        Project.methods.addTask( "[" + req.body.issue.key + "] " + req.body.issue.summary, tid ).send()
            .on('receipt', function(receipt) {
                console.log("Issue [" + tid + "] created.");
                Project.methods.setTaskAssignee( tid, assignee, assigneeReward).send()
                    .on('receipt', function(receipt) {
                        console.log("Assignee assigned to task [" + tid + "].");

						Project.methods.setTaskOracle( tid, oracle, oracleReward).send()
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
