const Drop = artifacts.require("Drop");
const TransferToken = artifacts.require("TransferToken");

module.exports = function(deployer) {
	deployer.deploy(Drop, 10000);
	deployer.deploy(TransferToken);
};
