// OpenZeppelin test suite
// https://docs.openzeppelin.com/test-environment/0.1/migrating-from-truffle
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const [ owner, accountOne, accountTwo ] = accounts;
const { expect } = require('chai');
require('chai').should();

const { deployEuclid } = require('./deployments.js');

describe.skip('ERC-721', () => {
	it('mint balance', async () => {
		const instance = await deployEuclid(40, owner);
		// Get initial balances
		const totalSupply1 = (await instance.totalSupply()).toNumber();
		const ownerBalance1 = (await instance.balanceOf(owner)).toNumber();
		const accountOneBalance1 = (await instance.balanceOf(accountOne)).toNumber();
		const accountTwoBalance1 = (await instance.balanceOf(accountTwo)).toNumber();
		expect(totalSupply1, 'totalSupply1 should be Zero').equal(0);
		expect(ownerBalance1, 'ownerBalance1 should be Zero').equal(0);
		expect(accountOneBalance1, 'accountOneBalance1 should be Zero').equal(0);
		expect(accountTwoBalance1, 'accountTwoBalance1 should be Zero').equal(0);
		// Mint some
		let receipt;
		receipt = await instance.giftCode(owner, 1, { from: owner });
		// console.log(receipt.logs[1].args.tokenId)
		receipt = await instance.giftCode(accountOne, 1, { from: owner });
		// console.log(receipt.logs[1].args.tokenId)
		receipt = await instance.giftCode(accountOne, 1, { from: owner });
		// console.log(receipt.logs[1].args.tokenId)
		receipt = await instance.giftCode(accountTwo, 1, { from: owner });
		// console.log(receipt.logs[1].args.tokenId)
		receipt = await instance.giftCode(accountTwo, 1, { from: owner });
		// console.log(receipt.logs[1].args.tokenId)
		// Get balances after mint
		const totalSupply2 = (await instance.totalSupply()).toNumber();
		const ownerBalance2 = (await instance.balanceOf(owner)).toNumber();
		const accountOneBalance2 = (await instance.balanceOf(accountOne)).toNumber();
		const accountTwoBalance2 = (await instance.balanceOf(accountTwo)).toNumber();
		expect(totalSupply2, 'totalSupply2 should be Zero').equal(5);
		expect(ownerBalance2, 'ownerBalance2 should be 1').equal(1);
		expect(accountOneBalance2, 'accountOneBalance2 should be 2').equal(2);
		expect(accountTwoBalance2, 'accountTwoBalance2 should be 2').equal(2);
	});

	it('mint transfer event', async () => {
		const instance = await deployEuclid(40, owner);
		const receipt = await instance.giftCode(owner, 1, { from: owner });
		expectEvent(receipt, 'Transfer', { from: constants.ZERO_ADDRESS, to: owner});
	});

	// it('pausable', async () => {
	// 	const instance = await deployEuclid(40, owner);
	// 	// can mint
	// 	expectEvent(await instance.giftCode(owner, 1, { from: owner }), 'Transfer');
	// 	// only owner can pause
  //   await expectRevert(instance.pause({ from: accountOne }), 'Ownable: caller is not the owner', {account: owner});
	// 	expectEvent(await instance.pause({ from: owner }), 'Paused', {account: owner});
	// 	// can't mint
	// 	await expectRevert(instance.giftCode(accountOne, 1, { from: owner }), 'Pausable: paused');
	// 	// only owner can unpause
  //   await expectRevert(instance.unpause({ from: accountOne }), 'Ownable: caller is not the owner');
	// 	expectEvent(await instance.unpause({ from: owner }), 'Unpaused', {account: owner});
	// 	// can't mint
	// 	expectEvent(await instance.giftCode(accountOne, 1, { from: owner }), 'Transfer');
	// });
});
