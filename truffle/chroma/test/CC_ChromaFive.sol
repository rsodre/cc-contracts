// SPDX-License-Identifier: MIT
// Same version as openzeppelin 3.4
pragma solidity >=0.6.0 <0.8.0;

// Truffle Assert
// https://github.com/trufflesuite/truffle/blob/develop/packages/resolver/solidity/Assert.sol

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/ChromaFive.sol";
import "../contracts/Utils.sol";

contract TestChromaFive
{
	//
	// Contract tests
	//
	// TODO: Move to A5 test
	// function test_makePixels() public
	// {
	//     ChromaFive cc = ChromaFive(DeployedAddresses.ChromaFive());
	//     //                   0                   10                  20
	//     //                   001122334455667788990011223344556677889900
	//     bytes20 reds   = hex"0e78ee7899f8c70e9ebe8974ef43cb2c861d35d9";
	//     bytes20 greens = hex"d8db78ac080f13882a426137c4aa305d161d4aab";
	//     bytes20 blues  = hex"e115c9fe553fcb3318775d0c0ebb07c014f48c35";
	//     bytes memory actual = cc.makePixels(reds,  greens,  blues, 1);
	//     Assert.equal(actual.length, cc.getWidth()*cc.getHeight()*3, "Art bytes do not match");
	//     _AssertsEqual( actual[0*3+0], byte(0x0e), "Art channel first bytes do not match" );
	//     _AssertsEqual( actual[0*3+1], byte(0xd8), "Art channel first bytes do not match" );
	//     _AssertsEqual( actual[0*3+2], byte(0xe1), "Art channel first bytes do not match" );
	//     _AssertsEqual( actual[4*3+0], byte(0x99), "Art channel first bytes do not match" );
	//     _AssertsEqual( actual[4*3+1], byte(0x08), "Art channel first bytes do not match" );
	//     _AssertsEqual( actual[4*3+2], byte(0x55), "Art channel first bytes do not match" );
	//     _AssertsEqual( actual[actual.length-3], byte(0xcb), "Art channel last bytes do not match" );
	//     _AssertsEqual( actual[actual.length-2], byte(0x30), "Art channel last bytes do not match" );
	//     _AssertsEqual( actual[actual.length-1], byte(0x07), "Art channel last bytes do not match" );
	// }

	//
	// Better Asserts
	function _AssertsEqual(string memory actual, string memory expected, string memory message) public
	{
		Assert.equal( actual, expected, string(abi.encodePacked(message, ": (string) need ", expected, " got ", actual)) );
	}
	function _AssertsEqual(bytes memory actual, bytes memory expected, string memory message) public
	{
		Assert.equal( string(actual), string(expected), string(abi.encodePacked(message, ": (bytes) need 0x", Utils.convertBytesToHexString(expected), " got 0x", Utils.convertBytesToHexString(actual))) );
	}
	// function _AssertsEqual(byte actual, byte expected, string memory message) public
	// {
	//     Assert.equal( actual, expected, string(abi.encodePacked(message, ": (byte) need 0x", Utils.convertByteToHexString(expected), " got 0x", Utils.convertByteToHexString(actual))) );
	// }
	// Unsupported types
	function _AssertsEqual(uint8 actual, uint8 expected, string memory message) public
	{
		Assert.isTrue( actual == expected, string(abi.encodePacked(message, ": (uint8) need ", Utils.utoa(uint(expected)), " got ", Utils.utoa(uint(actual)))) );
	}
}




