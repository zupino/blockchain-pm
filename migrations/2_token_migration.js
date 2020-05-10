const Drop = artifacts.require("Drop");
const Project = artifacts.require("Project");
const Task = artifacts.require("Task");

module.exports = function(deployer) {
	deployer.deploy(Project);
	// deployer.deploy(ProjectExternalTask);
	// deployer.deploy(Task);

};
