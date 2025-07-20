const Utils = artifacts.require("Utils");
const ChromaFive = artifacts.require("ChromaFive");
const ChromaFour = artifacts.require("ChromaFour");
const ChromaThree = artifacts.require("ChromaThree");
const ChromaTwo= artifacts.require("ChromaTwo");
const ChromaOne = artifacts.require("ChromaOne");

module.exports = function(deployer) {
	deployer.deploy(Utils);
	deployer.link(Utils, [ChromaFive, ChromaFour, ChromaThree, ChromaTwo, ChromaOne]);
	deployer.deploy(ChromaFive);
	deployer.deploy(ChromaFour);
	deployer.deploy(ChromaThree);
	deployer.deploy(ChromaTwo);
	deployer.deploy(ChromaOne);
};
