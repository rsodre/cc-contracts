const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const ERC721BurnableMock = artifacts.require('ERC721BurnableMock');

contract('ERC721Burnable', function (accounts) {
	const [owner, approved] = accounts;

	const firstTokenId = new BN(1);
	const secondTokenId = new BN(2);
	const unknownTokenId = new BN(3);

	const name = 'Non Fungible Token';
	const symbol = 'NFT';

	beforeEach(async function () {
		this.token = await ERC721BurnableMock.new(name, symbol);
	});

	describe('like a burnable ERC721', function () {
		beforeEach(async function () {
			await this.token.mint(owner, firstTokenId);
			await this.token.mint(owner, secondTokenId);
		});

		describe('burn', function () {
			const tokenId = firstTokenId;
			let logs = null;

			describe('when successful', function () {
				beforeEach(async function () {
					const result = await this.token.burn(tokenId, { from: owner });
					logs = result.logs;
				});

				it('burns the given token ID and adjusts the balance of the owner', async function () {
					await expectRevert(
						this.token.ownerOf(tokenId),
						'ERC721: owner query for nonexistent token',
					);
					expect(await this.token.balanceOf(owner)).to.be.bignumber.equal('1');
				});

				it('emits a burn event', async function () {
					expectEvent.inLogs(logs, 'Transfer', {
						from: owner,
						to: ZERO_ADDRESS,
						tokenId: tokenId,
					});
				});
			});

			describe('when there is a previous approval burned', function () {
				beforeEach(async function () {
					await this.token.approve(approved, tokenId, { from: owner });
					const result = await this.token.burn(tokenId, { from: owner });
					logs = result.logs;
				});

				context('getApproved', function () {
					it('reverts', async function () {
						await expectRevert(
							this.token.getApproved(tokenId), 'ERC721: approved query for nonexistent token',
						);
					});
				});
			});

			describe('when the given token ID was not tracked by this contract', function () {
				it('reverts', async function () {
					await expectRevert(
						this.token.burn(unknownTokenId, { from: owner }), 'ERC721: operator query for nonexistent token',
					);
				});
			});
		});
	});
});
