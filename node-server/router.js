'use strict';

/*
*	This file is kept for historical reason, 
*	my expectation is that it can safely be deleted
*	since all the relevant content has been 
*	migrated to ../custom-scaffold/routes/index.js 
*	
*	It is quite late now and I could not confirm
*	100% all has been moved, but Project, Drop and 
*	Task creation on blockchain works there as
*	reaction to JIRA corresponding event and webhook
*	
*	If there is nothing more than that here, delete
*
*/


// TODO relative path not ok
const prjContractInt = require('../build/contracts/Project.json');
const drpContractInt = require('../build/contracts/Drop.json');

const web3 = require('web3');
const express = require('express');
const bodyParser = require('body-parser');
const proxy = require('express-http-proxy'); 
const axios = require('axios');
const jwt = require('atlassian-jwt');
const moment = require('moment');

//import moment from 'moment';

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.raw());
app.use(bodyParser.json());

//Local HttpProvider Endpoint
let web3js = new web3(new web3.providers.HttpProvider("http://172.18.0.3:8545"));

// User account
const userAccount = "0x2b64e6ff555d41fde621b3062df2aa81a081b33d";


var prjContractAddress = "0xA498730423825C107497E491b6C8Bca67BF65e0B";
var drpContractAddress = "";

let Project = new web3js.eth.Contract(prjContractInt.abi, prjContractAddress, {
    from: userAccount,
});

app.use(express.static("./public"));
app.use(express.static(".."));
app.use(express.static("../build/"));

// try to get the Web3 provider connection through the same server
// by proxying RPC calls
app.use('/provider', proxy('http://172.18.0.3:8545'));

app.get('/bp-project-settings', function(req,res) {
		res.send("Admin page all set!");
});

// Webhook for plugin installation, will get the 
// JWT secret here
app.post('/installed', function(req, res) {
	console.log("Received security context.");
	res.sendStatus(200);
});

// Webhook for Issue created
app.post('/issue-created', function(req, res) {

		/*
		*	Issues custom fields
		*	
		*		- Oracle address: 	req.body.issue.fields.customfield_10034.value
		*		- Assignee address:	req.body.issue.fields.customfield_10035.value
		*		- Oracle reward:	req.body.issue.fields.customfield_10037
		*		- Assignee reward:	req.body.issue.fields.customfield_10038
		*		
		*		- Project Key:		req.body.issue.fields.project.key
		*		- Issue summary:	req.body.issue.fields.summary
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

// Webhook for Project created
app.post('/project-created', function(req,res) {
	// We check the project name instead of dedicated property
	// if project name starts with BPM, then we create the corresponding
	// Blockchain contract
	
	// basic checks
	var prjName = req.body.project.name;
	var prjLead = req.body.project.projectLead.accountId;


	if((prjName.substring(0,3) == "BPM") && (prjLead == "557058:d26095ad-03ff-4c8b-886a-0662adc8dbdc") ) {
		// Conditions are met, we create an Issue Webhook
		console.log("Project conditions are met, creating the POST request for the Issue webhook");

		// prepare the JWT for authenticate the API request
		var now = moment.utc();
		var req = jwt.fromMethodAndUrl('POST', '/rest/api/2/webhook');

		var tokenData = {
			"iss": 'issuer-val',
			"iat": now.unix(),
			"exp": now.add(3, 'minutes').unix(),
			"qsh": jwt.createQueryStringHash(req)
		};

		var secret = 'EGgBMAJfFqtUfD4wE/gURVGYDK84ssvv+KTgxogJt+p+hik4hLV7/KElVmu2srZNzrG1z+rfQStEoJvLb0tK0g';

		var token = jwt.encode(tokenData, secret);

		var data = {
			'url': 'https://0fd4a6c6211e.ngrok.io/issue-created',
			'webhooks': [
				{
					'jqlFilter': "project = " + prjName,
					'events': ["jira:issue_created", "jira:issue_updated"]
				}
			]
		};

		var headers = {
			'Authorization': 'JWT ' + token
		};

		axios.post('https://blockchain-pm.atlassian.net/rest/api/2/webhook', data, { headers: headers})
			.then((res) => {
        		console.log(`Status: ${res.status}`);
        		console.log('Body: ', res.data);
    		}).catch((err) => {
        		console.error(err);
    		});
		
	} else {
		// Created project condtions are not met
		res.sendStatus(204);
	}
	
});

app.get('/sendtx',function(req,res){

        var myAddress = 'ADDRESS_THAT_SENDS_TRANSACTION';
        var privateKey = Buffer.from('YOUR_PRIVATE_KEY', 'hex')
        var toAddress = 'ADRESS_TO_SEND_TRANSACTION';

        //contract abi is the array that you can get from the ethereum wallet or etherscan
        var contractABI =YOUR_CONTRACT_ABI;
        var contractAddress ="YOUR_CONTRACT_ADDRESS";
        //creating contract object
        var contract = new web3js.eth.Contract(contractABI,contractAddress);

        var count;
        // get transaction count, later will used as nonce
        web3js.eth.getTransactionCount(myAddress).then(function(v){
            console.log("Count: "+v);
            count = v;
            var amount = web3js.utils.toHex(1e16);
            //creating raw tranaction
            var rawTransaction = {"from":myAddress, "gasPrice":web3js.utils.toHex(20* 1e9),"gasLimit":web3js.utils.toHex(210000),"to":contractAddress,"value":"0x0","data":contract.methods.transfer(toAddress, amount).encodeABI(),"nonce":web3js.utils.toHex(count)}
            console.log(rawTransaction);
            //creating tranaction via ethereumjs-tx
            var transaction = new Tx(rawTransaction);
            //signing transaction with private key
            transaction.sign(privateKey);
            //sending transacton via web3js module
            web3js.eth.sendSignedTransaction('0x'+transaction.serialize().toString('hex'))
            .on('transactionHash',console.log);
                
            contract.methods.balanceOf(myAddress).call()
            .then(function(balance){console.log(balance)});
        })
    });
app.listen(3000, () => console.log('Example app listening on port 3000!'))
