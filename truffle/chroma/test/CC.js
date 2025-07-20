const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { expect } = require('chai');

const Ganache = require("ganache-core");
const ChromaFive = artifacts.require("ChromaFive");
const ChromaFour = artifacts.require("ChromaFour");
const ChromaThree = artifacts.require("ChromaThree");
const ChromaTwo = artifacts.require("ChromaTwo");
const ChromaOne = artifacts.require("ChromaOne");

async function _buyCode( contract, to, quantity, build) {
	const price_bn = (await contract.calculatePriceForQuantity(quantity)); // wei 1e18 (BN)
	//const gwei_str = web3.utils.fromWei(price_bn.toString(), 'gwei');
	const result = await contract.buyCode(to, quantity, build, { from: to, value: price_bn.toString() });
	return result;
}

function _makePrice( price ) {
	return new BN(price).mul(new BN('10000000000000000'));
}

contract('CollectCode', (accounts) => {
	// Setup
	let sharedContract, accountOne, accountTwo, accountThree;
	before(async () => {
		sharedContract = await ChromaOne.deployed();
		accountOne = accounts[0];
		accountTwo = accounts[3];
		accountThree = accounts[2];
	})

	it('Examples', async () => {
		var contract = sharedContract;

		// chai: expect: https://www.chaijs.com/api/bdd/
		const supply = (await contract.totalSupply()).toNumber();
		expect(supply).to.be.equal(0, "message");

		assert.equal(supply, 0, "message");

		const supplyBN = await contract.totalSupply();
		expect(supplyBN).to.be.bignumber.equal('0', "message");
		expect(supplyBN.toNumber()).to.be.equal(0);
		expect(await contract.totalSupply()).to.be.bignumber.equal('0', "message");
	});

	it('Privates', async () => {
		var contract = sharedContract;
		// expect(contract.mintCode_(accountTwo, 1, true)).to.throw(TypeError);
		// expect(contract.buildCode_(accountTwo, 1, 1)).to.throw(TypeError);
		// expect(contract.calculateSupply_()).to.throw(TypeError);
		// expect(contract.makeTokenURI_(1)).to.throw(TypeError);
	});

	context('Token Zero', function () {
		it('Cannot grant to Others', async () => {
			var contract = sharedContract;

			expect(await contract.owner()).to.be.equal(accountOne);
			expect((await contract.getState()).mintedCount).to.be.equal('0');
			// Others cant gift or buy Zero Token
			await expectRevert( contract.giftCode(accountTwo), "CC:NotOwner" );
			await expectRevert( contract.giftCode(accountOne, {from: accountTwo}), "Ownable: caller is not the owner" );
			await expectRevert( _buyCode(contract, accountTwo, 1, true), "CC: Unreleased" );
			// Token Zero still not created
			await expectRevert( contract.ownerOf(0), 'ERC721: owner query for nonexistent token', );
			// Balance unchanged
			expect((await contract.getState()).mintedCount).to.be.equal('0');
			expect(await contract.balanceOf(accountTwo)).to.be.bignumber.equal('0', "Account Two should NOT have a token");
		});

		it('Can grant to Owner', async () => {
			var contract = sharedContract;
			expect((await contract.getState()).mintedCount).to.be.equal('0');

			// gift the Zero token to Owner
			var result = await contract.giftCode(accountOne);
			expect((await contract.getState()).mintedCount).to.be.equal('0');
			expect(await contract.ownerOf(0)).to.be.equal(accountOne, "Token Zero should be owned by Account One");

			// Can gift only once
			await expectRevert( contract.giftCode(accountOne), "CC:AlreadyIssued" );
			await expectRevert( contract.giftCode(accountTwo), "CC:AlreadyIssued" );

			// Now others can buy
			await _buyCode(contract, accountTwo, 1, true);
			expect((await contract.getState()).mintedCount).to.be.equal('1');
			expect(await contract.ownerOf(1)).to.be.equal(accountTwo, "Token One should be owned by Account Two");

			expect(await contract.balanceOf(accountOne)).to.be.bignumber.equal('1', "Account One should have one token");
			expect(await contract.balanceOf(accountTwo)).to.be.bignumber.equal('1', "Account Two should have one token");
		});
	});

	context('Ownership', function () {
		it('You Own It', async () => {
			var contract = await ChromaTwo.new();
			await contract.giftCode(accountOne);
			await _buyCode(contract, accountOne, 1, false);
			// buy 2-4
			await _buyCode(contract, accountTwo, 1, true);
			await _buyCode(contract, accountTwo, 1, false);
			await _buyCode(contract, accountTwo, 1, false);
			// buy 5-8
			await _buyCode(contract, accountThree, 2, true);
			await _buyCode(contract, accountThree, 2, false);

			// To check ownership we need to pass the address
			expect((await contract.getTokenInfo(accountOne,0)).youOwnIt).to.be.equal(true);
			expect((await contract.getTokenInfo(accountOne,1)).youOwnIt).to.be.equal(true);
			expect((await contract.getTokenInfo(accountTwo,2)).youOwnIt).to.be.equal(true);
			expect((await contract.getTokenInfo(accountTwo,3)).youOwnIt).to.be.equal(true);
			expect((await contract.getTokenInfo(accountTwo,4)).youOwnIt).to.be.equal(true);
			expect((await contract.getTokenInfo(accountThree,5)).youOwnIt).to.be.equal(true);
			expect((await contract.getTokenInfo(accountThree,6)).youOwnIt).to.be.equal(true);
			expect((await contract.getTokenInfo(accountThree,7)).youOwnIt).to.be.equal(true);
			expect((await contract.getTokenInfo(accountThree,8)).youOwnIt).to.be.equal(true);

			// Other users fail to check ownership
			expect((await contract.getTokenInfo(accountTwo,0)).youOwnIt).to.be.equal(false);
			expect((await contract.getTokenInfo(accountTwo,1)).youOwnIt).to.be.equal(false);
			expect((await contract.getTokenInfo(accountOne,2)).youOwnIt).to.be.equal(false);
			expect((await contract.getTokenInfo(accountOne,3)).youOwnIt).to.be.equal(false);
			expect((await contract.getTokenInfo(accountOne,4)).youOwnIt).to.be.equal(false);
			expect((await contract.getTokenInfo(accountOne,5)).youOwnIt).to.be.equal(false);
			expect((await contract.getTokenInfo(accountOne,6)).youOwnIt).to.be.equal(false);
			expect((await contract.getTokenInfo(accountOne,7)).youOwnIt).to.be.equal(false);
			expect((await contract.getTokenInfo(accountOne,8)).youOwnIt).to.be.equal(false);
		});

		it('Owned Tokens', async () => {
			var contract = await ChromaOne.new();
			await contract.giftCode(accountOne);

			await _buyCode(contract, accountTwo, 1, true);    // token 1
			await _buyCode(contract, accountTwo, 1, true);    // token 2
			await _buyCode(contract, accountOne, 1, true);    // token 3
			await _buyCode(contract, accountThree, 1, true);  // token 4
			await _buyCode(contract, accountThree, 1, true);  // token 5
			await _buyCode(contract, accountThree, 1, true);  // token 6
			await _buyCode(contract, accountTwo, 1, true);    // token 7
			await _buyCode(contract, accountTwo, 1, true);    // token 8
			await _buyCode(contract, accountThree, 1, true);  // token 9
			await _buyCode(contract, accountOne, 1, true);    // token 10
			await _buyCode(contract, accountThree, 1, true);  // token 11
			await _buyCode(contract, accountThree, 1, true);  // token 12

			const ownedByOneBN = (await contract.getOwnedTokens(accountOne, {from: accountOne}));
			const ownedByTwoBN = (await contract.getOwnedTokens(accountTwo, {from: accountOne}));
			const ownedByThreeBN = (await contract.getOwnedTokens(accountThree, {from: accountOne}));

			expect(ownedByOneBN.length).to.be.equal(3);
			expect(ownedByTwoBN.length).to.be.equal(4);
			expect(ownedByThreeBN.length).to.be.equal(6);

			let ownedByOne = ownedByOneBN.map(function(bn) { return parseInt(bn); });
			let ownedByTwo = ownedByTwoBN.map(function(bn) { return parseInt(bn); });
			let ownedByThree = ownedByThreeBN.map(function(bn) { return parseInt(bn); });
		
			expect(ownedByOne.includes(0)).to.be.equal(true);
			expect(ownedByOne.includes(1)).to.be.equal(false);
			expect(ownedByOne.includes(2)).to.be.equal(false);
			expect(ownedByOne.includes(3)).to.be.equal(true);
			expect(ownedByOne.includes(4)).to.be.equal(false);
			expect(ownedByOne.includes(5)).to.be.equal(false);
			expect(ownedByOne.includes(6)).to.be.equal(false);
			expect(ownedByOne.includes(7)).to.be.equal(false);
			expect(ownedByOne.includes(8)).to.be.equal(false);
			expect(ownedByOne.includes(9)).to.be.equal(false);
			expect(ownedByOne.includes(10)).to.be.equal(true);
			expect(ownedByOne.includes(11)).to.be.equal(false);
			expect(ownedByOne.includes(12)).to.be.equal(false);

			expect(ownedByTwo.includes(0)).to.be.equal(false);
			expect(ownedByTwo.includes(1)).to.be.equal(true);
			expect(ownedByTwo.includes(2)).to.be.equal(true);
			expect(ownedByTwo.includes(3)).to.be.equal(false);
			expect(ownedByTwo.includes(4)).to.be.equal(false);
			expect(ownedByTwo.includes(5)).to.be.equal(false);
			expect(ownedByTwo.includes(6)).to.be.equal(false);
			expect(ownedByTwo.includes(7)).to.be.equal(true);
			expect(ownedByTwo.includes(8)).to.be.equal(true);
			expect(ownedByTwo.includes(9)).to.be.equal(false);
			expect(ownedByTwo.includes(10)).to.be.equal(false);
			expect(ownedByTwo.includes(11)).to.be.equal(false);
			expect(ownedByTwo.includes(12)).to.be.equal(false);

			expect(ownedByThree.includes(0)).to.be.equal(false);
			expect(ownedByThree.includes(1)).to.be.equal(false);
			expect(ownedByThree.includes(2)).to.be.equal(false);
			expect(ownedByThree.includes(3)).to.be.equal(false);
			expect(ownedByThree.includes(4)).to.be.equal(true);
			expect(ownedByThree.includes(5)).to.be.equal(true);
			expect(ownedByThree.includes(6)).to.be.equal(true);
			expect(ownedByThree.includes(7)).to.be.equal(false);
			expect(ownedByThree.includes(8)).to.be.equal(false);
			expect(ownedByThree.includes(9)).to.be.equal(true);
			expect(ownedByThree.includes(10)).to.be.equal(false);
			expect(ownedByThree.includes(11)).to.be.equal(true);
			expect(ownedByThree.includes(12)).to.be.equal(true);
		});

		it('Transfer Ownership', async () => {
			var contract = await ChromaTwo.new();
			await contract.giftCode(accountOne);

			const transferValue_bn = (await contract.calculatePriceForQuantity(1));
			let lastEtherContract = new BN(await web3.eth.getBalance(contract.address));
			let lastEtherOne = new BN(await web3.eth.getBalance(accountOne));
			let lastEtherTwo = new BN(await web3.eth.getBalance(accountTwo));
			let lastEtherThree = new BN(await web3.eth.getBalance(accountThree));

			// buy 1,2
			expect(await contract.balanceOf(accountTwo)).to.be.bignumber.equal('0');
			await _buyCode(contract, accountTwo, 2, true);
			expect(await contract.ownerOf(1)).to.be.equal(accountTwo);
			expect(await contract.ownerOf(2)).to.be.equal(accountTwo);
			expect(await contract.balanceOf(accountTwo)).to.be.bignumber.equal('2');
			expect(await contract.balanceOf(accountThree)).to.be.bignumber.equal('0');

			// check ether balance
			let currentEtherContract = new BN(await web3.eth.getBalance(contract.address));
			let currentEtherOne = new BN(await web3.eth.getBalance(accountOne));
			let currentEtherTwo = new BN(await web3.eth.getBalance(accountTwo));
			expect(currentEtherContract).to.be.bignumber.above(lastEtherContract);
			expect(currentEtherOne).to.be.bignumber.equal(lastEtherOne);
			expect(currentEtherTwo).to.be.bignumber.below(lastEtherTwo);
			lastEtherContract = currentEtherContract;
			lastEtherTwo = currentEtherTwo;

			// transfer 1
			// TODO: Fix transfer revert when using value
			// await contract.approve(accountThree, 1, { from: accountTwo });
			// await contract.safeTransferFrom(accountTwo, accountThree, 1, { from: accountTwo, value: transferValue_bn.toString() }); 
			await contract.transferFrom(accountTwo, accountThree, 1, { from: accountTwo }); 
			expect(await contract.ownerOf(1)).to.be.equal(accountThree);
			expect(await contract.ownerOf(2)).to.be.equal(accountTwo);
			expect(await contract.balanceOf(accountTwo)).to.be.bignumber.equal('1');
			expect(await contract.balanceOf(accountThree)).to.be.bignumber.equal('1');

			// check ether balance
			// currentEtherTwo = new BN(await web3.eth.getBalance(accountTwo));
			// currentEtherThree = new BN(await web3.eth.getBalance(accountThree));
			// expect(currentEtherTwo).to.be.bignumber.above(lastEtherTwo);
			// expect(currentEtherThree).to.be.bignumber.below(lastEtherThree);
			// lastEtherTwo = currentEtherTwo;
			// lastEtherThree = currentEtherThree;
			
			// transfer again (error)
			await expectRevert( contract.transferFrom(accountTwo, accountThree, 1, { from: accountTwo }), "ERC721: transfer caller is not owner nor approved" );
			
			// transfer 2
			// await contract.transferFrom(accountTwo, accountThree, 2, { from: accountTwo, value: transferValue_bn.toString() }); 
			await contract.transferFrom(accountTwo, accountThree, 2, { from: accountTwo }); 
			expect(await contract.ownerOf(1)).to.be.equal(accountThree);
			expect(await contract.ownerOf(2)).to.be.equal(accountThree);
			expect(await contract.balanceOf(accountTwo)).to.be.bignumber.equal('0');
			expect(await contract.balanceOf(accountThree)).to.be.bignumber.equal('2');

			// check ether balance
			// currentEtherTwo = new BN(await web3.eth.getBalance(accountTwo));
			// currentEtherThree = new BN(await web3.eth.getBalance(accountThree));
			// expect(currentEtherTwo).to.be.bignumber.above(lastEtherTwo);
			// expect(currentEtherThree).to.be.bignumber.below(lastEtherThree);
			// lastEtherTwo = currentEtherTwo;
			// lastEtherThree = currentEtherThree;
		});
	});

	context('Build', function () {
		it('Build Pixels', async () => {
			var contract = await ChromaOne.new();
			await contract.giftCode(accountOne);
			await _buyCode(contract, accountOne, 1, false);
			await _buyCode(contract, accountTwo, 1, true);
			await _buyCode(contract, accountTwo, 1, false);
			await _buyCode(contract, accountTwo, 1, false);

			expect((await contract.getTokenInfo(accountOne,0)).isBuilt).to.be.equal(true);
			expect((await contract.getTokenInfo(accountOne,1)).isBuilt).to.be.equal(false);
			expect((await contract.getTokenInfo(accountOne,2)).isBuilt).to.be.equal(true);
			expect((await contract.getTokenInfo(accountOne,3)).isBuilt).to.be.equal(false);
			expect((await contract.getTokenInfo(accountOne,4)).isBuilt).to.be.equal(false);
			await expectRevert( contract.getTokenInfo(accountOne,5), "CC:BadTokenId" );
			await expectRevert( contract.buildCode(5, {from: accountOne}), "CC:BadTokenId" );

			expect(await contract.totalSupply()).to.be.bignumber.equal('5');
			expect((await contract.getState()).mintedCount).to.be.equal('4');

			expect((await contract.getState()).builtCount).to.be.equal('1'); // Token Zero does not count
			expect((await contract.getState()).notBuiltCount).to.be.equal('3');

			// expect((await contract.getTokenInfo(accountOne,0)).pixels).to.be.not.equal('');
			// expect((await contract.getTokenInfo(accountOne,1)).pixels).to.be.equal('');
			// expect((await contract.getTokenInfo(accountOne,2)).pixels).to.be.not.equal('');
			// expect((await contract.getTokenInfo(accountOne,3)).pixels).to.be.equal('');
			// expect((await contract.getTokenInfo(accountOne,4)).pixels).to.be.equal('');

			var uri = await contract.tokenURI(0);
			expect(uri.substr(uri.length-7,7)).to.be.not.equal('pixels=');
			uri = await contract.tokenURI(1);
			expect(uri.substr(uri.length-7,7)).to.be.equal('pixels=');
			uri = await contract.tokenURI(2);
			expect(uri.substr(uri.length-7,7)).to.be.not.equal('pixels=');

			await expectRevert( contract.buildCode(0, {from: accountOne} ), "CC:AlreadyBuilt" );
			await expectRevert( contract.buildCode(0, {from: accountTwo} ), "CC:AlreadyBuilt" );
			await expectRevert( contract.buildCode(1, {from: accountTwo}), "CC:NotOwner" );
			await contract.buildCode(1, {from: accountOne} );
			expect((await contract.getState()).builtCount).to.be.equal('2');
			expect((await contract.getState()).notBuiltCount).to.be.equal('2');
			expect((await contract.getTokenInfo(accountOne,1)).isBuilt).to.be.equal(true);
			uri = await contract.tokenURI(2);
			expect(uri.substr(uri.length-7,7)).to.be.not.equal('pixels=');

			await expectRevert( contract.buildCode(2, {from: accountTwo} ), "CC:AlreadyBuilt" );
			await expectRevert( contract.buildCode(3, {from: accountOne}), "CC:NotOwner" );
			await contract.buildCode(3, {from: accountTwo} );
			await contract.buildCode(4, {from: accountTwo} );
			expect((await contract.getState()).builtCount).to.be.equal('4');
			expect((await contract.getState()).notBuiltCount).to.be.equal('0');
			expect((await contract.getTokenInfo(accountOne,3)).isBuilt).to.be.equal(true);
			expect((await contract.getTokenInfo(accountOne,4)).isBuilt).to.be.equal(true);
		});

		it('Build Sequence', async () => {
			var contract = await ChromaFive.new();
			await contract.giftCode(accountOne);
			// buy 1, 2
			await _buyCode(contract, accountTwo, 1, false);
			await _buyCode(contract, accountTwo, 1, true);

			// buy 3-4
			await _buyCode(contract, accountTwo, 2, true);
			// buy 5-6-7
			await _buyCode(contract, accountTwo, 3, true);
			// buy 8-9-10-11
			await _buyCode(contract, accountTwo, 4, true);
			// buy 12-13-14-15-16
			await _buyCode(contract, accountTwo, 5, true);
			// buyout of 6 should not be allowed, just checking...
			await expectRevert( _buyCode(contract, accountTwo, 6, true), "CC:TooMany" );
			// buy 17-18, not built
			await _buyCode(contract, accountTwo, 2, false);
			// buy 19-20
			await _buyCode(contract, accountTwo, 2, true);

			// Test after all is build, to check if sequences are overlapping

			// sequence 3-4
			expect((await contract.getTokenInfo(accountOne,0)).sequenceNumber).to.be.bignumber.equal('0');
			expect((await contract.getTokenInfo(accountOne,1)).sequenceNumber).to.be.bignumber.equal('0');
			expect((await contract.getTokenInfo(accountOne,2)).sequenceNumber).to.be.bignumber.equal('0');
			expect((await contract.getTokenInfo(accountOne,0)).sequenceTokens).to.be.eql([]);
			expect((await contract.getTokenInfo(accountOne,1)).sequenceTokens).to.be.eql([]);
			// sequence 3-4
			expect((await contract.getTokenInfo(accountOne,3)).sequenceNumber).to.be.bignumber.equal('1');
			expect((await contract.getTokenInfo(accountOne,4)).sequenceNumber).to.be.bignumber.equal('2');
			expect((await contract.getTokenInfo(accountOne,3)).sequenceTokens).to.be.eql(['3','4']);
			expect((await contract.getTokenInfo(accountOne,4)).sequenceTokens).to.be.eql(['3','4']);
			// sequence 5-6-7
			expect((await contract.getTokenInfo(accountOne,5)).sequenceNumber).to.be.bignumber.equal('1');
			expect((await contract.getTokenInfo(accountOne,6)).sequenceNumber).to.be.bignumber.equal('2');
			expect((await contract.getTokenInfo(accountOne,7)).sequenceNumber).to.be.bignumber.equal('3');
			expect((await contract.getTokenInfo(accountOne,5)).sequenceTokens).to.be.eql(['5','6','7']);
			expect((await contract.getTokenInfo(accountOne,6)).sequenceTokens).to.be.eql(['5','6','7']);
			expect((await contract.getTokenInfo(accountOne,7)).sequenceTokens).to.be.eql(['5','6','7']);
			// sequence 8-9-10-11
			expect((await contract.getTokenInfo(accountOne,8)).sequenceNumber).to.be.bignumber.equal('1');
			expect((await contract.getTokenInfo(accountOne,9)).sequenceNumber).to.be.bignumber.equal('2');
			expect((await contract.getTokenInfo(accountOne,10)).sequenceNumber).to.be.bignumber.equal('3');
			expect((await contract.getTokenInfo(accountOne,11)).sequenceNumber).to.be.bignumber.equal('4');
			expect((await contract.getTokenInfo(accountOne,8)).sequenceTokens).to.be.eql(['8','9','10','11']);
			expect((await contract.getTokenInfo(accountOne,9)).sequenceTokens).to.be.eql(['8','9','10','11']);
			expect((await contract.getTokenInfo(accountOne,10)).sequenceTokens).to.be.eql(['8','9','10','11']);
			expect((await contract.getTokenInfo(accountOne,11)).sequenceTokens).to.be.eql(['8','9','10','11']);
			// sequence 12-13-14-15-16
			expect((await contract.getTokenInfo(accountOne,12)).sequenceNumber).to.be.bignumber.equal('1');
			expect((await contract.getTokenInfo(accountOne,13)).sequenceNumber).to.be.bignumber.equal('2');
			expect((await contract.getTokenInfo(accountOne,14)).sequenceNumber).to.be.bignumber.equal('3');
			expect((await contract.getTokenInfo(accountOne,15)).sequenceNumber).to.be.bignumber.equal('4');
			expect((await contract.getTokenInfo(accountOne,16)).sequenceNumber).to.be.bignumber.equal('5');
			expect((await contract.getTokenInfo(accountOne,12)).sequenceTokens).to.be.eql(['12','13','14','15','16']);
			expect((await contract.getTokenInfo(accountOne,13)).sequenceTokens).to.be.eql(['12','13','14','15','16']);
			expect((await contract.getTokenInfo(accountOne,14)).sequenceTokens).to.be.eql(['12','13','14','15','16']);
			expect((await contract.getTokenInfo(accountOne,15)).sequenceTokens).to.be.eql(['12','13','14','15','16']);
			expect((await contract.getTokenInfo(accountOne,16)).sequenceTokens).to.be.eql(['12','13','14','15','16']);
			// sequence 17-18, not built
			expect((await contract.getTokenInfo(accountOne,17)).sequenceNumber).to.be.bignumber.equal('0');
			expect((await contract.getTokenInfo(accountOne,18)).sequenceNumber).to.be.bignumber.equal('0');
			expect((await contract.getTokenInfo(accountOne,17)).sequenceTokens).to.be.eql([]);
			expect((await contract.getTokenInfo(accountOne,18)).sequenceTokens).to.be.eql([]);
			// sequence 19-20
			expect((await contract.getTokenInfo(accountOne,19)).sequenceNumber).to.be.bignumber.equal('1');
			expect((await contract.getTokenInfo(accountOne,20)).sequenceNumber).to.be.bignumber.equal('2');
			expect((await contract.getTokenInfo(accountOne,19)).sequenceTokens).to.be.eql(['19','20']);
			expect((await contract.getTokenInfo(accountOne,20)).sequenceTokens).to.be.eql(['19','20']);

			// sequence dont change after build
			await contract.buildCode(17, {from: accountTwo});
			await contract.buildCode(18, {from: accountTwo});
			expect((await contract.getTokenInfo(accountOne,17)).sequenceNumber).to.be.bignumber.equal('0');
			expect((await contract.getTokenInfo(accountOne,18)).sequenceNumber).to.be.bignumber.equal('0');
			expect((await contract.getTokenInfo(accountOne,17)).sequenceTokens).to.be.eql([]);
			expect((await contract.getTokenInfo(accountOne,18)).sequenceTokens).to.be.eql([]);

		});

		it('Transfer And Build', async () => {
			var contract = await ChromaTwo.new();
			await contract.giftCode(accountOne);

			// buy 1,2
			expect(await contract.balanceOf(accountTwo)).to.be.bignumber.equal('0');
			await _buyCode(contract, accountTwo, 2, false);
			expect((await contract.getTokenInfo(accountOne,1)).isBuilt).to.be.equal(false);
			expect((await contract.getTokenInfo(accountOne,2)).isBuilt).to.be.equal(false);
			expect(await contract.ownerOf(1)).to.be.equal(accountTwo);
			expect(await contract.ownerOf(2)).to.be.equal(accountTwo);

			// build 1
			await contract.buildCode(1, {from: accountTwo});
			expect((await contract.getTokenInfo(accountOne,1)).isBuilt).to.be.equal(true);

			// transfer 2
			await contract.transferFrom(accountTwo, accountThree, 2, { from: accountTwo }); 
			expect(await contract.ownerOf(2)).to.be.equal(accountThree);
			// build 2
			await expectRevert( contract.buildCode(2, {from: accountTwo}), "CC:NotOwner" );
			await contract.buildCode(2, {from: accountThree});
			expect((await contract.getTokenInfo(accountOne,1)).isBuilt).to.be.equal(true);

			// transfer 1 > already built
			await contract.transferFrom(accountTwo, accountThree, 1, { from: accountTwo }); 
			expect(await contract.ownerOf(2)).to.be.equal(accountThree);
			await expectRevert( contract.buildCode(2, {from: accountThree}), "CC:AlreadyBuilt" );
		});
	});

	context('Supply', function () {
		it('Initial Supply', async () => {
			var contract = await ChromaOne.new();

			// Token Zero available to contract owner only
			expect((await contract.getState({from: accountOne})).availableSupply).to.be.equal('0');
			expect((await contract.getState({from: accountTwo})).availableSupply).to.be.equal('0');
			expect((await contract.getState({from: accountOne})).isAvailable).to.be.equal(false);
			expect((await contract.getState({from: accountTwo})).isAvailable).to.be.equal(false);

			// Public total supply (minted tokens) still zero after Token Zero is minted
			expect((await contract.getState()).mintedCount).to.be.equal('0');
			await contract.giftCode(accountOne);
			expect(await contract.totalSupply()).to.be.bignumber.equal('1');
			expect((await contract.getState()).mintedCount).to.be.equal('0');
			
			const config = (await contract.getConfig());
			const initialSupply = parseInt(config.initialSupply);
			const maxSupply = parseInt(config.maxSupply);

			expect(initialSupply).to.be.above(0, "Initial supply cannot be zero");
			expect((await contract.getState()).availableSupply).to.be.equal(initialSupply.toString());
			expect((await contract.getState()).isAvailable).to.be.equal(true);

			// Exceed initial supply
			var currentSupply = parseInt((await contract.getState()).mintedCount);
			await expectRevert( _buyCode(contract, accountTwo, initialSupply+1, true), "CC:TooMany" );

			// buy out initial supply
			for(var tokenIndex=currentSupply ; tokenIndex < initialSupply ; tokenIndex++)
			{
				expect((await contract.getState()).currentSupply).to.be.equal(initialSupply.toString());
				expect((await contract.getState()).availableSupply).to.be.equal((initialSupply-tokenIndex).toString());
				await _buyCode(contract, accountTwo, 1, true);
			}
			expect((await contract.getState()).mintedCount).to.be.equal((initialSupply).toString());

			// Exceed max supply
			await expectRevert( _buyCode(contract, accountTwo, maxSupply+1, true), "CC:TooMany" );

			// buy out until max
			for(var tokenIndex=initialSupply ; tokenIndex < maxSupply ; tokenIndex++)
			{
				expect((await contract.getState()).currentSupply).to.be.bignumber.above(initialSupply.toString());
				expect(parseInt((await contract.getState()).availableSupply)).to.be.above(0);
				await _buyCode(contract, accountTwo, 1, true);
			}

			expect((await contract.getState()).currentSupply).to.be.equal(maxSupply.toString());
			expect((await contract.getState()).availableSupply).to.be.equal('0');
			expect((await contract.getState()).isAvailable).to.be.equal(false);
			await expectRevert( _buyCode(contract, accountTwo, 1, true), "CC:SoldOut" );
		});

		it('Surplus Supply', async () => {
			var contract = await ChromaOne.new();
			await contract.giftCode(accountOne);

			const initialSupply = 10;
			const maxSupply = 20;
			const surplusSupply = 2;
			const maxBuyout = 1;

			// limiters
			await expectRevert( _buyCode(contract, accountTwo, surplusSupply+1, true), "CC:TooMany" );
			await expectRevert( _buyCode(contract, accountTwo, maxBuyout+1, true), "CC:TooMany" );
			await expectRevert( _buyCode(contract, accountTwo, surplusSupply, true), "CC:TooMany" );

			// check config
			const config = (await contract.getConfig());
			expect(config.initialSupply).to.be.equal(initialSupply.toString());
			expect(config.maxSupply).to.be.equal(maxSupply.toString());

			// buy 2 locked
			await _buyCode(contract, accountTwo, 1, false);
			await _buyCode(contract, accountTwo, 1, false);
			// : supply = 2

			// buy out initial supply
			var currentSupply = parseInt((await contract.getState()).mintedCount);
			for(var tokenIndex=currentSupply ; tokenIndex < initialSupply ; tokenIndex++)
				await _buyCode(contract, accountTwo, 1, true);
			// : supply = 10
			// none should be available
			expect((await contract.getState()).availableSupply).to.be.equal('0');
			expect((await contract.getState()).isAvailable).to.be.equal(false);

			// unlock 1,2
			await contract.buildCode(1, {from: accountTwo} );
			expect((await contract.getState()).availableSupply).to.be.equal('1');
			expect((await contract.getState()).isAvailable).to.be.equal(true);
			await contract.buildCode(2, {from: accountTwo} );
			expect((await contract.getState()).availableSupply).to.be.equal('2');
			expect((await contract.getState()).isAvailable).to.be.equal(true);

			// limiters
			await expectRevert( _buyCode(contract, accountTwo, surplusSupply+1, true), "CC:TooMany" );
			await expectRevert( _buyCode(contract, accountTwo, maxBuyout+1, true), "CC:TooMany" );
			await expectRevert( _buyCode(contract, accountTwo, surplusSupply, true), "CC:TooMany" );

			// buy 11,12 (locked)
			await _buyCode(contract, accountTwo, 1, false);
			await _buyCode(contract, accountTwo, 1, false);
			// none available again
			expect((await contract.getState()).mintedCount).to.be.equal('12');
			expect((await contract.getState()).availableSupply).to.be.equal('0');
			expect((await contract.getState()).isAvailable).to.be.equal(false);
			await expectRevert( _buyCode(contract, accountTwo, 1, true), "CC:Unavailable" );
			// : supply = 12
			
			// unlock 11,12
			await contract.buildCode(11, {from: accountTwo} );
			await contract.buildCode(12, {from: accountTwo} );
			// 2 available
			expect((await contract.getState()).availableSupply).to.be.equal(surplusSupply.toString());
			expect((await contract.getState()).isAvailable).to.be.equal(true);

			// buy 13, 14 (unlocked) 15 (locked)
			await _buyCode(contract, accountTwo, 1, true);
			await _buyCode(contract, accountTwo, 1, true);
			await _buyCode(contract, accountTwo, 1, false);
			// with 15, 1 more is 1 available
			expect((await contract.getState()).mintedCount).to.be.equal('15');
			expect((await contract.getState()).currentSupply).to.be.equal('16');
			expect((await contract.getState()).availableSupply).to.be.equal('1');
			expect((await contract.getState()).isAvailable).to.be.equal(true);
			// : supply = 15

			// unlock 13
			await contract.buildCode(15, {from: accountTwo} );
			expect((await contract.getState()).availableSupply).to.be.equal(surplusSupply.toString());
			expect((await contract.getState()).isAvailable).to.be.equal(true);
			// 2 available

			// buy 16,17 (locked) 18 (unavailable)
			await _buyCode(contract, accountTwo, 1, false);
			await _buyCode(contract, accountTwo, 1, false);
			await expectRevert( _buyCode(contract, accountTwo, 1, false), "CC:Unavailable" );
			// none available
			expect((await contract.getState()).mintedCount).to.be.equal('17');
			expect((await contract.getState()).availableSupply).to.be.equal('0');
			expect((await contract.getState()).isAvailable).to.be.equal(false);
			await expectRevert( _buyCode(contract, accountTwo, 1, true), "CC:Unavailable" );

			// unlock 16,17
			await contract.buildCode(16, {from: accountTwo} );
			expect((await contract.getState()).availableSupply).to.be.equal('1');
			expect((await contract.getState()).isAvailable).to.be.equal(true);
			await contract.buildCode(17, {from: accountTwo} );
			expect((await contract.getState()).availableSupply).to.be.equal('2');
			expect((await contract.getState()).isAvailable).to.be.equal(true);
			// buy/unlock 18
			await _buyCode(contract, accountTwo, 1, false);
			await contract.buildCode(18, {from: accountTwo} );
			expect((await contract.getState()).availableSupply).to.be.equal(surplusSupply.toString());
			expect((await contract.getState()).isAvailable).to.be.equal(true);
			// max available is 2, capped at max suypply (20)

			// buy 19,20 (locked)
			await _buyCode(contract, accountTwo, 1, false);
			expect((await contract.getState()).availableSupply).to.be.equal('1');
			expect((await contract.getState()).isAvailable).to.be.equal(true);
			await _buyCode(contract, accountTwo, 1, false);
			expect((await contract.getState()).availableSupply).to.be.equal('0');
			expect((await contract.getState()).isAvailable).to.be.equal(false);
			await expectRevert( _buyCode(contract, accountTwo, 1, true), "CC:SoldOut" );
			// none available, reached max supply

			// unlock 19,20
			await contract.buildCode(19, {from: accountTwo} );
			await contract.buildCode(20, {from: accountTwo} );
			// still sold out
			expect((await contract.getState()).availableSupply).to.be.equal('0');
			expect((await contract.getState()).isAvailable).to.be.equal(false);
			await expectRevert( _buyCode(contract, accountTwo, 1, true), "CC:SoldOut" );
		});

		it('Price Singles', async () => {
			var contract = await ChromaOne.new();
			await contract.giftCode(accountOne);

			const config = (await contract.getConfig());
			const initialPrice_bn = _makePrice(config.initialPrice);
			const maxSupply = parseInt(config.maxSupply);

			// Get available prices
			expect((await contract.getState()).maxBuyout).to.be.equal((maxSupply*0.05).toString());
			const prices = (await contract.getPrices());
			expect(prices.length).to.be.above(0);
			
			// Bad prices
			const value_bn = (await contract.calculatePriceForQuantity(1));
			await expectRevert( contract.buyCode(accountTwo, 1, true, { from: accountTwo, value: 0 }), "CC:BadValue" );
			await expectRevert( contract.buyCode(accountTwo, 1, true, { from: accountTwo, value: value_bn.add(new BN('1')).toString() }), "CC:BadValue" );
			await expectRevert( contract.buyCode(accountTwo, 1, true, { from: accountTwo, value: value_bn.add(new BN('-1')).toString() }), "CC:BadValue" );

			// buy out one by one
			var currentPrice_bn = new BN('0');
			for(var tokenId=1 ; tokenId <= maxSupply ; tokenId++)
			{
				currentPrice_bn = currentPrice_bn.add(initialPrice_bn);
				expect(await contract.calculatePriceForQuantity(1)).to.be.bignumber.equal(currentPrice_bn);
				await _buyCode(contract, accountTwo, 1, true, {from: accountTwo, value: currentPrice_bn.toString()});
			}

			// Sold Out
			expect((await contract.getState()).isAvailable).to.be.equal(false);
			await expectRevert( _buyCode(contract, accountTwo, 1, true), "CC:SoldOut" );
		});

		it('Price Multiples', async () => {
			//
			// TODO
			//
		});

		it('Withdraw', async () => {
			var contract = await ChromaTwo.new();
			await contract.giftCode(accountOne);

			let lastEtherContract = new BN(await web3.eth.getBalance(contract.address));
			let lastEtherOne = new BN(await web3.eth.getBalance(accountOne));

			// buy
			await _buyCode(contract, accountTwo, 1, true);
			await _buyCode(contract, accountTwo, 1, true);

			// check ether balance
			let currentEtherContract = new BN(await web3.eth.getBalance(contract.address));
			let currentEtherOne = new BN(await web3.eth.getBalance(accountOne));
			expect(currentEtherContract).to.be.bignumber.above(lastEtherContract);
			expect(currentEtherOne).to.be.bignumber.equal(lastEtherOne);
			lastEtherContract = currentEtherContract;
			lastEtherOne = currentEtherOne;

			// withdraw
			await expectRevert( contract.withdraw({ from: accountTwo }), "Ownable: caller is not the owner" );
			await contract.withdraw({ from: accountOne });

			// check ether balance
			currentEtherContract = new BN(await web3.eth.getBalance(contract.address));
			currentEtherOne = new BN(await web3.eth.getBalance(accountOne));
			expect(currentEtherContract).to.be.bignumber.below(lastEtherContract);
			expect(currentEtherOne).to.be.bignumber.above(lastEtherOne);
		});

	});

});

//----------------------------------------------
// CHROMA ONE
// 
contract('ChromaOne', (accounts) => {

});


//----------------------------------------------
// CHROMA TWO
// 
contract('ChromaTwo', (accounts) => {
	// Setup
	before(async () => {
		accountOne = accounts[0];
		accountTwo = accounts[5];
		accountThree = accounts[6];
	})

	it('Supply', async () => {
		var contract = await ChromaTwo.new();
		await contract.giftCode(accountOne);

		const initialSupply = 20;
		const maxSupply = 40;
		const surplusSupply = 4;
		const maxBuyout = 2;

		// const prices = (await contract.getPrices());
		// for(let i = 0 ; i < prices.length ; ++i)
		//   console.log(prices[i].toString());

		// buy out initial supply
		var currentSupply = parseInt((await contract.getState()).mintedCount);
		for(var tokenIndex=currentSupply ; tokenIndex < initialSupply ; tokenIndex++) {
			// console.log('Buy token:'+tokenIndex);
			// console.log('Balance='+(await web3.eth.getBalance(accountTwo)));
			await _buyCode(contract, accountTwo, 1, true);
		}

		// full available supply
		expect((await contract.getState()).availableSupply).to.be.equal(surplusSupply.toString());
		expect((await contract.getState()).maxBuyout).to.be.equal(maxBuyout.toString());

		// Exceed supply
		await expectRevert( _buyCode(contract, accountTwo, maxSupply+1, true), "CC:TooMany" );
		await expectRevert( _buyCode(contract, accountTwo, surplusSupply+1, true), "CC:TooMany" );
		await expectRevert( _buyCode(contract, accountTwo, maxBuyout+1, true), "CC:TooMany" );
		
		// buy out initial supply
		var currentSupply = parseInt((await contract.getState()).mintedCount);
		for(var tokenIndex=currentSupply ; tokenIndex < maxSupply ; tokenIndex++)
			await _buyCode(contract, accountTwo, 1, true);

		// sold out
		expect((await contract.getState()).availableSupply).to.be.equal('0');
		expect((await contract.getState()).isAvailable).to.be.equal(false);
		await expectRevert( _buyCode(contract, accountTwo, 1, true), "CC:SoldOut" );
	});

	it('Buy Multiples', async () => {
		var contract = await ChromaTwo.new();
		await contract.giftCode(accountOne);

		const initialSupply = 20;
		const maxSupply = 40;
		const surplusSupply = 4;
		const maxBuyout = 2;

		// 50% (initial supply)
		for(var i = 0 ; i < 10 ; ++i)
			await _buyCode(contract, accountThree, maxBuyout, true);

		// 100% (initial supply)
		for(var i = 0 ; i < 10 ; ++i)
			await _buyCode(contract, accountThree, maxBuyout, true);

		// sold out
		expect((await contract.getState()).availableSupply).to.be.equal('0');
		expect((await contract.getState()).isAvailable).to.be.equal(false);
		await expectRevert( _buyCode(contract, accountThree, 1, true), "CC:SoldOut" );
	});
});


// //----------------------------------------------
// // CHROMA FIVE
// // 
// contract('ChromaFive', (accounts) => {
//   // Setup
//   before(async () => {
//     accountOne = accounts[0];
//     accountTwo = accounts[1];
//   })

//   it('Buy Multiples', async () => {
//     var contract = await ChromaFive.new();
//     await contract.giftCode(accountOne);

//     const initialSupply = 50;
//     const maxSupply = 100;
//     const surplusSupply = 10;
//     const maxBuyout = 5;

//     // 50% (initial supply)
//     for(var i = 0 ; i < 10 ; ++i)
//       await _buyCode(contract, accountTwo, maxBuyout, true);

//     // 100% (initial supply)
//     for(var i = 0 ; i < 10 ; ++i)
//       await _buyCode(contract, accountTwo, maxBuyout, true);

//     // sold out
//     expect((await contract.getState()).availableSupply).to.be.equal('0');
//     expect((await contract.getState()).isAvailable).to.be.equal(false);
//     await expectRevert( _buyCode(contract, accountTwo, 1, true), "CC:SoldOut" );
//   });
// });
