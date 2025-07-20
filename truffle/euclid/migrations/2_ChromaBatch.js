const ChromaBatch = artifacts.require("ChromaBatch");
const ChromaOne = artifacts.require('ChromaOne'); // symbolic link ../chroma/
const ChromaTwo = artifacts.require('ChromaTwo'); // symbolic link ../chroma/
const ChromaThree = artifacts.require('ChromaThree'); // symbolic link ../chroma/
const ChromaFour = artifacts.require('ChromaFour'); // symbolic link ../chroma/
const ChromaFive = artifacts.require('ChromaFive'); // symbolic link ../chroma/

module.exports = function (deployer, network) {
	let contracts = {
		'1': ChromaOne.address,
		'2': ChromaTwo.address,
		'3': ChromaThree.address,
		'4': ChromaFour.address,
		'5': ChromaFive.address,
	};
	// console.log(contractAddresses);
	deployer.deploy(ChromaBatch, Object.keys(contracts), Object.values(contracts));
};
