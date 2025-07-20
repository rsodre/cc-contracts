const Utils = artifacts.require("Utils");
const ChromaThree = artifacts.require("ChromaThree");

module.exports = function(deployer) {
	deployer.link(Utils, ChromaThree);
	deployer.deploy(ChromaThree);
};
