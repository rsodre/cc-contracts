// OpenZeppelin test suite
// https://docs.openzeppelin.com/test-environment/0.1/migrating-from-truffle
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const [owner, accountOne, accountTwo] = accounts;
const nullAccount = '0x0000000000000000000000000000000000000000';
const { expect } = require('chai');
require('chai').should();

const RandomizerTest = contract.fromArtifact('RandomizerTest');
const Randomizer = contract.fromArtifact('Randomizer');
async function deployRandomizerTest(ownerAccount, size = 10) {
	const rnd = await Randomizer.new({ from: ownerAccount });
	await RandomizerTest.detectNetwork();
	await RandomizerTest.link('Randomizer', rnd.address);
	return await RandomizerTest.new(new BN(size), { from: ownerAccount });
};

const { _bnToHash } = require('./deployments.js');

describe.skip('Randomizer', () => {

	//-------------------------------
	// Memory Randomizer
	//

	it('memory initialize', async () => {
		const instance = await deployRandomizerTest(owner);
		// Generate hash
		const hash = '170c8df8c4d617eb916e1f4172d12bc3';
		const state = await instance.generateMemoryInitialState(new BN(hash, 16));
		_testInitialStateAgainsHash(hash, state);
	});
	function _testInitialStateAgainsHash(hash, state) {
		// for (let i = 0; i < state.length; ++i) console.log(`state[${i}] ${_bnToHash(state[i], 8)}, ${state[i].toString()}`);
		hash = hash.replace('0x', '');
		for (let i = 0; i < 4; ++i) {
			const a = '0x' + hash.substr(i * 8, 8);
			const s = _bnToHash(state[i], 8);
			expect(s, `Random state [${i}](${s}) not part of hash [${hash}](${a})`).equal(a);
		}
	}

	it('memory sequence diversity', async () => {
		const hash1 = new BN('170c8df8c4d617eb916e1f4172d12bc3', 16);
		const hash2 = new BN('adb5c12c437ae6aa380305a81d8a9b8c', 16);
		// const hash3 = new BN('bd813e11fcd6398a181cb2d0bacd58a2', 16);
		// contract 1
		const instance1 = await deployRandomizerTest(owner);
		const sequence1 = await instance1.generateMemorySequence(hash1);
		// contract 2
		const instance2 = await deployRandomizerTest(owner);
		const sequence2 = await instance2.generateMemorySequence(hash2);
		// contract 3 (same as contract 1)
		const instance3 = await deployRandomizerTest(owner);
		const sequence3 = await instance3.generateMemorySequence(hash1);
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
		const hash1 = new BN('170c8df8c4d617eb916e1f4172d12bc3', 16);
		const hash2 = new BN('adb5c12c437ae6aa380305a81d8a9b8c', 16);
		const values1 = [3967300585, 219000112, 2031127093, 167816098, 667563632, 1204714388, 3128037498, 3038830893, 3274651727, 4144621925];
		const values2 = [3836377581, 3299085973, 1350561565, 1405155487, 3826419227, 2550954, 2945379508, 4225695194, 2341248740, 3170398339];
		// contract 1
		const instance1 = await deployRandomizerTest(owner);
		const sequence1 = await instance1.generateMemorySequence(hash1);
		// contract 2
		const instance2 = await deployRandomizerTest(owner);
		const sequence2 = await instance2.generateMemorySequence(hash2);
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


	//-------------------------------
	// Storage Randomizer
	//

	it('storage initialize with address', async () => {
		const instance = await deployRandomizerTest(owner);
		// Get contract address
		const address = instance.address.toLowerCase();
		expect(instance.address, 'Contract address is 0x0').not.equal('0x0');
		// Get initialized state
		const state = await instance.getStorageState();
		_testInitialStateAgainsHash(address.substr(-32,32), state);
	});

	it('storage initial state', async () => {
		const instance1 = await deployRandomizerTest(owner);
		const state1 = await instance1.getStorageState();
		const instance2 = await deployRandomizerTest(owner);
		const state2 = await instance2.getStorageState();
		for (let i = 0; i < 4; ++i) {
			const s1 = state1[i].toNumber();
			const s2 = state2[i].toNumber();
			expect(s1, `Random initial state1[${i}](${s1}) equal to state2[${i}](${s2})`).not.equal(s2);
		}
	});

	it('storage state change', async () => {
		const instance = await deployRandomizerTest(owner);
		let states = [];
		for (let s = 0; s < 10; ++s) {
			states.push(await instance.getStorageState());
			const receipt = await instance.generateStorageValue();
			// console.log(receipt.receipt.gasUsed);
		}
		_testStateChanges(states);
	});
	function _testStateChanges(states) {
		// states must be different from each other
		for (let s = 0; s < states.length; ++s) {
			const si1 = s;
			const si2 = (s + 1) % 8;
			for (let i = 0; i < 4; ++i) {
				const s1 = states[si1][i].toNumber();
				const s2 = states[si2][i].toNumber();
				// console.log(`${s1} != ${s2}`);
				expect(s1, `Random state states[${si1}][${i}](${s1}) equal to states[${si2}][${i}](${s2})`).not.equal(s2);
			}
		}
		// state shifted
		for (let s = 1; s < states.length; ++s) {
			const si0 = s - 1;
			const si1 = s;
			for (let i = 1; i < 4; ++i) {
				const s1 = states[si1][i].toNumber();
				const s0 = states[si0][i - 1].toNumber();
				// console.log(`${s1} == ${s0}`);
				expect(s1, `Random state states[${si1}][${i}](${s1}) not equal to states[${si0}][${i - 1}](${s0})`).equal(s0);
			}
		}
	}

	it('storage sequence', async () => {
		// contract 1
		const instance1 = await deployRandomizerTest(owner);
		for (let i = 0; i < 10; ++i) await instance1.generateStorageValue();
		const sequence1 = await instance1.getStorageSequence();
		// contract 2
		const instance2 = await deployRandomizerTest(owner);
		for (let i = 0; i < 10; ++i) await instance2.generateStorageValue();
		const sequence2 = await instance2.getStorageSequence();
		// contract 3
		const instance3 = await deployRandomizerTest(owner);
		for (let i = 0; i < 10; ++i) await instance3.generateStorageValue();
		const sequence3 = await instance3.getStorageSequence();
		// sequences must be different from each other
		for (let i = 0; i < 10; ++i) {
			const n1 = sequence1[i].toNumber();
			const n2 = sequence2[i].toNumber();
			const n3 = sequence3[i].toNumber();
			expect(n1, `sequece1[${i}](${n1}) equals to sequece2[${i}](${n2})`).not.equal(n2);
			expect(n2, `sequece2[${i}](${n2}) equals to sequece3[${i}](${n3})`).not.equal(n3);
		}
		// each sequence must have completely different values
		for (let i = 1; i < 10; ++i) {
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

	//-------------------------------
	// Shuffle Randomizer
	//

	it('shuffle initialize with address', async () => {
		const instance = await deployRandomizerTest(owner);
		// Get contract address
		const address = instance.address.toLowerCase();
		expect(instance.address, 'Contract address is 0x0').not.equal('0x0');
		// Get initialized state
		const state = await instance.getShuffleState();
		_testInitialStateAgainsHash(address.substr(-32, 32), state);
	});

	it('shuffle state change', async () => {
		const instance = await deployRandomizerTest(owner, 10);
		let states = [];
		for (let s = 0; s < 10; ++s) {
			states.push(await instance.getShuffleState());
			const receipt = await instance.generateShuffleId();
			// console.log(receipt.receipt.gasUsed);
		}
		_testStateChanges(states);
	});

	it('shuffle integrity', async () => {
		// Test several times
		await _testShuffle();
		await _testShuffle();
		await _testShuffle();
		await _testShuffle();
		await _testShuffle();
	});
	async function _testShuffle() {
		const size = 10;
		const instance = await deployRandomizerTest(owner, size);
		// Token Zero must return Zero
		expect((await instance.getShuffleId(0)).toNumber(), `token Zero is not zero`).equal(0);
		// Generate shuffled sequence
		let ids = [];
		for (let i = 1; i <= size; ++i) {
			await instance.generateShuffleId();
			ids.push((await instance.getShuffleId(i)).toNumber());
			expect((await instance.getShufflePos()).toNumber()).equal(i);
		}
		// sold out
		await expectRevert(instance.generateShuffleId(), 'Sold out');
		await expectRevert(instance.getShuffleId(size + 1), 'Invalid token');
		expect((await instance.getShufflePos()).toNumber()).equal(size);
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



