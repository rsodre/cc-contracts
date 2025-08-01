// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

// import "../token/ERC721/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol";

contract ERC721BurnableMock is ERC721Burnable {
    constructor(string memory name, string memory symbol) ERC721(name, symbol) { }

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}
