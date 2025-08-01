/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * trufflesuite.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like @truffle/hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

// const HDWalletProvider = require('@truffle/hdwallet-provider');
// const infuraKey = "fj4jll3k.....";
//
// const fs = require('fs');
// const mnemonic = fs.readFileSync(".secret").toString().trim();

const path = require("path");

const HDWalletProvider = require("@truffle/hdwallet-provider");
require('dotenv').config();

module.exports = {

	/* Copy contracts to react app */
	contracts_build_directory: path.join(__dirname, "../cc-dapp/src/contracts/chroma"),

	/**
	 * Networks define how you connect to your ethereum client and let you set the
	 * defaults web3 uses to send transactions. If you don't specify one truffle
	 * will spin up a development blockchain for you on port 9545 when you
	 * run `develop` or `test`. You can ask a truffle command to use a specific
	 * network from the command line, e.g
	 *
	 * $ truffle test --network <network-name>
	 */

	networks: {
		development: {
			// http://127.0.0.1:7545/
			// Chain ID: 1337
			host: "127.0.0.1",
			port: 7545,
			network_id: "*",
			gas: 6721975,
			gasPrice: 100000000000, // 100 gwei
		},
		test: {
			host: "127.0.0.1",
			port: 7545,
			network_id: "*",
			gasPrice: 1,
			gas: 6721975,
		},
	
		// Configure live networks with Infura
		// https://www.trufflesuite.com/tutorials/using-infura-custom-provider
		ropsten: {
			// Test connection with: truffle console --network ropsten
			provider: function () {
				return new HDWalletProvider(
					`${process.env.INFURA_MNEMONIC}`,
					// `https://ropsten.infura.io/v3/${process.env.INFURA_ID}`
					`wss://ropsten.infura.io/ws/v3/${process.env.INFURA_ID}`,
					0 // Metamask 1st connected account
				)
			},
			from: '0x93e26dC00F47522fEB2fF272D9fEd8ddC52d91EB', // ProtoCoder
			gas: 7000000, // Need to have gas * gasPrice available for deployment!
			gasPrice: 5000000000, // 5 gwei
			networkCheckTimeout: 10000000,
			network_id: 3
		},
		rinkeby: {
			// Test connection with: truffle console --network rinkeby
			provider: function() {
				return new HDWalletProvider(
					`${process.env.INFURA_MNEMONIC}`, 
					// `https://rinkeby.infura.io/v3/${process.env.INFURA_ID}`,
					`wss://rinkeby.infura.io/ws/v3/${process.env.INFURA_ID}`,
					0 // Metamask 1st connected account
				)
			},
			from: '0x93e26dC00F47522fEB2fF272D9fEd8ddC52d91EB', // ProtoCoder
			gas: 7000000, // First migration. Need to have gas * gasPrice available for deployment
			gasPrice: 5000000000, // 5 gwei
			networkCheckTimeout: 10000000,
			network_id: 4
		},

		// Configure Mainnet
		// https://docs.zeppelinos.org/docs/2.0.0/mainnet
		mainnet: {
			// Test connection with: truffle console --network mainnet
			provider: function() {
				return new HDWalletProvider(
					`${process.env.INFURA_MNEMONIC}`, 
					// `https://mainnet.infura.io/v3/${process.env.INFURA_ID}`,
					`wss://mainnet.infura.io/ws/v3/${process.env.INFURA_ID}`,
					5 // Metamask 2nd connected account
				)
			},
			from: '0xBFAE544D6d8ab3F06182b76B89C30637227f8931', // Coder
			// gas: 100000, // good for contract interaction
			gas: 7000000, // First migration. Need to have gas * gasPrice available for deployment
			gasPrice: 20000000000, // 20 gwei
			networkCheckTimeout: 10000000,
			network_id: 1
		}
		

		// Useful for testing. The `development` name is special - truffle uses it by default
		// if it's defined here and no other network is specified at the command line.
		// You should run a client (like ganache-cli, geth or parity) in a separate terminal
		// tab if you use this network and you must also set the `host`, `port` and `network_id`
		// options below to some value.
		//
		// Another network with more advanced options...
		// advanced: {
		// port: 8777,             // Custom port
		// network_id: 1342,       // Custom network
		// gas: 8500000,           // Gas sent with each transaction (default: ~6700000)
		// gasPrice: 20000000000,  // 20 gwei (in wei) (default: 100 gwei)
		// from: <address>,        // Account to send txs from (default: accounts[0])
		// websocket: true        // Enable EventEmitter interface for web3 (default: false)
		// },
		// Useful for deploying to a public network.
		// NB: It's important to wrap the provider as a function.
		// ropsten: {
		// provider: () => new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/YOUR-PROJECT-ID`),
		// network_id: 3,       // Ropsten's id
		// gas: 5500000,        // Ropsten has a lower block limit than mainnet
		// confirmations: 2,    // # of confs to wait between deployments. (default: 0)
		// timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
		// skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
		// },
		// Useful for private networks
		// private: {
		// provider: () => new HDWalletProvider(mnemonic, `https://network.io`),
		// network_id: 2111,   // This network is yours, in the cloud.
		// production: true    // Treats this network as if it was a public net. (default: false)
		// }
	},

	// Set default mocha options here, use special reporters etc.
	mocha: {
		// timeout: 100000
	},

	// Configure your compilers
	compilers: {
		solc: {
			version: "0.7.6", // Highest compatible with openzeppelin 3.4
			// docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
			// settings: {          // See the solidity docs for advice about optimization and evmVersion
			//  optimizer: {
			//    enabled: false,
			//    runs: 200
			//  },
			//  evmVersion: "byzantium"
			// }
		}
	},
	
	// https://www.npmjs.com/package/truffle-contract-size
	plugins: [
		'truffle-contract-size',
		'truffle-plugin-verify'
	],

	api_keys: {
		// https://kalis.me/verify-truffle-smart-contracts-etherscan/
		etherscan: process.env.ETHERSCAN_API_KEY
	}
};
