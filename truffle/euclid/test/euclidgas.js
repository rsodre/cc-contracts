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

const { deployEuclid, _giftCode, _claimCode, _buyCode } = require('./deployments.js');
const { deployChromaBatch, deployAllChromas, _mintChromas } = require('./deployments.js');

function _numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function _logReceipt(receipt, label, amount = 1) {
	_logGas(receipt.receipt.gasUsed, label, amount);
}
function _logGas(gasUsed, label, amount = 1) {
	let result = `${label}:`;
	const gasPrice = 100;
	let feeWei = web3.utils.toWei(new BN(gasUsed * gasPrice), 'Gwei');
	let feeEth = parseFloat(web3.utils.fromWei(feeWei));
	result += ` ${_numberWithCommas(gasUsed)} * ${gasPrice} = ${feeEth}`;
	if (amount > 1) {
		gasUsed = parseInt(gasUsed / amount);
		feeWei = web3.utils.toWei(new BN(gasUsed * gasPrice), 'Gwei');
		feeEth = parseFloat(web3.utils.fromWei(feeWei));
		result += ` (${amount}) / ${_numberWithCommas(gasUsed)} * ${gasPrice} = ${feeEth} (1)`;
	}
	console.log(result);
}

//-----------------------------------------------------------------------------------------
//
// UNIT TESTS
//

describe('Euclid Gas Reports', () => {

	//--------------------------------------------------------------------
	// Each test has a single instance
	//
	describe('# misc instances', async () => {
		let instance = null;
		let receipt = null;
		beforeEach(async function () {
			instance = await deployEuclid(1870, owner);
		});

		it('_giftCode() once', async () => {
			receipt = (await _giftCode(instance, owner));
			_logReceipt(receipt, `_giftCode()`);
		});

		it('_giftCode() multiples', async () => {
			for (let i = 1; i <= 12; ++i) {
				receipt = (await _giftCode(instance, owner, i));
				_logReceipt(receipt, `_giftCode(${i})`, i);
			}
		});

		it('_buyCode() one by one (same account)', async () => {
			receipt = (await _giftCode(instance, owner));
			_logReceipt(receipt, `_giftCode()`);
			await instance.setPhase(2, 0, 0, { from: owner });
			let sum = 0;
			for (let i = 0; i < 5; ++i) {
				receipt = (await _buyCode(instance, accountOne, 1));
				sum += receipt.receipt.gasUsed;
				_logReceipt(receipt, `_buyCode(${i + 1})`);
			}
			_logGas(sum, `_buyCode(sum)`);
		});

		it('_buyCode() one by one (multiple accounts)', async () => {
			receipt = (await _giftCode(instance, owner));
			_logReceipt(receipt, `_giftCode()`);
			await instance.setPhase(2, 0, 0, { from: owner });
			for (let i = 1; i < Math.min(5, accounts.length); ++i) {
				const account = accounts[i];
				receipt = (await _buyCode(instance, account, 1));
				_logReceipt(receipt, `_buyCode(${i})`);
			}
		});

		it('_buyCode() two by two (same account)', async () => {
			receipt = (await _giftCode(instance, owner));
			_logReceipt(receipt, `_giftCode()`);
			await instance.setPhase(2, 0, 0, { from: owner });
			let sum = 0;
			for (let i = 0; i < 3; ++i) {
				receipt = (await _buyCode(instance, accountOne, 2));
				sum += receipt.receipt.gasUsed;
				_logReceipt(receipt, `_buyCode(${i * 2})`, 2);
			}
			_logGas(sum, `_buyCode(sum)`);
		});

		it('_buyCode() five by five (same account)', async () => {
			receipt = (await _giftCode(instance, owner));
			_logReceipt(receipt, `_giftCode()`);
			await instance.setPhase(2, 0, 0, { from: owner });
			receipt = (await _buyCode(instance, accountOne, 5));
			_logReceipt(receipt, `_buyCode(5)`, 5);
			receipt = (await _buyCode(instance, accountOne, 5));
			_logReceipt(receipt, `_buyCode(5)`, 5);
			receipt = (await _buyCode(instance, accountOne, 5));
			_logReceipt(receipt, `_buyCode(5)`, 5);
		});
	});





	//--------------------------------------------------------------------
	// Whitelist
	//
	describe('# Whitelisted', async () => {
		let instance, batchInstance, chromaInstances;
		beforeEach(async function () {
			// release Chromas
			chromaInstances = await deployAllChromas(owner);
			expectEvent(await chromaInstances[1].giftCode(owner, { from: owner }), 'Transfer');
			expectEvent(await chromaInstances[2].giftCode(owner, { from: owner }), 'Transfer');
			expectEvent(await chromaInstances[3].giftCode(owner, { from: owner }), 'Transfer');
			expectEvent(await chromaInstances[4].giftCode(owner, { from: owner }), 'Transfer');
			expectEvent(await chromaInstances[5].giftCode(owner, { from: owner }), 'Transfer');
			// release Euclid
			instance = await deployEuclid(40, owner);
			expectEvent(await _giftCode(instance, owner), 'Minted');
			expectEvent(await instance.setPhase(1, 0, 0, { from: owner }), 'ChangedPhase', { phase: '1' });
			// release Batch
			batchInstance = await deployChromaBatch(owner, Object.keys(chromaInstances), Object.values(chromaInstances));
			await instance.setupWhitelistContract(batchInstance.address, mintsPerSource, mintsPerBuilt, { from: owner });
		});

		const mintsPerSource = 1;
		const mintsPerBuilt = 3;

		it(`claim sources, singles, front to back`, async () => {
			const chromasToMint = [
				{ gridSize: 1, quantity: 1, build: false, account: accountOne },
				{ gridSize: 1, quantity: 1, build: false, account: accountOne },
				// { gridSize: 1, quantity: 1, build: false, account: accountTwo },
				// { gridSize: 1, quantity: 1, build: false, account: accountTwo },
				{ gridSize: 2, quantity: 2, build: false, account: accountOne },
				// { gridSize: 2, quantity: 2, build: false, account: accountTwo },
				{ gridSize: 3, quantity: 2, build: false, account: accountOne },
				// { gridSize: 3, quantity: 2, build: false, account: accountTwo },
				{ gridSize: 4, quantity: 2, build: false, account: accountOne },
				// { gridSize: 4, quantity: 2, build: false, account: accountTwo },
				{ gridSize: 5, quantity: 2, build: false, account: accountOne },
				// { gridSize: 5, quantity: 2, build: false, account: accountTwo },
			];
			const chromasMinted = await _mintChromas(chromaInstances, chromasToMint, { mintsPerSource, mintsPerBuilt });
			const mintsPerClaim = mintsPerSource;
			for (let i = 0; i < chromasMinted.length; ++i) {
				const ch = chromasMinted[i];
				if (ch.account != accountOne) continue;
				receipt = await _claimCode(instance, ch.account, [ch.batchId], mintsPerClaim);
				_logReceipt(receipt, `_claimCode(${i})`, mintsPerClaim);
			}
		});

		it(`claim sources, singles, back to front`, async () => {
			const chromasToMint = [
				{ gridSize: 1, quantity: 1, build: false, account: accountOne },
				{ gridSize: 1, quantity: 1, build: false, account: accountOne },
				{ gridSize: 2, quantity: 2, build: false, account: accountOne },
				{ gridSize: 3, quantity: 2, build: false, account: accountOne },
				{ gridSize: 4, quantity: 2, build: false, account: accountOne },
				{ gridSize: 5, quantity: 2, build: false, account: accountOne },
			];
			const chromasMinted = await _mintChromas(chromaInstances, chromasToMint, { mintsPerSource, mintsPerBuilt });
			const mintsPerClaim = mintsPerSource;
			for (let i = chromasMinted.length - 1; i >= 0; --i) {
				const ch = chromasMinted[i];
				if (ch.account != accountOne) continue;
				receipt = await _claimCode(instance, ch.account, [ch.batchId], mintsPerClaim);
				_logReceipt(receipt, `_claimCode(${i})`, mintsPerClaim);
			}
		});

		it(`claim builds, singles, front to back`, async () => {
			const chromasToMint = [
				{ gridSize: 1, quantity: 1, build: true, account: accountOne },
				{ gridSize: 1, quantity: 1, build: true, account: accountOne },
				{ gridSize: 2, quantity: 2, build: true, account: accountOne },
				{ gridSize: 3, quantity: 2, build: true, account: accountOne },
				{ gridSize: 4, quantity: 2, build: true, account: accountOne },
				{ gridSize: 5, quantity: 2, build: true, account: accountOne },
			];
			const chromasMinted = await _mintChromas(chromaInstances, chromasToMint, { mintsPerSource, mintsPerBuilt });
			const mintsPerClaim = mintsPerBuilt;
			for (let i = 0; i < chromasMinted.length; ++i) {
				const ch = chromasMinted[i];
				if (ch.account != accountOne) continue;
				receipt = await _claimCode(instance, ch.account, [ch.batchId], mintsPerClaim);
				_logReceipt(receipt, `_claimCode(${i})`, mintsPerClaim);
			}
		});

		it(`claim builds, singles, back to front`, async () => {
			const chromasToMint = [
				{ gridSize: 1, quantity: 1, build: true, account: accountOne },
				{ gridSize: 1, quantity: 1, build: true, account: accountOne },
				{ gridSize: 2, quantity: 2, build: true, account: accountOne },
				{ gridSize: 3, quantity: 2, build: true, account: accountOne },
				{ gridSize: 4, quantity: 2, build: true, account: accountOne },
				{ gridSize: 5, quantity: 2, build: true, account: accountOne },
			];
			const chromasMinted = await _mintChromas(chromaInstances, chromasToMint, { mintsPerSource, mintsPerBuilt });
			const mintsPerClaim = mintsPerBuilt;
			for (let i = chromasMinted.length - 1; i >= 0; --i) {
				const ch = chromasMinted[i];
				if (ch.account != accountOne) continue;
				receipt = await _claimCode(instance, ch.account, [ch.batchId], mintsPerClaim);
				_logReceipt(receipt, `_claimCode(${i})`, mintsPerClaim);
			}
		});

		it(`claim sources, multiples of 3`, async () => {
			const chromasToMint = [
				{ gridSize: 1, quantity: 1, build: false, account: accountOne },
				{ gridSize: 1, quantity: 1, build: false, account: accountOne },
				{ gridSize: 2, quantity: 1, build: false, account: accountOne },
				{ gridSize: 2, quantity: 2, build: false, account: accountOne },
				{ gridSize: 3, quantity: 3, build: false, account: accountOne },
				{ gridSize: 4, quantity: 3, build: false, account: accountOne },
				{ gridSize: 5, quantity: 4, build: false, account: accountOne },
			];
			const chromasMinted = await _mintChromas(chromaInstances, chromasToMint, { mintsPerSource, mintsPerBuilt });
			const mintsPerClaim = mintsPerSource * 3;
			for (let i = 0; i < chromasMinted.length; i += 3) {
				const ch1 = chromasMinted[i+0];
				const ch2 = chromasMinted[i+1];
				const ch3 = chromasMinted[i+2];
				receipt = await _claimCode(instance, ch1.account, [ch1.batchId, ch2.batchId, ch3.batchId], mintsPerClaim);
				_logReceipt(receipt, `_claimCode(${i})`, mintsPerClaim);
			}
		});

	});

});

