// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

struct RandomizerStateMemory {
	uint32[4] state;
	uint32 value;
}
struct RandomizerStateStorage {
	uint32[4] state;
}
struct ShuffleStateStorage {
	RandomizerStateStorage state;
	mapping(uint32 => uint32) ids;
	uint32 size;
	uint32 pos;
}

library Randomizer {

	//-------------------------------
	// Memory version
	// - resides inside a single read call
	// - no gas cost
	//
	function initialize_m(uint128 seed) public pure returns (RandomizerStateMemory memory) {
		RandomizerStateMemory memory self;
		for (uint i = 0; i < 4; i++) {
			self.state[3-i] = uint32( (seed >> (32*i)) & 0xffffffff );
		}
		self.value = 0;
		return self;
	}
	function initialize_m(bytes16 seed) public pure returns (RandomizerStateMemory memory) {
		return initialize_m(uint128(seed));
	}
	function initialize_m(address seed) public pure returns (RandomizerStateMemory memory) {
		return initialize_m(uint128(uint160(seed)));
	}
	// Returns next random uint32 between 0x0 and 0xffffffff
	function getNextValue_m(RandomizerStateMemory memory self) public pure returns (RandomizerStateMemory memory) {
		// tentative to save gas, actually increases cost
		// uint8 i0 = self.index;
		// uint8 i3 = (self.index+3)%4;
		// uint32 s = self.state[i0];
		// uint32 t = self.state[i3];
		// t ^= t << 11;
		// t ^= t >> 8;
		// self.value = t ^ s ^ (s >> 19);
		// self.state[i3] = self.value;
		// self.index = i3;
		uint32 t = self.state[3];
		self.state[3] = self.state[2];
		self.state[2] = self.state[1];
		self.state[1] = self.state[0];
		uint32 s = self.state[0];
		t ^= t << 11;
		t ^= t >> 8;
		self.state[0] = t ^ s ^ (s >> 19);
		self.value = self.state[0];
		return self;
	}
	function getInt_m(RandomizerStateMemory memory self, uint32 maxExclusive) public pure returns (RandomizerStateMemory memory) {
		self = getNextValue_m(self);
		self.value = self.value % maxExclusive;
		return self;
	}
	function getIntRange_m(RandomizerStateMemory memory self, uint32 minInclusive, uint32 maxExclusive) public pure returns (RandomizerStateMemory memory) {
		self = getNextValue_m(self);
		self.value = minInclusive + (self.value % (maxExclusive-minInclusive));
		return self;
	}


	//-------------------------------
	// Storage version
	// - persistent state
	// - costs gas
	//
	// Hash seed is 128 bits / 16 bytes / 32 char hex
	function initialize_s(RandomizerStateStorage storage self, uint128 seed) public {
		for (uint i = 0; i < 4; i++) {
			self.state[3-i] = uint32( (seed >> (32*i)) & 0xffffffff );
		}
	}
	function initialize_s(RandomizerStateStorage storage self, bytes16 seed) public {
		initialize_s(self, uint128(seed));
	}
	function initialize_s(RandomizerStateStorage storage self, address seed) public {
		initialize_s(self, uint128(uint160(seed)));
	}
	// Returns next random uint32 between 0x0 and 0xffffffff
	function getNextValue_s(RandomizerStateStorage storage self) public returns (uint32) {
		uint32 t = self.state[3];
		self.state[3] = self.state[2];
		self.state[2] = self.state[1];
		self.state[1] = self.state[0];
		uint32 s = self.state[0];
		t ^= t << 11;
		t ^= t >> 8;
		self.state[0] = t ^ s ^ (s >> 19);
		return self.state[0];
	}
	function getInt_s(RandomizerStateStorage storage self, uint32 maxExclusive) public returns (uint32) {
		return getNextValue_s(self) % maxExclusive;
	}
	function getIntRange_s(RandomizerStateStorage storage self, uint32 minInclusive, uint32 maxExclusive) public returns (uint32) {
		uint32 d = maxExclusive - minInclusive;
		return minInclusive + ( d > 0 ? (getNextValue_s(self) % d) : 0 );
	}

	//----------------------------------
	// Fisher–Yates shuffle
	//
	// Initializes Shuffle storage
	function initialize_shuffle(ShuffleStateStorage storage self, uint128 seed, uint32 size) public {
		initialize_s(self.state, seed);
		self.size = size;
		self.pos = 0;
	}
	function initialize_shuffle(ShuffleStateStorage storage self, bytes16 seed, uint32 size) public {
		initialize_shuffle(self, uint128(seed), size);
	}
	function initialize_shuffle(ShuffleStateStorage storage self, address seed, uint32 size) public {
		initialize_shuffle(self, uint128(uint160(seed)), size);
	}
	// Return new shuffled id from storage
	// Ids keys and values range from 1..size
	// Returns 0 when all ids have bee used
	function getNextShuffleId(ShuffleStateStorage storage self) public returns (uint32) {
		if(self.pos == self.size) return 0; // no more ids available
		self.pos += 1;
		if(self.pos == self.size) return self.ids[self.pos]; // last
		// choose a random cell and swap for current position
		uint32 swapPos = getIntRange_s(self.state, self.pos, self.size) + 1;
		uint32 newId = self.ids[swapPos] > 0 ? self.ids[swapPos] : swapPos;
		self.ids[swapPos] = self.ids[self.pos] > 0 ? self.ids[self.pos] : self.pos;
		self.ids[self.pos] = newId;
		return newId;
	}

}
