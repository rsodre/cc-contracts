// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "./Whitelist.sol";

contract WhitelistTest {

	WhitelistStorage public whitelist;

	event Minted(uint256[] tokenIds, uint8 indexed quantity);

	constructor() {
	}

	function setupWhitelistContract(address contractAddress, uint8 newMintsPerSource, uint8 newMintsPerBuilt) public {
		Whitelist.setupContract(whitelist, contractAddress, newMintsPerSource, newMintsPerBuilt);
	}

	//------------------------------
	// Test functions
	//
	function chroma_totalSupply() public view returns (uint256) {
		return whitelist.parent.totalSupply();
	}
	function chroma_tokenURI(uint256 tokenId) public view returns (string memory) {
		return whitelist.parent.tokenURI(tokenId);
	}
	function wl_isTokenBuilt(uint256 tokenId) public view returns (bool) {
		return Whitelist.isTokenBuilt(whitelist, tokenId);
	}
	function wl_calcAllowedMintsPerTokenId(uint256 tokenId) public view returns (uint8) {
		return Whitelist.calcAllowedMintsPerTokenId(whitelist, tokenId);
	}
	function wl_calcAvailableMintsPerTokenId(uint256 tokenId) public view returns (uint8) {
		return Whitelist.calcAvailableMintsPerTokenId(whitelist, tokenId);
	}
	function wl_getAvailableMintsForUser(address to) public view returns (uint256[] memory, uint8[] memory) {
		return Whitelist.getAvailableMintsForUser(whitelist, to);
	}
	function wl_claimTokenIds(uint256[] memory tokenIds) public returns(uint8 quantity) {
		quantity = Whitelist.claimTokenIds(whitelist, tokenIds);
		emit Minted(tokenIds, quantity);
	}
}
