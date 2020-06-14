'use strict';

// TODO relative path not ok
const prjContractInt = require('../build/contracts/Project.json');
const drpContractInt = require('../build/contracts/Drop.json');

const web3 = require('web3');
const express = require('express');
const bodyParser = require('body-parser');

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

app.use(express.static("public"));
app.use(express.static("blockchain-pm"));

app.get('/bp-project-settings', function(req,res) {
		res.send("Admin page all set!");
});

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
