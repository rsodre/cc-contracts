const Utils = artifacts.require("Utils");
const ChromaOne = artifacts.require("ChromaOne");

module.exports = function(deployer) {
	deployer.link(Utils, ChromaOne);
	deployer.deploy(ChromaOne);
};
