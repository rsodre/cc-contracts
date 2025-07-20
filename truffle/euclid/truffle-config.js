
const path = require("path");

const HDWalletProvider = require("@truffle/hdwallet-provider");
require('dotenv').config();

// http://truffleframework.com/docs/advanced/configuration
module.exports = {
	// contracts_directory: path.join(__dirname, "./contracts"),
	// contracts_build_directory: path.join(__dirname, "./build/contracts"),
	contracts_build_directory: path.join(__dirname, "../cc-dapp/src/contracts/euclid"),
	networks: {
		development: {
			host: "127.0.0.1",
			port: 7545,
			network_id: "*",
			gasPrice: 100000000000, // 100 gwei
			gas: 6000000, // Need to have gas * gasPrice available for deployment!
		},

		// Configure live networks with Infura
		// https://www.trufflesuite.com/tutorials/using-infura-custom-provider
		ropsten: {
			// Test connection with: truffle console --network ropsten
			provider: function () {
				return new HDWalletProvider(
					`${process.env.INFURA_MNEMONIC}`,
					// `https://ropsten.infura.io/v3/${process.env.INFURA_ID}`
					`wss://ropsten.infura.io/ws/v3/${process.env.INFURA_ID}`
				)
			},
			from: '0x93e26dC00F47522fEB2fF272D9fEd8ddC52d91EB', // ProtoCoder
			gas: 7000000, // First migration. Need to have gas * gasPrice available for deployment
			// gasPrice: 40000000000, // 40 gwei
			networkCheckTimeout: 10000000,
			network_id: 3,
			confirmations: 2,
		},
		rinkeby: {
			// Test connection with: truffle console --network rinkeby
			provider: function () {
				return new HDWalletProvider(
					`${process.env.INFURA_MNEMONIC}`,
					// `https://rinkeby.infura.io/v3/${process.env.INFURA_ID}`,
					`wss://rinkeby.infura.io/ws/v3/${process.env.INFURA_ID}`
				)
			},
			from: '0x93e26dC00F47522fEB2fF272D9fEd8ddC52d91EB', // ProtoCoder
			gas: 7000000, // First migration. Need to have gas * gasPrice available for deployment
			// gasPrice: 20000000000, // 20 gwei
			networkCheckTimeout: 10000000,
			network_id: 4,
			confirmations: 2,
		},

		// Configure Mainnet
		// https://docs.zeppelinos.org/docs/2.0.0/mainnet
		mainnet: {
			// Test connection with: truffle console --network mainnet
			provider: function () {
				return new HDWalletProvider(
					`${process.env.INFURA_MNEMONIC}`,
					// `https://mainnet.infura.io/v3/${process.env.INFURA_ID}`,
					`wss://mainnet.infura.io/ws/v3/${process.env.INFURA_ID}`
				)
			},
			from: '0xBFAE544D6d8ab3F06182b76B89C30637227f8931', // Coder
			gas: 7000000, // First migration. Need to have gas * gasPrice available for deployment
			// gasPrice: 30000000000, // 20 gwei
			networkCheckTimeout: 10000000,
			network_id: 1
		}
	},
	// Configure your compilers
	compilers: {
		solc: {
			version: "^0.8.2"	// for openzeppelin 4.4.2
		}
	},
	plugins: [
		'truffle-contract-size',
		'truffle-plugin-verify'
	],
	api_keys: {
		// https://kalis.me/verify-truffle-smart-contracts-etherscan/
		etherscan: process.env.ETHERSCAN_API_KEY
	}
};
