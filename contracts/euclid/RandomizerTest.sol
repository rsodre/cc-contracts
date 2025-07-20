// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "./Randomizer.sol";

contract RandomizerTest {
	RandomizerStateStorage storageState;
	uint32[] storageSequence;

	ShuffleStateStorage storageShuffle;

	constructor(uint32 shuffleCount) {
		Randomizer.initialize_s(storageState, address(this));
		Randomizer.initialize_shuffle(storageShuffle, address(this), shuffleCount);
	}

	//-----------------------
	// Memory tests
	function generateMemoryInitialState(uint128 hash) public pure returns (uint32[4] memory) {
		RandomizerStateMemory memory memState = Randomizer.initialize_m(hash);
		return memState.state;
	}
	function generateMemorySequence(uint128 hash) public pure returns (uint32[100] memory) {
		RandomizerStateMemory memory memState = Randomizer.initialize_m(hash);
		uint32[100] memory memSequence;
		for (uint i = 0; i < 100; i++) {
			memState = Randomizer.getNextValue_m(memState);
			memSequence[i] = memState.value;
		}
		return memSequence;
	}

	//-----------------------
	// Storage tests
	function getStorageState() public view returns(uint32[4] memory) {
		return storageState.state;
	}
	function getStorageSequence() public view returns(uint32[] memory) {
		return storageSequence;
	}
	function generateStorageValue() public returns(uint32) {
		uint32 r = Randomizer.getNextValue_s(storageState);
		storageSequence.push(r);
		return r;
	}

	//-----------------------
	// Shuffle tests
	function getShuffleState() public view returns(uint32[4] memory) {
		return storageShuffle.state.state;
	}
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
	function generateShuffleId() public returns(uint32) {
		uint32 newId = Randomizer.getNextShuffleId(storageShuffle);
		require(newId > 0, 'Sold out');
		return newId;
	}

}
