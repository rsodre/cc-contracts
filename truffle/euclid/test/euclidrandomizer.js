// OpenZeppelin test suite
// https://docs.openzeppelin.com/test-environment/0.1/migrating-from-truffle
// https://github.com/indutny/bn.js
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const [owner, accountOne, accountTwo] = accounts;
const nullAccount = '0x0000000000000000000000000000000000000000';
const { expect } = require('chai');
require('chai').should();

const EuclidRandomizerTest = contract.fromArtifact('EuclidRandomizerTest');
const EuclidRandomizer = contract.fromArtifact('EuclidRandomizer');
const EuclidShuffle = contract.fromArtifact('EuclidShuffle');
async function deployEuclidRandomizerTest(ownerAccount, size = 10) {
	const _EuclidRandomizer = await EuclidRandomizer.new({ from: ownerAccount });
	await EuclidShuffle.detectNetwork();
	const _EuclidShuffle = await EuclidShuffle.new({ from: ownerAccount });
	await EuclidRandomizerTest.detectNetwork();
	await EuclidRandomizerTest.link('EuclidShuffle', _EuclidShuffle.address);
	return await EuclidRandomizerTest.new(new BN(size), _EuclidRandomizer.address, { from: ownerAccount });
};

const { FetchJson, _bnToHash } = require('./deployments.js');

describe('EuclidRandomizer', () => {
	const hash1 = '170c8df8c4d617eb916e1f4172d12bc3';
	const hash2 = 'adb5c12c437ae6aa380305a81d8a9b8c';
	const hash3 = 'bd813e11fcd6398a181cb2d0bacd58a2';
	const hash1bn = new BN(hash1, 16);
	const hash2bn = new BN(hash2, 16);
	const hash3bn = new BN(hash3, 16);

	//-------------------------------
	// Memory Randomizer
	//

	it('memory initialize', async () => {
		const instance = await deployEuclidRandomizerTest(owner);
		// Generate hash
		const state = await instance.generateMemoryInitialState(hash1bn);
		// console.log(`hashbn ${_bnToHash(hash1bn)}, ${hash1bn.toString()}`);
		// for (let i = 0; i < state.length; ++i) console.log(`state[${i}] ${_bnToHash(state[i],8)}, ${state[i].toString()}`);
		_testInitialStateAgainsHash(hash1, state);
	});
	function _testInitialStateAgainsHash(hash, state) {
		hash = hash.replace('0x', '');
		for (let i = 0; i < 4; ++i) {
			const a = '0x' + hash.substr(i * 8, 8);
			const s = _bnToHash(state[i], 8);
			expect(s, `Random state [${i}](${s}) not part of hash [${hash}](${a})`).equal(a);
		}
	}

	it('memory sequence diversity', async () => {
		// contract 1
		const instance1 = await deployEuclidRandomizerTest(owner);
		const sequence1 = await instance1.generateMemorySequence(hash1bn);
		// contract 2
		const instance2 = await deployEuclidRandomizerTest(owner);
		const sequence2 = await instance2.generateMemorySequence(hash2bn);
		// contract 3 (same as contract 1)
		const instance3 = await deployEuclidRandomizerTest(owner);
		const sequence3 = await instance3.generateMemorySequence(hash1bn);
		// sequences must be different from each other
		for (let i = 0; i < 100; ++i) {
			const n1 = sequence1[i].toNumber();
			const n2 = sequence2[i].toNumber();
			const n3 = sequence3[i].toNumber();
			expect(n1, `sequece1[${i}](${n1}) equals to sequece2[${i}](${n2})`).not.equal(n2);
			expect(n1, `sequece1[${i}](${n1}) not equals to sequece3[${i}](${n3})`).equal(n3);
		}
		// each sequence must have completely different values
		for (let i = 1; i < 100; ++i) {
			const n1 = sequence1[i].toNumber();
			const n2 = sequence2[i].toNumber();
			const n3 = sequence3[i].toNumber();
			const n01 = sequence1[i - 1].toNumber();
			const n02 = sequence2[i - 1].toNumber();
			const n03 = sequence3[i - 1].toNumber();
			expect(n1, `sequece1[${i}](${n1}) equals to sequece1[${i - 1}](${n01})`).not.equal(n01);
			expect(n2, `sequece2[${i}](${n2}) equals to sequece2[${i - 1}](${n02})`).not.equal(n02);
			expect(n3, `sequece3[${i}](${n3}) equals to sequece3[${i - 1}](${n03})`).not.equal(n03);
		}
	});

	it('memory sequence integrity', async () => {
		const values1 = [3967300585, 219000112, 2031127093, 167816098, 667563632, 1204714388, 3128037498, 3038830893, 3274651727, 4144621925];
		const values2 = [3836377581, 3299085973, 1350561565, 1405155487, 3826419227, 2550954, 2945379508, 4225695194, 2341248740, 3170398339];
		// contract 1
		const instance1 = await deployEuclidRandomizerTest(owner);
		const sequence1 = await instance1.generateMemorySequence(hash1bn);
		// contract 2
		const instance2 = await deployEuclidRandomizerTest(owner);
		const sequence2 = await instance2.generateMemorySequence(hash2bn);
		// values must match
		for (let i = 0; i < values1.length; ++i) {
			const v1 = values1[i];
			const v2 = values2[i];
			const n1 = sequence1[i].toNumber();
			const n2 = sequence2[i].toNumber();
			expect(n1, `sequece1[${i}](${n1}) not equal to value (${v1})`).equal(v1);
			expect(n2, `sequece2[${i}](${n2}) not equal to value (${v2})`).equal(v2);
		}
	});

	it('memory sequence Int', async () => {
		const maxExclusive = 10;
		const instance1 = await deployEuclidRandomizerTest(owner);
		const sequence1 = await instance1.generateMemorySequenceInt(hash1bn, new BN(maxExclusive));
		expect(sequence1.length).equal(100);
		let counts = {};
		for (let i = 0; i < sequence1.length; ++i) {
			const n1 = sequence1[i].toNumber();
			expect(n1).greaterThanOrEqual(0);
			expect(n1).lessThan(maxExclusive);
			counts[n1] = (counts[n1] ?? 0) + 1;
		}
		for (let i = 0; i < maxExclusive; ++i) {
			expect(counts[i]).greaterThan(0);
		}
	});

	it('memory sequence IntRange', async () => {
		const min = 10;
		const maxExclusive = 20;
		const instance1 = await deployEuclidRandomizerTest(owner);
		const sequence1 = await instance1.generateMemorySequenceIntRange(hash1bn, new BN(min),new BN(maxExclusive));
		expect(sequence1.length).equal(100);
		let counts = {};
		for (let i = 0; i < sequence1.length; ++i) {
			const n1 = sequence1[i].toNumber();
			expect(n1).greaterThanOrEqual(min);
			expect(n1).lessThan(maxExclusive);
			counts[n1] = (counts[n1] ?? 0) + 1;
		}
		for (let i = min; i < maxExclusive; ++i) {
			expect(counts[i]).greaterThan(0);
		}
	});


	//-------------------------------
	// Shuffle Randomizer
	//

	it('shuffle initialize', async () => {
		const size = 10;
		const instance = await deployEuclidRandomizerTest(owner, size);
		// Get contract address
		const address = instance.address.toLowerCase();
		expect(instance.address, 'Contract address is 0x0').not.equal('0x0');
		// Get initialized state
		expect((await instance.getShuffleSize()).toNumber()).equal(size);
		expect((await instance.getShufflePos()).toNumber()).equal(0);
	});

	it('shuffle integrity', async () => {
		// Test several times
		let tests = [];
		tests.push(await _testShuffle());
		tests.push(await _testShuffle());
		tests.push(await _testShuffle());
		tests.push(await _testShuffle());
		tests.push(await _testShuffle());
	});
	async function _testShuffle() {
		const size = 10;
		const instance = await deployEuclidRandomizerTest(owner, size);
		// Token Zero must return Zero
		expect((await instance.getShuffleId(0)).toNumber(), `token Zero is not zero`).equal(0);
		// Generate shuffled sequence
		let seeds = [];
		let ids = [];
		for (let i = 1; i <= size; ++i) {
			await instance.generateShuffleId();
			seeds.push((await instance.getSeed()).toString());
			ids.push((await instance.getShuffleId(i)).toNumber());
			// const id = ids[ids.length - 1];
			// console.log(`id[${i}](${id})`);
			expect((await instance.getShufflePos()).toNumber()).equal(i);
		}
		// sold out
		await expectRevert(instance.generateShuffleId(), 'Sold out');
		await expectRevert(instance.getShuffleId(size + 1), 'Invalid token');
		expect((await instance.getShufflePos()).toNumber()).equal(size);
		// validate seeds
		for (let i = 0; i < seeds.length - 1; ++i) {
			const seed0 = seeds[i];
			const seed1 = seeds[i + 1];
			expect(seed0, `seed [${i}](${seed0}) == [${i + 1}](${seed1})`).not.equal(seed1);
		}
		// validate sequence range
		for (let i = 0; i < ids.length; ++i) {
			const id = ids[i];
			expect(id, `id[${i}](${id}) is zero`).greaterThanOrEqual(1);
			expect(id, `id[${i}](${id}) over ${size}`).lessThanOrEqual(size);
		}
		// sequence must not be sequential
		for (let i = 1; i <= size; ++i) {
			const id = ids[i - 1];
			if (id != i) break; // at least one is different!
			// should not reach the end!
			expect(i, `sequence is not shuffled!`).lessThan(size);
		}
		// sort suffled, must be sequential
		let sorted = ids.slice(0, size);
		sorted = sorted.sort(function (a, b) { return a - b; });
		for (let i = 1; i <= size; ++i) {
			const id = sorted[i - 1];
			expect(id, `sorted id[${i}](${id}) is not (${i})`).equal(i);
		}
		return ids;
	}

});



describe('EuclidRandomizer port from dapp', () => {
	let instance = null;
	const hash1 = '170c8df8c4d617eb916e1f4172d12bc3';
	const hash1bn = new BN(hash1, 16);
	beforeEach(async function () {
		instance = await deployEuclidRandomizerTest(owner);
	});

	// Test Randomizer against dapp
	// http://localhost:3000/api/x/randomsequence?hash=0x170c8df8c4d617eb916e1f4172d12bc3&count=10&max=0xffffffff

	it('randomization', async () => {
		const sequence1 = await instance.generateMemorySequence(hash1bn);
		// values must match
		for (let i = 1; i < sequence1.values.length; ++i) {
			const n1 = sequence1[i].toNumber();
			const n0 = sequence1[i - 1].toNumber();
			expect(n1, `sequece[${i}](${n1}) is equal to sequece[${i-1}](${n0})`).not.equal(n0);
		}
	});

	it('integrity (uint32)', async () => {
		// const maxExclusive = 1024;
		const sequence1 = await instance.generateMemorySequence(hash1bn);
		const url = 'http://localhost:3000/api/x/randomsequence';
		const sequence2 = await FetchJson(url, 'GET', {
			hash: `0x${hash1}`,
			count: 100,
			maxExclusive: 0x100000000,
		});
		expect(sequence2.error, `Fetch error [${sequence2.error}]`).equal(undefined);
		expect(sequence2.values.length).equal(100);
		// values must match
		for (let i = 0; i < sequence2.values.length; ++i) {
			const n1 = sequence1[i].toNumber();
			const n2 = sequence2.values[i];
			expect(n1, `sequece[${i}](${n1}) not equal to value (${n2})`).equal(n2);
		}
	});

	it('integrity (1024)', async () => {
		const maxExclusive = 1024;
		const sequence1 = await instance.generateMemorySequenceInt(hash1bn, new BN(maxExclusive));
		const url = 'http://localhost:3000/api/x/randomsequence';
		const sequence2 = await FetchJson(url, 'GET', {
			hash: `0x${hash1}`,
			count: 100,
			maxExclusive,
		});
		expect(sequence2.error, `Fetch error [${sequence2.error}]`).equal(undefined);
		expect(sequence2.values.length).equal(100);
		// values must match
		for (let i = 0; i < sequence2.values.length; ++i) {
			const n1 = sequence1[i].toNumber();
			const n2 = sequence2.values[i];
			expect(n1, `sequece[${i}](${n1}) not equal to value (${n2})`).equal(n2);
		}
	});

});



