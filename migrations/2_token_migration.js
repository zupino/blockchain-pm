const Drop = artifacts.require("Drop");
const ProjectExternalTask = artifacts.require("ProjectExternalTask");
const Task = artifacts.require("Task");

module.exports = function(deployer) {
	deployer.deploy(Drop, 10000);
	// deployer.deploy(ProjectExternalTask);
	// deployer.deploy(Task);

};
