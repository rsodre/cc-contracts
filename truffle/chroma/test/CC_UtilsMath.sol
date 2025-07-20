// SPDX-License-Identifier: MIT
// Same version as openzeppelin 3.4
pragma solidity >=0.6.0 <0.8.0;

// Truffle Assert
// https://github.com/trufflesuite/truffle/blob/develop/packages/resolver/solidity/Assert.sol

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Utils.sol";

contract TestUtilsMath
{
	function test_cast() public
	{
		address ff = address(bytes20(hex"ffffffffffffffffffffffffffffffffffffffff"));
		_AssertsEqual_uint8( uint8(uint256(0)), 0, "Bad Cast 0" );
		_AssertsEqual_uint8( uint8(uint256(255)), 255, "Bad Cast 1" );
		// _AssertsEqual_uint8( uint8(uint256(256)), 255, "Bad Cast 2" ); // fails
		_AssertsEqual_uint8( uint8(uint256(ff)), 255, "Bad Cast 3" );
		_AssertsEqual_uint8( uint8(int256(-10000000000)), 0, "Bad Cast 4" );
		// _AssertsEqual_uint8( uint8(int256(-10)), 0, "Bad Cast 5" ); // fails
		_AssertsEqual_uint8( uint8(int256(0)), 0, "Bad Cast 6" );
		_AssertsEqual_uint8( uint8(int256(255)), 255, "Bad Cast 7" );
		// _AssertsEqual_uint8( uint8(int256(256)), 255, "Bad Cast 8" ); // fails
		_AssertsEqual_uint8( uint8(int256(ff)), 255, "Bad Cast 9" );
	}

	function test_clamp() public
	{
		// _AssertsEqual_uint8( Utils.clamp_uint8(0, 0, 10), 0, "Bad Clamp" );
		// _AssertsEqual_uint8( Utils.clamp_uint8(0, 1, 10), 1, "Bad Clamp" );
		// _AssertsEqual_uint8( Utils.clamp_uint8(0, 10, 10), 10, "Bad Clamp" );
		// _AssertsEqual_uint8( Utils.clamp_uint8(11, 0, 10), 10, "Bad Clamp" );
		// _AssertsEqual_uint8( Utils.clamp_uint8(10, 0, 10), 10, "Bad Clamp" );
		// _AssertsEqual_uint8( Utils.clamp_uint8(10, 0, 9), 9, "Bad Clamp" );
		// _AssertsEqual_uint8( Utils.clamp_uint8(10, 0, 0), 0, "Bad Clamp" );

		_AssertsEqual_uint256( Utils.clamp_uint256(0, 0, 10), 0, "Bad Clamp" );
		_AssertsEqual_uint256( Utils.clamp_uint256(0, 1, 10), 1, "Bad Clamp" );
		_AssertsEqual_uint256( Utils.clamp_uint256(0, 10, 10), 10, "Bad Clamp" );
		_AssertsEqual_uint256( Utils.clamp_uint256(11, 0, 10), 10, "Bad Clamp" );
		_AssertsEqual_uint256( Utils.clamp_uint256(10, 0, 10), 10, "Bad Clamp" );
		_AssertsEqual_uint256( Utils.clamp_uint256(10, 0, 9), 9, "Bad Clamp" );
		_AssertsEqual_uint256( Utils.clamp_uint256(10, 0, 0), 0, "Bad Clamp" );
	}

	function test_percent() public
	{
		_AssertsEqual_uint256( Utils.percent_uint256(100, 0), 0, "Bad Percent (uint256)" );
		_AssertsEqual_uint256( Utils.percent_uint256(100, 10), 10, "Bad Percent (uint256)" );
		_AssertsEqual_uint256( Utils.percent_uint256(100, 99), 99, "Bad Percent (uint256)" );
		_AssertsEqual_uint256( Utils.percent_uint256(100, 100), 100, "Bad Percent (uint256)" );
		_AssertsEqual_uint256( Utils.percent_uint256(15, 20), 3, "Bad Percent (uint256)" );
		_AssertsEqual_uint256( Utils.percent_uint256(50, 20), 10, "Bad Percent (uint256)" );
		_AssertsEqual_uint256( Utils.percent_uint256(10, 10), 1, "Bad Percent (uint256)" );
		_AssertsEqual_uint256( Utils.percent_uint256(10, 9), 0, "Bad Percent (uint256)" );
		_AssertsEqual_uint256( Utils.percent_uint256(10, 90), 9, "Bad Percent (uint256)" );
		_AssertsEqual_uint256( Utils.percent_uint256(10, 91), 9, "Bad Percent (uint256)" );
		_AssertsEqual_uint256( Utils.percent_uint256(10, 91), 9, "Bad Percent (uint256)" );
		_AssertsEqual_uint256( Utils.percent_uint256(10, 100), 10, "Bad Percent (uint256)" );

		// _AssertsEqual_uint8( Utils.percent_uint8(100, 0), 0, "Bad Percent (uint8)" );
		// _AssertsEqual_uint8( Utils.percent_uint8(100, 10), 10, "Bad Percent (uint8)" );
		// _AssertsEqual_uint8( Utils.percent_uint8(100, 99), 99, "Bad Percent (uint8)" );
		// _AssertsEqual_uint8( Utils.percent_uint8(100, 100), 100, "Bad Percent (uint8)" );
		// _AssertsEqual_uint8( Utils.percent_uint8(15, 20), 3, "Bad Percent (uint8)" );
		// _AssertsEqual_uint8( Utils.percent_uint8(50, 20), 10, "Bad Percent (uint8)" );
		// _AssertsEqual_uint8( Utils.percent_uint8(10, 10), 1, "Bad Percent (uint8)" );
		// _AssertsEqual_uint8( Utils.percent_uint8(10, 9), 0, "Bad Percent (uint8)" );
		// _AssertsEqual_uint8( Utils.percent_uint8(10, 90), 9, "Bad Percent (uint8)" );
		// _AssertsEqual_uint8( Utils.percent_uint8(10, 91), 9, "Bad Percent (uint8)" );
		// _AssertsEqual_uint8( Utils.percent_uint8(10, 91), 9, "Bad Percent (uint8)" );
		// _AssertsEqual_uint8( Utils.percent_uint8(10, 100), 10, "Bad Percent (uint8)" );
	}

	function test_minmax() public
	{
		_AssertsEqual_uint256( Utils.min_uint256(100, 0), 0, "Bad Min" );
		_AssertsEqual_uint256( Utils.min_uint256(0, 100), 0, "Bad Min" );
		_AssertsEqual_uint256( Utils.max_uint256(100, 0), 100, "Bad Max" );
		_AssertsEqual_uint256( Utils.max_uint256(0, 100), 100, "Bad Max" );
	}

	//
	// Utils
	function _convertBytesHexString(bytes memory values) public pure returns (string memory)
	{
		bytes memory result = new bytes(values.length*2);
		for(uint8 i = 0; i < values.length; i++)
		{
			for(uint8 j = 0 ; j < 2; j++)
			{
				uint8 v = ( j == 0 ? uint8(values[i]>>4) : uint8(values[i] & 0x0f) );
				result[i*2+j] = v > 9 ? byte(55+v) : byte(48+v);
			}
		}
		return string(result);
	}

	//
	// Better Asserts
	function _AssertsEqual(string memory actual, string memory expected, string memory message) public
	{
		Assert.equal( actual, expected, string(abi.encodePacked(message, ": (string) need ", expected, " got ", actual)) );
	}
	function _AssertsEqual(bytes memory actual, bytes memory expected, string memory message) public
	{
		Assert.equal( string(actual), string(expected), string(abi.encodePacked(message, ": (bytes) need 0x", _convertBytesHexString(expected), " got 0x", _convertBytesHexString(actual))) );
	}
	// function _AssertsEqual(byte actual, byte expected, string memory message) public
	// {
	//     Assert.equal( actual, expected, string(abi.encodePacked(message, ": (byte) need 0x", Utils.convertByteToHexString(expected), " got 0x", Utils.convertByteToHexString(actual))) );
	// }
	// Unsupported types
	function _AssertsEqual_uint8(uint8 actual, uint8 expected, string memory message) public
	{
		Assert.isTrue( actual == expected, string(abi.encodePacked(message, ": (uint8) need ", Utils.utoa(uint(expected)), " got ", Utils.utoa(uint(actual)))) );
	}
	function _AssertsEqual_uint256(uint256 actual, uint256 expected, string memory message) public
	{
		Assert.isTrue( actual == expected, string(abi.encodePacked(message, ": (uint256) need ", Utils.utoa(uint(expected)), " got ", Utils.utoa(uint(actual)))) );
	}
}
