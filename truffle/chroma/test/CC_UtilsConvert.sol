// SPDX-License-Identifier: MIT
// Same version as openzeppelin 3.4
pragma solidity >=0.6.0 <0.8.0;

// Truffle Assert
// https://github.com/trufflesuite/truffle/blob/develop/packages/resolver/solidity/Assert.sol

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Utils.sol";

contract TestUtilsConvert
{
	// function test_convertArrayToString_uint256() public
	// {
	//     {
	//         uint256[] memory values = new uint256[](1);
	//         values[0] = 111;
	//         string memory converted = Utils.convertArrayToString_uint256(values);
	//         Assert.equal( converted, "111", "Array conversion error" );
	//     }
	//     {
	//         uint256[] memory values = new uint256[](4);
	//         values[0] = 111;
	//         values[1] = 222;
	//         values[2] = 333;
	//         values[3] = 444;
	//         string memory converted = Utils.convertArrayToString_uint256(values);
	//         Assert.equal( converted, "111,222,333,444", "Array conversion error" );
	//     }
	//     {
	//         uint256[] memory values = new uint256[](1);
	//         values[0] = 1000000000000000000; // 1 ETH
	//         string memory converted = Utils.convertArrayToString_uint256(values);
	//         Assert.equal( converted, "1000000000000000000", "Array conversion error" );
	//     }
	//     {
	//         uint256[] memory values = new uint256[](4);
	//         values[0] = 1000000000000000005;
	//         values[1] = 12000000000000000006;
	//         values[2] = 123000000000000000007;
	//         values[3] = 1234000000000000000008;
	//         string memory converted = Utils.convertArrayToString_uint256(values);
	//         Assert.equal( converted, "1000000000000000005,12000000000000000006,123000000000000000007,1234000000000000000008", "Array conversion error" );
	//     }
	//     {
	//         uint256[] memory values = new uint256[](10);
	//         for(uint256 i = 0 ; i < 10 ; ++i)
	//             values[i] = 1000000000000000000 + i;
	//         string memory converted = Utils.convertArrayToString_uint256(values);
	//         Assert.equal( converted, "1000000000000000000,1000000000000000001,1000000000000000002,1000000000000000003,1000000000000000004,1000000000000000005,1000000000000000006,1000000000000000007,1000000000000000008,1000000000000000009", "Array conversion error" );
	//     }
	// }

	// function test_convertIntsToBytes() public
	// {
	//     uint8[] memory values = new uint8[](11);
	//     values[0] = 0x00;
	//     values[1] = 0x01;
	//     values[2] = 0x10;
	//     values[3] = 0x9A;
	//     values[4] = 0xA9;
	//     values[5] = 0xAA;
	//     values[6] = 0xAF;
	//     values[7] = 0xFA;
	//     values[8] = 0xFF;
	//     values[9] = 0xF0;
	//     values[10] = 0x0F;
	//     bytes memory actual = Utils.convertIntsToBytes(values);
	//     bytes memory expected = hex"0001109AA9AAAFFAFFF00F";
	//     Assert.equal( string(actual), string(expected), "Bytes array does not match original ints array" );
	// }

	// function test_convertToHexString() public
	// {
	//     bytes memory values = new bytes(11);
	//     values[0] = 0x00;
	//     values[1] = 0x01;
	//     values[2] = 0x10;
	//     values[3] = 0x9A;
	//     values[4] = 0xA9;
	//     values[5] = 0xAA;
	//     values[6] = 0xAF;
	//     values[7] = 0xFA;
	//     values[8] = 0xFF;
	//     values[9] = 0xF0;
	//     values[10] = 0x0F;
	//     string memory actual = Utils.convertToHexString(values);
	//     string memory expected = "0001109AA9AAAFFAFFF00F";
	//     Assert.equal( bytes(actual).length, values.length*2, "Hex String must be double as byte array" );
	//     Assert.equal( actual, expected, "Hex String does not match original bytes array" );
	// }

	function test_convertToHexString() public
	{
		uint8[] memory values = new uint8[](11);
		values[0] = 0x00;
		values[1] = 0x01;
		values[2] = 0x10;
		values[3] = 0x9A;
		values[4] = 0xA9;
		values[5] = 0xAA;
		values[6] = 0xAF;
		values[7] = 0xFA;
		values[8] = 0xFF;
		values[9] = 0xF0;
		values[10] = 0x0F;
		string memory actual = Utils.convertToHexString(values);
		string memory expected = "0001109AA9AAAFFAFFF00F";
		Assert.equal( bytes(actual).length, values.length*2, "Hex String must be double as byte array" );
		Assert.equal( actual, expected, "Hex String does not match original bytes array" );
	}

	// function test_convertByteToHexString() public
	// {
	//     Assert.equal( bytes(Utils.convertByteToHexString(0x00)).length, 2, "Byte do not match" );
	//     Assert.equal( bytes(Utils.convertByteToHexString(0xff)).length, 2, "Byte do not match" );
	//     Assert.equal( Utils.convertByteToHexString(0x00), "00", "Byte do not match" );
	//     Assert.equal( Utils.convertByteToHexString(0x01), "01", "Byte do not match" );
	//     Assert.equal( Utils.convertByteToHexString(0x10), "10", "Byte do not match" );
	//     Assert.equal( Utils.convertByteToHexString(0x9A), "9A", "Byte do not match" );
	//     Assert.equal( Utils.convertByteToHexString(0xA9), "A9", "Byte do not match" );
	//     Assert.equal( Utils.convertByteToHexString(0xAA), "AA", "Byte do not match" );
	//     Assert.equal( Utils.convertByteToHexString(0xAF), "AF", "Byte do not match" );
	//     Assert.equal( Utils.convertByteToHexString(0xFA), "FA", "Byte do not match" );
	//     Assert.equal( Utils.convertByteToHexString(0xFF), "FF", "Byte do not match" );
	//     Assert.equal( Utils.convertByteToHexString(0xF0), "F0", "Byte do not match" );
	//     Assert.equal( Utils.convertByteToHexString(0x0F), "0F", "Byte do not match" );
	// }
}
