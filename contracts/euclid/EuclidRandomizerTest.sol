// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;
import "./IEuclidRandomizer.sol";
import "./EuclidShuffle.sol";

contract EuclidRandomizerTest {

	IEuclidRandomizer randomizer;
	EuclidShuffle.ShuffleState storageShuffle;

	constructor(uint32 shuffleCount, address randomizer_) {
		randomizer = IEuclidRandomizer(randomizer_);
		EuclidShuffle.initialize(storageShuffle, shuffleCount);
	}

	//-----------------------
	// Memory tests
	function generateMemoryInitialState(uint128 hash) public view returns (uint32[4] memory) {
		IEuclidRandomizer.RandomizerState memory memState = randomizer.initialize(hash);
		return memState.state;
	}
	function generateMemorySequence(uint128 hash) public view returns (uint32[100] memory) {
		IEuclidRandomizer.RandomizerState memory memState = randomizer.initialize(hash);
		uint32[100] memory memSequence;
		for (uint i = 0; i < 100; i++) {
			memState = randomizer.getNextValue(memState);
			memSequence[i] = memState.value;
		}
		return memSequence;
	}
	function generateMemorySequenceInt(uint128 hash, uint32 maxExclusive) public view returns (uint32[100] memory) {
		IEuclidRandomizer.RandomizerState memory memState = randomizer.initialize(hash);
		uint32[100] memory memSequence;
		for (uint i = 0; i < 100; i++) {
			memState = randomizer.getInt(memState, maxExclusive);
			memSequence[i] = memState.value;
		}
		return memSequence;
	}
	function generateMemorySequenceIntRange(uint128 hash, uint32 minInclusive, uint32 maxExclusive) public view returns (uint32[100] memory) {
		IEuclidRandomizer.RandomizerState memory memState = randomizer.initialize(hash);
		uint32[100] memory memSequence;
		for (uint i = 0; i < 100; i++) {
			memState = randomizer.getIntRange(memState, minInclusive, maxExclusive);
			memSequence[i] = memState.value;
		}
		return memSequence;
	}

	//-----------------------
	// Shuffle tests
	function getShuffleSize() public view returns(uint32) {
		return storageShuffle.size;
	}
	function getShufflePos() public view returns(uint32) {
		return storageShuffle.pos;
	}
	function getShuffleId(uint32 tokenNumber) public view returns(uint32) {
		require(tokenNumber <= storageShuffle.pos, 'Invalid token');
		return storageShuffle.ids[tokenNumber];
	}
	function getSeed() public view returns(uint128) {
		return randomizer.makeSeed(address(this), msg.sender, block.number, storageShuffle.pos);
	}
	function generateShuffleId() public returns(uint32) {
		uint32 newId = EuclidShuffle.getNextShuffleId(randomizer, storageShuffle, getSeed());
		require(newId > 0, 'Sold out');
		return newId;
	}
}
