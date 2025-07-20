const Utils = artifacts.require("Utils");
const ChromaFour = artifacts.require("ChromaFour");

module.exports = function(deployer) {
	deployer.link(Utils, ChromaFour);
	deployer.deploy(ChromaFour);
};
