const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const [owner, accountOne, accountTwo] = accounts;
const { expect } = require('chai');
require('chai').should();

const { deployChromaFive, _mintChromas, _buyChroma } = require('./deployments.js');

const WhitelistTest = contract.fromArtifact('WhitelistTest');
const Whitelist = contract.fromArtifact('Whitelist');
async function deployWhitelistTest(ownerAccount) {
	const wl = await Whitelist.new({ from: ownerAccount });
	await WhitelistTest.detectNetwork();
	await WhitelistTest.link('Whitelist', wl.address);
	return await WhitelistTest.new({ from: ownerAccount });
};

describe('Whitelist', () => {

	describe('# ChromaFive', async () => {
		let instance, chromaInstance;
		before(async function () {
			instance = await deployWhitelistTest(owner);
			chromaInstance = await deployChromaFive(owner);
		});

		const chromasToMint = [
			{ quantity: 1, build: false, account: accountOne }, // 0
			{ quantity: 1, build: true, account: accountOne },	// 1
			{ quantity: 1, build: false, account: accountTwo },	// 2
			{ quantity: 1, build: false, account: accountTwo },	// 3
			{ quantity: 1, build: false, account: accountTwo },	// 4
			{ quantity: 1, build: false, account: accountTwo },	// 5
			{ quantity: 1, build: false, account: accountTwo },	// 6
			// multiples
			{ quantity: 5, build: false, account: accountOne },	// 7-11
			{ quantity: 5, build: true, account: accountOne },	// 12-16
			{ quantity: 1, build: false, account: accountTwo },	// 17
		];
		let chromas = [];

		const mintsPerSource = 1;
		const mintsPerBuilt = 3;

		it(`setup whitelist contract`, async () => {
			await instance.setupWhitelistContract(chromaInstance.address, mintsPerSource, mintsPerBuilt, { from: owner });
		});

		it(`mint chromas`, async () => {
			// release
			expectEvent(await chromaInstance.giftCode(owner, { from: owner }), 'Transfer');
			// mint
			chromas = await _mintChromas(chromaInstance, chromasToMint, { mintsPerSource, mintsPerBuilt });
			const totalSupply = (await chromaInstance.totalSupply()).toNumber();
			expect(totalSupply, `Wrong chroma supply (${totalSupply}) != (${chromas.length + 1})`).equal(chromas.length + 1);
		});

		it(`whitelist totalSupply()`, async () => {
			const totalSupply = (await instance.chroma_totalSupply()).toNumber();
			expect(totalSupply, `Wrong whitelist supply (${totalSupply}) != (${chromas.length + 1})`).equal(chromas.length + 1);
		});

		it(`whitelist isTokenBuilt()`, async () => {
			for (let i = 0; i < chromas.length; ++i) {
				const tokenId = chromas[i].tokenId;
				const expected = chromas[i].built;
				const isBuilt = await instance.wl_isTokenBuilt(tokenId);
				expect(isBuilt, `Token isBuilt [${tokenId}](${isBuilt}) != (${expected})`).equal(expected);
			}
		});

		it(`whitelist uri is built`, async () => {
			for (let i = 0; i < chromas.length; ++i) {
				const tokenId = chromas[i].tokenId;
				const uri = await instance.chroma_tokenURI(tokenId);
				const expected = !uri.endsWith('pixels=');
				const isBuilt = await instance.wl_isTokenBuilt(tokenId);
				expect(isBuilt, `Token isBuilt [${tokenId}](${isBuilt}) != URI (${expected})`).equal(expected);
			}
		});

		it(`allowed / available mints (inexistent token)`, async () => {
			const allowedMints = (await instance.wl_calcAllowedMintsPerTokenId(100)).toNumber();
			expect(allowedMints, `Token allowedMints (${allowedMints}) != (0)`).equal(0);
			const availableMints = (await instance.wl_calcAvailableMintsPerTokenId(100)).toNumber();
			expect(availableMints, `Token availableMints (${allowedMints}) != (0)`).equal(0);
		});

		it(`allowed / available mints`, async () => {
			for (let i = 0; i < chromas.length; ++i) {
				const tokenId = chromas[i].tokenId;
				const expected = chromas[i].allowedMints;
				const allowedMints = (await instance.wl_calcAllowedMintsPerTokenId(tokenId)).toNumber();
				expect(allowedMints, `Token allowedMints [${tokenId}](${allowedMints}) != (${expected})`).equal(expected);
				const availableMints = (await instance.wl_calcAvailableMintsPerTokenId(tokenId)).toNumber();
				expect(availableMints, `Token availableMints [${tokenId}](${availableMints}) != (${expected})`).equal(expected);
			}
		});

		it(`getAvailableMintsForUser()`, async () => {
			for (let a = 1; a <= 2; ++a) {
				const account = a == 1 ? accountOne : accountTwo;
				let accountChromas = [];
				chromas.forEach(function (mint) {
					if (mint.account == account) accountChromas.push(mint)
				});
				const mapping = (await instance.wl_getAvailableMintsForUser(account, { from: account }));
				expect(accountChromas.length, `mapping${a} size mismatch`).equal(mapping['0'].length);
				const tokenIds = mapping['0'].map(x => x.toNumber());
				const available = mapping['1'].map(x => x.toNumber());
				for (let i = 0; i < accountChromas.length; ++i) {
					const ch = accountChromas[i];
					expect(tokenIds[i], `mapping${a} id[${i}](${tokenIds[i]}) != (${ch.tokenId})`).equal(ch.tokenId);
					expect(available[i], `mapping${a} id[${i}](${available[i]}) != (${ch.allowedMints})`).equal(ch.allowedMints);
				}
			}
		});

		it(`claim by others`, async () => {
			for (let i = 0; i < chromas.length; ++i) {
				await expectRevert(instance.wl_claimTokenIds([chromas[i].tokenId], { from: chromas[i].otherAccount }), 'Whitelist: Not Owner');
			}
		});

		it(`claim source`, async () => {
			const ch = chromas[0];
			expect(ch.built, 'Need Source token').equal(false);
			// claim
			expect((await instance.wl_calcAllowedMintsPerTokenId(ch.tokenId)).toNumber()).equal(mintsPerSource);
			expect((await instance.wl_calcAvailableMintsPerTokenId(ch.tokenId)).toNumber()).equal(mintsPerSource);
			expectEvent(await instance.wl_claimTokenIds([ch.tokenId], { from: ch.account }), 'Minted', { quantity: mintsPerSource.toString() });
			// allowed does not change, available is zero
			expect((await instance.wl_calcAllowedMintsPerTokenId(ch.tokenId)).toNumber()).equal(mintsPerSource);
			expect((await instance.wl_calcAvailableMintsPerTokenId(ch.tokenId)).toNumber()).equal(0);
			// try another (revert)
			await expectRevert(instance.wl_claimTokenIds([ch.tokenId], { from: ch.account }), 'Whitelist: None available');
		});

		it(`claim built`, async () => {
			const ch = chromas[1];
			expect(ch.built, 'Need Built token').equal(true);
			expect((await instance.wl_calcAllowedMintsPerTokenId(ch.tokenId)).toNumber()).equal(mintsPerBuilt);
			expect((await instance.wl_calcAvailableMintsPerTokenId(ch.tokenId)).toNumber()).equal(mintsPerBuilt);
			expectEvent(await instance.wl_claimTokenIds([ch.tokenId], { from: ch.account }), 'Minted', { quantity: mintsPerBuilt.toString() });
			// allowed does not change, available is zero
			expect((await instance.wl_calcAllowedMintsPerTokenId(ch.tokenId)).toNumber()).equal(mintsPerBuilt);
			expect((await instance.wl_calcAvailableMintsPerTokenId(ch.tokenId)).toNumber()).equal(0);
			// try another (revert)
			await expectRevert(instance.wl_claimTokenIds([ch.tokenId], { from: ch.account }), 'Whitelist: None available');
		});

		it(`claim source + build + claim built`, async () => {
			const ch = chromas[2];
			expect(ch.built, 'Need Source token').equal(false);
			// claim source
			expectEvent(await instance.wl_claimTokenIds([ch.tokenId], { from: ch.account }), 'Minted', { quantity: mintsPerSource.toString() });
			expect((await instance.wl_calcAvailableMintsPerTokenId(ch.tokenId)).toNumber()).equal(0);
			// build
			expect(await instance.wl_isTokenBuilt(ch.tokenId), '').equal(false);
			await chromaInstance.buildCode(ch.tokenId, { from: ch.account });
			expect(await instance.wl_isTokenBuilt(ch.tokenId), '').equal(true);
			// claim again
			const newAvailable = mintsPerBuilt - mintsPerSource;
			expect((await instance.wl_calcAvailableMintsPerTokenId(ch.tokenId)).toNumber()).equal(newAvailable);
			expectEvent(await instance.wl_claimTokenIds([ch.tokenId], { from: ch.account }), 'Minted', { quantity: newAvailable.toString() });
			expect((await instance.wl_calcAvailableMintsPerTokenId(ch.tokenId)).toNumber()).equal(0);
			// try another (revert)
			await expectRevert(instance.wl_claimTokenIds([ch.tokenId], { from: ch.account }), 'Whitelist: None available');
		});

		it(`transfer + claim`, async () => {
			const ch = chromas[3];
			expect(ch.built, 'Need Source token').equal(false);
			// transfer
			expectEvent(await chromaInstance.transferFrom(ch.account, ch.otherAccount, ch.tokenId, { from: ch.account }), 'Transfer');
			// original owner cant claim anymore
			await expectRevert(instance.wl_claimTokenIds([ch.tokenId], { from: ch.account }), 'Whitelist: Not Owner');
			// new owner can claim
			expectEvent(await instance.wl_claimTokenIds([ch.tokenId], { from: ch.otherAccount }), 'Minted', { quantity: mintsPerSource.toString() });
			expect((await instance.wl_calcAvailableMintsPerTokenId(ch.tokenId)).toNumber()).equal(0);
		});

		it(`claim + transfer + claim (revert)`, async () => {
			const ch = chromas[4];
			expect(ch.built, 'Need Source token').equal(false);
			// claim built
			expectEvent(await instance.wl_claimTokenIds([ch.tokenId], { from: ch.account }), 'Minted', { quantity: mintsPerSource.toString() });
			expect((await instance.wl_calcAvailableMintsPerTokenId(ch.tokenId)).toNumber()).equal(0);
			// transfer
			expectEvent(await chromaInstance.transferFrom(ch.account, ch.otherAccount, ch.tokenId, { from: ch.account }), 'Transfer');
			// new owner has none available
			await expectRevert(instance.wl_claimTokenIds([ch.tokenId], { from: ch.otherAccount }), 'Whitelist: None available');
		});

		it(`claim source + transfer + build + claim built`, async () => {
			const ch = chromas[5];
			expect(ch.built, 'Need Source token').equal(false);
			// claim source
			expectEvent(await instance.wl_claimTokenIds([ch.tokenId], { from: ch.account }), 'Minted', { quantity: mintsPerSource.toString() });
			expect((await instance.wl_calcAvailableMintsPerTokenId(ch.tokenId)).toNumber()).equal(0);
			// transfer
			expectEvent(await chromaInstance.transferFrom(ch.account, ch.otherAccount, ch.tokenId, { from: ch.account }), 'Transfer');
			// build
			expect(await instance.wl_isTokenBuilt(ch.tokenId), '').equal(false);
			await chromaInstance.buildCode(ch.tokenId, { from: ch.otherAccount });
			expect(await instance.wl_isTokenBuilt(ch.tokenId), '').equal(true);
			// original owner cant claim anymore
			await expectRevert(instance.wl_claimTokenIds([ch.tokenId], { from: ch.account }), 'Whitelist: Not Owner');
			// claim built
			const newAvailable = mintsPerBuilt - mintsPerSource;
			expect((await instance.wl_calcAvailableMintsPerTokenId(ch.tokenId)).toNumber()).equal(newAvailable);
			expectEvent(await instance.wl_claimTokenIds([ch.tokenId], { from: ch.otherAccount }), 'Minted', { quantity: newAvailable.toString() });
			expect((await instance.wl_calcAvailableMintsPerTokenId(ch.tokenId)).toNumber()).equal(0);
		});

		it(`claim source + build + transfer + claim built`, async () => {
			const ch = chromas[6];
			expect(ch.built, 'Need Source token').equal(false);
			// claim source
			expectEvent(await instance.wl_claimTokenIds([ch.tokenId], { from: ch.account }), 'Minted', { quantity: mintsPerSource.toString() });
			expect((await instance.wl_calcAvailableMintsPerTokenId(ch.tokenId)).toNumber()).equal(0);
			// build
			expect(await instance.wl_isTokenBuilt(ch.tokenId), '').equal(false);
			await chromaInstance.buildCode(ch.tokenId, { from: ch.account });
			expect(await instance.wl_isTokenBuilt(ch.tokenId), '').equal(true);
			// transfer
			expectEvent(await chromaInstance.transferFrom(ch.account, ch.otherAccount, ch.tokenId, { from: ch.account }), 'Transfer');
			// original owner cant claim anymore
			await expectRevert(instance.wl_claimTokenIds([ch.tokenId], { from: ch.account }), 'Whitelist: Not Owner');
			// claim built
			const newAvailable = mintsPerBuilt - mintsPerSource;
			expect((await instance.wl_calcAvailableMintsPerTokenId(ch.tokenId)).toNumber()).equal(newAvailable);
			expectEvent(await instance.wl_claimTokenIds([ch.tokenId], { from: ch.otherAccount }), 'Minted', { quantity: newAvailable.toString() });
			expect((await instance.wl_calcAvailableMintsPerTokenId(ch.tokenId)).toNumber()).equal(0);
		});

		it(`claim multiples`, async () => {
			const s1 = chromas[7];
			const s2 = chromas[8];
			const s3 = chromas[9];
			const s4 = chromas[10];
			const s5 = chromas[11];
			const b1 = chromas[12];
			const b2 = chromas[13];
			const b3 = chromas[14];
			const b4 = chromas[15];
			const b5 = chromas[16];
			const other = chromas[17];
			expect(s1.built, 'Need Source token').equal(false);
			expect(s2.built, 'Need Source token').equal(false);
			expect(s3.built, 'Need Source token').equal(false);
			expect(s4.built, 'Need Source token').equal(false);
			expect(s5.built, 'Need Source token').equal(false);
			expect(b1.built, 'Need Built token').equal(true);
			expect(b2.built, 'Need Built token').equal(true);
			expect(b3.built, 'Need Built token').equal(true);
			expect(b4.built, 'Need Built token').equal(true);
			expect(b5.built, 'Need Built token').equal(true);
			// claim sources
			expectEvent(await instance.wl_claimTokenIds([s1.tokenId, s2.tokenId], { from: s1.account }), 'Minted', { quantity: (mintsPerSource * 2).toString() });
			expect((await instance.wl_calcAvailableMintsPerTokenId(s1.tokenId)).toNumber()).equal(0);
			expect((await instance.wl_calcAvailableMintsPerTokenId(s2.tokenId)).toNumber()).equal(0);
			// claim builds
			expectEvent(await instance.wl_claimTokenIds([b1.tokenId, b2.tokenId], { from: s1.account }), 'Minted', { quantity: (mintsPerBuilt * 2).toString() });
			expect((await instance.wl_calcAvailableMintsPerTokenId(b1.tokenId)).toNumber()).equal(0);
			expect((await instance.wl_calcAvailableMintsPerTokenId(b2.tokenId)).toNumber()).equal(0);
			// claim mixed
			expectEvent(await instance.wl_claimTokenIds([s3.tokenId, s4.tokenId, b3.tokenId, b4.tokenId], { from: s1.account }), 'Minted', { quantity: (mintsPerSource * 2 + mintsPerBuilt * 2).toString() });
			expect((await instance.wl_calcAvailableMintsPerTokenId(s3.tokenId)).toNumber()).equal(0);
			expect((await instance.wl_calcAvailableMintsPerTokenId(s4.tokenId)).toNumber()).equal(0);
			expect((await instance.wl_calcAvailableMintsPerTokenId(b3.tokenId)).toNumber()).equal(0);
			expect((await instance.wl_calcAvailableMintsPerTokenId(b4.tokenId)).toNumber()).equal(0);
			// claim mixed + other (revert)
			await expectRevert(instance.wl_claimTokenIds([s5.tokenId, b5.tokenId, other.tokenId], { from: s1.account }), 'Whitelist: Not Owner');
			// claim mixed (ignore claimed)
			expectEvent(await instance.wl_claimTokenIds([s1.tokenId, s2.tokenId, s3.tokenId, s4.tokenId, s5.tokenId, b1.tokenId, b2.tokenId, b3.tokenId, b4.tokenId, b5.tokenId], { from: s1.account }), 'Minted', { quantity: (mintsPerSource + mintsPerBuilt).toString() });
			// claim unavailables (revert)
			await expectRevert(instance.wl_claimTokenIds([s1.tokenId, s2.tokenId, b3.tokenId, b4.tokenId], { from: s1.account }), 'Whitelist: None available');
		});
	});

});
