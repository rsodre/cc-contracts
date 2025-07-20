const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const [owner, accountOne, accountTwo, accountThree] = accounts;
const { expect } = require('chai');
require('chai').should();

const { deployChromaBatch, deployAllChromas, _mintChromas, _buyChroma, _toBatchId, deployUtils } = require('./deployments.js');

describe('Chroma Batch', () => {
	const randomAddress = '0x0102030405060708090a0b0c0d0e0f0102030405';

	//------------------------------------------------------
	// BATCH SETUP
	//
	describe('# Setup', async () => {
		let batchInstance, chromaInstances;
		beforeEach(async function () {
			chromaInstances = await deployAllChromas(owner);
		});

		it(`setup from constructor`, async () => {
			batchInstance = await deployChromaBatch(owner, Object.keys(chromaInstances), Object.values(chromaInstances));
			await validateContractSetup();
		});

		it(`setup manually`, async () => {
			// deploy, no contracts
			batchInstance = await deployChromaBatch(owner, [], []);
			await expectRevert.unspecified(batchInstance.series(0));
			// setup ChromaOne, only owner
			await expectRevert(batchInstance.setupContract(1, chromaInstances[1].address, true, { from: accountOne }), 'Ownable: caller is not the owner');
			expectEvent(await batchInstance.setupContract(1, chromaInstances[1].address, true, { from: owner }), 'ContractSetup', { isActive: true, contractAddress: chromaInstances[1].address });
			expect((await batchInstance.series(0)).toNumber()).equal(1);
			await expectRevert.unspecified(batchInstance.series(1));
			// setup invalid addresses, must revert
			await expectRevert(batchInstance.setupContract(2, owner, true, { from: owner }), 'ChromaBatch: Not a contract');
			await expectRevert(batchInstance.setupContract(2, randomAddress, true, { from: owner }), 'ChromaBatch: Not a contract');
			await expectRevert(batchInstance.setupContract(2, (await deployUtils(owner)).address, true, { from: owner }), 'ChromaBatch: Contract is not Chroma');
			await expectRevert(batchInstance.setupContract(2, batchInstance.address, true, { from: owner }), 'ChromaBatch: Cannot add self');
			await expectRevert.unspecified(batchInstance.series(1));
			// setup invalid addresses
			expectEvent(await batchInstance.setupContract(2, chromaInstances[2].address, false, { from: owner }), 'ContractSetup', { isActive: false });
			expectEvent(await batchInstance.setupContract(3, chromaInstances[3].address, false, { from: owner }), 'ContractSetup', { isActive: false });
			expectEvent(await batchInstance.setupContract(4, chromaInstances[4].address, false, { from: owner }), 'ContractSetup', { isActive: false });
			expectEvent(await batchInstance.setupContract(5, chromaInstances[5].address, false, { from: owner }), 'ContractSetup', { isActive: false });
			expect((await batchInstance.series(1)).toNumber()).equal(2);
			expect((await batchInstance.series(2)).toNumber()).equal(3);
			expect((await batchInstance.series(3)).toNumber()).equal(4);
			expect((await batchInstance.series(4)).toNumber()).equal(5);
			await expectRevert.unspecified(batchInstance.series(5));
			// update a contract, size does not change
			expectEvent(await batchInstance.setupContract(2, chromaInstances[2].address, true, { from: owner }), 'ContractSetup', { isActive: true });
			expectEvent(await batchInstance.setupContract(3, chromaInstances[3].address, true, { from: owner }), 'ContractSetup', { isActive: true });
			expectEvent(await batchInstance.setupContract(4, chromaInstances[4].address, true, { from: owner }), 'ContractSetup', { isActive: true });
			expectEvent(await batchInstance.setupContract(5, chromaInstances[5].address, true, { from: owner }), 'ContractSetup', { isActive: true });
			expect((await batchInstance.series(1)).toNumber()).equal(2);
			expect((await batchInstance.series(2)).toNumber()).equal(3);
			expect((await batchInstance.series(3)).toNumber()).equal(4);
			expect((await batchInstance.series(4)).toNumber()).equal(5);
			await expectRevert.unspecified(batchInstance.series(5));
			// validate contracts
			await validateContractSetup();
		});

		async function validateContractSetup() {
			for (let i = 1; i <= 5; ++i) {
				// gridSize array values
				expect((await batchInstance.series(i-1)).toNumber()).equal(i);
				// contratcs values
				const c = await batchInstance.contracts(i);
				expect(c.seriesNumber.toNumber()).equal(i);
				expect(c.instance).equal(chromaInstances[i].address);
				expect(c.isActive).equal(true);
			}
			// Grid size is 5!
			await expectRevert.unspecified(batchInstance.series(6));
		}

		// from:
		// https://eips.ethereum.org/EIPS/eip-165
		// https://eips.ethereum.org/EIPS/eip-721
		const _INTERFACE_ID_IERC165 = '0x01ffc9a7';
		const _INTERFACE_ID_IERC721 = '0x80ac58cd';
		const _INTERFACE_ID_IERC721METADATA = '0x5b5e139f';
		const _INTERFACE_ID_IERC721ENUMERABLE = '0x780e9d63';
		it(`visibility`, async () => {
			batchInstance = await deployChromaBatch(owner, Object.keys(chromaInstances), Object.values(chromaInstances));
			expect(await batchInstance.supportsInterface(_INTERFACE_ID_IERC165)).equal(true);
			expect(await batchInstance.supportsInterface(_INTERFACE_ID_IERC721)).equal(true);
			expect(await batchInstance.supportsInterface(_INTERFACE_ID_IERC721METADATA)).equal(true);
			expect(await batchInstance.supportsInterface(_INTERFACE_ID_IERC721ENUMERABLE)).equal(true);
			// make invisible
			await expectRevert(batchInstance.setVisibility(false, { from: accountOne }), 'Ownable: caller is not the owner');
			expectEvent(await batchInstance.setVisibility(false, { from: owner }), 'ChangedVisibility', { isVisible: false });
			expect(await batchInstance.supportsInterface(_INTERFACE_ID_IERC165)).equal(true);
			expect(await batchInstance.supportsInterface(_INTERFACE_ID_IERC721)).equal(false);
			expect(await batchInstance.supportsInterface(_INTERFACE_ID_IERC721METADATA)).equal(false);
			expect(await batchInstance.supportsInterface(_INTERFACE_ID_IERC721ENUMERABLE)).equal(false);
			// visible again
			expectEvent(await batchInstance.setVisibility(true, { from: owner }), 'ChangedVisibility', { isVisible: true });
			expect(await batchInstance.supportsInterface(_INTERFACE_ID_IERC165)).equal(true);
			expect(await batchInstance.supportsInterface(_INTERFACE_ID_IERC721)).equal(true);
			expect(await batchInstance.supportsInterface(_INTERFACE_ID_IERC721METADATA)).equal(true);
			expect(await batchInstance.supportsInterface(_INTERFACE_ID_IERC721ENUMERABLE)).equal(true);
		});

	});

	//------------------------------------------------------
	// BATCH TOKENS
	//
	describe('# Tokens', async () => {
		let batchInstance, chromaInstances;
		before(async function () {
			chromaInstances = await deployAllChromas(owner);
			batchInstance = await deployChromaBatch(owner, Object.keys(chromaInstances), Object.values(chromaInstances));
		});

		const chromasToMint = [
			// ChromaFive (10)
			{ gridSize: 5, quantity: 1, build: false, account: accountOne },
			{ gridSize: 5, quantity: 1, build: true, account: accountOne },
			{ gridSize: 5, quantity: 3, build: true, account: accountOne },
			{ gridSize: 5, quantity: 2, build: false, account: accountTwo },
			{ gridSize: 5, quantity: 3, build: false, account: accountTwo },
			// ChromaFour (8)
			{ gridSize: 4, quantity: 2, build: false, account: accountTwo },
			{ gridSize: 4, quantity: 2, build: true, account: accountTwo },
			{ gridSize: 4, quantity: 1, build: true, account: accountOne },
			{ gridSize: 4, quantity: 3, build: false, account: accountOne },
			// ChromaThree (6)
			{ gridSize: 3, quantity: 1, build: false, account: accountOne },
			{ gridSize: 3, quantity: 2, build: true, account: accountTwo },
			{ gridSize: 3, quantity: 3, build: true, account: accountOne },
			// ChromaTwo (5)
			{ gridSize: 2, quantity: 2, build: false, account: accountOne },
			{ gridSize: 2, quantity: 2, build: true, account: accountTwo },
			{ gridSize: 2, quantity: 1, build: true, account: accountTwo },
			// ChromaOne (3)
			{ gridSize: 1, quantity: 1, build: false, account: accountOne },
			{ gridSize: 1, quantity: 1, build: true, account: accountOne },
			{ gridSize: 1, quantity: 1, build: true, account: accountTwo },
		];
		let chromasMinted = [];
		let chromasSorted = [];
		let chromasPerAccount = {};
		let chromaSupply = 0;
		let chromaCounts = {};	// no token zero
		let supplyCounts = {};	// with token zero

		it(`release`, async () => {
			expectEvent(await chromaInstances[5].giftCode(owner, { from: owner }), 'Transfer');
			expectEvent(await chromaInstances[4].giftCode(owner, { from: owner }), 'Transfer');
			expectEvent(await chromaInstances[3].giftCode(owner, { from: owner }), 'Transfer');
			expectEvent(await chromaInstances[2].giftCode(owner, { from: owner }), 'Transfer');
			expectEvent(await chromaInstances[1].giftCode(owner, { from: owner }), 'Transfer');
		});

		it(`released totalSupply()`, async () => {
			const totalSupply = (await batchInstance.totalSupply()).toNumber();
			expect(totalSupply, `Wrong released supply (${totalSupply}) != (${5})`).equal(5);
		});

		it(`released balanceOf()`, async () => {
			const balance = (await batchInstance.balanceOf(owner)).toNumber();
			expect(balance, `Wrong released balance (${balance}) != (${5})`).equal(5);
		});

		it(`released tokeURI(), ownerOf()`, async () => {
			for (let i = 1; i <= 5; ++i) {
				const batchId = _toBatchId(i, 0);
				const chromaURI = await chromaInstances[i].tokenURI(new BN(0));
				const batchURI = await batchInstance.tokenURI(new BN(batchId));
				expect(chromaURI, `tokenURI [${i}][${0}] mismatch to batch [${batchId}]`).equal(batchURI);
				// check Owner
				expect(await batchInstance.ownerOf(batchId, { from: accountOne })).equal(owner);
			}
		});

		it(`invalid batch token ids`, async () => {
			await expectRevert(batchInstance.tokenURI(new BN(0), { from: accountOne }), 'ChromaBatch: Bad Batch Token Id');
			await expectRevert(batchInstance.tokenURI(new BN(1), { from: accountOne }), 'ChromaBatch: Bad Batch Token Id');
			await expectRevert(batchInstance.tokenURI(_toBatchId(1, 1), { from: accountOne }), 'CC:BadTokenId');
			await expectRevert(batchInstance.tokenURI(_toBatchId(6, 1), { from: accountOne }), 'ChromaBatch: Batch Token not found');
		});

		it(`mint chromas`, async () => {
			chromasMinted = await _mintChromas(chromaInstances, chromasToMint );
			expect(chromasMinted.length, `Chromas not minted (${chromasMinted.length}) < (${chromasToMint.length})`).greaterThanOrEqual(chromasToMint.length);
			// count minted
			chromasMinted.forEach(function (mint) {
				chromaCounts[mint.gridSize] = chromaCounts[mint.gridSize] === undefined ? 1 : chromaCounts[mint.gridSize] + 1;
				supplyCounts[mint.gridSize] = supplyCounts[mint.gridSize] === undefined ? 2 : supplyCounts[mint.gridSize] + 1;
			});
			const totalCounted = Object.values(supplyCounts).reduce((partialSum, count) => partialSum + count, 0);
			expect(totalCounted).greaterThanOrEqual(chromasToMint.length);
		});

		it(`sort chromas, adding token zeros`, async () => {
			chromasSorted = [...chromasMinted];
			// add token zeros
			for (let i = 1; i <= 5; ++i) {
				chromasSorted.push({
					gridSize: i,
					tokenId: 0,
					batchId: _toBatchId(i, 0),
					built: true,
					account: owner,
				});
			}
			// sort
			chromasSorted.sort(function (a, b) {
				if (a.gridSize == b.gridSize) {
					return a.tokenId - b.tokenId;
				}
				return a.gridSize - b.gridSize;
			});
			// sort per account
			chromasSorted.forEach(function (mint) {
				if (chromasPerAccount[mint.account] == undefined) chromasPerAccount[mint.account] = [];
				chromasPerAccount[mint.account].push(mint);
			});
		});

		it(`minted totalSupply()`, async () => {
			chromaSupply = chromasSorted.length;
			const totalSupply = (await batchInstance.totalSupply()).toNumber();
			expect(totalSupply, `Wrong minted supply (${totalSupply}) != (${chromaSupply})`).equal(chromaSupply);
		});

		it(`minted balanceOf()`, async () => {
			for (let a = 0; a < accounts.length; ++a) {
				const account = accounts[a];
				const balance = (await batchInstance.balanceOf(account)).toNumber();
				const accountCount = chromasPerAccount[account] != undefined ? chromasPerAccount[account].length : 0;
				expect(balance, `Wrong minted balance [${account}](${balance}) != (${accountCount})`).equal(accountCount);
			}
		});

		it(`minted tokeURI(), ownerOf()`, async () => {
			for (let i = 0; i < chromasMinted.length ; ++i) {
				const mint = chromasMinted[i];
				const chromaInstance = chromaInstances[mint.gridSize];
				const batchId = _toBatchId(mint.gridSize, mint.tokenId);
				const chromaURI = await chromaInstance.tokenURI(new BN(mint.tokenId));
				const batchURI = await batchInstance.tokenURI(new BN(batchId));
				expect(chromaURI, `tokenURI [${i}][${mint.tokenId}] mismatch to batch [${batchId}]`).equal(batchURI);
				// check Owner
				expect(await batchInstance.ownerOf(batchId)).equal(mint.account);
			}
		});

		it(`tokenByIndex()`, async () => {
			const totalSupply = (await batchInstance.totalSupply()).toNumber();
			expect(chromasSorted.length, `Sorted chromas count (${chromasSorted.length}) != totalSupply (${totalSupply})`).equal(totalSupply);
			await test_tokenByIndex();
		});
		async function test_tokenByIndex(disabledGrids=[]) {
			let index = 0;
			for (let i = 0; i < chromasSorted.length; ++i) {
				const mint = chromasSorted[i];
				if(disabledGrids.includes(parseInt(mint.gridSize))) continue;
				const batchTokenId = (await batchInstance.tokenByIndex(index)).toNumber();
				expect(batchTokenId, `Wrong tokenByIndex [${index}](${batchTokenId}) != (${mint.batchId})`).equal(mint.batchId);
				index++;
			}
			// no more
			await expectRevert(batchInstance.tokenByIndex(index), 'ChromaBatch: global index out of bounds');
		}

		it(`tokenOfOwnerByIndex()`, async () => {
			await test_tokenOfOwnerByIndex();
		});
		async function test_tokenOfOwnerByIndex(disabledGrids = []) {
			for (let a = 0; a < accounts.length; ++a) {
				const account = accounts[a];
				const chomas = chromasPerAccount[account] != undefined ? chromasPerAccount[account] : [];
				const balance = (await batchInstance.balanceOf(account)).toNumber();
				if (disabledGrids.length == 0) {
					expect(balance, `Account balance mismatch [${a}](${balance}) != (${chomas.length})`).equal(chomas.length);
				}
				let index = 0;
				for (let i = 0; i < chomas.length; ++i) {
					const mint = chomas[i];
					if (disabledGrids.includes(parseInt(mint.gridSize))) continue;
					const batchTokenId = (await batchInstance.tokenOfOwnerByIndex(account, index)).toNumber();
					expect(batchTokenId, `Wrong tokenOfOwnerByIndex [${i}](${batchTokenId}) != (${mint.batchId})`).equal(mint.batchId);
					index++;
				}
				// no more
				await expectRevert(batchInstance.tokenOfOwnerByIndex(account, index), 'ChromaBatch: owner index out of bounds');
			}
		}

		it(`!isActive`, async () => {
			let totalSupply = 0;
			let deactivatedCount = 0;
			let accountOneBalance = chromasPerAccount[accountOne].length;
			let accountTwoBalance = chromasPerAccount[accountTwo].length;
			expect(accountOneBalance).greaterThan(0);
			expect(accountTwoBalance).greaterThan(0);
			expect(accountOneBalance + accountTwoBalance).equal(chromasMinted.length);
			for (let i = 1; i <= 5; ++i) {
				const chromaInstance = chromaInstances[i];
				expectEvent(await batchInstance.setupContract(i, chromaInstance.address, false, { from: owner }), 'ContractSetup');
				deactivatedCount += supplyCounts[i];
				const newSupply = chromaSupply - deactivatedCount;
				// affects supply
				totalSupply = (await batchInstance.totalSupply()).toNumber();
				expect(totalSupply, `Wrong supply [${i}](${totalSupply}) != (${newSupply})`).equal(newSupply);
				// affects balance
				const balanceOfAccountOne = (await batchInstance.balanceOf(accountOne)).toNumber();
				const balanceOfAccountTwo = (await batchInstance.balanceOf(accountTwo)).toNumber();
				expect(balanceOfAccountOne, `Wrong supply [${i}](${accountOne}) != (${accountOneBalance})`).lessThan(accountOneBalance);
				expect(balanceOfAccountTwo, `Wrong supply [${i}](${accountTwo}) != (${accountOneBalance})`).lessThan(accountTwoBalance);
				accountOneBalance = balanceOfAccountOne;
				accountTwoBalance = balanceOfAccountTwo;
				// not founds...
				await expectRevert(batchInstance.ownerOf(_toBatchId(i, 0), { from: accountOne }), 'ChromaBatch: Batch Token not found');
				await expectRevert(batchInstance.ownerOf(_toBatchId(i, 1), { from: accountOne }), 'ChromaBatch: Batch Token not found');
				await expectRevert(batchInstance.tokenURI(_toBatchId(i, 0), { from: accountOne }), 'ChromaBatch: Batch Token not found');
				await expectRevert(batchInstance.tokenURI(_toBatchId(i, 1), { from: accountOne }), 'ChromaBatch: Batch Token not found');
			}
			// zero conts
			expect(totalSupply, `Deactivated supply should be zero`).equal(0);
			expect(accountOneBalance, 'Balance should be zero').equal(0);
			expect(accountTwoBalance, 'Balance should be zero').equal(0);
			await expectRevert(batchInstance.tokenByIndex(0, { from: accountOne }), 'ChromaBatch: global index out of bounds');
			for (let a = 0; a < accounts.length; ++a) {
				const account = accounts[a];
				const balance = (await batchInstance.balanceOf(account)).toNumber();
				expect(balance, `Account balance mismatch [${a}](${balance}) != (${0})`).equal(0);
				await expectRevert(batchInstance.tokenOfOwnerByIndex(account, 0, { from: accountOne }), 'ChromaBatch: owner index out of bounds');
			}
			// re-activate
			await activateAllChromas();
		});
		async function activateAllChromas() {
			for (let i = 1; i <= 5; ++i) {
				expectEvent(await batchInstance.setupContract(i, chromaInstances[i].address, true, { from: owner }), 'ContractSetup');
			}
		}

		it(`!isActive + tokenByIndex()`, async () => {
			const gridsToDisable = [5, 1, 3, 2, 4];
			for (let i = 0; i < gridsToDisable.length; ++i) {
				const gridSize = gridsToDisable[i];
				const chromaInstance = chromaInstances[gridSize];
				expectEvent(await batchInstance.setupContract(gridSize, chromaInstance.address, false, { from: owner }), 'ContractSetup');
				await test_tokenByIndex(gridsToDisable.slice(0, i + 1));
			}
			// re-activate
			await activateAllChromas();
		});

		it(`!isActive + tokenOfOwnerByIndex()`, async () => {
			const gridsToDisable = [5, 1, 3, 2, 4];
			for (let i = 0; i < gridsToDisable.length; ++i) {
				const gridSize = gridsToDisable[i];
				const chromaInstance = chromaInstances[gridSize];
				expectEvent(await batchInstance.setupContract(gridSize, chromaInstance.address, false, { from: owner }), 'ContractSetup');
				await test_tokenOfOwnerByIndex(gridsToDisable.slice(0, i + 1));
			}
			// re-activate
			await activateAllChromas();
		});

		it(`Transfer Token ownership`, async () => {
			const startTotalSupply = (await batchInstance.totalSupply()).toNumber();
			const startBalanceOne = (await batchInstance.balanceOf(accountOne)).toNumber();
			const startBalanceTwo = (await batchInstance.balanceOf(accountTwo)).toNumber();
			const startBalanceThree = (await batchInstance.balanceOf(accountThree)).toNumber();
			expect(startBalanceThree).equal(0);
			// Save accountOne owner batch ids
			let batchIds = [];
			let index = 0;
			for (let i = 0; i < chromasSorted.length; ++i) {
				const mint = chromasSorted[i];
				if (mint.account == accountOne) {
					batchIds.push((await batchInstance.tokenOfOwnerByIndex(mint.account, index++)).toNumber());
				}
			}
			await expectRevert(batchInstance.tokenOfOwnerByIndex(accountThree, 0), 'ChromaBatch: owner index out of bounds');
			// Transfer all accountOne to accountThree
			for (let i = 0; i < chromasMinted.length; ++i) {
				const mint = chromasMinted[i];
				if(mint.account == accountOne) {
					const chromaInstance = chromaInstances[mint.gridSize];
					const batchId = _toBatchId(mint.gridSize, mint.tokenId);
					expect(await batchInstance.ownerOf(batchId)).equal(mint.account);
					expectEvent(await chromaInstance.transferFrom(mint.account, accountThree, mint.tokenId, { from: mint.account }), 'Transfer');
					expect(await batchInstance.ownerOf(batchId)).equal(accountThree);
				}
			}
			// compare balances
			const endTotalSupply = (await batchInstance.totalSupply()).toNumber();
			const endBalanceOne = (await batchInstance.balanceOf(accountOne)).toNumber();
			const endBalanceTwo = (await batchInstance.balanceOf(accountTwo)).toNumber();
			const endBalanceThree = (await batchInstance.balanceOf(accountThree)).toNumber();
			expect(endTotalSupply).equal(startTotalSupply);
			expect(endBalanceOne).equal(0);
			expect(endBalanceTwo).equal(startBalanceTwo);
			expect(endBalanceThree).equal(startBalanceOne);
			// Transfered owner batch ids
			index = 0;
			for (let i = 0; i < chromasSorted.length; ++i) {
				const mint = chromasSorted[i];
				if (mint.account == accountOne) {
					const batchId = (await batchInstance.tokenOfOwnerByIndex(accountThree, index)).toNumber();
					expect(batchId, `Batch Id [${index}](${batchId}) != (${batchIds[index]})`).equal(batchIds[index]);
					index++;
				}
			}
			await expectRevert(batchInstance.tokenOfOwnerByIndex(accountOne, 0), 'ChromaBatch: owner index out of bounds');
		});


	});


	//------------------------------------------------------
	// BATCH TRANSFERS
	//
	describe.skip('# Transfers', async () => {
		let batchInstance, chromaInstances;
		before(async function () {
			chromaInstances = await deployAllChromas(owner);
			batchInstance = await deployChromaBatch(owner, Object.keys(chromaInstances), Object.values(chromaInstances));
		});

		const chromasToMint = [
			{ quantity: 1, build: false, account: accountOne },
			{ quantity: 1, build: true, account: accountOne },
			{ quantity: 1, build: true, account: accountOne },
			{ quantity: 1, build: false, account: accountOne },
		];
		let chromasMinted = [];
		let chromaIndex = 0;

		it(`mint chromas`, async () => {
			// release
			const chromaInstance = chromaInstances[5];
			expectEvent(await chromaInstance.giftCode(owner, { from: owner }), 'Transfer');
			// mint
			chromasMinted = await _mintChromas(chromaInstance, chromasToMint);
			const totalSupply = (await chromaInstance.totalSupply()).toNumber();
			expect(totalSupply, `Wrong chroma supply (${totalSupply}) != (${chromasMinted.length + 1})`).equal(chromasMinted.length + 1);
		});

		it(`chroma.transferFrom()`, async () => {
			const chromaInstance = chromaInstances[5];
			const mint = chromasMinted[chromaIndex++];
			expectEvent(await chromaInstance.transferFrom(mint.account, mint.otherAccount, mint.tokenId, { from: mint.account }), 'Transfer');
		});
		it(`batch.transferFrom()`, async () => {
			const chromaInstance = chromaInstances[5];
			const mint = chromasMinted[chromaIndex++];
			// not approved yet
			await expectRevert(batchInstance.transferFrom(mint.account, mint.otherAccount, mint.tokenId, { from: mint.account }), 'Approve Chroma Batch first');
			// approve and transfer!
			expectEvent(await chromaInstance.setApprovalForAll(batchInstance.address, true, { from: mint.account }), 'ApprovalForAll', { operator: batchInstance.address });
			expectEvent(await batchInstance.transferFrom(mint.account, mint.otherAccount, mint.tokenId, { from: mint.account }), 'Transfer');
		});
		it(`batch.safeTransferFrom()`, async () => {
			const mint = chromasMinted[chromaIndex++];
			expectEvent(await batchInstance.safeTransferFrom(mint.account, mint.otherAccount, mint.tokenId, { from: mint.account }), 'Transfer');
		});
		it(`batch.safeTransferFrom(data)`, async () => {
			const mint = chromasMinted[chromaIndex++];
			expectEvent(await batchInstance.safeTransferFrom(mint.account, mint.otherAccount, mint.tokenId, 'some data', { from: mint.account }), 'Transfer');
		});

	});

});
