// OpenZeppelin test suite
// https://github.com/OpenZeppelin/openzeppelin-test-environment
const { accounts, contract } = require('@openzeppelin/test-environment');
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const fetch = require('cross-fetch');

//--------------------------
// Euclid
//
const Euclid = contract.fromArtifact('Euclid');
const EuclidRandomizer = contract.fromArtifact('EuclidRandomizer');
const EuclidFormula = contract.fromArtifact('EuclidFormula');
const EuclidShuffle = contract.fromArtifact('EuclidShuffle');
const Whitelist = contract.fromArtifact('Whitelist');
async function deployEuclid(maxSupply, ownerAccount) {
	const _EuclidRandomizer = await EuclidRandomizer.new({ from: ownerAccount });
	const _EuclidFormula = await EuclidFormula.new(_EuclidRandomizer.address, { from: ownerAccount });
	await EuclidShuffle.detectNetwork();
	const _EuclidShuffle = await EuclidShuffle.new({ from: ownerAccount });
	await Whitelist.detectNetwork();
	const _Whitelist = await Whitelist.new({ from: ownerAccount });
	await Euclid.detectNetwork();
	await Euclid.link('EuclidShuffle', _EuclidShuffle.address);
	await Euclid.link('Whitelist', _Whitelist.address);
	return await Euclid.new(maxSupply, _EuclidRandomizer.address, _EuclidFormula.address, { from: ownerAccount });
};
async function _giftCode(contract, to, quantity=1, options = {}) {
	if (!options.from) {
		options.from = to;
	}
	return contract.giftCode(to, quantity, options);
}
async function _claimCode(contract, to, tokenIds, quantity, options = {}) {
	const price_bn = (await contract.calculatePriceForQuantity(quantity, 1)); // wei 1e18 (BN)
	options.value = options.value ?? price_bn.toString();
	options.from = options.from ?? to;
	return contract.claimCode(to, tokenIds, options);
}
async function _buyCode(contract, to, quantity, options = {}) {
	const price_bn = (await contract.calculatePriceForQuantity(quantity, 2)); // wei 1e18 (BN)
	options.value = options.value ?? price_bn.toString();
	options.from = options.from ?? to;
	return contract.buyCode(to, quantity, options);
}
async function _getWhitelistedTokens(contract, to) {
	let result = {};
	const mapping = (await contract.getWhitelistedTokens(to, { from: to }));
	for (let i = 0; i < mapping['0'].length; ++i) {
		const batchId = mapping['0'][i].toNumber();
		const allowedMints = mapping['1'][i].toNumber();
		if (allowedMints > 0) {
			result[batchId] = allowedMints;
		}
	}
	return result;
}


//--------------------------
// Chroma
//
// OZ uses contract-loader to find modules
// https://github.com/OpenZeppelin/openzeppelin-contract-loader
const ChromaFive = contract.fromArtifact('../../../../../cc-dapp/src/contracts/chroma/ChromaFive');
const ChromaFour = contract.fromArtifact('../../../../../cc-dapp/src/contracts/chroma/ChromaFour');
const ChromaThree = contract.fromArtifact('../../../../../cc-dapp/src/contracts/chroma/ChromaThree');
const ChromaTwo = contract.fromArtifact('../../../../../cc-dapp/src/contracts/chroma/ChromaTwo');
const ChromaOne = contract.fromArtifact('../../../../../cc-dapp/src/contracts/chroma/ChromaOne');
const Utils = contract.fromArtifact('../../../../../cc-dapp/src/contracts/chroma/Utils');
async function deployUtils(ownerAccount) {
	return await Utils.new({ from: ownerAccount });
};
async function deployChroma(ownerAccount, contract) {
	const utils = await Utils.new({ from: ownerAccount });
	await contract.detectNetwork();
	await contract.link('Utils', utils.address);
	return await contract.new({ from: ownerAccount });
};
async function deployChromaOne(ownerAccount) { return await deployChroma(ownerAccount, ChromaOne); };
async function deployChromaTwo(ownerAccount) { return await deployChroma(ownerAccount, ChromaTwo); };
async function deployChromaThree(ownerAccount) { return await deployChroma(ownerAccount, ChromaThree); };
async function deployChromaFour(ownerAccount) { return await deployChroma(ownerAccount, ChromaFour); };
async function deployChromaFive(ownerAccount) { return await deployChroma(ownerAccount, ChromaFive); };
async function deployAllChromas(ownerAccount) {
	return {
		'1': await deployChromaOne(ownerAccount),
		'2': await deployChromaTwo(ownerAccount),
		'3': await deployChromaThree(ownerAccount),
		'4': await deployChromaFour(ownerAccount),
		'5': await deployChromaFive(ownerAccount),
	}
};

async function _mintChromas(chromaInstance, chromasToMint, options = { mintsPerSource: 1, mintsPerBuilt: 1 }) {
	let result = [];
	const singleInstance = chromaInstance.address != undefined;
	let instance = singleInstance ? chromaInstance : null;
	let gridSize = singleInstance ? parseInt((await instance.getConfig()).gridSize) : 0;
	let gridCounts = {};
	for (let i = 0; i < chromasToMint.length; ++i) {
		const mint = chromasToMint[i];
		if (!singleInstance) {
			gridSize = mint.gridSize ?? 0;
			instance = chromaInstance[gridSize];
		}
		expect(gridSize, `_mintChromas[${i}] undefined gridSize`).greaterThan(0);
		expect(instance != null && instance != undefined, `_mintChromas[${i}](${gridSize}) null instance`).equal(true);
		expectEvent(await _buyChroma(instance, mint.account, mint.quantity, mint.build), 'Transfer');
		for (let j = 1; j <= mint.quantity; ++j) {
			gridCounts[gridSize] = gridCounts[gridSize] === undefined ? 1 : gridCounts[gridSize] + 1;
			const tokenId = gridCounts[gridSize];
			const batchId = _toBatchId(gridSize, tokenId);
			const allowedMints = mint.build ? options.mintsPerBuilt : options.mintsPerSource;
			result.push({
				gridSize,
				tokenId,
				batchId,
				built: mint.build,
				account: mint.account,
				otherAccount: mint.account == accounts[1] ? accounts[2] : accounts[1],
				allowedMints,
			});
		}
	}
	return result;
};

async function _buyChroma(contract, to, quantity, build) {
	const price_bn = (await contract.calculatePriceForQuantity(quantity)); // wei 1e18 (BN)
	//const gwei_str = web3.utils.fromWei(price_bn.toString(), 'gwei');
	const result = await contract.buyCode(to, quantity, build, { from: to, value: price_bn.toString() });
	return result;
}


//--------------------------
// Chroma Batch
//
const BATCHM = 10000;
const ChromaBatch = contract.fromArtifact('ChromaBatch');
async function deployChromaBatch(ownerAccount, seriesNumbers, chromaInstances) {
	const contractAddresses = chromaInstances.map(instance => {
		return instance.address
	});
	return await ChromaBatch.new(seriesNumbers, contractAddresses, { from: ownerAccount });
};
function _toBatchId(gridSize, tokenId) {
	return (parseInt(gridSize) * BATCHM) + tokenId;
}
function _fromBatchId(batchTokenId) {
	return [
		Math.floor(batchTokenId / BATCHM),  //gridSize
		batchTokenId % BATCHM,              // tokenId
	];
}




//--------------------------
// Misc
//
function _isBN(object) {
	return BN.isBN(object) || object instanceof BN;
}
function _bnToHash(bn, size = 32) {
	const hex = '0'.repeat(size).concat(bn.toJSON()); // toJSON() = toString(16)
	return `0x${hex.slice(-size)}`;
}

function AddParamsToUrl(url, params) {
	// remove empty params
	for (var key in params) {
		if (params[key] === null || params[key] === undefined || (typeof params[key] === 'string' && params[key].length == 0)) {
			delete params[key];
		}
	}
	if (Object.keys(params).length > 0) {
		return url + '?' + (new URLSearchParams(params)).toString();
	}
	return url;
}
async function Fetch(url, method, params, options) {
	if ('GET' === method) {
		url = AddParamsToUrl(url, params);
	} else {
		options.body = JSON.stringify(params);
	}
	options.method = method;
	return await fetch(url, options);
}
async function FetchJson(url, method = 'GET', params = {}, options = {}) {
	let result = {}
	await Fetch(url, method, params, options)
		.then(response => response.json())
		.then(data => { result = data })
		.catch(error => { result = { error: error } });
	return result;
}





//--------------------------
// Exports
//
module.exports = {
	// Euclid
	deployEuclid,
	_giftCode,
	_claimCode,
	_buyCode,
	_getWhitelistedTokens,
	// Chroma
	deployUtils,
	deployChromaOne,
	deployChromaTwo,
	deployChromaThree,
	deployChromaFour,
	deployChromaFive,
	deployAllChromas,
	_mintChromas,
	_buyChroma,
	// ChromaBatch
	deployChromaBatch,
	_toBatchId,
	_fromBatchId,
	// Misc
	_isBN,
	_bnToHash,
	FetchJson,
};

