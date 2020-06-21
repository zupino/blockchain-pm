const web3 = require('web3');
const axios = require('axios');
const util = require('util');

const prjContractInt = require('../public/contract-interface/Project.json');
const drpContractInt = require('../public/contract-interface/Drop.json');

// Web3 settings

//Local HttpProvider Endpoint
let web3js = new web3(new web3.providers.HttpProvider("http://172.18.0.3:8545"));

// User account
const userAccount = "0x2b64e6ff555d41fde621b3062df2aa81a081b33d";

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
    // We check the project name instead of dedicated property
    // if project name starts with BPM, then we create the corresponding
    // Blockchain contract

	// Get an instance of the ACE httpClient (which also handle JWT Auth for REST API requests)
	var httpClient = addon.httpClient(req);
	
    // basic checks
    var prjName = req.body.project.name;
    var prjLead = req.body.project.projectLead.accountId;

    if((prjName.substring(0,3) == "BPM") && (prjLead == "557058:d26095ad-03ff-4c8b-886a-0662adc8dbdc") ) {

		// <project-contract-creation>
		// Creation of Project contract instance on blockchain
		var prjTemp = new web3js.eth.Contract(prjContractInt.abi);
	    prjTemp.deploy({
    	    data: prjContractInt.bytecode,
        	arguments: []
	    })
		.send({from: userAccount, value: 250000})
		.on('error', function(error) { console.log(error)})
		.on('receipt', function(receipt) { console.log("Receipt says: " + receipt.contractAddress)})
		.then(function(newContractInstance) {
			console.log("New project contract address: " + newContractInstance.options.address);

			// TODO 3 Should be enough to `update` Project with newContractInstance, but
	        // addTask() fails if I do not set at COntract creation time the default accounts
    	    Project = new web3js.eth.Contract(prjContractInt.abi, newContractInstance.options.address, {from: userAccount});
			prjContractAddress = newContractInstance.options.address;

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
			console.log("All good with REST API call. Response: ", httpResponse);
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
            .on('confirmation', function(receipt) {
                console.log("Issue [" + tid + "] created.");
                Project.methods.setTaskAssignee( tid, assignee, assigneeReward).send()
                    .on('confirmation', function(receipt) {
                        console.log("Assignee assigned to task [" + tid + "].");
                        res.sendStatus(200);
                    })
                    .on('error', function(error) {
                        console.log("Error assignee assignment: " + error);
                        res.sendStatus(500);
                    })

                console.log("Issue [" + tid + "] created.");
                Project.methods.setTaskOracle( tid, oracle, oracleReward).send()
                    .on('confirmation', function(receipt) {
                        console.log("Oracle assigned to task [" + tid + "].");
                        res.sendStatus(200);
                    })
                    .on('error', function(error) {
                        console.log("Error oracle assignment: " + error);
                        res.sendStatus(500);
                    })

            })
            .on('error', function(error) {
                console.log("Error creation Task: " + error);
                res.sendStatus(500);
            })

	});


}
