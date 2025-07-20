const Utils = artifacts.require("Utils");
const ChromaTwo= artifacts.require("ChromaTwo");

module.exports = function(deployer) {
	deployer.link(Utils, ChromaTwo);
	deployer.deploy(ChromaTwo);
};
