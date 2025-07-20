const Euclid = artifacts.require("Euclid");
const EuclidShuffle = artifacts.require("EuclidShuffle");
const Whitelist = artifacts.require("Whitelist");

// https://trufflesuite.com/docs/truffle/getting-started/running-migrations.html

module.exports = function(deployer) {
	deployer.deploy(Whitelist);
	deployer.link(Whitelist, Euclid);

	deployer.deploy(EuclidShuffle);
	deployer.link(EuclidShuffle, Euclid);
};
