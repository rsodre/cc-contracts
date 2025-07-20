// SPDX-License-Identifier: MIT
//
//  ********  **     **    ******   **        **  *******  
// /**/////  /**    /**   **////** /**       /** /**////** 
// /**       /**    /**  **    //  /**       /** /**    /**
// /*******  /**    /** /**        /**       /** /**    /**
// /**////   /**    /** /**        /**       /** /**    /**
// /**       /**    /** //**    ** /**       /** /**    ** 
// /******** //*******   //******  /******** /** /*******  
// ////////   ///////     //////   ////////  //  ///////   
//
// by collect-code 2022
// https://collect-code.com/
//
// PRNG - Pseudo Random Number Generator
// Based on https://github.com/mattdesl/tiny-artblocks#prng
// by @mattdesl and @piterpasma, MIT
// Algorithm "xor128" from p. 5 of Marsaglia, "Xorshift RNGs"
//
// - generates multiple random numbers from a single seed
// - no gas cost if used inside inside a read call
// - allows getters to be called as many times as needed
//
pragma solidity ^0.8.2;
import "./IEuclidRandomizer.sol";

contract EuclidRandomizer is IEuclidRandomizer {
	constructor() {}
	function makeSeed(address contractAddress, address senderAddress, uint blockNumber, uint256 tokenNumber) public view override returns (uint128) {
		return uint128(bytes16(keccak256(abi.encodePacked(blockhash(blockNumber-11), contractAddress, senderAddress, tokenNumber, "ba-dum-tss"))));
	}
	function initialize(uint128 seed) public pure override returns (RandomizerState memory) {
		RandomizerState memory self;
		for (uint i = 0; i < 4; i++) {
			self.state[3-i] = uint32( (seed >> (32*i)) & 0xffffffff );
		}
		self.value = 0;
		return self;
	}
	function initialize(bytes16 seed) public pure override returns (RandomizerState memory) {
		return initialize(uint128(seed));
	}
	// Returns next random uint32 between 0x0 and 0xffffffff
	function getNextValue(RandomizerState memory self) public pure override returns (RandomizerState memory) {
		uint32 t = self.state[3];
		self.state[3] = self.state[2];
		self.state[2] = self.state[1];
		self.state[1] = self.state[0];
		uint32 s = self.state[0];
		t ^= t << 11;
		t ^= t >> 8;
		self.value = self.state[0] = t ^ s ^ (s >> 19);
		return self;
	}
	function getInt(RandomizerState memory self, uint32 maxExclusive) public pure override returns (RandomizerState memory) {
		self = getNextValue(self);
		self.value = self.value % maxExclusive;
		return self;
	}
	function getIntRange(RandomizerState memory self, uint32 minInclusive, uint32 maxExclusive) public pure override returns (RandomizerState memory) {
		self = getNextValue(self);
		self.value = minInclusive + (self.value % (maxExclusive-minInclusive));
		return self;
	}
}
