require('dotenv').config();

const path = require("path");
const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {

  compilers: {
    solc: {
      version: "0.6.11"
    }
  },

  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    ropsten: {
      provider: function() {
	return new HDWalletProvider(process.env["ROPSTEN_SEEDPHRASE"], "wss://ropsten.infura.io/ws/v3/418c24f1554d40c782bb77d763aadb8c");
      },
      network_id: 3
    }
  }
};
