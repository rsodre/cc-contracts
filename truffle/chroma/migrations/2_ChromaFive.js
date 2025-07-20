const Utils = artifacts.require("Utils");
const ChromaFive = artifacts.require("ChromaFive");

module.exports = function(deployer) {
	deployer.deploy(Utils);
	deployer.link(Utils, ChromaFive);
	deployer.deploy(ChromaFive);
};
