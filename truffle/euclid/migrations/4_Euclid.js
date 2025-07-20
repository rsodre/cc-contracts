const Euclid = artifacts.require("Euclid");
const EuclidRandomizer = artifacts.require("EuclidRandomizer");
const EuclidFormula = artifacts.require("EuclidFormula");

// https://trufflesuite.com/docs/truffle/getting-started/running-migrations.html

module.exports = async function (deployer) {
	await deployer.deploy(EuclidRandomizer);
	await deployer.deploy(EuclidFormula, EuclidRandomizer.address);
	return await deployer.deploy(Euclid, 1870, EuclidRandomizer.address, EuclidFormula.address);
};
