
// hacky check to see if truffle is running us
var Controller = null;
var Ledger = null;
var Token = null;

var web3_def = true;
try {
  web3;
} catch (e) {
  if (e.name == "ReferenceError") {
    console.log("unable to find web3, ledgers will not be loaded");
    web3_def = false;
  }
}

if (web3_def) {
  Controller = artifacts.require('./Controller.sol');
  Ledger = artifacts.require("./Ledger.sol");
  Token = artifacts.require("./Token.sol");
}

// web3 already loaded by truffle

let padLeft = function(value, len) {
  let hexLength = len * 2;
  if (value.length > len)
    return value;

  var outStr = value;
  for (i = 0; i < (hexLength - value.length); i++) {
    outStr = '0' + outStr;
  }
  return outStr;
}

/**
 * Generates the packed address value multiMint expects
 * 
 * TODO: this function should throw if anything goes wrong
 * since its our responsibility to ensure the input is correct.
 * This function or some variation of it must be unit tested in the future
 * to ensure safe functionality.
 *
 * @param      {string}    address  The address in hexidecimal string format with or without '0x'
 * @param      {number}    value    The numerical value of the intended value to mint
 * @return     {string}    The correctly formatted numerical value that maps to uint256
 */
let addressValue = function(address, value) {
  let hexValue = value.toString(16);
  if (hexValue.length > 24)
    throw "size too large";

  let paddedHexValue = padLeft(hexValue, 12);

  let headerIncluded = false;
  if (address.substring(0, 2) == '0x') {
    headerIncluded = true;
  }

  if (headerIncluded && !(address.length == 42))
    throw "address wrong length";

  if (!headerIncluded && !(address.length == 40))
    throw "address wrong length";

  return address + paddedHexValue;
}

let deploys = (contracts) => {
  p = new Promise((resolve, reject) => {
    c = {
      token: null,
      controller: null,
      ledger: null
    };

    let tokenDeploy = [contracts.token.new(),
      contracts.controller.new(),
      contracts.ledger.new()];

    Promise.all(tokenDeploy).then((value) => {
      c.token = value[0];
      c.controller = value[1];
      c.ledger = value[2];
    }).then(() => {
      let connections = [
        c.token.setController(c.controller.address),
        c.controller.setToken(c.token.address),
        c.controller.setLedger(c.ledger.address),
        c.ledger.setController(c.controller.address)
      ];

      Promise.all(connections).then((value) => {
        resolve(c);
      })
    });

  });

  return p;  
}

/**
 * Does all the dirtywork of setting up the contracts and
 * setting the controllers to eachother
 *
 * @return     {<type>}  { description_of_the_return_value }
 */
let deployAll = () => {
  p = new Promise((resolve, reject) => {
    c = {
      token: null,
      controller: null,
      ledger: null
    };

    let tokenDeploy = [
      Token.new(),
      Controller.new(),
      Ledger.new()
    ];

    Promise.all(tokenDeploy).then((value) => {
      c.token = value[0];
      c.controller = value[1];
      c.ledger = value[2];
    }).then(() => {
      let connections = [
        c.token.setController(c.controller.address),
        c.controller.setToken(c.token.address),
        c.controller.setLedger(c.ledger.address),
        c.ledger.setController(c.controller.address)
      ];

      Promise.all(connections).then((value) => {
        resolve(c);
      })
    });

  });

  return p;
}

let searchForEvent = (receipt, signature) => {
  let hashed = web3.sha3(signature);
  for (i = 0; i < receipt.logs.length; i++) {
    let topics = receipt.logs[i].topics;
    for (j = 0; j < topics.length; j++) {
      let topic = topics[j];
      if (topic == hashed)
        return true;      
    }
  }
  return false;
}

/**
 * Promise wrapper for tx getting mined
 * Starts filtering from 10 blocks before when called, until the latest.
 * 
 * Resolves on txHash find
 * Rejects after 50 blocks
 */
let transactionMined = (txHash) => {
  let latestBlock = web3.eth.blockNumber
  let p = new Promise((resolve, reject) => {
    let filter = web3.eth.filter({fromBlock: latestBlock - 10, toBlock: 'latest'});

    filter.watch((err, res) => {
      let block = web3.eth.getBlock(res.blockHash, true);
      for (j = 0; j < block.transactions.length; j++) {
        if (block.transactions[j].hash == txHash) {
          let tx = block.transactions[j];
          let receipt = web3.eth.getTransactionReceipt(tx.hash);
          filter.stopWatching();
          resolve({tx: tx, receipt: receipt});
        }
      }

      if ((res.blockNumber - latestBlock) > 50) {
        filter.stopWatching();
        reject("waited 50 blocks, no transaction response");
      }
    }); 
  });
  return p;
}

/**
 * Confirms that a transaction is mined, then confirms that said transaction
 * did not occur any invalid opcodes
 */
let confirmTransactionValid = (txHash) => {
  return new Promise((resolve, reject) => {
    transactionMined(txHash).then((res) => {
      return web3.debug.traceTransaction(res.hash);
    }, (err) => {
      reject(err);
    }).then((res) => {
      let lastOpError = res.structLogs[res.structLogs.length - 1].error
      if (error == "")
        resolve(null);
      else
        reject(lastOpError);
    });
  });
}

/**
 * Exports
 */

module.exports.Controller = Controller;
module.exports.Ledger = Ledger;
module.exports.Token = Token;

module.exports.padLeft = padLeft;
module.exports.addressValue = addressValue;
module.exports.deploys = deploys;
module.exports.deployAll = deployAll;
module.exports.searchForEvent = searchForEvent;
module.exports.transactionMined = transactionMined;