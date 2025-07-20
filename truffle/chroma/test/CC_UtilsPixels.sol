// SPDX-License-Identifier: MIT
// Same version as openzeppelin 3.4
pragma solidity >=0.6.0 <0.8.0;

// Truffle Assert
// https://github.com/trufflesuite/truffle/blob/develop/packages/resolver/solidity/Assert.sol

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Utils.sol";

contract TestUtilsPixels
{
	function test_step_uint8() public
	{
		// min cases
		//_AssertsEqual_uint8( Utils.step_uint8( 100, 200, 2, -1 ), 100, "Should be min" );
		_AssertsEqual_uint8( Utils.step_uint8( 100, 200, 0, 0 ), 100, "Should be min" );
		_AssertsEqual_uint8( Utils.step_uint8( 100, 200, 1, 0 ), 100, "Should be min" );
		_AssertsEqual_uint8( Utils.step_uint8( 100, 200, 2, 0 ), 100, "Should be min" );
		_AssertsEqual_uint8( Utils.step_uint8( 100, 100, 2, 0 ), 100, "Should be min" );
		// max cases
		_AssertsEqual_uint8( Utils.step_uint8( 100, 200, 5, 5 ), 200, "Should be max" );
		_AssertsEqual_uint8( Utils.step_uint8( 100, 200, 5, 10 ), 200, "Should be max" );
		// 2 steps up
		_AssertsEqual_uint8( Utils.step_uint8( 100, 200, 2, 0 ), 100, "Bad step" );
		_AssertsEqual_uint8( Utils.step_uint8( 100, 200, 2, 1 ), 200, "Bad step" );
		// 3 steps up
		_AssertsEqual_uint8( Utils.step_uint8( 100, 200, 3, 0 ), 100, "Bad step" );
		_AssertsEqual_uint8( Utils.step_uint8( 100, 200, 3, 1 ), 150, "Bad step" );
		_AssertsEqual_uint8( Utils.step_uint8( 100, 200, 3, 2 ), 200, "Bad step" );
		// 3 steps down
		_AssertsEqual_uint8( Utils.step_uint8( 200, 100, 3, 0 ), 200, "Bad step" );
		_AssertsEqual_uint8( Utils.step_uint8( 200, 100, 3, 1 ), 150, "Bad step" );
		_AssertsEqual_uint8( Utils.step_uint8( 200, 100, 3, 2 ), 100, "Bad step" );
		// 5 steps up
		_AssertsEqual_uint8( Utils.step_uint8( 100, 200, 5, 0 ), 100, "Bad step" );
		_AssertsEqual_uint8( Utils.step_uint8( 100, 200, 5, 1 ), 125, "Bad step" );
		_AssertsEqual_uint8( Utils.step_uint8( 100, 200, 5, 2 ), 150, "Bad step" );
		_AssertsEqual_uint8( Utils.step_uint8( 100, 200, 5, 3 ), 175, "Bad step" );
		_AssertsEqual_uint8( Utils.step_uint8( 100, 200, 5, 4 ), 200, "Bad step" );
		// 5 steps down
		_AssertsEqual_uint8( Utils.step_uint8( 200, 100, 5, 0 ), 200, "Bad step" );
		_AssertsEqual_uint8( Utils.step_uint8( 200, 100, 5, 1 ), 175, "Bad step" );
		_AssertsEqual_uint8( Utils.step_uint8( 200, 100, 5, 2 ), 150, "Bad step" );
		_AssertsEqual_uint8( Utils.step_uint8( 200, 100, 5, 3 ), 125, "Bad step" );
		_AssertsEqual_uint8( Utils.step_uint8( 200, 100, 5, 4 ), 100, "Bad step" );
	}

	function test_map_uint8() public
	{
		_AssertsEqual_uint8( Utils.map_uint8( 0, 0, 255 ), 0, "Bad mappping" );
		_AssertsEqual_uint8( Utils.map_uint8( 64, 0, 255 ), 64, "Bad mappping" );
		_AssertsEqual_uint8( Utils.map_uint8( 128, 0, 255 ), 128, "Bad mappping" );
		_AssertsEqual_uint8( Utils.map_uint8( 255, 0, 255 ), 255, "Bad mappping" );

		_AssertsEqual_uint8( Utils.map_uint8( 0, 0, 127 ), 0, "Bad mappping" );
		_AssertsEqual_uint8( Utils.map_uint8( 64, 0, 127 ), 31, "Bad mappping" );
		_AssertsEqual_uint8( Utils.map_uint8( 128, 0, 127 ), 63, "Bad mappping" );
		_AssertsEqual_uint8( Utils.map_uint8( 255, 0, 127 ), 127, "Bad mappping" );

		_AssertsEqual_uint8( Utils.map_uint8( 0, 128, 255 ), 128, "Bad mappping" );
		_AssertsEqual_uint8( Utils.map_uint8( 64, 128, 255 ), 159, "Bad mappping" );
		_AssertsEqual_uint8( Utils.map_uint8( 128, 128, 255 ), 191, "Bad mappping" );
		_AssertsEqual_uint8( Utils.map_uint8( 255, 128, 255 ), 255, "Bad mappping" );
	}

	function test_map_uint256() public
	{
		_AssertsEqual_uint256( Utils.map_uint256( 0, 0, 255 ), 0, "Bad mappping" );
		_AssertsEqual_uint256( Utils.map_uint256( 64, 0, 255 ), 64, "Bad mappping" );
		_AssertsEqual_uint256( Utils.map_uint256( 128, 0, 255 ), 128, "Bad mappping" );
		_AssertsEqual_uint256( Utils.map_uint256( 255, 0, 255 ), 255, "Bad mappping" );

		_AssertsEqual_uint256( Utils.map_uint256( 0, 0, 127 ), 0, "Bad mappping" );
		_AssertsEqual_uint256( Utils.map_uint256( 64, 0, 127 ), 31, "Bad mappping" );
		_AssertsEqual_uint256( Utils.map_uint256( 128, 0, 127 ), 63, "Bad mappping" );
		_AssertsEqual_uint256( Utils.map_uint256( 255, 0, 127 ), 127, "Bad mappping" );

		_AssertsEqual_uint256( Utils.map_uint256( 0, 128, 255 ), 128, "Bad mappping" );
		_AssertsEqual_uint256( Utils.map_uint256( 64, 128, 255 ), 159, "Bad mappping" );
		_AssertsEqual_uint256( Utils.map_uint256( 128, 128, 255 ), 191, "Bad mappping" );
		_AssertsEqual_uint256( Utils.map_uint256( 255, 128, 255 ), 255, "Bad mappping" );
	}

	function _rshift_bytes20(bytes20 buffer, uint256 bits) public pure returns (bytes20)
	{
		return (buffer >> (bits%160)) | (buffer << (160-(bits%160)));
	}

	function test_shift_bytes20() public
	{
		bytes20 buffer = hex"1122334455667788990001020304aabbccddeeff";
		bytes20 b1 = buffer;
		b1 = _rshift_bytes20(b1, 8);
		_AssertsEqual( b1, hex"ff1122334455667788990001020304aabbccddee", "Bad right shift" );
		b1 = _rshift_bytes20(b1, 16);
		_AssertsEqual( b1, hex"ddeeff1122334455667788990001020304aabbcc", "Bad right shift" );
		b1 = Utils.lshift_bytes20(b1, 8);
		_AssertsEqual( b1, hex"eeff1122334455667788990001020304aabbccdd", "Bad left shift" );
		b1 = Utils.lshift_bytes20(b1, 16);
		_AssertsEqual( b1, hex"1122334455667788990001020304aabbccddeeff", "Bad left shift" );
		_AssertsEqual( b1, buffer, "Should be equal to original" );
		// mod
		b1 = _rshift_bytes20(buffer, 16 + (20*8));
		_AssertsEqual( b1, hex"eeff1122334455667788990001020304aabbccdd", "Bad mod right shift" );
		b1 = Utils.lshift_bytes20(buffer, 16 + (20*8));
		_AssertsEqual( b1, hex"334455667788990001020304aabbccddeeff1122", "Bad mod left shift" );
	}


	function test_hsvToRgb() public
	{
		// black
		_AssertsEqual_hsvToRgb( 0, 0, 0, 0, 0, 0, "Bad black", 0 );
		_AssertsEqual_hsvToRgb( 128, 0, 0, 0, 0, 0, "Bad black", 0 );
		_AssertsEqual_hsvToRgb( 0, 128, 0, 0, 0, 0, "Bad black", 0 );
		_AssertsEqual_hsvToRgb( 128, 128, 0, 0, 0, 0, "Bad black", 0 );
		_AssertsEqual_hsvToRgb( 255, 0, 0, 0, 0, 0, "Bad black", 0 );
		_AssertsEqual_hsvToRgb( 0, 255, 0, 0, 0, 0, "Bad black", 0 );
		_AssertsEqual_hsvToRgb( 255, 255, 0, 0, 0, 0, "Bad black", 0 );
		// white
		_AssertsEqual_hsvToRgb( 0, 0, 255, 255, 255, 255, "Bad white", 0 );
		_AssertsEqual_hsvToRgb( 128, 0, 255, 255, 255, 255, "Bad white", 0 );
		_AssertsEqual_hsvToRgb( 255, 0, 255, 255, 255, 255, "Bad white", 0 );
		// gray
		_AssertsEqual_hsvToRgb( 0, 0, 128, 128, 128, 128, "Bad gray", 0 );
		_AssertsEqual_hsvToRgb( 128, 0, 128, 128, 128, 128, "Bad gray", 0 );
		_AssertsEqual_hsvToRgb( 255, 0, 128, 128, 128, 128, "Bad gray", 0 );
		// colors
		_AssertsEqual_hsvToRgb( 0, 255, 255, 255, 0, 0, "Bad red", 0 );
		_AssertsEqual_hsvToRgb( 43, 255, 255, 255, 255, 0, "Bad yellow", 1 );
		_AssertsEqual_hsvToRgb( 86, 255, 255, 0, 255, 0, "Bad green", 1 );
		_AssertsEqual_hsvToRgb( 129, 255, 255, 0, 255, 255, "Bad cyan", 1 );
		_AssertsEqual_hsvToRgb( 172, 255, 255, 0, 0, 255, "Bad blue", 1 );
		_AssertsEqual_hsvToRgb( 215, 255, 255, 255, 0, 255, "Bad magenta", 1 );
		_AssertsEqual_hsvToRgb( 255, 255, 255, 255, 0, 15, "Bad reddd", 0 );
	}


	function _diff_uint8(uint8 a, uint8 b) internal returns (uint8)
	{
		return (a > b ? a - b : b - a);
	}

	//
	// Utils
	function _convertBytesHexString(bytes20 values) public pure returns (string memory)
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

	// Unsupported types
	function _AssertsEqual_uint8(uint8 actual, uint8 expected, string memory message) public
	{
		Assert.isTrue( actual == expected, string(abi.encodePacked(message, ": (uint8) need ", Utils.utoa(uint(expected)), " got ", Utils.utoa(uint(actual)))) );
	}
	function _AssertsEqual_uint256(uint256 actual, uint256 expected, string memory message) public
	{
		Assert.isTrue( actual == expected, string(abi.encodePacked(message, ": (uint256) need ", Utils.utoa(uint(expected)), " got ", Utils.utoa(uint(actual)))) );
	}
	function _AssertsEqual(bytes20 actual, bytes20 expected, string memory message) public
	{
		Assert.equal( actual, expected, string(abi.encodePacked(message, ": (bytes20) need 0x", _convertBytesHexString(expected), " got 0x", _convertBytesHexString(actual))) );
	}
	function _AssertsEqual_hsvToRgb(uint8 h, uint8 s, uint8 v, uint8 expectedR, uint8 expectedG, uint8 expectedB, string memory message, uint8 delta ) public
	{
		byte r;
		byte g;
		byte b;
		(r, g, b) = Utils.hsvToRgb(h, s, v);
		_AssertsEqual_rgb( uint8(r), uint8(g), uint8(b), expectedR, expectedG, expectedB, message, delta );
	}
	function _AssertsEqual_rgb(uint8 actualR, uint8 actualG, uint8 actualB, uint8 expectedR, uint8 expectedG, uint8 expectedB, string memory message, uint8 delta ) public
	{
		Assert.isTrue( _diff_uint8(actualR,expectedR) <= delta && _diff_uint8(actualG,expectedG) <= delta && _diff_uint8(actualB,expectedB) <= delta,
			string(abi.encodePacked(message, 
			": (rgb) RGB need (",Utils.utoa(uint(expectedR)), ",",Utils.utoa(uint(expectedG)),",",Utils.utoa(uint(expectedB)),
			") got (",Utils.utoa(uint(actualR)),",",Utils.utoa(uint(actualG)),",",Utils.utoa(uint(actualB)),")")));
	}
}
