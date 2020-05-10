const Drop = artifacts.require("Drop");
const Project = artifacts.require("Project");
const Task = artifacts.require("Task");

module.exports = function(deployer) {
// We deploy Project with 250000 test-wei as this
// will generate 250000 DRP as project budget
	deployer.deploy(Project, {value: 250000});
	// deployer.deploy(ProjectExternalTask);
	// deployer.deploy(Task);

};
