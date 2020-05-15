# Project.sol Development Frontend

The purpose for this test frontend is to validate the Web3 implementation of the Dapp
and to play with the main functionalities to refine the overall concept.

## Installation

In order to run this frontend you will need

### 1. Python3 installed, will be used to run a very basic Web Werver (httpserver.py)
This simple web server enable CORS and it is used to serve both the `index.html` file
and the `Project.json` contract interface file (see point 3)

### 2. An ethereum node running and exposing an RPC HTTP interface at 172.18.0.2:8545 (configurable in index.html)
The node can be remote, as soon as the IP address and port are reachable by the client machine. 
Note: the script assumes that the user account used is unlocked on the node.
The location of the ethereum node RPC server can be set in `index.html` file in the
`providerURI` variable

### 3. The Project contract JSON interface (to be generated)
The file is not available when the project is cloned, to avoid that
the JSON interface file is not up-to-date with the corresponding `Project.sol`
contract source file. 
To generate it, simple run `truffle compile` in this project and find 
the `Project.json` in the `build/` dir.
This file is used in `index.html` JS script to get the contract ABI.
Note: because the browsers do not allow to directly read file from local 
filesystem, the script retrieve this file with an Ajax call, so the 
URI of this JSON interface file needs to be set in `index.html` as `contractAbiURI` 
variable. 

### 4. The account address which deployed the Project contract (also configured in `index.html`)
The `index.html` file defines the user account to be used in the `userAccount`
variable. This address need to match with the account that was used to deploy
the contract in the ethereum node.

### 5. The Project contract address
In order to interact with the deployed contract methods, we need to set
the contract address. This is defined in the `index.html` file as `contractAddress` variable.

Two simple contract methods call are implemented: `getProjectBudgetDrop()` and `addTask()`
which have been succesfully tested on a geth node and Firefox browser.

