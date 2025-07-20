// OpenZeppelin test suite
// https://docs.openzeppelin.com/test-environment/0.1/migrating-from-truffle
// https://github.com/OpenZeppelin/openzeppelin-test-helpers
// https://github.com/OpenZeppelin/openzeppelin-test-environment
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const [owner, accountOne, accountTwo, accountThree, vault] = accounts;
// https://www.chaijs.com/api/bdd/
const { expect } = require('chai');
require('chai').should();
// https://mochajs.org/
// describe({ it({}) })

const { deployEuclid, _giftCode, _claimCode, _buyCode, _getWhitelistedTokens } = require('./deployments.js');
const { deployChromaBatch, deployAllChromas, deployChromaFive, _mintChromas, _buyChroma, _toBatchId } = require('./deployments.js');
const { _isBN, _bnToHash, FetchJson } = require('./deployments.js');

async function _tokenURI(contract, tokenNumber, options = {}) {
	const tokenInfo = await contract.getTokenInfo(owner, tokenNumber);
	const tokenId = parseInt(tokenInfo.tokenId);
	const uri = contract.tokenURI(tokenId, { from: options.from ?? owner });
	return uri;
}
function _getHashFromTokenURI(uri) {
	let match = uri.match(new RegExp('&hash=0x([0-9a-fA-F]*)'));
	return match.length > 0 ? ('0x' + match[1].toLowerCase()) : null;
}
function _getFormulaFromTokenURI(uri) {
	let match = uri.match(new RegExp('&formula=([0-9a-zA-Z\.]*)'));
	return match.length > 0 ? match[1] : null;
}

// Extract events from transaction receipt
// see function inLogs in: https://github.com/OpenZeppelin/openzeppelin-test-helpers/blob/master/src/expectEvent.js
function _getEventArgs(receipt, eventName = null) {
	let result = [];
	const events = eventName ? receipt.logs.filter(e => e.event === eventName) : [...receipt.logs];
	events.forEach(function (event) {
		let ev = {
			name: event.event,
			args: {},
		}
		Object.keys(event.args).forEach(function (key) {
			if (isNaN(parseInt(key[0])) && key[0] != '_') {
				const value = event.args[key];
				ev.args[key] = _isBN(value) ? _bnToHash(value) : value;
			}
		});
		result.push(ev);
	});
	// console.log(result);
	return result;
}

//-----------------------------------------------------------------------------------------
//
// UNIT TESTS
//

describe('Euclid', () => {

	//--------------------------------------------------------------------
	// Each test has a single instance
	//
	describe('# misc instances', async () => {
		let instance = null;
		beforeEach(async function () {
			instance = await deployEuclid(1870, owner);
		});

		it('phases', async () => {
			// mint some chroma
			const chromaInstance = await deployChromaFive(owner);
			await instance.setupWhitelistContract(chromaInstance.address, 1, 3, { from: owner });
			expectEvent(await chromaInstance.giftCode(owner, { from: owner }), 'Transfer');
			expectEvent(await _buyChroma(chromaInstance, owner, 2, false), 'Transfer');
			// starts paused
			expect(parseInt((await instance.getState()).phase), 'Starting phase is not Paused (0)').equal(0);
			await expectRevert(_buyCode(instance, owner, 1), 'CC:Unreleased');
			await expectRevert(_buyCode(instance, accountOne, 1), 'CC:Unreleased');
			// giftCode is independent of phase
			expectEvent(await _giftCode(instance, owner), 'Minted');
			await expectRevert(_claimCode(instance, owner, [1], 1), 'CC:ChromiumSaleIsPaused');
			await expectRevert(_buyCode(instance, owner, 1), 'CC:PublicSaleIsPaused');
			// whitelist / only owner
			await expectRevert(instance.setPhase(1, 0, 0, { from: accountOne }), 'Ownable: caller is not the owner');
			await expectRevert(instance.setPhase(1, 0, 0, { from: accountTwo }), 'Ownable: caller is not the owner');
			expectEvent(await instance.setPhase(1, 0, 0, { from: owner }), 'ChangedPhase', { phase: '1' });
			expect(parseInt((await instance.getState()).phase), 'Phase did not change to (1)').equal(1);
			expectEvent(await _giftCode(instance, owner), 'Minted');
			expectEvent(await _claimCode(instance, owner, [1], 1), 'Minted');
			await expectRevert(_buyCode(instance, owner, 1), 'CC:PublicSaleIsPaused');
			// pause
			expectEvent(await instance.setPhase(0, 0, 0, { from: owner }), 'ChangedPhase', { phase: '0' });
			expect(parseInt((await instance.getState()).phase), 'Phase did not change to (0)').equal(0);
			expectEvent(await _giftCode(instance, owner), 'Minted');
			await expectRevert(_claimCode(instance, owner, [1], 1), 'CC:ChromiumSaleIsPaused');
			await expectRevert(_buyCode(instance, owner, 1), 'CC:PublicSaleIsPaused');
			// public
			expectEvent(await instance.setPhase(2, 0, 0, { from: owner }), 'ChangedPhase', { phase: new BN(2) });
			expect(parseInt((await instance.getState()).phase), 'Phase did not change to (2)').equal(2);
			expectEvent(await _giftCode(instance, owner), 'Minted');
			expectEvent(await _claimCode(instance, owner, [2], 1), 'Minted');
			expectEvent(await _buyCode(instance, owner, 1), 'Minted');
			// pause
			expectEvent(await instance.setPhase(0, 0, 0, { from: owner }), 'ChangedPhase', { phase: '0' });
			expect(parseInt((await instance.getState()).phase), 'Phase did not change to (0)').equal(0);
			expectEvent(await _giftCode(instance, owner), 'Minted');
			await expectRevert(_claimCode(instance, owner, [1], 1), 'CC:ChromiumSaleIsPaused');
			await expectRevert(_buyCode(instance, owner, 1), 'CC:PublicSaleIsPaused');
		});

		it('prices', async () => {
			const state = await instance.getState();
			const maxBuyout_bn = new BN(state.maxBuyout);
			const initialPriceEthPhase1 = 0.05;
			const initialPriceEthPhase2 = 0.168;
			const initialPriceWeiPhase1 = new BN(web3.utils.toWei(initialPriceEthPhase1.toString(), 'ether'));
			const initialPriceWeiPhase2 = new BN(web3.utils.toWei(initialPriceEthPhase2.toString(), 'ether'));
			const initialPricePweiPhase1 = new BN(web3.utils.fromWei(initialPriceWeiPhase1, 'finney'));
			const initialPricePweiPhase2 = new BN(web3.utils.fromWei(initialPriceWeiPhase2, 'finney'));
			// initial price
			for (let phase = 1; phase <= 2; ++phase) {
				const expectedInitialPriceEth = (phase == 1 ? initialPriceEthPhase1 : initialPriceEthPhase2);
				const initialPriceWei = await instance.calculatePriceForQuantity(1, phase);
				const initialPricePwei = new BN(web3.utils.fromWei(initialPriceWei.toString(), 'finney'));
				const initialPriceEth = parseFloat(web3.utils.fromWei(initialPriceWei));
				expect(initialPriceEth, `Initial price (${initialPriceWei}) != (${expectedInitialPriceEth})`).equal(expectedInitialPriceEth);
				const storedPrice = (phase == 1 ? (await instance.getState()).price1 : (await instance.getState()).price2);
				expect(storedPrice, 'Starting price wrong').to.be.a.bignumber.equal(initialPricePwei);
			}
			// release, no price change, price is stored in Pwei
			expectEvent(await _giftCode(instance, owner), 'Minted');
			for (let phase = 1; phase <= 2; ++phase) {
				expectEvent(await instance.setPhase(phase, 0, 0, { from: owner }), 'ChangedPhase', {
					phase: phase.toString(),
					price1: initialPricePweiPhase1,
					price2: initialPricePweiPhase2,
				});
				const currentPriceWei = await instance.calculatePriceForQuantity(1, phase);
				const currentPricePwei = new BN(web3.utils.fromWei(currentPriceWei.toString(), 'finney'));
				let price = await instance.calculatePriceForQuantity(1, phase);
				let calculatedPrice = await instance.calculatePriceForQuantity(1, phase);
				let calculatedPriceMax = await instance.calculatePriceForQuantity(maxBuyout_bn, phase);
				expect(price, `Price changed (${price.toString()}) != (${currentPriceWei.toString()})`).to.be.a.bignumber.equal(currentPriceWei);
				expect(calculatedPrice, `CalculatedPrice changed `).to.be.a.bignumber.equal(currentPriceWei);
				expect(calculatedPriceMax, `CalculatedPriceMax changed`).to.be.a.bignumber.equal(currentPriceWei.mul(maxBuyout_bn));
				const storedPrice = (phase == 1 ? (await instance.getState()).price1 : (await instance.getState()).price2);
				expect(storedPrice, 'Starting price wrong').to.be.a.bignumber.equal(currentPricePwei);
			}
			// price changes
			for (let phase = 1; phase <= 2; ++phase) {
				// reset to initial
				expectEvent(await instance.setPhase(0, initialPricePweiPhase1, initialPricePweiPhase2, { from: owner }), 'ChangedPhase', {
					phase: '0',
					price1: initialPricePweiPhase1,
					price2: initialPricePweiPhase2,
				});
				expect((await instance.getState()).price1, 'New price wrong').to.be.a.bignumber.equal(initialPricePweiPhase1);
				expect((await instance.getState()).price2, 'New price wrong').to.be.a.bignumber.equal(initialPricePweiPhase2);
				// change once
				let newPriceWei = new BN(web3.utils.toWei('0.222', 'ether'));
				let newPricePwei = new BN(web3.utils.fromWei(newPriceWei, 'finney'));
				expectEvent(await instance.setPhase(phase, phase == 1 ? newPricePwei : 0, phase == 2 ? newPricePwei : 0, { from: owner }), 'ChangedPhase', {
					phase: phase.toString(),
					price1: phase == 1 ? newPricePwei : initialPricePweiPhase1,
					price2: phase == 2 ? newPricePwei : initialPricePweiPhase2,
				});
				let price = await instance.calculatePriceForQuantity(1, phase);
				let calculatedPrice = await instance.calculatePriceForQuantity(1, phase);
				let calculatedPriceMax = await instance.calculatePriceForQuantity(maxBuyout_bn, phase);
				expect(price, `New price (${price.toString()}) != (${newPriceWei.toString()})`).to.be.a.bignumber.equal(newPriceWei);
				expect(calculatedPrice, `CalculatedPrice new`).to.be.a.bignumber.equal(newPriceWei);
				expect(calculatedPriceMax, `CalculatedPriceMax new `).to.be.a.bignumber.equal(newPriceWei.mul(maxBuyout_bn));
				let storedPrice = (phase == 1 ? (await instance.getState()).price1 : (await instance.getState()).price2);
				expect(storedPrice, 'New price wrong').to.be.a.bignumber.equal(newPricePwei);
				// increase price
				newPriceWei = new BN(web3.utils.toWei('0.333', 'ether'));
				newPricePwei = new BN(web3.utils.fromWei(newPriceWei, 'finney'));
				expectEvent(await instance.setPhase(phase, phase == 1 ? newPricePwei : 0, phase == 2 ? newPricePwei : 0, { from: owner }), 'ChangedPhase', {
					phase: phase.toString(),
					price1: phase == 1 ? newPricePwei : initialPricePweiPhase1,
					price2: phase == 2 ? newPricePwei : initialPricePweiPhase2,
				});
				price = await instance.calculatePriceForQuantity(1, phase);
				calculatedPrice = await instance.calculatePriceForQuantity(1, phase);
				calculatedPriceMax = await instance.calculatePriceForQuantity(maxBuyout_bn, phase);
				expect(price, `New price (${price.toString()}) != (${newPriceWei.toString()})`).to.be.a.bignumber.equal(newPriceWei);
				expect(calculatedPrice, `CalculatedPrice new`).to.be.a.bignumber.equal(newPriceWei);
				expect(calculatedPriceMax, `CalculatedPriceMax new`).to.be.a.bignumber.equal(newPriceWei.mul(maxBuyout_bn));
				storedPrice = (phase == 1 ? (await instance.getState()).price1 : (await instance.getState()).price2);
				expect(storedPrice, 'New price wrong').to.be.a.bignumber.equal(newPricePwei);
				// change phase only, no price change
				expectEvent(await instance.setPhase(0, 0, 0, { from: owner }), 'ChangedPhase', {
					phase: '0',
					price1: phase == 1 ? newPricePwei : initialPricePweiPhase1,
					price2: phase == 2 ? newPricePwei : initialPricePweiPhase2,
				});
				price = await instance.calculatePriceForQuantity(1, phase);
				calculatedPrice = await instance.calculatePriceForQuantity(1, phase);
				calculatedPriceMax = await instance.calculatePriceForQuantity(maxBuyout_bn, phase);
				expect(price, `Price changed (${price.toString()}) != (${newPriceWei.toString()})`).to.be.a.bignumber.equal(newPriceWei);
				expect(calculatedPrice, `CalculatedPrice changed`).to.be.a.bignumber.equal(newPriceWei);
				expect(calculatedPriceMax, `CalculatedPriceMax changed`).to.be.a.bignumber.equal(newPriceWei.mul(maxBuyout_bn));
				expect(storedPrice, 'New price wrong').to.be.a.bignumber.equal(newPricePwei);
			}
		});

		it('mint events', async () => {
			// giftCode is independent of phase
			let receipt = await instance.giftCode(owner, 1, { from: owner });
			expectEvent(receipt, 'Minted', { to: owner, tokenNumber: '0', tokenId: '0' });
			expectEvent(receipt, 'Transfer', { to: owner, tokenId: '0' });
			// buy one
			expectEvent(await instance.setPhase(2, 0, 0, { from: owner }), 'ChangedPhase');
			receipt = await _buyCode(instance, accountOne, 1)
			expectEvent(receipt, 'Minted', { to: accountOne, tokenNumber: '1' });
			expectEvent(receipt, 'Transfer', { to: accountOne });
			// buy many
			const state = await instance.getState();
			const maxBuyout = parseInt(state.maxBuyout);
			receipt = await _buyCode(instance, accountTwo, maxBuyout)
			for (let i = 1; i <= maxBuyout; ++i) {
				expectEvent(receipt, 'Minted', { to: accountTwo, tokenNumber: new BN(1 + i) });
				expectEvent(receipt, 'Transfer', { to: accountTwo });
			}
		});

		it('giftCode()', async () => {
			// only owner can gift
			await expectRevert(instance.giftCode(accountOne, 1, { from: accountOne }), 'Ownable: caller is not the owner');
			await expectRevert(instance.giftCode(owner, 1, { from: accountOne }), 'Ownable: caller is not the owner');
			await expectRevert(instance.giftCode(owner, 5, { from: accountOne }), 'Ownable: caller is not the owner');
			expectEvent(await instance.giftCode(owner, 1, { from: owner }), 'Minted');
			await expectRevert(instance.giftCode(accountOne, 1, { from: accountOne }), 'Ownable: caller is not the owner');
			await expectRevert(instance.giftCode(accountOne, 5, { from: accountOne }), 'Ownable: caller is not the owner');
			await expectRevert(instance.giftCode(owner, 1, { from: accountOne }), 'Ownable: caller is not the owner');
			await expectRevert(instance.giftCode(owner, 5, { from: accountOne }), 'Ownable: caller is not the owner');
			// Can gift only once??
			// await expectRevert(instance.giftCode(owner, { from: owner }), 'CC:AlreadyReleased');
			// gift freely, including to others
			expectEvent(await instance.giftCode(owner, 1, { from: owner }), 'Minted');
			expectEvent(await instance.giftCode(accountOne, 1, { from: owner }), 'Minted');
		});

		it('giftCode() multiples', async () => {
			expectEvent(await instance.giftCode(owner, 1, { from: owner }), 'Minted');
			let totalSupply = (await instance.totalSupply()).toNumber();
			expect(totalSupply).equal(1);
			// gift more
			await expectRevert(instance.giftCode(owner, 5, { from: accountOne }), 'Ownable: caller is not the owner');
			expectEvent(await instance.giftCode(owner, 5, { from: owner }), 'Minted');
			expectEvent(await instance.giftCode(accountOne, 5, { from: owner }), 'Minted');
			totalSupply = (await instance.totalSupply()).toNumber();
			expect(totalSupply).equal(11);
			// token ids not in order
			expect(parseInt((await instance.getTokenInfo(owner, 0)).tokenId)).equal(0);
			for (let i = 1; i <= totalSupply; ++i) {
				expect(parseInt((await instance.getTokenInfo(owner, i)).tokenId)).not.equal(i);
			}
		});

		it('giftCode() start multiples', async () => {
			expectEvent(await instance.giftCode(owner, 5, { from: owner }), 'Minted');
			totalSupply = (await instance.totalSupply()).toNumber();
			expect(totalSupply).equal(5);
			// token ids not in order
			expect(parseInt((await instance.getTokenInfo(owner, 0)).tokenId)).equal(0);
			for (let i = 1; i <= totalSupply; ++i) {
				expect(parseInt((await instance.getTokenInfo(owner, i)).tokenId)).not.equal(i);
			}
		});

		it('buyCode()', async () => {
			// not before giftCode()
			expectEvent(await _giftCode(instance, owner), 'Minted');
			expectEvent(await instance.setPhase(2, 0, 0, { from: owner }), 'ChangedPhase');
			// now everyone can, including to others
			expectEvent(await _buyCode(instance, accountOne, 1), 'Minted');
			expectEvent(await _buyCode(instance, accountOne, 2), 'Minted');
			expectEvent(await _buyCode(instance, accountOne, 3), 'Minted');
			expectEvent(await _buyCode(instance, owner, 1), 'Minted');
			expectEvent(await _buyCode(instance, owner, 2), 'Minted');
			expectEvent(await _buyCode(instance, owner, 3), 'Minted');
			expectEvent(await _buyCode(instance, accountTwo, 5), 'Minted');
			expectEvent(await _buyCode(instance, accountTwo, 2), 'Minted');
			expectEvent(await _buyCode(instance, accountTwo, 3), 'Minted');
			// Only Owner can buy for free / any price
			expectEvent(await instance.buyCode(owner, 2, { from: owner, value: '0' }), 'Minted');
			expectEvent(await instance.buyCode(owner, 2, { from: owner, value: '99' }), 'Minted');
			expectEvent(await instance.buyCode(accountOne, 2, { from: owner, value: '0' }), 'Minted');
			expectEvent(await instance.buyCode(accountOne, 2, { from: owner, value: '99' }), 'Minted');
			const supplyBeforeReverts = (await instance.totalSupply()).toNumber();
			await expectRevert(instance.buyCode(owner, 1, { from: accountOne, value: '0' }), 'CC:BadValue');
			await expectRevert(instance.buyCode(owner, 1, { from: accountOne, value: '0.01' }), 'CC:BadValue');
			await expectRevert(instance.buyCode(owner, 1, { from: accountOne, value: '999' }), 'CC:BadValue');
			await expectRevert(instance.buyCode(accountOne, 1, { from: accountOne, value: '0' }), 'CC:BadValue');
			await expectRevert(instance.buyCode(accountOne, 1, { from: accountOne, value: '0.01' }), 'CC:BadValue');
			await expectRevert(instance.buyCode(accountOne, 1, { from: accountOne, value: '999' }), 'CC:BadValue');
			// reverts
			await expectRevert(_buyCode(instance, accountOne, 0), 'CC:QuantityNotAvailable');
			// Supply does not change after reverts
			const supplyAfterReverts = (await instance.totalSupply()).toNumber();
			expect(supplyAfterReverts, 'Supply must not change after reverts').equal(supplyBeforeReverts);
		});

		it('balance', async () => {
			expect((await instance.balanceOf(owner)).toNumber(), 'Invalid initial balance').equal(0);
			expect((await instance.balanceOf(accountOne)).toNumber(), 'Invalid initial balance').equal(0);
			expect((await instance.balanceOf(accountTwo)).toNumber(), 'Invalid initial balance').equal(0);
			expectEvent(await _giftCode(instance, owner), 'Minted');
			expectEvent(await instance.setPhase(2, 0, 0, { from: owner }), 'ChangedPhase');
			expectEvent(await _buyCode(instance, accountOne, 1), 'Minted');
			expectEvent(await _buyCode(instance, accountOne, 2, { from: owner }), 'Minted');
			expectEvent(await _buyCode(instance, accountOne, 3, { from: accountTwo }), 'Minted');
			expectEvent(await _buyCode(instance, owner, 1), 'Minted');
			expectEvent(await _buyCode(instance, owner, 2, { from: accountOne }), 'Minted');
			expectEvent(await _buyCode(instance, owner, 3, { from: accountTwo }), 'Minted');
			expectEvent(await _buyCode(instance, accountTwo, 5), 'Minted');
			expectEvent(await _buyCode(instance, accountTwo, 2, { from: owner }), 'Minted');
			expectEvent(await _buyCode(instance, accountTwo, 3, { from: accountOne }), 'Minted');
			expect((await instance.balanceOf(owner)).toNumber(), 'Invalid balance').equal(7);
			expect((await instance.balanceOf(accountOne)).toNumber(), 'Invalid balance').equal(6);
			expect((await instance.balanceOf(accountTwo)).toNumber(), 'Invalid balance').equal(10);
		});

		it('mintCode()', async () => {
			// internal, cannot be called!
			// https://www.chaijs.com/api/bdd/#method_throw
			expect(function () { instance.mintCode(accountOne, 1, { from: accountOne }); }).to.throw(TypeError);
			expect(function () { instance.mintCode(owner, 1, { from: owner }); }).to.throw(TypeError);
		});

		it('tokenURI()', async () => {
			let uris = [];
			// mint 0
			await expectRevert(instance.tokenURI(0, { from: accountOne }), 'CC:BadTokenId');
			expectEvent(await _giftCode(instance, owner), 'Minted');
			expectEvent(await instance.setPhase(2, 0, 0, { from: owner }), 'ChangedPhase');
			// mint 1
			await expectRevert(instance.tokenURI(1, { from: accountOne }), 'CC:BadTokenId');
			await expectRevert(instance.tokenURI(2, { from: accountOne }), 'CC:BadTokenId');
			expectEvent(await _buyCode(instance, accountOne, 1), 'Minted');
			// id 1 should not be issued yet, but some random id
			await expectRevert(instance.tokenURI(1, { from: accountOne }), 'CC:BadTokenId');
			// mint some more
			expectEvent(await _buyCode(instance, accountOne, 1), 'Minted');
			expectEvent(await _buyCode(instance, accountTwo, 1), 'Minted');
			expectEvent(await _buyCode(instance, owner, 1), 'Minted');
			uris.push(await instance.tokenURI(0, { from: accountOne }));
			uris.push(await _tokenURI(instance, 1, { from: owner }));
			uris.push(await _tokenURI(instance, 2, { from: accountTwo }));
			uris.push(await _tokenURI(instance, 3, { from: accountTwo }));
			uris.push(await _tokenURI(instance, 4, { from: accountTwo }));
			for (let i = 0; i < uris.length; ++i) {
				const uri = uris[i];
				expect(uri.startsWith('https://collect-code.com/api/token/euclid/'), `token URi [${i}](${uri}) not properly formatted`).equal(true);
			}
		});

		it('mint event validation', async () => {
			let events = [];
			events.push(_getEventArgs(await _giftCode(instance, accounts[0]), 'Minted'));
			expectEvent(await instance.setPhase(2, 0, 0, { from: owner }), 'ChangedPhase');
			events.push(_getEventArgs(await _buyCode(instance, accounts[1], 1), 'Minted'));
			events.push(_getEventArgs(await _buyCode(instance, accounts[2], 1), 'Minted'));
			for (let i = 0; i < events.length; ++i) {
				const args = events[i][0].args;
				const to = accounts[i];
				const tokenNumber = i;
				const tokenInfo = await instance.getTokenInfo(owner, tokenNumber);
				const tokenId = parseInt(tokenInfo.tokenId);
				const hash = _bnToHash(new BN(tokenInfo.hash));
				expect(to, `Logged to [${i}](${to}) is not (${args.to})`).equal(args.to);
				expect(tokenNumber, `Logged token number [${i}](${tokenNumber}) is not (${args.tokenNumber})`).equal(parseInt(args.tokenNumber, 16));
				expect(tokenId, `Logged token id [${i}](${tokenId}) is not (${args.tokenId})`).equal(parseInt(args.tokenId, 16));
				expect(hash, `Logged hash [${i}](${hash}) is not (${args.hash})`).equal(args.hash);
			}
		});

		it('tokenURI() hash validation', async () => {
			// format: https://collect-code.com/api/token/euclid/0/metadata?v=1&hash=0x2bfa8b9cdeb52253d4be777db18498b2
			expectEvent(await _giftCode(instance, owner), 'Minted');
			expectEvent(await instance.setPhase(2, 0, 0, { from: owner }), 'ChangedPhase');
			expectEvent(await _buyCode(instance, accountOne, 1), 'Minted');
			expectEvent(await _buyCode(instance, accountOne, 1), 'Minted');
			expectEvent(await _buyCode(instance, accountTwo, 1), 'Minted');
			expectEvent(await _buyCode(instance, accountTwo, 1), 'Minted');
			for (let i = 0; i < 5; ++i) {
				const uri = await _tokenURI(instance, i);
				// Validate Hash
				const hash = _getHashFromTokenURI(uri);
				expect(hash, 'tokenURI does not contain a hash').not.equal(null);
				expect(hash.length, 'tokenURI hash invalid size').equal(34);
				expect(hash, 'tokenURI has is Zero').not.equal(constants.ZERO_ADDRESS);
				// Match stored
				const tokenInfo = await instance.getTokenInfo(owner, i);
				const tokenHash = _bnToHash(new BN(tokenInfo.hash));
				expect(hash, 'tokenURI hash divergence').equal(tokenHash);
			}
		});

		it('tokenURI() Formula validation', async () => {
			// format: https://collect-code.com/api/token/euclid/0/metadata?v=1&hash=0x2bfa8b9cdeb52253d4be777db18498b2
			expectEvent(await _giftCode(instance, owner), 'Minted');
			expectEvent(await instance.setPhase(2, 0, 0, { from: owner }), 'ChangedPhase');
			for (let i = 0; i < 10; ++i) {
				// mint
				if (i > 0) {
					expectEvent(await _buyCode(instance, accountOne, 1), 'Minted');
				}
				// Validate formula
				const tokenInfo = await instance.getTokenInfo(owner, i);
				const tokenId = parseInt(tokenInfo.tokenId);
				const uri = await _tokenURI(instance, i);
				const hash = _getHashFromTokenURI(uri);
				const formula = _getFormulaFromTokenURI(uri);
				expect(formula, 'tokenURI does not contain a formula').not.equal(null);
				expect(formula.length, 'tokenURI formula invalid size').greaterThan(0);
				// Validate Formula
				const url = 'http://localhost:3000/api/x/euclidformula';
				const fetchFormula = await FetchJson(url, 'GET', {
					hash,
					tokenId,
				});
				expect(fetchFormula.error, `Fetch error [${fetchFormula.error}]`).equal(undefined);
				expect(fetchFormula.formula.length).greaterThan(0);
				// console.log(formula);
				// console.log(fetchFormula.formula);
				// expect(formula).equal(fetchFormula.formula.slice(0, formula.length));
				expect(formula).equal(fetchFormula.formula);
			}
		});

	});




	//--------------------------------------------------------------------
	// Each test share the same instance
	//
	describe('# buy out instance', async () => {
		let instance, maxBuyout, maxSupply, leftover, initialPriceWei;
		let mintedCount = 0;
		let tokenIds = [];
		let hashes = [];
		let ethContractStart, ethAccountOneStart, ethVaultStart;

		before(async function () {
			instance = await deployEuclid(40, owner);
			const state = await instance.getState();
			maxBuyout = parseInt(state.maxBuyout);
			maxSupply = parseInt(state.maxSupply);
			leftover = Math.max(2, Math.floor(maxBuyout / 2));
			initialPriceWei = await instance.calculatePriceForQuantity(1, 2);
		});

		it('initial states', async () => {
			const totalSupply = (await instance.totalSupply()).toNumber();
			expect(totalSupply, `Initial supply (${totalSupply}) not zero`).equal(0);
			const mintedIds = (await instance.getMintedTokenIds(0, 0));
			expect(mintedIds.length, 'getMintedTokenIds does not match').equal(0);
			const prices = await instance.getPrices(2);
			expect(prices.length, `getPrices() (${prices.length}) should be empty`).equal(0);
			const state = await instance.getState();
			expect(parseInt(state.mintedCount), 'Starting minted count wrong').equal(0);
			expect(parseInt(state.availableSupply), 'Starting available supply wrong').equal(maxSupply);
		});

		it(`release`, async () => {
			expectEvent(await _giftCode(instance, owner), 'Minted');
			expectEvent(await instance.setPhase(2, 0, 0, { from: owner }), 'ChangedPhase');
			ethContractStart = new BN(await web3.eth.getBalance(instance.address));
			ethAccountOneStart = new BN(await web3.eth.getBalance(accountOne));
			ethVaultStart = new BN(await web3.eth.getBalance(vault));
			const totalSupply = (await instance.totalSupply()).toNumber();
			expect(totalSupply, `Released supply (${totalSupply}) not 1`).equal(1);
			const mintedIds = (await instance.getMintedTokenIds(0, 0));
			expect(mintedIds.length, 'getMintedTokenIds does not match').equal(1);
		});

		it('getPrices', async () => {
			const prices = await instance.getPrices(2);
			_test_prices(prices, maxBuyout, initialPriceWei);
			expect(parseInt((await instance.getState()).availableSupply), 'Released available supply wrong').equal(maxSupply);
		});
		function _test_prices(prices, quantity, unitPrice) {
			expect(prices.length, `getPrices() length (${prices.length}) should be (${quantity})`).equal(quantity);
			for (let i = 0; i < quantity; ++i) {
				const expectedPrice = unitPrice.mul(new BN(i + 1));
				expect(prices[i], `Price [${i}](${prices[i].toString()}) should be (${expectedPrice.toString()})`).to.be.bignumber.equal(expectedPrice);
			}
		}

		it(`max supply`, async () => {
			expect(maxSupply, 'bad maxSupply').greaterThan(0);
			expect(maxSupply, 'bad maxSupply <> maxBuyout').greaterThan(maxBuyout);
		});

		it('maxBuyout', async () => {
			expect(maxBuyout, 'bad maxBuyout').greaterThan(0);
			// test buy out limit
			await expectRevert(_buyCode(instance, accountOne, maxBuyout + 1), 'CC:QuantityNotAvailable');
			expectEvent(await _buyCode(instance, accountOne, maxBuyout), 'Minted');
			mintedCount = maxBuyout;
		});

		it('getState (maxBuyout)', async () => {
			const state = await instance.getState();
			expect(parseInt(state.mintedCount), 'Minted count wrong').equal(mintedCount);
			expect(parseInt(state.availableSupply), 'Available supply wrong').equal(maxSupply - mintedCount);
		});

		it(`ETH Balance`, async () => {
			const ethSpent = new BN(await instance.calculatePriceForQuantity(mintedCount, 2));
			const ethContract = new BN(await web3.eth.getBalance(instance.address));
			const ethAccountOne = new BN(await web3.eth.getBalance(accountOne));
			const ethAccountOneExpected = ethAccountOneStart.sub(ethSpent);
			expect(ethContractStart, 'Contract start ETH balance is not zero').to.be.a.bignumber.that.is.zero;
			expect(ethContract, 'Contract ETH balance is incorrect').to.be.a.bignumber.equal(ethSpent);
			expect(ethAccountOne, 'Spender ETH balance is incorrect').to.be.a.bignumber.below(ethAccountOneExpected);
		});

		it(`ETH Payee`, async () => {
			const percentage = 75;
			const quantity = 2;
			const msgValue = new BN(await instance.calculatePriceForQuantity(quantity, 2));
			const msgFee = msgValue.div(new BN(100)).mul(new BN(percentage));
			let ethContract = new BN(await web3.eth.getBalance(instance.address));
			// reverts
			await expectRevert(instance.setPayee(accountOne, 100, { from: accountOne }), 'Ownable: caller is not the owner');
			// null percentage
			await instance.setPayee(vault, 0, { from: owner });
			expectEvent(await _buyCode(instance, accountOne, quantity), 'Minted');
			expect((await web3.eth.getBalance(instance.address))).to.be.a.bignumber.equal(ethContract.add(msgValue));
			expect((await web3.eth.getBalance(vault))).to.be.a.bignumber.equal(ethVaultStart);
			ethContract = ethContract.add(msgValue);
			mintedCount += quantity;
			// null address
			await instance.setPayee(constants.ZERO_ADDRESS, percentage, { from: owner });
			expectEvent(await _buyCode(instance, accountOne, quantity), 'Minted');
			expect((await web3.eth.getBalance(instance.address))).to.be.a.bignumber.equal(ethContract.add(msgValue));
			expect((await web3.eth.getBalance(vault))).to.be.a.bignumber.equal(ethVaultStart);
			ethContract = ethContract.add(msgValue);
			mintedCount += quantity;
			// buy some
			await instance.setPayee(vault, percentage, { from: owner });
			expectEvent(await _buyCode(instance, accountOne, quantity), 'Minted');
			expect((await web3.eth.getBalance(instance.address))).to.be.a.bignumber.equal(ethContract.add(msgValue).sub(msgFee));
			expect((await web3.eth.getBalance(vault))).to.be.a.bignumber.equal(ethVaultStart.add(msgFee));
			mintedCount += quantity;
		});

		it(`buy out (almost)`, async () => {
			// https://mochajs.org/#timeouts
			// this.timeout(10000);
			// setTimeout(done, 10000);
			while (mintedCount < maxSupply - leftover) {
				const quantity = Math.min(maxBuyout, maxSupply - leftover - mintedCount);
				expectEvent(await _buyCode(instance, accountTwo, quantity), 'Minted');
				mintedCount += quantity;
			}
			const totalSupply = (await instance.totalSupply()).toNumber();
			expect(totalSupply, `Total supply (${totalSupply}) does not match`).equal(mintedCount + 1);
			const mintedIds = (await instance.getMintedTokenIds(0, 0));
			expect(mintedIds.length, 'Minted does not match getMintedTokenIds').equal(mintedCount + 1);
			// done();
		});

		it('getPrices (leftover)', async () => {
			const prices = await instance.getPrices(2);
			_test_prices(prices, leftover, initialPriceWei);
		});

		it('getState (leftover)', async () => {
			const state = await instance.getState();
			expect(parseInt(state.mintedCount), 'Minted count wrong').equal(mintedCount);
			expect(parseInt(state.availableSupply), 'Available supply wrong').equal(leftover);
		});

		it(`buy leftover`, async () => {
			await expectRevert(_buyCode(instance, accountOne, leftover + 1), 'CC:QuantityNotAvailable');
			expectEvent(await _buyCode(instance, accountOne, leftover), 'Minted');
			mintedCount += leftover;
		});

		it('getPrices (none)', async () => {
			const prices = await instance.getPrices(2);
			expect(prices.length, `getPrices() (${prices.length}) should be empty`).equal(0);
		});

		it('getState (none)', async () => {
			const state = await instance.getState();
			expect(parseInt(state.mintedCount), 'Minted count wrong').equal(mintedCount);
			expect(parseInt(state.availableSupply), 'Available supply wrong').equal(0);
		});

		it('sold out', async () => {
			await expectRevert(_buyCode(instance, accountOne, 1), 'CC:SoldOut');
		});

		it('total supply', async () => {
			const totalSupply = (await instance.totalSupply()).toNumber();
			expect(mintedCount, 'Minted does not match total supply').equal(totalSupply - 1);
			expect(mintedCount, 'Minted does not match maxSupply').equal(maxSupply);
		});

		it('token ids validation', async () => {
			let sortedCount = 0;
			tokenIds.push(0);
			for (let i = 1; i <= mintedCount; ++i) {
				const tokenInfo = await instance.getTokenInfo(owner, i);
				const tokenId = parseInt(tokenInfo.tokenId);
				expect(tokenId, `Minted tokenId [${i}](${tokenId}) is under 1`).greaterThanOrEqual(1);
				expect(tokenId, `Minted tokenId [${i}](${tokenId}) is over maxSupply`).lessThanOrEqual(maxSupply);
				tokenIds.push(tokenId);
				if (i == tokenId) {
					sortedCount++;
				}
			}
			const maxMatchingCount = Math.ceil(maxSupply * 0.02);
			expect(sortedCount, `token ids not properly shuffled (matching ${sortedCount} of ${maxSupply})`).lessThanOrEqual(maxMatchingCount);
		});

		it('token ids uniqueness', async () => {
			for (let i = 0; i < tokenIds.length - 1; ++i) {
				const id = tokenIds[i];
				for (let j = i + 1; j < tokenIds.length; ++j) {
					const id2 = tokenIds[j];
					expect(id, `Token Id [${i}](${id}) is equal to [${j}](${id2}`).not.equal(id2);
				}
			}
		});

		it('token ids un-shuffle', async () => {
			const sorted = [...tokenIds].sort(function (a, b) { return a - b; });
			for (let i = 0; i <= mintedCount; ++i) {
				const id = sorted[i];
				expect(id, `sorted id[${i}](${id}) is not (${i})`).equal(i);
			}
		});

		it('getMintedTokenIds()', async () => {
			const mintedIds = (await instance.getMintedTokenIds(0, 0));
			await _testMintedIds(mintedIds);
		});
		async function _testMintedIds(mintedIds) {
			expect(mintedIds.length, 'Minted does not match getMintedTokenIds').equal(maxSupply + 1);
			expect(mintedIds[0].toNumber(), `Minted id[0](${mintedIds[0].toNumber()}) != 0`).equal(0);
			for (let i = 0; i < mintedIds.length; ++i) {
				const id = mintedIds[i].toNumber();
				const expectedId = tokenIds[i];
				expect(id, `Minted id[${i}](${id}) != (${expectedId})`).equal(expectedId);
			}
		};

		it('getMintedTokenIds() pagination', async () => {
			// clamp to supply
			let mintedIds = (await instance.getMintedTokenIds(0, maxSupply * 2));
			await _testMintedIds(mintedIds);
			// ov er offset
			mintedIds = (await instance.getMintedTokenIds(999, 0));
			expect(mintedIds.length, 'Should return zero minted ids').equal(0);
			// paginate by 1
			mintedIds = [];
			for (let i = 0; i <= maxSupply; i += 1) {
				mintedIds = mintedIds.concat(await instance.getMintedTokenIds(i, 1));
			}
			await _testMintedIds(mintedIds);
			// paginate by 10
			mintedIds = [];
			for (let i = 0; i <= maxSupply; i += 10) {
				mintedIds = mintedIds.concat(await instance.getMintedTokenIds(i, 10));
			}
			await _testMintedIds(mintedIds);
			// paginate by 15
			mintedIds = [];
			for (let i = 0; i <= maxSupply; i += 15) {
				mintedIds = mintedIds.concat(await instance.getMintedTokenIds(i, 15));
			}
			await _testMintedIds(mintedIds);
		});

		it('getOwnedTokens()', async () => {
			for (let i = 0; i < accounts.length; ++i) {
				const account = accounts[i];
				const tokens = (await instance.getOwnedTokens(account));
				const tokenIds = tokens.map(x => x.toNumber());
				const balance = (await instance.balanceOf(account)).toNumber();
				expect(tokenIds.length, `Account balance mismatch`).equal(balance);
				for (let j = 0; j < tokenIds.length; ++j) {
					const owner = (await instance.ownerOf(tokenIds[j]));
					expect(owner, `Token owner is wrong`).equal(account);
				}
			}
		});

		it('hashes validation (TokenInfo)', async () => {
			const bign = new BN('ffffffffffffffffffffffffffff', 16); // 14 bytes
			expect(bign).to.be.bignumber.equal(bign);
			for (let i = 1; i <= mintedCount; ++i) {
				const tokenInfo = await instance.getTokenInfo(owner, i);
				const hash_bn = new BN(tokenInfo.hash);
				const hash = _bnToHash(hash_bn);
				expect(hash.length, `Hash [${i}](${hash}) size is wrong (${hash.length})`).equal(34);
				expect(hash_bn, `Hash [${i}](${hash}) is not a big number`).to.be.bignumber.greaterThan(bign);
				hashes.push(hash);
			}
		});

		it('hashes uniqueness', async () => {
			for (let i = 0; i < hashes.length - 1; ++i) {
				const hash = hashes[i];
				for (let j = i + 1; j < hashes.length; ++j) {
					const hash2 = hashes[j];
					expect(hash, `Hash [${i}](${hash}) is equal to [${j}](${hash2}`).not.equal(hash2);
				}
			}
		});

		it(`withdraw()`, async () => {
			// const ethContract0 = parseFloat(web3.utils.fromWei(await web3.eth.getBalance(instance.address)));
			const ethContract0 = new BN(await web3.eth.getBalance(instance.address));
			const ethOwner0 = new BN(await web3.eth.getBalance(owner));
			expect(ethContract0, 'Contract ETH balance is zero').to.be.a.bignumber.that.is.not.zero;
			// only owner can withdraw
			await expectRevert(instance.withdraw({ from: accountOne }), 'Ownable: caller is not the owner');
			await expectRevert(instance.withdraw({ from: accountTwo }), 'Ownable: caller is not the owner');
			const receipt = await instance.withdraw({ from: owner, gasPrice: 0 });
			const fee = web3.utils.toWei(new BN(receipt.receipt.gasUsed), 'Gwei');
			const ethContract1 = await web3.eth.getBalance(instance.address);
			const ethOwner1 = await web3.eth.getBalance(owner);
			const expected = ethContract0.add(ethOwner0).sub(fee);
			expect(ethContract1, 'Contract ETH balance should be zero').to.be.a.bignumber.that.is.zero;
			expect(ethOwner1, 'Contract ETH balance mismatch').to.be.bignumber.above(ethOwner0);
			expect(ethOwner1, 'Contract ETH balance mismatch').to.be.bignumber.above(expected);
		});

	});



	//--------------------------------------------------------------------
	// Whitelist
	//
	describe('# Whitelist', async () => {
		let instance, batchInstance, chromaInstances;
		before(async function () {
			instance = await deployEuclid(40, owner);
			chromaInstances = await deployAllChromas(owner);
			batchInstance = await deployChromaBatch(owner, Object.keys(chromaInstances), Object.values(chromaInstances));
		});

		const chromasToMint = [
			{ gridSize: 1, quantity: 1, build: false, account: accountOne },	// 0
			{ gridSize: 1, quantity: 1, build: true, account: accountOne },		// 1
			{ gridSize: 1, quantity: 1, build: false, account: accountTwo },	// 2
			{ gridSize: 2, quantity: 2, build: false, account: accountOne },	// 3-4
			{ gridSize: 2, quantity: 2, build: true, account: accountOne },		// 5-6
			{ gridSize: 3, quantity: 2, build: false, account: accountOne },	// 7-8
			{ gridSize: 3, quantity: 2, build: true, account: accountOne },		// 9-10
			{ gridSize: 4, quantity: 2, build: false, account: accountOne },	// 11-12
			{ gridSize: 4, quantity: 2, build: true, account: accountOne },		// 13-14
			{ gridSize: 5, quantity: 2, build: false, account: accountTwo },	// 15-16
			{ gridSize: 5, quantity: 2, build: true, account: accountTwo },		// 17-18
		];
		let chromasMinted = [];
		let chromasPerAccount = {};
		let chromaSupply = 0;
		let currentSupply = 0;

		const mintsPerSource = 1;
		const mintsPerBuilt = 3;

		it(`setup whitelist contract`, async () => {
			// only owner
			await expectRevert(instance.setupWhitelistContract(batchInstance.address, mintsPerSource, mintsPerBuilt, { from: accountOne }), 'Ownable: caller is not the owner');
			await instance.setupWhitelistContract(batchInstance.address, mintsPerSource, mintsPerBuilt, { from: owner });
			// release Chroma
			expectEvent(await chromaInstances[1].giftCode(owner, { from: owner }), 'Transfer');
			expectEvent(await chromaInstances[2].giftCode(owner, { from: owner }), 'Transfer');
			expectEvent(await chromaInstances[3].giftCode(owner, { from: owner }), 'Transfer');
			expectEvent(await chromaInstances[4].giftCode(owner, { from: owner }), 'Transfer');
			expectEvent(await chromaInstances[5].giftCode(owner, { from: owner }), 'Transfer');
		});

		it(`mint chromas`, async () => {
			chromasMinted = await _mintChromas(chromaInstances, chromasToMint, { mintsPerSource, mintsPerBuilt });
			chromaSupply = chromasMinted.length + 5;
			const totalSupply = (await batchInstance.totalSupply()).toNumber();
			expect(totalSupply, `Wrong chroma supply (${totalSupply}) != (${chromaSupply})`).equal(chromaSupply);
			// per account
			chromasMinted.forEach(function (mint) {
				if (chromasPerAccount[mint.account] == undefined) chromasPerAccount[mint.account] = [];
				chromasPerAccount[mint.account].push(mint);
			});
		});

		it(`start whitelist phase`, async () => {
			expectEvent(await _giftCode(instance, owner), 'Minted');
			expectEvent(await instance.setPhase(1, 0, 0, { from: owner }), 'ChangedPhase', { phase: '1' });
			currentSupply = (await instance.totalSupply()).toNumber();
		});

		it(`getWhitelistedTokens()`, async () => {
			for (let a = 1; a <= 2; ++a) {
				const account = a == 1 ? accountOne : accountTwo;
				const mapping = await _getWhitelistedTokens(instance, account);
				const tokenCount = chromasPerAccount[account].length;
				expect(Object.keys(mapping).length, `mapping[${a}] tokens (${Object.keys(mapping).length}) != (${tokenCount})`).equal(tokenCount);
				for (let i = 0; i < chromasPerAccount[account].length; ++i) {
					const mint = chromasPerAccount[account][i];
					const batchId = parseInt(Object.keys(mapping)[i]);
					const allowedMints = mapping[batchId];
					expect(batchId, `mapping[${a}][${i}] token id (${batchId}) != (${mint.batchId})`).equal(mint.batchId);
					expect(allowedMints, `mapping[${a}][${i}] allowed (${allowedMints}) != (${mint.allowedMints})`).equal(mint.allowedMints);
					const available = (await instance.getWhitelistAvailableMints(batchId, 0)).toNumber();
					expect(available, `available[${a}][${i}] token id (${batchId}) != (${allowedMints})`).equal(allowedMints);
				}
				// Invlia tokens
				expect((await instance.getWhitelistAvailableMints(0, 0)).toNumber(), `getWhitelistAvailableMints(x) should be zero`).equal(0);
				expect((await instance.getWhitelistAvailableMints(1, 0)).toNumber(), `getWhitelistAvailableMints(x) should be zero`).equal(0);
				expect((await instance.getWhitelistAvailableMints(10, 0)).toNumber(), `getWhitelistAvailableMints(x) should be zero`).equal(0);
				expect((await instance.getWhitelistAvailableMints(100, 0)).toNumber(), `getWhitelistAvailableMints(x) should be zero`).equal(0);
			}
		});

		it(`claim value`, async () => {
			const mint = chromasMinted[0];
			const bigValue = new BN(web3.utils.toWei('99', 'ether'));
			await expectRevert(_claimCode(instance, mint.account, [mint.batchId], mintsPerSource, { value: 0 }), 'CC:BadValue');
			await expectRevert(_claimCode(instance, mint.account, [mint.batchId], mintsPerSource, { value: bigValue }), 'CC:BadValue');
			// supply must not change after revert
			const initialSupply = currentSupply
			currentSupply = (await instance.totalSupply()).toNumber();
			expect(currentSupply, `Wrong supply`).equal(initialSupply);
		});

		it(`claim source`, async () => {
			const mint = chromasMinted[0];
			expect(mint.built, 'Not correct token').equal(false);
			let mapping = await _getWhitelistedTokens(instance, mint.account);
			expect(mapping[mint.batchId], 'Bad mapping').equal(mintsPerSource);
			expect((await instance.getWhitelistAvailableMints(mint.batchId, 0)).toNumber(), `getWhitelistAvailableMints(x) should not be zero`).equal(mintsPerSource);
			// only owner
			await expectRevert(_claimCode(instance, mint.otherAccount, [mint.batchId], mintsPerSource), 'Whitelist: Not Owner');
			// claim
			expectEvent(await _claimCode(instance, mint.account, [mint.batchId], mintsPerSource), 'Minted');
			// try another (revert)
			await expectRevert(_claimCode(instance, mint.account, [mint.batchId], mintsPerSource), 'Whitelist: None available');
			// check supply
			const initialSupply = currentSupply
			currentSupply = (await instance.totalSupply()).toNumber();
			expect(currentSupply, `Wrong supply`).equal(initialSupply + mintsPerSource);
			// check mapping
			mapping = await _getWhitelistedTokens(instance, mint.account);
			expect(mapping[mint.batchId], 'Bad mapping').equal(undefined);
			expect((await instance.getWhitelistAvailableMints(mint.batchId, 0)).toNumber(), `getWhitelistAvailableMints(x) should be zero`).equal(0);
		});

		it(`claim built`, async () => {
			const mint = chromasMinted[1];
			expect(mint.built, 'Not correct token').equal(true);
			let mapping = await _getWhitelistedTokens(instance, mint.account);
			expect(mapping[mint.batchId], 'Bad mapping').equal(mintsPerBuilt);
			expect((await instance.getWhitelistAvailableMints(mint.batchId, 0)).toNumber(), `getWhitelistAvailableMints(x) should not be zero`).equal(mintsPerBuilt);
			// only owner
			await expectRevert(_claimCode(instance, mint.otherAccount, [mint.batchId], mintsPerBuilt), 'Whitelist: Not Owner');
			// claim
			expectEvent(await _claimCode(instance, mint.account, [mint.batchId], mintsPerBuilt), 'Minted');
			// try another (revert)
			await expectRevert(_claimCode(instance, mint.account, [mint.batchId], mintsPerBuilt), 'Whitelist: None available');
			// check supply
			const initialSupply = currentSupply
			currentSupply = (await instance.totalSupply()).toNumber();
			expect(currentSupply, `Wrong supply`).equal(initialSupply + mintsPerBuilt);
			// check mapping
			mapping = await _getWhitelistedTokens(instance, mint.account);
			expect(mapping[mint.batchId], 'Bad mapping').equal(undefined);
			expect((await instance.getWhitelistAvailableMints(mint.batchId, 0)).toNumber(), `getWhitelistAvailableMints(x) should be zero`).equal(0);
		});

		it(`claim source + build`, async () => {
			const mint = chromasMinted[2];
			expect(mint.built, 'Not correct token').equal(false);
			let mapping = await _getWhitelistedTokens(instance, mint.account);
			expect(mapping[mint.batchId], 'Bad mapping').equal(mintsPerSource);
			expect((await instance.getWhitelistAvailableMints(mint.batchId, 0)).toNumber(), `getWhitelistAvailableMints(x) should not be zero`).equal(mintsPerSource);
			// claim source
			expectEvent(await _claimCode(instance, mint.account, [mint.batchId], mintsPerSource), 'Minted');
			mapping = await _getWhitelistedTokens(instance, mint.account);
			expect(mapping[mint.batchId], 'Bad mapping').equal(undefined);
			expect((await instance.getWhitelistAvailableMints(mint.batchId, 0)).toNumber(), `getWhitelistAvailableMints(x) should be zero`).equal(0);
			// try another (revert)
			await expectRevert(_claimCode(instance, mint.account, [mint.batchId], mintsPerSource), 'Whitelist: None available');
			//  build
			const leftover = mintsPerBuilt - mintsPerSource;
			await chromaInstances[1].buildCode(mint.tokenId, { from: mint.account });
			mapping = await _getWhitelistedTokens(instance, mint.account);
			expect(mapping[mint.batchId], 'Bad mapping').equal(leftover);
			expect((await instance.getWhitelistAvailableMints(mint.batchId, 0)).toNumber(), `getWhitelistAvailableMints(x) should not be zero`).equal(leftover);
			// claim built (full amount, revert)
			await expectRevert(_claimCode(instance, mint.account, [mint.batchId], mintsPerBuilt), 'CC:BadValue');
			// claim built (letover)
			expectEvent(await _claimCode(instance, mint.account, [mint.batchId], leftover), 'Minted');
			mapping = await _getWhitelistedTokens(instance, mint.account);
			expect(mapping[mint.batchId], 'Bad mapping').equal(undefined);
			expect((await instance.getWhitelistAvailableMints(mint.batchId, 0)).toNumber(), `getWhitelistAvailableMints(x) should be zero`).equal(0);
		});

		it(`claim multiples`, async () => {
			const s1 = chromasMinted[3];
			const s2 = chromasMinted[4];
			const s3 = chromasMinted[7];
			const s4 = chromasMinted[8];
			const s5 = chromasMinted[11];
			const s6 = chromasMinted[12];
			const b1 = chromasMinted[5];
			const b2 = chromasMinted[6];
			const b3 = chromasMinted[9];
			const b4 = chromasMinted[10];
			const b5 = chromasMinted[13];
			const b6 = chromasMinted[14];
			const other = chromasMinted[15];
			expect(s1.built, 'Need Source token').equal(false);
			expect(s2.built, 'Need Source token').equal(false);
			expect(s3.built, 'Need Source token').equal(false);
			expect(s4.built, 'Need Source token').equal(false);
			expect(s5.built, 'Need Source token').equal(false);
			expect(s6.built, 'Need Source token').equal(false);
			expect(b1.built, 'Need Built token').equal(true);
			expect(b2.built, 'Need Built token').equal(true);
			expect(b3.built, 'Need Built token').equal(true);
			expect(b4.built, 'Need Built token').equal(true);
			expect(b5.built, 'Need Built token').equal(true);
			expect(b6.built, 'Need Built token').equal(true);
			const initialSupply = (await instance.totalSupply()).toNumber();
			// check mapping
			const initialMapping = await _getWhitelistedTokens(instance, s1.account);
			expect(s1.batchId in initialMapping, 'Bad mapping').equal(true);
			expect(s2.batchId in initialMapping, 'Bad mapping').equal(true);
			expect(s3.batchId in initialMapping, 'Bad mapping').equal(true);
			expect(s4.batchId in initialMapping, 'Bad mapping').equal(true);
			expect(s5.batchId in initialMapping, 'Bad mapping').equal(true);
			expect(b1.batchId in initialMapping, 'Bad mapping').equal(true);
			expect(b2.batchId in initialMapping, 'Bad mapping').equal(true);
			expect(b3.batchId in initialMapping, 'Bad mapping').equal(true);
			expect(b4.batchId in initialMapping, 'Bad mapping').equal(true);
			expect(b5.batchId in initialMapping, 'Bad mapping').equal(true);
			expect(other.batchId in initialMapping, 'Bad mapping').equal(false);
			// claim sources
			let claimedAmount = mintsPerSource * 3;
			expectEvent(await _claimCode(instance, s1.account, [s1.batchId, s2.batchId, s3.batchId], claimedAmount), 'Minted');
			let mapping = await _getWhitelistedTokens(instance, s1.account);
			expect(s1.batchId in mapping, 'Bad mapping').equal(false);
			expect(s2.batchId in mapping, 'Bad mapping').equal(false);
			expect(s3.batchId in mapping, 'Bad mapping').equal(false);
			// claim builds
			claimedAmount = mintsPerBuilt * 3;
			expectEvent(await _claimCode(instance, s1.account, [b1.batchId, b2.batchId, b3.batchId], claimedAmount), 'Minted');
			mapping = await _getWhitelistedTokens(instance, s1.account);
			expect(b1.batchId in mapping, 'Bad mapping').equal(false);
			expect(b2.batchId in mapping, 'Bad mapping').equal(false);
			expect(b3.batchId in mapping, 'Bad mapping').equal(false);
			// claim mixed
			claimedAmount = mintsPerSource * 2 + mintsPerBuilt * 2;
			expectEvent(await _claimCode(instance, s1.account, [s4.batchId, s5.batchId, b4.batchId, b5.batchId], claimedAmount), 'Minted');
			mapping = await _getWhitelistedTokens(instance, s1.account);
			expect(s4.batchId in mapping, 'Bad mapping').equal(false);
			expect(s5.batchId in mapping, 'Bad mapping').equal(false);
			expect(b4.batchId in mapping, 'Bad mapping').equal(false);
			expect(b5.batchId in mapping, 'Bad mapping').equal(false);
			// claim mixed + bad value (revert)
			claimedAmount = mintsPerSource + mintsPerBuilt;
			await expectRevert(_claimCode(instance, s1.account, [s6.batchId, b6.batchId], claimedAmount, { value: '0.01' }), 'CC:BadValue');
			// claim mixed + other (revert)
			claimedAmount = mintsPerSource * 2 + mintsPerBuilt;
			await expectRevert(_claimCode(instance, s1.account, [s6.batchId, b6.batchId, other.batchId], claimedAmount), 'Whitelist: Not Owner');
			// claim mixed (ignore claimed)
			expect(s6.batchId in mapping, 'Bad mapping').equal(true); // still there
			expect(b6.batchId in mapping, 'Bad mapping').equal(true); // still there
			claimedAmount = mintsPerSource + mintsPerBuilt;
			expectEvent(await _claimCode(instance, s1.account, [s1.batchId, s2.batchId, s3.batchId, s4.batchId, s5.batchId, s6.batchId, b1.batchId, b2.batchId, b3.batchId, b4.batchId, b5.batchId, b6.batchId], claimedAmount), 'Minted');
			mapping = await _getWhitelistedTokens(instance, s1.account);
			expect(s6.batchId in mapping, 'Bad mapping').equal(false);
			expect(b6.batchId in mapping, 'Bad mapping').equal(false);
			// claim unavailables (revert)
			claimedAmount = mintsPerSource * 2 + mintsPerBuilt * 2;
			await expectRevert(_claimCode(instance, s1.account, [s1.batchId, s2.batchId, b3.batchId, b4.batchId], claimedAmount), 'Whitelist: None available');
			// Check supply
			const finalSupply = (await instance.totalSupply()).toNumber();
			expect(finalSupply, 'Wrong supply').equal(initialSupply + mintsPerSource * 6 + mintsPerBuilt * 6);
		});

		it(`update whitelist contract`, async () => {
			const mint = chromasMinted[16];
			expect(mint.built, 'Not correct token').equal(false);
			// claim
			expectEvent(await _claimCode(instance, mint.account, [mint.batchId], mintsPerSource), 'Minted');
			await expectRevert(_claimCode(instance, mint.account, [mint.batchId], 1), 'Whitelist: None available');
			// update (owner only)
			await expectRevert(instance.setupWhitelistContract(batchInstance.address, mintsPerSource + 2, mintsPerBuilt, { from: accountOne }), 'Ownable: caller is not the owner');
			await instance.setupWhitelistContract(batchInstance.address, mintsPerSource + 2, mintsPerBuilt, { from: owner });
			//claim
			expectEvent(await _claimCode(instance, mint.account, [mint.batchId], 2), 'Minted');
			await expectRevert(_claimCode(instance, mint.account, [mint.batchId], 1), 'Whitelist: None available');
			// update back
			await instance.setupWhitelistContract(batchInstance.address, mintsPerSource, mintsPerBuilt, { from: owner });
			await expectRevert(_claimCode(instance, mint.account, [mint.batchId], 1), 'Whitelist: None available');
		});
	});

});

